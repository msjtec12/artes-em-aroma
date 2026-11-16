import { z } from "zod";
import { db, ensureDatabaseInitialized } from "@/db";
import {
  products,
  productVariants,
  customers,
  orders,
  orderItems,
  orderStatusHistory,
  orderNotes,
  storeSettings,
  auditLogs,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { sanitizePhone } from "@/lib/utils";
import {
  COMMERCIAL_STATUSES,
  COMMERCIAL_STATUS_LABELS,
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUS_LABELS,
  buildWhatsAppOrderMessage,
  type CommercialStatus,
  type CommunicationStatus,
} from "./order-constants";

export {
  COMMERCIAL_STATUSES,
  COMMERCIAL_STATUS_LABELS,
  COMMUNICATION_STATUSES,
  COMMUNICATION_STATUS_LABELS,
  buildWhatsAppOrderMessage,
};
export type { CommercialStatus, CommunicationStatus };

export const CreateOrderInputSchema = z.object({
  customerName: z
    .string()
    .min(2, "Por favor, informe seu nome para o atendimento.")
    .max(120),
  customerPhone: z
    .string()
    .min(8, "Informe um telefone ou WhatsApp válido para contato.")
    .max(30),
  fulfillmentMode: z.enum(["retirada", "entrega_consultar"]).default("retirada"),
  customerNotes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(8).max(120).optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().optional().nullable(),
        quantity: z.number().int().min(1, "Quantidade mínima é 1").max(500),
        // Campos enviados pelo cliente (ex: clientPriceCents) são deliberadamente ignorados no cálculo!
        clientPriceCents: z.number().optional(),
      })
    )
    .min(1, "Sua sacola está vazia. Adicione ao menos um produto."),
});

export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

export interface OrderCreationResult {
  orderId: number;
  orderCode: string;
  subtotalCents: number;
  totalItemsCount: number;
  commercialStatus: CommercialStatus;
  communicationStatus: CommunicationStatus;
  whatsappUrl: string;
  whatsappMessage: string;
  isDuplicateIdempotent: boolean;
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    subtotalCents: number;
  }>;
}

/**
 * Cria um pedido validando todos os produtos, variantes, disponibilidade e recalculando preços no servidor.
 * Jamais confia em preços enviados pelo navegador.
 */
