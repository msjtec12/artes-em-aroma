import { NextRequest, NextResponse } from "next/server";
import { db, ensureDatabaseInitialized } from "@/db";
import { auditLogs } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";

const ALLOWED_FUNNEL_EVENTS = new Set([
  "view_item_list",
  "select_item",
  "view_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "order_request_created",
  "whatsapp_checkout_click",
]);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const rate = checkRateLimit(`analytics:${ip}`, 60, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await request.json();
    const eventName = String(body?.event || "");
    if (!ALLOWED_FUNNEL_EVENTS.has(eventName)) {
      return NextResponse.json({ error: "Evento não reconhecido." }, { status: 400 });
    }

    await ensureDatabaseInitialized();

    // Minimização de dados LGPD: remove qualquer campo que pareça nome, telefone ou e-mail antes de gravar no log de funil
    const rawParams =
      body?.params && typeof body.params === "object" ? body.params : {};
    const safeDetails: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rawParams)) {
      if (!["name", "phone", "email", "customerName", "customerPhone"].includes(k)) {
        safeDetails[k] = v;
      }
    }

    await db.insert(auditLogs).values({
      actor: "public_funnel",
      action: `funnel.${eventName}`,
      entityType: "funnel",
      entityId: String(safeDetails.productSlug || safeDetails.orderCode || ""),
      details: safeDetails,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
