import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db, ensureDatabaseInitialized } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  signAdminToken,
  verifyAdminToken,
  SESSION_COOKIE_NAME,
  AdminSessionPayload,
} from "./auth-token";

export { signAdminToken, verifyAdminToken, SESSION_COOKIE_NAME };
export type { AdminSessionPayload };

export async function getServerAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireAdminSession(): Promise<AdminSessionPayload> {
  const session = await getServerAdminSession();
  if (!session || session.role !== "admin") {
    throw new Error("UNAUTHORIZED_ADMIN_ACCESS");
  }
  return session;
}

export async function authenticateAdminCredentials(
  email: string,
  passwordPlain: string
): Promise<{ success: boolean; session?: AdminSessionPayload; token?: string; error?: string }> {
  await ensureDatabaseInitialized();
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !user.isActive) {
    return { success: false, error: "Credenciais inválidas ou usuário inativo." };
  }

  const valid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!valid) {
    await db.insert(auditLogs).values({
      actor: normalizedEmail,
      action: "auth.login_failed",
      entityType: "user",
      entityId: String(user.id),
      details: { reason: "invalid_password" },
    });
    return { success: false, error: "Credenciais inválidas." };
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await db.insert(auditLogs).values({
    actor: user.email,
    action: "auth.login_success",
    entityType: "user",
    entityId: String(user.id),
    details: { role: user.roleName },
  });

  const sessionPayload: AdminSessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.roleName,
  };

  const token = await signAdminToken(sessionPayload);
  return { success: true, session: sessionPayload, token };
}