export async function createServerValidatedOrder(
  rawInput: unknown
): Promise<OrderCreationResult> {
  await ensureDatabaseInitialized();
  const input = CreateOrderInputSchema.parse(rawInput);

  // 1. Verifica idempotência para evitar pedidos duplicados em cliques repetidos
  if (input.idempotencyKey) {
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existingOrder) {
      const existingItems = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, existingOrder.id));

      const [settings] = await db.select().from(storeSettings).limit(1);
      const waPhone = sanitizePhone(settings?.whatsappNumber || "5511910771820");

      const mappedItems = existingItems.map((it) => ({
        productName: it.productNameSnapshot,
        variantName: it.variantNameSnapshot,
        sku: it.skuSnapshot,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCentsSnapshot,
        subtotalCents: it.subtotalCentsSnapshot,
      }));

      const message = buildWhatsAppOrderMessage({
        orderCode: existingOrder.orderCode,
        customerName: existingOrder.customerName,
        fulfillmentMode: existingOrder.fulfillmentMode,
        subtotalCents: existingOrder.subtotalCents,
        items: mappedItems,
      });

      return {
        orderId: existingOrder.id,
        orderCode: existingOrder.orderCode,
        subtotalCents: existingOrder.subtotalCents,
        totalItemsCount: existingOrder.totalItemsCount,
        commercialStatus: existingOrder.commercialStatus as CommercialStatus,
        communicationStatus: existingOrder.communicationStatus as CommunicationStatus,
        whatsappUrl: `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`,
        whatsappMessage: message,
        isDuplicateIdempotent: true,
        items: mappedItems,
      };
    }
  }

  // 2. Carrega produtos e variantes atuais do banco
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const dbProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  const dbVariants = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

  // 3. Valida cada item e recalcula preços no servidor
  const validatedSnapshots: Array<{
    productId: number;
    variantId: number | null;
    productName: string;
    variantName: string;
    sku: string;
    unitPriceCents: number;
    quantity: number;
    subtotalCents: number;
  }> = [];

  let calculatedSubtotalCents = 0;
  let totalItemsCount = 0;

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product || product.isDeleted || !product.isActive) {
      throw new Error(
        `O produto selecionado (#${item.productId}) não está mais ativo no catálogo.`
      );
    }

    if (!product.isAvailable) {
      throw new Error(
        `O produto "${product.name}" está temporariamente indisponível para solicitação.`
      );
    }

    let unitPriceCents = product.priceCents;
    let variantName = product.volumeOrWeight;
    let sku = product.sku;
    let resolvedVariantId: number | null = null;

    if (item.variantId) {
      const variant = variantMap.get(item.variantId);
      if (!variant || variant.productId !== product.id) {
        throw new Error(`Variante inválida para o produto "${product.name}".`);
      }
      if (!variant.isAvailable) {
        throw new Error(
          `A opção "${variant.name}" do produto "${product.name}" está indisponível no momento.`
        );
      }
      unitPriceCents = variant.priceCents;
      variantName = variant.name;
      sku = variant.sku;
      resolvedVariantId = variant.id;
    } else {
      // Se o produto tiver variantes cadastradas e nenhuma foi enviada, usa a primeira disponível
      const prodVariants = dbVariants.filter((v) => v.productId === product.id);
      if (prodVariants.length > 0) {
        const firstAvailable = prodVariants.find((v) => v.isAvailable);
        if (!firstAvailable) {
          throw new Error(
            `Todas as variações do produto "${product.name}" estão indisponíveis.`
          );
        }
        unitPriceCents = firstAvailable.priceCents;
        variantName = firstAvailable.name;
        sku = firstAvailable.sku;
        resolvedVariantId = firstAvailable.id;
      }
    }

    const itemSubtotalCents = unitPriceCents * item.quantity;
    calculatedSubtotalCents += itemSubtotalCents;
    totalItemsCount += item.quantity;

    validatedSnapshots.push({
      productId: product.id,
      variantId: resolvedVariantId,
      productName: product.name,
      variantName,
      sku,
      unitPriceCents,
      quantity: item.quantity,
      subtotalCents: itemSubtotalCents,
    });
  }

  // 4. Registra cliente com minimização de dados (LGPD)
  const [settings] = await db.select().from(storeSettings).limit(1);
  const retentionDays = settings?.dataRetentionDays ?? 365;
  const retentionExpiresAt = new Date(Date.now() + retentionDays * 86400_000);

  const cleanPhone = input.customerPhone.trim();
  const cleanName = input.customerName.trim();

  const [customer] = await db
    .insert(customers)
    .values({
      name: cleanName,
      phone: cleanPhone,
      privacyConsentAt: new Date(),
      retentionExpiresAt,
    })
    .returning();

  // 5. Gera identificador único #AA-YYYY-NNNNNN
  const year = new Date().getFullYear();
  const allOrders = await db.select({ id: orders.id }).from(orders);
  const nextSeq = allOrders.length + 123;
  const randomSuffix = Math.floor(10 + Math.random() * 89);
  const orderCode = `AA-${year}-${String(nextSeq).padStart(4, "0")}${randomSuffix}`;

  // 6. Persiste o pedido no banco
  const [createdOrder] = await db
    .insert(orders)
    .values({
      orderCode,
      idempotencyKey: input.idempotencyKey || null,
      customerId: customer.id,
      customerName: cleanName,
      customerPhone: cleanPhone,
      fulfillmentMode: input.fulfillmentMode,
      customerNotes: input.customerNotes?.trim() || null,
      subtotalCents: calculatedSubtotalCents,
      totalItemsCount,
      commercialStatus: "solicitacao_iniciada",
      communicationStatus: "link_gerado",
    })
    .returning();

  // 7. Persiste os itens com snapshot imutável de nome, SKU, variante e preço do momento
  for (const snap of validatedSnapshots) {
    await db.insert(orderItems).values({
      orderId: createdOrder.id,
      productId: snap.productId,
      variantId: snap.variantId,
      productNameSnapshot: snap.productName,
      skuSnapshot: snap.sku,
      variantNameSnapshot: snap.variantName,
      unitPriceCentsSnapshot: snap.unitPriceCents,
      quantity: snap.quantity,
      subtotalCentsSnapshot: snap.subtotalCents,
    });
  }

  // 8. Registra histórico inicial de status
  await db.insert(orderStatusHistory).values({
    orderId: createdOrder.id,
    previousCommercialStatus: null,
    newCommercialStatus: "solicitacao_iniciada",
    previousCommunicationStatus: null,
    newCommunicationStatus: "link_gerado",
    changedBy: "cliente_vitrine",
    note: "Solicitação de pedido registrada na vitrine antes do redirecionamento ao WhatsApp.",
  });

  // 9. Registra evento técnico de funil (sem expor PII desnecessária)
  await db.insert(auditLogs).values({
    actor: "public_funnel",
    action: "funnel.order_request_created",
    entityType: "order",
    entityId: createdOrder.orderCode,
    details: {
      orderId: createdOrder.id,
      subtotalCents: calculatedSubtotalCents,
      totalItemsCount,
      fulfillmentMode: input.fulfillmentMode,
    },
  });

  const waPhone = sanitizePhone(settings?.whatsappNumber || "5511910771820");
  const whatsappMessage = buildWhatsAppOrderMessage({
    orderCode: createdOrder.orderCode,
    customerName: cleanName,
    fulfillmentMode: input.fulfillmentMode,
    subtotalCents: calculatedSubtotalCents,
    items: validatedSnapshots,
  });

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return {
    orderId: createdOrder.id,
    orderCode: createdOrder.orderCode,
    subtotalCents: calculatedSubtotalCents,
    totalItemsCount,
    commercialStatus: "solicitacao_iniciada",
    communicationStatus: "link_gerado",
    whatsappUrl,
    whatsappMessage,
    isDuplicateIdempotent: false,
    items: validatedSnapshots.map((s) => ({
      productName: s.productName,
      variantName: s.variantName,
      sku: s.sku,
      quantity: s.quantity,
      unitPriceCents: s.unitPriceCents,
      subtotalCents: s.subtotalCents,
    })),
  };
}

