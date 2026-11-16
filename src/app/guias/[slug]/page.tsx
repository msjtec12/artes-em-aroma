import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/catalog/ProductCard";
import { EDITORIAL_GUIDES } from "@/domain/guides";
import { getAllCatalogProducts } from "@/domain/products";
import { buildBreadcrumbJsonLd } from "@/domain/jsonld";
import {
  CheckCircle2,
  AlertTriangle,
  Users,
  HelpCircle,
  BookOpen,
} from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.com.br";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);
  if (!guide) {
    return { title: "Guia não encontrado" };
  }

  return {
    title: guide.title,
    description: guide.mainAnswer,
    alternates: {
      canonical: `${SITE_URL}/guias/${guide.slug}`,
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = EDITORIAL_GUIDES.find((g) => g.slug === slug);

  if (!guide) {
    notFound();
  }

  const { items: allProducts } = await getAllCatalogProducts({
    includeInactive: false,
    pageSize: 100,
  });

  const relatedProducts = allProducts.filter((p) =>
    guide.relatedProductSlugs.includes(p.slug)
  );

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Guias de Criação", path: "/guias" },
    { name: guide.title, path: `/guias/${guide.slug}` },
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-marrom/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/guias" className="hover:text-oliva">
                  Guias de Criação
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">{guide.title}</li>
            </ol>
          </nav>

          <article className="space-y-8 rounded-3xl border border-dourado/30 bg-brancoQuente p-6 sm:p-10">
            <header className="border-b border-dourado/25 pb-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                <BookOpen className="h-4 w-4" />
                Guia Técnico Artes em Aroma • Leitura: {guide.readingTime}
              </span>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-marrom sm:text-5xl">
                {guide.title}
              </h1>
              <p className="mt-2 text-base text-marrom/80">{guide.subtitle}</p>
            </header>

            {/* Problema Abordado & Público */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-creme/60 p-4">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                  <HelpCircle className="h-4 w-4" />
                  Qual problema aborda
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-marrom/85 sm:text-sm">
                  {guide.problemAddressed}
                </p>
              </div>

              <div className="rounded-2xl bg-creme/60 p-4">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                  <Users className="h-4 w-4" />
                  Para quem é indicado
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-marrom/85 sm:text-sm">
                  {guide.targetAudience}
                </p>
              </div>
            </div>

            {/* Resposta Principal */}
            <div className="rounded-2xl border border-oliva/35 bg-creme p-6">
              <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-marrom">
                <CheckCircle2 className="h-5 w-5 text-oliva" />
                Resposta Direta
              </h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-marrom sm:text-base">
                {guide.mainAnswer}
              </p>
            </div>

            {/* Explicações Detalhadas */}
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-marrom">
                Explicações e Fundamentos
              </h2>
              {guide.explanations.map((exp, idx) => (
                <p
                  key={idx}
                  className="text-sm leading-relaxed text-marrom/85 sm:text-base"
                >
                  {exp}
                </p>
              ))}
            </div>

            {/* Exemplos Práticos */}
            <div className="rounded-2xl border border-dourado/30 bg-creme/45 p-6">
              <h2 className="font-serif text-xl font-semibold text-marrom">
                Exemplos de Aplicação na Prática
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-marrom/85">
                {guide.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>

            {/* Cuidados Pertinentes */}
            <div className="rounded-2xl border border-amber-700/30 bg-amber-50/60 p-5">
              <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-marrom">
                <AlertTriangle className="h-5 w-5 text-amber-800" />
                Cuidados Pertinentes
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-marrom/85 sm:text-sm">
                {guide.careInstructions}
              </p>
            </div>

            {/* Fonte / Responsável */}
            <footer className="border-t border-dourado/20 pt-4 text-xs text-marrom/65">
              Responsável pela informação: <strong>{guide.responsibleSource}</strong> • Atualizado em {guide.updatedAt}
            </footer>
          </article>

          {/* Produtos Relacionados ao Guia */}
          {relatedProducts.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-2xl font-semibold text-marrom">
                Insumos Relacionados a este Guia
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
