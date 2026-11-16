import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  getAllCatalogProducts,
  upsertProductAdmin,
  duplicateProductAdmin,
  softDeleteProductAdmin,
  toggleProductStateAdmin,
} from "@/domain/products";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await requireAdminSession();
    const result = await getAllCatalogProducts({
      includeInactive: true,
      pageSize: 500,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();

    if (body?.action === "duplicate" && body?.productId) {
      const dup = await duplicateProductAdmin(Number(body.productId), session.email);
      revalidatePath("/");
      revalidatePath("/produtos");
      return NextResponse.json(dup, { status: 201 });
    }

    const saved = await upsertProductAdmin(body, session.email);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath(`/produtos/${saved.slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao salvar produto.";
    const status = msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const productId = Number(body?.productId);
    if (!productId) {
      return NextResponse.json({ error: "ID do produto inválido." }, { status: 400 });
    }

    const updated = await toggleProductStateAdmin(
      productId,
      {
        isAvailable: body.isAvailable,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
      },
      session.email
    );
    revalidatePath("/");
    revalidatePath("/produtos");
    if (updated?.slug) {
      revalidatePath(`/produtos/${updated.slug}`);
    }
    return NextResponse.json({ product: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar produto.";
    return NextResponse.json(
      { error: msg },
      { status: msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const productId = Number(searchParams.get("id"));
    if (!productId) {
      return NextResponse.json({ error: "ID do produto obrigatório." }, { status: 400 });
    }

    await softDeleteProductAdmin(productId, session.email);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao excluir produto.";
    return NextResponse.json(
      { error: msg },
      { status: msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 400 }
    );
  }
}