/**
 * Registra que o cliente acionou o link wa.me (sem presumir que a mensagem foi efetivamente enviada ou confirmada).
 */
export async function markWhatsAppLinkTriggered(orderCode: string) {
  await ensureDatabaseInitialized();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderCode, orderCode))
    .limit(1);

  if (!order) return null;

  const nextCommStatus: CommunicationStatus =
    order.communicationStatus === "contato_confirmado_manualmente"
      ? "contato_confirmado_manualmente"
      : "whatsapp_acionado";

  const nextCommercialStatus: CommercialStatus =
    order.commercialStatus === "solicitacao_iniciada"
      ? "aguardando_contato"
      : (order.commercialStatus as CommercialStatus);

  const [updated] = await db
    .update(orders)
    .set({
      whatsappLinkTriggeredAt: new Date(),
      communicationStatus: nextCommStatus,
      commercialStatus: nextCommercialStatus,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    previousCommercialStatus: order.commercialStatus,
    newCommercialStatus: nextCommercialStatus,
    previousCommunicationStatus: order.communicationStatus,
    newCommunicationStatus: nextCommStatus,
    changedBy: "cliente_vitrine",
    note: "Link wa.me acionado no navegador/dispositivo. Aguardando confirmação real de mensagem recebida.",
  });

  await db.insert(auditLogs).values({
    actor: "public_funnel",
    action: "funnel.whatsapp_checkout_click",
    entityType: "order",
    entityId: order.orderCode,
    details: { orderId: order.id },
  });

  return updated;
}

/**
 * Atualiza o status comercial e/ou status de comunicação por um administrador autenticado.
 */
