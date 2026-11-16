import { formatCurrency } from "@/lib/utils";

export const COMMERCIAL_STATUSES = [
  "solicitacao_iniciada",
  "aguardando_contato",
  "em_atendimento",
  "pedido_confirmado",
  "em_preparacao",
  "pronto_retirada_envio",
  "finalizado",
  "cancelado",
] as const;

export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];

export const COMMERCIAL_STATUS_LABELS: Record<CommercialStatus, string> = {
  solicitacao_iniciada: "Solicitação iniciada",
  aguardando_contato: "Aguardando contato",
  em_atendimento: "Em atendimento",
  pedido_confirmado: "Pedido confirmado",
  em_preparacao: "Em preparação",
  pronto_retirada_envio: "Pronto para retirada ou envio",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const COMMUNICATION_STATUSES = [
  "link_gerado",
  "whatsapp_acionado",
  "contato_confirmado_manualmente",
  "sem_resposta",
] as const;

export type CommunicationStatus = (typeof COMMUNICATION_STATUSES)[number];

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
  link_gerado: "Link WhatsApp gerado (envio ainda não comprovado)",
  whatsapp_acionado: "Botão WhatsApp acionado pelo cliente",
  contato_confirmado_manualmente: "Contato recebido e confirmado pela loja",
  sem_resposta: "Aguardando retorno do cliente",
};

export function buildWhatsAppOrderMessage(params: {
  orderCode: string;
  customerName: string;
  fulfillmentMode: string;
  subtotalCents: number;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    subtotalCents: number;
  }>;
}): string {
  const lines: string[] = [
    "Olá, Artes em Aroma!",
    "",
    "Gostaria de solicitar os seguintes produtos:",
    "",
    `Pedido: #${params.orderCode}`,
    "",
  ];

  params.items.forEach((item, idx) => {
    const label = item.variantName
      ? `${item.productName} — ${item.variantName}`
      : item.productName;
    lines.push(`${idx + 1}. ${label}`);
    lines.push(`Quantidade: ${item.quantity}`);
    lines.push(`Subtotal: ${formatCurrency(item.subtotalCents)}`);
    lines.push("");
  });

  const modalidadeLabel =
    params.fulfillmentMode === "entrega_consultar"
      ? "Entrega local (consultar disponibilidade/taxa)"
      : "Retirada na loja (Suzano/SP)";

  lines.push(`Total dos produtos: ${formatCurrency(params.subtotalCents)}`);
  lines.push("");
  lines.push(`Nome: ${params.customerName}`);
  lines.push(`Modalidade: ${modalidadeLabel}`);
  lines.push("");
  lines.push("Gostaria de confirmar a disponibilidade e finalizar meu pedido.");

  return lines.join("\n");
}
