import { NextRequest, NextResponse } from "next/server";
import { authenticateAdminCredentials, SESSION_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const rate = checkRateLimit(`admin_login:${ip}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas de login. Aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "");
    const password = String(body?.password || "");

    const result = await authenticateAdminCredentials(email, password);
    if (!result.success || !result.token) {
      return NextResponse.json(
        { error: result.error || "Falha na autenticação." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: result.session,
    });

    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 horas
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao autenticar." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
