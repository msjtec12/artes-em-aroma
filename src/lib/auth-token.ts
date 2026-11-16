import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET deve conter pelo menos 32 caracteres e estar configurado no servidor.");
  }
  return new TextEncoder().encode(secret);
}

export const SESSION_COOKIE_NAME = "artes_aroma_admin_session";

export interface AdminSessionPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  exp?: number;
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.email || payload.role !== "admin") {
      return null;
    }
    return {
      userId: Number(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}
