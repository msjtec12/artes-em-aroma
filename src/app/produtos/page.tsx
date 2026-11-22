import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getAllCatalogProducts } from "@/domain/products";
import { db, ensureDatabaseInitialized } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { buildBreadcrumbJsonLd } from "@/domain/jsonld";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.konnexy.com.br";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilterParams = Boolean(
    params.q || params.sort || params.minPrice || params.maxPrice || params.page
  );

  return {
    title: "Catálogo de Essências, Ceras para Velas e Bases em Suzano",
    description:
      "Encontre essências aromáticas, cera vegetal de coco, base glicerinada para sabonetes, pavios e frascos âmbar em Suzano/SP na Artes em Aroma.",
    alternates: {
      // Canonical aponta sempre para /produtos limpo para evitar páginas duplicadas por filtros e ordenação
      canonical: `${SITE_URL}/produtos`,
    },
    robots: hasFilterParams
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureDatabaseInitialized();
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q : "";
  const categoriaSlug =
    typeof params.categoria === "string" ? params.categoria : "todas";
  const uso = typeof params.uso === "string" ? params.uso : "todos";
  const sort =
    typeof params.sort === "string"
      ? (params.sort as "featured" | "price_asc" | "price_desc" | "newest" | "name_asc")
      : "featured";
  const maxPriceReais =
    typeof params.maxPrice === "string" && params.maxPrice !== ""
      ? Number(params.maxPrice)
      : undefined;
  const page =
    typeof params.page === "string" ? Math.max(1, Number(params.page)) : 1;

  const activeCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.displayOrder));

  const catalogResult = await getAllCatalogProducts({
    includeInactive: false,
    search: q,
    categorySlug: categoriaSlug,
    usageType: uso,
    maxPriceCents:
      maxPriceReais !== undefined && !Number.isNaN(maxPriceReais)
        ? Math.round(maxPriceReais * 100)
        : undefined,
    sortBy: sort,
    page,
    pageSize: 8,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Produtos", path: "/produtos" },
  ]);

  const usageOptions = [
    "todos",
    "Velas",
    "Sabonetes",
    "Aromatizadores",
    "Perfumaria Artesanal",
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb visível */}
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-marrom/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">Catálogo de Produtos</li>
            </ol>
          </nav>

          {/* Cabeçalho da Página */}
          <div className="rounded-3xl border border-dourado/30 bg-creme p-6 sm:p-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Catálogo Oficial — Suzano/SP
              </span>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-marrom sm:text-5xl">
                Essências, Bases, Ceras &amp; Acessórios Artesanais
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-marrom/80 sm:text-base">
                Escolha seus produtos e variações, adicione à sacola e envie seu pedido pelo WhatsApp para confirmarmos a disponibilidade na loja.
              </p>
            </div>

            {/* Formulário de Filtros e Busca (GET acessível e sem dependência exclusiva de JS) */}
            <form
              method="GET"
              action="/produtos"
              className="mt-6 grid grid-cols-1 gap-3.5 rounded-2xl border border-dourado/25 bg-brancoQuente p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label
                  htmlFor="filter-q"
                  className="block text-[11px] font-semibold text-marrom/75 uppercase"
                >
                  Buscar produto ou aroma
                </label>
                <div className="relative mt-1">
                  <input
                    id="filter-q"
                    name="q"
                    type="search"
                    defaultValue={q}
                    placeholder="Ex: Lavanda, Cera de Coco..."
                    className="w-full rounded-xl border border-dourado/35 bg-creme/40 py-2 pr-3 pl-8 text-xs text-marrom focus:border-oliva focus:outline-none"
                  />
                  <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-marrom/50" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="filter-cat"
                  className="block text-[11px] font-semibold text-marrom/75 uppercase"
                >
                  Categoria
                </label>
                <select
                  id="filter-cat"
                  name="categoria"
                  defaultValue={categoriaSlug}
                  className="mt-1 w-full rounded-xl border border-dourado/35 bg-creme/40 px-3 py-2 text-xs text-marrom focus:border-oliva focus:outline-none"
                >
                  <option value="todas">Todas as categorias</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-uso"
                  className="block text-[11px] font-semibold text-marrom/75 uppercase"
                >
                  Tipo de Utilização
                </label>
                <select
                  id="filter-uso"
                  name="uso"
                  defaultValue={uso}
                  className="mt-1 w-full rounded-xl border border-dourado/35 bg-creme/40 px-3 py-2 text-xs text-marrom focus:border-oliva focus:outline-none"
                >
                  {usageOptions.map((u) => (
                    <option key={u} value={u}>
                      {u === "todos" ? "Todas as aplicações" : `Para ${u}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="filter-sort"
                  className="block text-[11px] font-semibold text-marrom/75 uppercase"
                >
                  Ordenar por
                </label>
                <select
                  id="filter-sort"
                  name="sort"
                  defaultValue={sort}
                  className="mt-1 w-full rounded-xl border border-dourado/35 bg-creme/40 px-3 py-2 text-xs text-marrom focus:border-oliva focus:outline-none"
                >
                  <option value="featured">Destaques &amp; Disponibilidade</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                  <option value="newest">Mais recentes</option>
                  <option value="name_asc">Ordem alfabética (A-Z)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label
                    htmlFor="filter-max-price"
                    className="block text-[11px] font-semibold text-marrom/75 uppercase"
                  >
                    Preço máx. (R$)
                  </label>
                  <input
                    id="filter-max-price"
                    name="maxPrice"
                    type="number"
                    min="5"
                    step="5"
                    defaultValue={maxPriceReais ?? ""}
                    placeholder="Ex: 100"
                    className="mt-1 w-full rounded-xl border border-dourado/35 bg-creme/40 px-3 py-2 text-xs text-marrom focus:border-oliva focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-oliva px-4 py-2 text-xs font-semibold text-brancoQuente transition hover:bg-marrom"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filtrar
                </button>
              </div>
            </form>

            {/* Atalhos rápidos de categorias */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/produtos"
                className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                  categoriaSlug === "todas" && uso === "todos" && !q
                    ? "bg-marrom text-brancoQuente"
                    : "bg-brancoQuente text-marrom hover:bg-dourado/20"
                }`}
              >
                Todos ({catalogResult.total})
              </Link>
              {activeCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/produtos?categoria=${c.slug}`}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                    categoriaSlug === c.slug
                      ? "bg-oliva text-brancoQuente"
                      : "bg-brancoQuente text-marrom hover:bg-dourado/20"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Listagem de Produtos */}
          <div className="mt-10">
            {catalogResult.items.length === 0 ? (
              <div className="rounded-3xl border border-dourado/30 bg-creme/40 p-12 text-center">
                <h2 className="font-serif text-2xl font-semibold text-marrom">
                  Nenhum produto encontrado para este filtro
                </h2>
                <p className="mt-2 text-sm text-marrom/75">
                  Tente limpar os filtros ou buscar por outro termo como &ldquo;Essência&rdquo;, &ldquo;Cera&rdquo; ou &ldquo;Base&rdquo;.
                </p>
                <Link
                  href="/produtos"
                  className="mt-5 inline-block rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente"
                >
                  Limpar todos os filtros
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between text-xs text-marrom/75">
                  <span>
                    Exibindo <strong>{catalogResult.items.length}</strong> de{" "}
                    <strong>{catalogResult.total}</strong> produto(s)
                  </span>
                  <span>
                    Página {catalogResult.page} de {catalogResult.totalPages}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {catalogResult.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Paginação */}
                {catalogResult.totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {Array.from(
                      { length: catalogResult.totalPages },
                      (_, i) => i + 1
                    ).map((pNum) => {
                      const sp = new URLSearchParams();
                      if (q) sp.set("q", q);
                      if (categoriaSlug !== "todas") sp.set("categoria", categoriaSlug);
                      if (uso !== "todos") sp.set("uso", uso);
                      if (sort !== "featured") sp.set("sort", sort);
                      if (maxPriceReais) sp.set("maxPrice", String(maxPriceReais));
                      sp.set("page", String(pNum));

                      return (
                        <Link
                          key={pNum}
                          href={`/produtos?${sp.toString()}`}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition ${
                            pNum === catalogResult.page
                              ? "bg-oliva text-brancoQuente"
                              : "border border-dourado/35 bg-brancoQuente text-marrom hover:bg-creme"
                          }`}
                        >
                          {pNum}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