export async function updateOrderStatusAdmin(params: {
  orderId: number;
  newCommercialStatus?: CommercialStatus;
  newCommunicationStatus?: CommunicationStatus;
  cancelReason?: string;
  note?: string;
  adminEmail: string;
}) {
  await ensureDatabaseInitialized();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.orderId))
    .limit(1);

  if (!order) {
    throw new Error("Pedido não encontrado.");
  }

  const targetCommercial =
    params.newCommercialStatus ?? (order.commercialStatus as CommercialStatus);
  const targetCommunication =
    params.newCommunicationStatus ?? (order.communicationStatus as CommunicationStatus);

  if (targetCommercial === "cancelado" && !params.cancelReason && !order.cancelReason) {
    throw new Error("Informe o motivo do cancelamento.");
  }

  const now = new Date();
  const updatePayload: Partial<typeof orders.$inferInsert> = {
    commercialStatus: targetCommercial,
    communicationStatus: targetCommunication,
    updatedAt: now,
  };

  if (params.cancelReason !== undefined) {
    updatePayload.cancelReason = params.cancelReason;
  }
  if (targetCommunication === "contato_confirmado_manualmente" && !order.contactConfirmedAt) {
    updatePayload.contactConfirmedAt = now;
  }
  if (targetCommercial === "pedido_confirmado" && !order.confirmedAt) {
    updatePayload.confirmedAt = now;
  }
  if (targetCommercial === "finalizado" && !order.finalizedAt) {
    updatePayload.finalizedAt = now;
    if (!order.confirmedAt) {
      updatePayload.confirmedAt = now;
    }
  }
  if (targetCommercial === "cancelado" && !order.cancelledAt) {
    updatePayload.cancelledAt = now;
  }

  const [updated] = await db
    .update(orders)
    .set(updatePayload)
    .where(eq(orders.id, order.id))
    .returning();

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    previousCommercialStatus: order.commercialStatus,
    newCommercialStatus: targetCommercial,
    previousCommunicationStatus: order.communicationStatus,
    newCommunicationStatus: targetCommunication,
    changedBy: params.adminEmail,
    note:
      params.note ||
      (targetCommercial === "cancelado"
        ? `Cancelado: ${params.cancelReason}`
        : `Status atualizado para ${COMMERCIAL_STATUS_LABELS[targetCommercial]}`),
  });

  if (targetCommercial === "pedido_confirmado" && order.commercialStatus !== "pedido_confirmado") {
    await db.insert(auditLogs).values({
      actor: params.adminEmail,
      action: "funnel.order_confirmed",
      entityType: "order",
      entityId: order.orderCode,
      details: { orderId: order.id, subtotalCents: order.subtotalCents },
    });
  }

  if (targetCommercial === "finalizado" && order.commercialStatus !== "finalizado") {
    await db.insert(auditLogs).values({
      actor: params.adminEmail,
      action: "funnel.order_finalized",
      entityType: "order",
      entityId: order.orderCode,
      details: { orderId: order.id, subtotalCents: order.subtotalCents },
    });
  }

  return updated;
}

export async function addOrderInternalNote(params: {
  orderId: number;
  content: string;
  author: string;
}) {
  await ensureDatabaseInitialized();
  const [note] = await db
    .insert(orderNotes)
    .values({
      orderId: params.orderId,
      content: params.content.trim(),
      author: params.author,
    })
    .returning();
  return note;
}

export async function getOrdersWithDetails(filters?: {
  search?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  await ensureDatabaseInitialized();
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const allItems = await db.select().from(orderItems);
  const allHistory = await db
    .select()
    .from(orderStatusHistory)
    .orderBy(desc(orderStatusHistory.createdAt));
  const allNotes = await db
    .select()
    .from(orderNotes)
    .orderBy(desc(orderNotes.createdAt));

  return allOrders
    .filter((o) => {
      if (filters?.status && filters.status !== "todos" && o.commercialStatus !== filters.status) {
        return false;
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matchCode = o.orderCode.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone) return false;
      }
      if (filters?.startDate && new Date(o.createdAt) < filters.startDate) {
        return false;
      }
      if (filters?.endDate && new Date(o.createdAt) > filters.endDate) {
        return false;
      }
      return true;
    })
    .map((o) => ({
      ...o,
      items: allItems.filter((i) => i.orderId === o.id),
      history: allHistory.filter((h) => h.orderId === o.id),
      notes: allNotes.filter((n) => n.orderId === o.id),
    }));
}
