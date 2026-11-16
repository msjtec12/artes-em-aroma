"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: number;
  variantId: number | null;
  slug: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string;
}

interface CartContextValue {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, variantId: number | null) => void;
  updateQuantity: (productId: number, variantId: number | null, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalCents: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "artes_em_aroma_cart_v2";
const DEDUP_EVENT_SET = new Set<string>();

export function trackFunnelEvent(
  event: string,
  params?: Record<string, unknown>,
  dedupKey?: string
) {
  if (typeof window === "undefined") return;
  if (dedupKey) {
    if (DEDUP_EVENT_SET.has(dedupKey)) return;
    DEDUP_EVENT_SET.add(dedupKey);
  }
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, params }),
  }).catch(() => {});
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignora erro de leitura
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignora erro de gravação
    }
  }, [items, hydrated]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    trackFunnelEvent("view_cart");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const addItem = useCallback(
    (incoming: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qtyToAdd = Math.max(1, incoming.quantity ?? 1);
      setItems((prev) => {
        const idx = prev.findIndex(
          (i) =>
            i.productId === incoming.productId &&
            (i.variantId ?? null) === (incoming.variantId ?? null)
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + qtyToAdd,
            unitPriceCents: incoming.unitPriceCents,
          };
          return updated;
        }
        return [
          ...prev,
          {
            ...incoming,
            quantity: qtyToAdd,
          },
        ];
      });
      trackFunnelEvent("add_to_cart", {
        productId: incoming.productId,
        variantId: incoming.variantId,
        productSlug: incoming.slug,
        quantity: qtyToAdd,
      });
      setIsDrawerOpen(true);
    },
    []
  );

  const removeItem = useCallback((productId: number, variantId: number | null) => {
    setItems((prev) =>
      prev.filter(
        (i) =>
          !(i.productId === productId && (i.variantId ?? null) === (variantId ?? null))
      )
    );
    trackFunnelEvent("remove_from_cart", { productId, variantId });
  }, []);

  const updateQuantity = useCallback(
    (productId: number, variantId: number | null, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && (i.variantId ?? null) === (variantId ?? null)
            ? { ...i, quantity: Math.min(500, quantity) }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalCents = items.reduce(
    (acc, item) => acc + item.unitPriceCents * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser utilizado dentro de um CartProvider");
  }
  return ctx;
}
