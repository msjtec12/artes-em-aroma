import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, ensureDatabaseInitialized } from "@/db";
import { users, roles, auditLogs } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const Input = z.object({
  recoveryToken: z.string().min(32).max(512),
  newPassword: z.string().min(16).max(128),
});

function sameSecret(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  if (!host || !origin) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    if (new URL(origin).host !== host || new URL(origin).protocol !== "https:") {
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!checkRateLimit("admin_recovery:" + ip, 3, 15 * 60_000).allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  }

  const envSecret = process.env.ADMIN_RECOVERY_TOKEN?.trim();
  if (!envSecret || envSecret.length < 32) {
    return NextResponse.json({ error: "Recuperação não habilitada. Configure ADMIN_RECOVERY_TOKEN na Vercel." }, { status: 503 });
  }
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !sameSecret(envSecret, parsed.data.recoveryToken)) {
    return NextResponse.json({ error: "Código de recuperação inválido." }, { status: 401 });
  }
  try {
    await ensureDatabaseInitialized();
    const email = process.env.ADMIN_INITIAL_EMAIL?.trim().toLowerCase() || "admin@artesemaroma.com.br";
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    if (existing.length) {
      await db.update(users).set({ passwordHash, isActive: true, updatedAt: new Date() }).where(eq(users.id, existing[0].id));
    } else {
      const admins = await db.select().from(users).where(eq(users.roleName, "admin")).limit(1);
      if (admins.length) {
        return NextResponse.json({ error: "Já existe outro administrador. Verifique ADMIN_INITIAL_EMAIL antes de recuperar." }, { status: 409 });
      }
      const adminRole = await db.select().from(roles).where(eq(roles.name, "admin")).limit(1);
      if (!adminRole.length) {
        return NextResponse.json({ error: "Papel administrativo não configurado." }, { status: 503 });
      }
      await db.insert(users).values({
        name: "Administração Artes em Aroma",
        email,
        passwordHash,
        roleId: adminRole[0].id,
        roleName: "admin",
        isActive: true,
      });
    }
    await db.insert(auditLogs).values({
      actor: "system_recovery",
      action: "auth.admin_recovery",
      entityType: "user",
      entityId: email,
      details: { method: "environment_recovery" },
    });
    return NextResponse.json({ ok: true, message: "Senha definida. Desative ADMIN_RECOVERY_TOKEN na Vercel e entre com a nova senha." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar o acesso. Verifique a conexão com o banco." }, { status: 500 });
  }
}
