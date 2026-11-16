"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart, trackFunnelEvent } from "./CartContext";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Truck,
  ShieldCheck,
} from "lucide-react";

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    clearCart,
    totalItemsCount,
    subtotalCents,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentMode, setFulfillmentMode] = useState<"retirada" | "entrega_consultar">(
    "retirada"
  );
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<{
    orderCode: string;
    whatsappUrl: string;
    whatsappMessage: string;
    subtotalCents: number;
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    `idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );

  if (!isDrawerOpen) return null;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    setErrorMsg(null);
    setSubmitting(true);
    trackFunnelEvent("begin_checkout", { itemsCount: totalItemsCount });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          fulfillmentMode,
          customerNotes,
          idempotencyKey,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível registrar sua solicitação.");
      }

      setCreatedOrder({
        orderCode: data.orderCode,
        whatsappUrl: data.whatsappUrl,
        whatsappMessage: data.whatsappMessage,
        subtotalCents: data.subtotalCents,
      });

      clearCart();
      // Gera nova chave de idempotência para futuros pedidos diferentes
      setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erro ao processar sua solicitação. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWhatsApp = async (orderCode: string, whatsappUrl: string) => {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode }),
      });
    } catch {
      // continua mesmo se falhar telemetria
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-marrom/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Sacola de solicitações Artes em Aroma"
    >
      <div className="relative flex h-full w-full max-w-md flex-col bg-brancoQuente text-marrom shadow-2xl">
        {/* Cabeçalho da Sacola */}
        <div className="flex items-center justify-between border-b border-dourado/25 bg-creme px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-oliva" />
            <h2 className="font-serif text-xl font-semibold text-marrom">
              Sua Sacola de Criação
            </h2>
            <span className="rounded-full bg-oliva px-2.5 py-0.5 text-xs font-medium text-brancoQuente">
              {totalItemsCount}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreatedOrder(null);
              closeDrawer();
            }}
            className="rounded-full p-2 text-marrom/70 hover:bg-dourado/15 hover:text-marrom"
            aria-label="Fechar sacola"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {createdOrder ? (
            <div className="space-y-5 rounded-2xl border border-salvia/50 bg-creme/70 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-oliva" />
                <div>
                  <span className="text-xs font-semibold tracking-wider text-oliva uppercase">
                    Solicitação Iniciada
                  </span>
                  <h3 className="font-serif text-2xl font-semibold text-marrom">
                    Pedido #{createdOrder.orderCode}
                  </h3>
                  <p className="mt-1 text-sm text-marrom/80">
                    Sua solicitação foi registrada com total calculado no servidor de{" "}
                    <strong>{formatCurrency(createdOrder.subtotalCents)}</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-dourado/30 bg-brancoQuente p-3.5 text-xs leading-relaxed text-marrom/85">
                <p className="font-semibold text-marrom">Importante:</p>
                <p className="mt-1">
                  O registro da solicitação não significa confirmação automática de estoque ou pagamento. Clique no botão abaixo para enviar a mensagem pelo WhatsApp e concluir o atendimento com nossa equipe em Suzano.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleOpenWhatsApp(createdOrder.orderCode, createdOrder.whatsappUrl)
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-oliva px-5 py-3.5 text-sm font-semibold text-brancoQuente shadow-md transition hover:bg-marrom"
              >
                <MessageCircle className="h-5 w-5" />
                Abrir WhatsApp e Enviar Pedido
              </button>

              <details className="text-xs text-marrom/75">
                <summary className="cursor-pointer font-medium underline">
                  Ver mensagem formatada do pedido
                </summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-brancoQuente p-3 font-sans text-xs text-marrom">
                  {createdOrder.whatsappMessage}
                </pre>
              </details>

              <button
                type="button"
                onClick={() => {
                  setCreatedOrder(null);
                  closeDrawer();
                }}
                className="w-full rounded-xl border border-dourado/40 py-2.5 text-xs font-medium text-marrom hover:bg-creme"
              >
                Continuar navegando na vitrine
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-creme text-oliva">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-marrom">
                Sua sacola está vazia
              </h3>
              <p className="mt-2 max-w-xs text-sm text-marrom/75">
                Explore nossas essências, ceras vegetais, bases glicerinadas e frascos para iniciar sua criação.
              </p>
              <Link
                href="/produtos"
                onClick={closeDrawer}
                className="mt-6 rounded-xl bg-oliva px-6 py-3 text-sm font-medium text-brancoQuente transition hover:bg-marrom"
              >
                Explorar catálogo de produtos
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lista de itens */}
              <ul className="divide-y divide-dourado/20">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId ?? "default"}`}
                    className="flex gap-3.5 py-4"
                  >
                    <img
                      src={item.imageUrl || "/images/prod-essencia-lavanda.svg"}
                      alt={item.productName}
                      className="h-18 w-18 shrink-0 rounded-xl border border-dourado/20 bg-creme object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/produtos/${item.slug}`}
                            onClick={closeDrawer}
                            className="font-serif text-base font-semibold text-marrom hover:text-oliva"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-xs text-marrom/70">
                            Variante: {item.variantName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 text-marrom/50 hover:text-red-700"
                          aria-label={`Remover ${item.productName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center rounded-lg border border-dourado/30 bg-creme">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            className="px-2.5 py-1 text-marrom hover:bg-dourado/15"
                            aria-label="Diminuir quantidade"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            className="px-2.5 py-1 text-marrom hover:bg-dourado/15"
                            aria-label="Aumentar quantidade"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-marrom">
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Formulário de Solicitação via WhatsApp */}
              <form
                onSubmit={handleCreateOrder}
                className="space-y-4 rounded-2xl border border-dourado/30 bg-creme/60 p-4"
              >
                <h3 className="font-serif text-lg font-semibold text-marrom">
                  Dados para Atendimento no WhatsApp
                </h3>

                {errorMsg && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="cart-customer-name"
                    className="block text-xs font-medium text-marrom"
                  >
                    Seu nome *
                  </label>
                  <input
                    id="cart-customer-name"
                    type="text"
                    required
                    minLength={2}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Mariana Silva"
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3.5 py-2.5 text-sm text-marrom focus:border-oliva focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cart-customer-phone"
                    className="block text-xs font-medium text-marrom"
                  >
                    Seu WhatsApp / Telefone *
                  </label>
                  <input
                    id="cart-customer-phone"
                    type="tel"
                    required
                    minLength={8}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3.5 py-2.5 text-sm text-marrom focus:border-oliva focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs font-medium text-marrom">
                    Preferência de atendimento
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFulfillmentMode("retirada")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                        fulfillmentMode === "retirada"
                          ? "border-oliva bg-oliva text-brancoQuente"
                          : "border-dourado/40 bg-brancoQuente text-marrom"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Retirada em Suzano
                    </button>
                    <button
                      type="button"
                      onClick={() => setFulfillmentMode("entrega_consultar")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                        fulfillmentMode === "entrega_consultar"
                          ? "border-oliva bg-oliva text-brancoQuente"
                          : "border-dourado/40 bg-brancoQuente text-marrom"
                      }`}
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Consultar Entrega
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="cart-customer-notes"
                    className="block text-xs font-medium text-marrom"
                  >
                    Observações (opcional)
                  </label>
                  <textarea
                    id="cart-customer-notes"
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Alguma dúvida sobre aplicação ou horário de retirada?"
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3.5 py-2 text-xs text-marrom focus:border-oliva focus:outline-none"
                  />
                </div>

                <div className="border-t border-dourado/25 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-marrom/80">Subtotal estimado:</span>
                    <span className="font-serif text-xl font-bold text-marrom">
                      {formatCurrency(subtotalCents)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-marrom/65">
                    <ShieldCheck className="h-3.5 w-3.5 text-oliva" />
                    Valores validados no servidor. Usamos seus dados apenas para o atendimento (LGPD).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-oliva px-5 py-3.5 text-sm font-semibold text-brancoQuente shadow-md transition hover:bg-marrom disabled:opacity-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  {submitting
                    ? "Validando e gerando pedido..."
                    : "Enviar solicitação pelo WhatsApp"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
