import { db, ensureDatabaseInitialized } from "@/db";
import { products, orders, orderItems, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAdminDashboardMetrics(periodDays?: number) {
  await ensureDatabaseInitialized();

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));

  const allOrders = await db.select().from(orders);
  const allOrderItems = await db.select().from(orderItems);
  const allLogs = await db.select().from(auditLogs);

  const cutoffDate = periodDays
    ? new Date(Date.now() - periodDays * 86400_000)
    : null;

  const filteredOrders = cutoffDate
    ? allOrders.filter((o) => new Date(o.createdAt) >= cutoffDate)
    : allOrders;

  const filteredOrderIds = new Set(filteredOrders.map((o) => o.id));
  const filteredItems = allOrderItems.filter((i) => filteredOrderIds.has(i.orderId));

  // Métricas de Catálogo
  const activeProductsCount = allProducts.filter((p) => p.isActive && p.isAvailable).length;
  const unavailableProductsCount = allProducts.filter((p) => !p.isAvailable || !p.isActive).length;

  // Métricas de Pedidos (Separando rigorosamente solicitações iniciadas de pedidos confirmados e vendas finalizadas)
  const totalRequestsRegistered = filteredOrders.length;

  const inProgressStatuses = new Set([
    "solicitacao_iniciada",
    "aguardando_contato",
    "em_atendimento",
    "em_preparacao",
    "pronto_retirada_envio",
  ]);

  const confirmedOrders = filteredOrders.filter(
    (o) =>
      o.commercialStatus === "pedido_confirmado" ||
      o.commercialStatus === "em_preparacao" ||
      o.commercialStatus === "pronto_retirada_envio"
  );
  const inProgressOrders = filteredOrders.filter((o) =>
    inProgressStatuses.has(o.commercialStatus)
  );
  const finalizedOrders = filteredOrders.filter(
    (o) => o.commercialStatus === "finalizado"
  );
  const cancelledOrders = filteredOrders.filter(
    (o) => o.commercialStatus === "cancelado"
  );

  // Valor de pedidos confirmados (não considera solicitações iniciadas como venda!)
  const confirmedOrdersValueCents = confirmedOrders.reduce(
    (acc, o) => acc + o.subtotalCents,
    0
  );

  // Valor de vendas efetivamente finalizadas
  const finalizedSalesValueCents = finalizedOrders.reduce(
    (acc, o) => acc + o.subtotalCents,
    0
  );

  // Produtos mais solicitados
  const productCounts = new Map<
    string,
    { name: string; totalQuantity: number; requestsCount: number; totalValueCents: number }
  >();

  for (const item of filteredItems) {
    const key = item.productNameSnapshot;
    const current = productCounts.get(key) || {
      name: key,
      totalQuantity: 0,
      requestsCount: 0,
      totalValueCents: 0,
    };
    current.totalQuantity += item.quantity;
    current.requestsCount += 1;
    current.totalValueCents += item.subtotalCentsSnapshot;
    productCounts.set(key, current);
  }

  const mostRequestedProducts = Array.from(productCounts.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 6);

  // Funil de Conversão Técnico (Seção 17)
  const funnelEvents = cutoffDate
    ? allLogs.filter(
        (l) => l.entityType === "funnel" || l.action.startsWith("funnel.")
      ).filter((l) => new Date(l.createdAt) >= cutoffDate)
    : allLogs.filter(
        (l) => l.entityType === "funnel" || l.action.startsWith("funnel.")
      );

  const countAction = (act: string) =>
    funnelEvents.filter((e) => e.action === act).length;

  return {
    activeProductsCount,
    unavailableProductsCount,
    totalRequestsRegistered,
    confirmedOrdersCount: confirmedOrders.length,
    inProgressOrdersCount: inProgressOrders.length,
    finalizedOrdersCount: finalizedOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    confirmedOrdersValueCents,
    finalizedSalesValueCents,
    mostRequestedProducts,
    funnel: {
      viewItemList: countAction("funnel.view_item_list"),
      viewItem: countAction("funnel.view_item"),
      addToCart: countAction("funnel.add_to_cart"),
      viewCart: countAction("funnel.view_cart"),
      orderRequestCreated: totalRequestsRegistered,
      whatsappCheckoutClick: countAction("funnel.whatsapp_checkout_click"),
      orderConfirmed: confirmedOrders.length + finalizedOrders.length,
      orderFinalized: finalizedOrders.length,
    },
  };
}
