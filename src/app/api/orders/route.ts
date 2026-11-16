import { NextRequest, NextResponse } from "next/server";
import { createServerValidatedOrder, markWhatsAppLinkTriggered } from "@/domain/orders";
import { checkRateLimit } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous-ip";
    const rate = checkRateLimit(`order_create:${ip}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "Muitas solicitações em sequência. Por favor, aguarde um minuto antes de tentar novamente.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = await createServerValidatedOrder(body);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.errors.map((e) => e.message).join(" ") },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error
        ? err.message
        : "Não foi possível processar a solicitação do pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.orderCode) {
      return NextResponse.json(
        { error: "Código do pedido obrigatório." },
        { status: 400 }
      );
    }
    const updated = await markWhatsAppLinkTriggered(String(body.orderCode));
    if (!updated) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json({
      orderCode: updated.orderCode,
      commercialStatus: updated.commercialStatus,
      communicationStatus: updated.communicationStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao registrar acionamento do WhatsApp." },
      { status: 500 }
    );
  }
}
