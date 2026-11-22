import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { db, ensureDatabaseInitialized } from "@/db";
import { faqs } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/domain/jsonld";
import { HelpCircle, ArrowRight } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.konnexy.com.br";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dúvidas Frequentes sobre Essências, Velas e Sabonetes em Suzano",
  description:
    "Respostas diretas sobre onde comprar essências em Suzano, materiais para velas e sabonetes artesanais, diferença entre essência e óleo essencial e como pedir pelo WhatsApp.",
  alternates: {
    canonical: `${SITE_URL}/duvidas`,
  },
};

export default async function FaqPage() {
  await ensureDatabaseInitialized();
  const activeFaqs = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(asc(faqs.displayOrder));

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Dúvidas Frequentes", path: "/duvidas" },
  ]);

  const faqJsonLd = buildFaqPageJsonLd(activeFaqs);

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-marrom/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">Dúvidas Frequentes</li>
            </ol>
          </nav>

          <div className="rounded-3xl border border-dourado/30 bg-creme p-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
              <HelpCircle className="h-4 w-4" />
              Central de Respostas — Artes em Aroma
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-marrom sm:text-5xl">
              Perguntas Frequentes sobre Produtos, Criação e Pedidos
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-marrom/80">
              Reunimos respostas objetivas para ajudar você a escolher matérias-primas e solicitar seu pedido em Suzano/SP.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {activeFaqs.map((faq) => (
              <article
                key={faq.id}
                className="rounded-2xl border border-dourado/30 bg-brancoQuente p-6 shadow-xs"
              >
                <span className="inline-block rounded-full bg-creme px-3 py-0.5 text-[11px] font-semibold text-oliva">
                  {faq.category}
                </span>
                <h2 className="mt-2 font-serif text-xl font-semibold text-marrom">
                  {faq.question}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-marrom/85">
                  {faq.answer}
                </p>
                {faq.relatedProductSlug && (
                  <Link
                    href={`/produtos/${faq.relatedProductSlug}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-oliva hover:text-marrom"
                  >
                    Conferir insumo relacionado no catálogo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-dourado/30 bg-creme/60 p-8 text-center">
            <h2 className="font-serif text-2xl font-semibold text-marrom">
              Ainda tem alguma dúvida específica?
            </h2>
            <p className="mt-2 text-sm text-marrom/80">
              Consulte nossos guias de criação artesanal ou entre em contato diretamente com nossa loja em Suzano.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/guias"
                className="rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
              >
                Ler Guias de Criação
              </Link>
              <Link
                href="/contato"
                className="rounded-xl border border-dourado/50 bg-brancoQuente px-6 py-3 text-xs font-semibold text-marrom hover:bg-creme"
              >
                Falar com a Loja
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
