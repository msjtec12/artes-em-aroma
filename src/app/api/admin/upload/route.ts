import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    if (process.env.VERCEL || process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Upload desabilitado até configurar armazenamento permanente (Vercel Blob, S3 ou R2). Utilize URL externa HTTPS para imagens enquanto isso." },
        { status: 503 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato de arquivo não permitido. Envie imagens JPG, PNG, WebP ou AVIF.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "A imagem excede o limite máximo de 5 MB." },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase() || ".webp";
    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeBase}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      filename,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no upload.";
    return NextResponse.json(
      { error: msg },
      { status: msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 500 }
    );
  }
}
