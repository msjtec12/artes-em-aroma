import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  getOrdersWithDetails,
  updateOrderStatusAdmin,
  addOrderInternalNote,
  CommercialStatus,
  CommunicationStatus,
} from "@/domain/orders";

function escapeCsvFormula(value: string): string {
  // Protect spreadsheet users from formula evaluation of customer-controlled text.
  return /^[\\s]*[=+@-]/.test(value) ? "'" + value : value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const format = searchParams.get("format");

    const ordersList = await getOrdersWithDetails({ search, status });

    if (format === "csv") {
      const headers = [
        "Codigo_Pedido",
        "Data_Criacao",
        "Cliente",
        "Telefone",
        "Modalidade",
        "Status_Comercial",
        "Status_Comunicacao",
        "Qtd_Itens",
        "Subtotal_BRL",
        "Resumo_Itens",
      ];
      const rows = ordersList.map((o) => {
        const itemsSummary = o.items
          .map((i) => `${i.quantity}x ${i.productNameSnapshot} (${i.variantNameSnapshot})`)
          .join(" | ");
        return [
          o.orderCode,
          new Date(o.createdAt).toISOString(),
          `"${escapeCsvFormula(o.customerName).replace(/"/g, '""')}"`,
          `"${o.customerPhone}"`,
          o.fulfillmentMode,
          o.commercialStatus,
          o.communicationStatus,
          o.totalItemsCount,
          (o.subtotalCents / 100).toFixed(2),
          `"${escapeCsvFormula(itemsSummary).replace(/"/g, '""')}"`,
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="pedidos-artes-em-aroma.csv"`,
        },
      });
    }

    return NextResponse.json({ orders: ordersList });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();

    if (body?.action === "add_note") {
      const note = await addOrderInternalNote({
        orderId: Number(body.orderId),
        content: String(body.content || ""),
        author: session.name || session.email,
      });
      return NextResponse.json({ note });
    }

    const updated = await updateOrderStatusAdmin({
      orderId: Number(body.orderId),
      newCommercialStatus: body.commercialStatus as CommercialStatus | undefined,
      newCommunicationStatus: body.communicationStatus as CommunicationStatus | undefined,
      cancelReason: body.cancelReason,
      note: body.note,
      adminEmail: session.email,
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar pedido.";
    return NextResponse.json(
      { error: msg },
      { status: msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 400 }
    );
  }
}
