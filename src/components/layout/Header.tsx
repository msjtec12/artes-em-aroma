"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  MapPin,
  Sparkles,
} from "lucide-react";

export function Header() {
  const { totalItemsCount, openDrawer } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/produtos?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-dourado/25 bg-brancoQuente/95 backdrop-blur-md">
      {/* Faixa superior editorial discreta */}
      <div className="bg-marrom px-4 py-1.5 text-center text-xs text-creme">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <MapPin className="h-3.5 w-3.5 text-dourado" />
            Loja Física em Suzano/SP • Rua Rui Barbosa, 310 — Vila Costa
          </span>
          <span className="mx-auto sm:mx-0">
            Essências, Ceras Vegetais, Base Glicerinada e Matérias-Primas Artesanais
          </span>
          <Link
            href="/guias"
            className="hidden items-center gap-1 text-dourado hover:underline md:inline-flex"
          >
            <Sparkles className="h-3 w-3" />
            Guias de Criação
          </Link>
        </div>
      </div>

      {/* Barra principal */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo original */}
        <Link href="/" className="flex items-center gap-3.5 group" aria-label="Artes em Aroma - Início">
          <img
            src="/images/logo-artes-em-aroma.jpg"
            alt="Logo Loja Artes em Aroma — Matéria Prima para Sabonetes e Velas"
            className="h-14 w-14 rounded-full border border-dourado/40 object-cover shadow-xs transition group-hover:scale-105 sm:h-16 sm:w-16"
          />
          <div className="flex flex-col">
            <span className="font-serif text-xl leading-none font-bold text-marrom sm:text-2xl">
              Artes <span className="font-script font-normal text-dourado">em</span>{" "}
              <span className="text-oliva">Aroma</span>
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-widest text-marrom/75 uppercase">
              Matéria-Prima para Sabonetes e Velas
            </span>
          </div>
        </Link>

        {/* Navegação Desktop */}
        <nav
          className="hidden items-center gap-7 text-sm font-medium text-marrom lg:flex"
          aria-label="Menu principal"
        >
          <Link href="/" className="transition hover:text-oliva">
            Início
          </Link>
          <Link href="/produtos" className="transition hover:text-oliva">
            Produtos
          </Link>
          <Link
            href="/produtos#categorias"
            className="transition hover:text-oliva"
          >
            Categorias
          </Link>
          <Link href="/guias" className="transition hover:text-oliva">
            Guias &amp; Receitas Base
          </Link>
          <Link href="/sobre" className="transition hover:text-oliva">
            Sobre
          </Link>
          <Link href="/duvidas" className="transition hover:text-oliva">
            Dúvidas
          </Link>
          <Link href="/contato" className="transition hover:text-oliva">
            Contato
          </Link>
        </nav>

        {/* Ações: Busca, Sacola e Menu Mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dourado/30 bg-creme/70 text-marrom transition hover:border-oliva hover:bg-creme"
            aria-label="Abrir busca de produtos"
          >
            <Search className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={openDrawer}
            className="relative flex items-center gap-2 rounded-full bg-oliva px-4 py-2.5 text-xs font-semibold text-brancoQuente shadow-xs transition hover:bg-marrom sm:text-sm"
            aria-label={`Abrir sacola com ${totalItemsCount} itens`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Sacola</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brancoQuente px-1.5 text-xs font-bold text-marrom">
              {totalItemsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dourado/30 text-marrom lg:hidden"
            aria-label="Menu mobile"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Barra de busca expansível */}
      {searchOpen && (
        <div className="border-t border-dourado/20 bg-creme px-4 py-3">
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto flex max-w-3xl items-center gap-2"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por essência, cera de coco, base glicerinada, frasco..."
              className="w-full rounded-xl border border-dourado/40 bg-brancoQuente px-4 py-2.5 text-sm text-marrom focus:border-oliva focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-xl bg-oliva px-5 py-2.5 text-sm font-semibold text-brancoQuente hover:bg-marrom"
            >
              Buscar
            </button>
          </form>
        </div>
      )}

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div className="border-t border-dourado/25 bg-brancoQuente px-4 py-5 lg:hidden">
          <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você deseja produzir hoje?"
              className="w-full rounded-xl border border-dourado/40 bg-creme/60 px-3.5 py-2.5 text-sm text-marrom"
            />
            <button
              type="submit"
              className="rounded-xl bg-oliva px-4 py-2.5 text-xs font-semibold text-brancoQuente"
            >
              Ir
            </button>
          </form>
          <nav className="flex flex-col space-y-3 text-base font-medium text-marrom">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Início
            </Link>
            <Link
              href="/produtos"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Catálogo de Produtos
            </Link>
            <Link
              href="/produtos?categoria=essencias-aromaticas"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 text-sm text-marrom/80 hover:bg-creme"
            >
              • Categorias: Essências Aromáticas
            </Link>
            <Link
              href="/produtos?categoria=ceras-e-velas"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 text-sm text-marrom/80 hover:bg-creme"
            >
              • Categorias: Ceras e Velas
            </Link>
            <Link
              href="/produtos?categoria=bases-saboaria-perfumaria"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 text-sm text-marrom/80 hover:bg-creme"
            >
              • Categorias: Bases para Saboaria
            </Link>
            <Link
              href="/guias"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Guias de Criação Artesanal
            </Link>
            <Link
              href="/sobre"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Sobre a Artes em Aroma
            </Link>
            <Link
              href="/duvidas"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Dúvidas Frequentes
            </Link>
            <Link
              href="/contato"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-creme"
            >
              Localização e Contato (Suzano)
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
