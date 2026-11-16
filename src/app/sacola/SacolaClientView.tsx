"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, MessageCircle } from "lucide-react";

export function SacolaClientView() {
  const { items, subtotalCents, totalItemsCount, openDrawer } = useCart();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-dourado/30 bg-creme p-8">
        <h1 className="font-serif text-3xl font-semibold text-marrom sm:text-4xl">
          Sua Sacola de Solicitação ({totalItemsCount} itens)
        </h1>
        <p className="mt-2 text-sm text-marrom/80">
          Revise seus produtos selecionados e finalize sua solicitação para atendimento via WhatsApp.
        </p>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-brancoQuente p-8 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-oliva" />
            <p className="mt-3 text-sm text-marrom/80">
              Você ainda não adicionou produtos à sua sacola.
            </p>
            <Link
              href="/produtos"
              className="mt-5 inline-block rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente"
            >
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-brancoQuente p-6">
              <ul className="divide-y divide-dourado/20">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId ?? "default"}`}
                    className="flex items-center justify-between py-3 text-sm"
                  >
                    <div>
                      <strong className="text-marrom">{item.productName}</strong>
                      <span className="ml-2 text-xs text-marrom/70">
                        ({item.variantName}) × {item.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-marrom">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-dourado/25 pt-4">
                <span className="text-sm font-medium text-marrom">Total estimado:</span>
                <span className="font-serif text-2xl font-bold text-marrom">
                  {formatCurrency(subtotalCents)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openDrawer}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-oliva px-6 py-4 text-sm font-semibold text-brancoQuente hover:bg-marrom"
            >
              <MessageCircle className="h-5 w-5" />
              Informar nome/contato e Enviar Pedido no WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
