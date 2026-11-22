import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EDITORIAL_GUIDES } from "@/domain/guides";
import { buildBreadcrumbJsonLd } from "@/domain/jsonld";
import { BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.konnexy.com.br";

export const metadata: Metadata = {
  title: "Guias de Criação Artesanal: Velas, Sabonetes e Aromatizadores",
  description:
    "Conteúdo técnico e prático da Artes em Aroma: como escolher essência para velas, diferenças entre famílias olfativas, materiais básicos para sabonetes e tipos de ceras.",
  alternates: {
    canonical: `${SITE_URL}/guias`,
  },
};

export default function GuidesIndexPage() {
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Guias de Criação", path: "/guias" },
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-marrom/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">Guias de Criação</li>
            </ol>
          </nav>

          <div className="rounded-3xl border border-dourado/30 bg-creme p-8 sm:p-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
              <BookOpen className="h-4 w-4" />
              Base Editorial de Apoio ao Artesão
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-marrom sm:text-5xl">
              Guias Práticos para Velas, Saboaria e Perfumaria Artesanal
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-marrom/80 sm:text-base">
              Orientações claras e estruturadas para ajudar você a escolher essências, bases glicerinadas, ceras vegetais e volumes adequados para seus projetos em Suzano e região.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {EDITORIAL_GUIDES.map((guide) => (
              <article
                key={guide.slug}
                className="flex flex-col justify-between rounded-2xl border border-dourado/30 bg-brancoQuente p-6 shadow-xs transition hover:border-oliva"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-oliva">
                    <span className="font-semibold">Tempo de leitura: {guide.readingTime}</span>
                    <span className="text-marrom/60">{guide.responsibleSource}</span>
                  </div>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-marrom">
                    <Link href={`/guias/${guide.slug}`} className="hover:text-oliva">
                      {guide.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-xs font-medium text-oliva">
                    Indicado para: {guide.targetAudience}
                  </p>
                  <div className="mt-3 rounded-xl bg-creme/60 p-3.5 text-xs leading-relaxed text-marrom/85">
                    <strong className="flex items-center gap-1 text-marrom">
                      <CheckCircle2 className="h-3.5 w-3.5 text-oliva" />
                      Resposta principal:
                    </strong>
                    <p className="mt-1">{guide.mainAnswer}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-dourado/20 pt-4">
                  <Link
                    href={`/guias/${guide.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-oliva hover:text-marrom"
                  >
                    Ler guia completo com exemplos e cuidados
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
