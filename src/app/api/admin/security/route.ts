import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDatabaseInitialized } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(16).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host")) {
      return NextResponse.json({ error: "Origem da requisição inválida." }, { status: 403 });
    }
    const parsed = ChangePasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Informe a senha atual e uma nova senha de pelo menos 16 caracteres." },
        { status: 400 }
      );
    }
    const { currentPassword, newPassword } = parsed.data;
    if (newPassword === currentPassword) {
      return NextResponse.json({ error: "A nova senha deve ser diferente da atual." }, { status: 400 });
    }
    await ensureDatabaseInitialized();
    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    if (!user || !user.isActive || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Senha atual inválida." }, { status: 403 });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, user.id));
    await db.insert(auditLogs).values({
      actor: user.email, action: "auth.password_changed",
      entityType: "user", entityId: String(user.id), details: {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED_ADMIN_ACCESS") {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }
    return NextResponse.json({ error: "Não foi possível alterar a senha." }, { status: 500 });
  }
}
