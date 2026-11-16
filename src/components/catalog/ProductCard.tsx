"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProductWithRelations } from "@/domain/products";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { ShoppingBag, Check, AlertCircle } from "lucide-react";

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    product.variants[0]?.id ?? null
  );
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const displayPriceCents = activeVariant ? activeVariant.priceCents : product.priceCents;
  const displayVolume = activeVariant
    ? activeVariant.volumeOrWeight
    : product.volumeOrWeight;
  const isAvailable =
    product.isAvailable && (activeVariant ? activeVariant.isAvailable : true);
  const primaryImage =
    product.images[0]?.url || "/images/prod-essencia-lavanda.svg";
  const primaryAlt = product.images[0]?.alt || product.name;

  const handleQuickAdd = () => {
    if (!isAvailable) return;
    addItem({
      productId: product.id,
      variantId: activeVariant?.id ?? null,
      slug: product.slug,
      productName: product.name,
      variantName: activeVariant?.name || displayVolume,
      sku: activeVariant?.sku || product.sku,
      unitPriceCents: displayPriceCents,
      imageUrl: primaryImage,
      quantity: 1,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-dourado/25 bg-brancoQuente p-4 shadow-xs transition duration-300 hover:-translate-y-0.5 hover:border-dourado/60 hover:shadow-md">
      <div>
        {/* Imagem + Badges */}
        <Link
          href={`/produtos/${product.slug}`}
          className="relative block aspect-square overflow-hidden rounded-xl bg-creme"
        >
          <img
            src={primaryImage}
            alt={primaryAlt}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-oliva px-2.5 py-0.5 text-[11px] font-semibold text-brancoQuente">
                Novidade
              </span>
            )}
            {product.isFeatured && (
              <span className="rounded-full bg-dourado px-2.5 py-0.5 text-[11px] font-semibold text-brancoQuente">
                Destaque
              </span>
            )}
            {!isAvailable && (
              <span className="rounded-full bg-marrom/90 px-2.5 py-0.5 text-[11px] font-semibold text-creme">
                Indisponível no momento
              </span>
            )}
          </div>
        </Link>

        {/* Categoria e Família Olfativa */}
        <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-oliva">
          <span className="font-medium">{product.categoryName}</span>
          {product.olfactoryFamily && (
            <span className="rounded-md bg-creme px-2 py-0.5 text-[11px] text-marrom/75">
              {product.olfactoryFamily}
            </span>
          )}
        </div>

        {/* Título e Descrição Curta */}
        <h3 className="mt-1.5 font-serif text-lg leading-snug font-semibold text-marrom">
          <Link href={`/produtos/${product.slug}`} className="hover:text-oliva">
            {product.name}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-marrom/75">
          {product.shortDescription}
        </p>

        {/* Tags de Uso */}
        {product.usageTypes.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {product.usageTypes.map((u) => (
              <span
                key={u}
                className="rounded-full border border-salvia/40 bg-creme/50 px-2 py-0.5 text-[10px] font-medium text-marrom/80"
              >
                {u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Seleção rápida de variante + Preço + CTA */}
      <div className="mt-4 border-t border-dourado/20 pt-3">
        {product.variants.length > 1 && (
          <div className="mb-2.5">
            <label
              htmlFor={`var-select-${product.id}`}
              className="sr-only"
            >
              Escolher volume ou variação
            </label>
            <select
              id={`var-select-${product.id}`}
              value={selectedVariantId ?? ""}
              onChange={(e) => setSelectedVariantId(Number(e.target.value))}
              className="w-full rounded-lg border border-dourado/35 bg-creme/60 px-2.5 py-1.5 text-xs text-marrom focus:border-oliva focus:outline-none"
            >
              {product.variants.map((v) => (
                <option key={v.id} value={v.id} disabled={!v.isAvailable}>
                  {v.name} — {formatCurrency(v.priceCents)}{" "}
                  {!v.isAvailable ? "(Indisponível)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="block text-[11px] text-marrom/65">
              {displayVolume}
            </span>
            <span className="font-serif text-xl font-bold text-marrom">
              {formatCurrency(displayPriceCents)}
            </span>
          </div>

          {isAvailable ? (
            <button
              type="button"
              onClick={handleQuickAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-oliva px-3.5 py-2.5 text-xs font-semibold text-brancoQuente transition hover:bg-marrom"
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" />
                  Na sacola
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  Adicionar
                </>
              )}
            </button>
          ) : (
            <Link
              href={`/produtos/${product.slug}`}
              className="inline-flex items-center gap-1 rounded-xl border border-dourado/40 bg-creme px-3 py-2 text-xs font-medium text-marrom/75 hover:bg-dourado/15"
            >
              <AlertCircle className="h-3.5 w-3.5 text-dourado" />
              Ver detalhes
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
