"use client";

import React, { useState, useEffect } from "react";
import { ProductWithRelations } from "@/domain/products";
import { formatCurrency } from "@/lib/utils";
import { useCart, trackFunnelEvent } from "@/components/cart/CartContext";
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

export function ProductDetailPurchase({
  product,
}: {
  product: ProductWithRelations;
}) {
  const { addItem, openDrawer } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    trackFunnelEvent(
      "view_item",
      {
        productId: product.id,
        productSlug: product.slug,
        priceCents: product.priceCents,
      },
      `view_item_${product.id}`
    );
  }, [product.id, product.slug, product.priceCents]);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const currentPriceCents = activeVariant
    ? activeVariant.priceCents
    : product.priceCents;
  const currentVolume = activeVariant
    ? activeVariant.volumeOrWeight
    : product.volumeOrWeight;
  const currentSku = activeVariant ? activeVariant.sku : product.sku;
  const isAvailable =
    product.isAvailable && (activeVariant ? activeVariant.isAvailable : true);

  const primaryImage =
    product.images[0]?.url || "/images/prod-essencia-lavanda.svg";

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addItem({
      productId: product.id,
      variantId: activeVariant?.id ?? null,
      slug: product.slug,
      productName: product.name,
      variantName: activeVariant?.name || currentVolume,
      sku: currentSku,
      unitPriceCents: currentPriceCents,
      imageUrl: primaryImage,
      quantity,
    });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-dourado/35 bg-creme/65 p-6">
      {/* Preço e Disponibilidade */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-dourado/25 pb-4">
        <div>
          <span className="block text-xs text-marrom/70">
            Preço para a variação selecionada ({currentVolume})
          </span>
          <span className="font-serif text-4xl font-bold text-marrom">
            {formatCurrency(currentPriceCents)}
          </span>
          <span className="mt-1 block text-xs text-marrom/65">
            SKU: {currentSku} • Marca: {product.brand}
          </span>
        </div>

        <div>
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-oliva/15 px-3.5 py-1 text-xs font-semibold text-oliva">
              <CheckCircle2 className="h-4 w-4" />
              Disponível para solicitação
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-900/15 px-3.5 py-1 text-xs font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              Indisponível no momento
            </span>
          )}
        </div>
      </div>

      {/* Seleção de Variações */}
      {product.variants.length > 0 && (
        <div>
          <label className="block text-xs font-semibold tracking-wider text-marrom/80 uppercase">
            Escolha a Variação / Volume:
          </label>
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {product.variants.map((v) => {
              const selected = v.id === activeVariant?.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-oliva bg-oliva text-brancoQuente shadow-xs"
                      : "border-dourado/40 bg-brancoQuente text-marrom hover:border-oliva"
                  } ${!v.isAvailable ? "opacity-60" : ""}`}
                >
                  <div>
                    <span className="block text-xs font-semibold">{v.name}</span>
                    <span
                      className={`text-[11px] ${
                        selected ? "text-creme/90" : "text-marrom/70"
                      }`}
                    >
                      {v.isAvailable ? v.volumeOrWeight : "Indisponível"}
                    </span>
                  </div>
                  <span className="font-serif text-base font-bold">
                    {formatCurrency(v.priceCents)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantidade e Botão de Compra */}
      {isAvailable ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-dourado/40 bg-brancoQuente">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-3 text-marrom hover:bg-creme"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-10 text-center text-sm font-bold text-marrom">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(200, q + 1))}
                className="px-3.5 py-3 text-marrom hover:bg-creme"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-oliva px-6 py-3.5 text-sm font-semibold text-brancoQuente shadow-md transition hover:bg-marrom"
            >
              <ShoppingBag className="h-5 w-5" />
              Adicionar à Sacola ({formatCurrency(currentPriceCents * quantity)})
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              handleAddToCart();
              openDrawer();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-oliva/50 bg-brancoQuente px-5 py-3 text-xs font-semibold text-oliva transition hover:bg-creme"
          >
            <MessageCircle className="h-4 w-4" />
            Solicitar agora pelo WhatsApp
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-700/30 bg-amber-50/70 p-4 text-xs leading-relaxed text-marrom">
          <strong className="block font-semibold">
            Aviso de Indisponibilidade Temporária:
          </strong>
          Este lote encontra-se indisponível para solicitação imediata. Você pode consultar a previsão de reposição ou aromas equivalentes em nosso atendimento em Suzano.
        </div>
      )}
    </div>
  );
}
