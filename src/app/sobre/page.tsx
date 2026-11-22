import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { db, ensureDatabaseInitialized } from "@/db";
import { siteContent, storeSettings } from "@/db/schema";
import { buildBreadcrumbJsonLd } from "@/domain/jsonld";
import { Sparkles, HeartHandshake, Palette, MapPin } from "lucide-react";

const SITE_URL = "https://artesemaroma.konnexy.com.br";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sobre a Loja Artes em Aroma | Perfumaria e Saboaria Artesanal em Suzano",
  description:
    "Conheça a Artes em Aroma em Suzano/SP: um espaço para quem deseja transformar criatividade em produtos aromáticos com variedade, inspiração e atendimento próximo.",
  alternates: {
    canonical: `${SITE_URL}/sobre`,
  },
};

export default async function AboutPage() {
  await ensureDatabaseInitialized();
  const allContents = await db.select().from(siteContent);
  const [settings] = await db.select().from(storeSettings).limit(1);
  const aboutContent = allContents.find((c) => c.sectionKey === "about");

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Sobre", path: "/sobre" },
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
              <li className="font-semibold text-marrom">Sobre a Artes em Aroma</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-center gap-12 rounded-3xl border border-dourado/30 bg-creme p-8 sm:p-12 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <span className="font-script text-2xl text-oliva">
                Nossa Identidade Artesanal
              </span>
              <h1 className="font-serif text-4xl font-semibold text-marrom sm:text-5xl">
                {aboutContent?.title ||
                  "Um espaço para transformar criatividade em produtos aromáticos"}
              </h1>
              <p className="text-base font-medium text-oliva">
                {aboutContent?.subtitle ||
                  "Mais do que uma loja de essências: variedade, inspiração e atendimento próximo em Suzano, São Paulo."}
              </p>
              <p className="text-sm leading-relaxed text-marrom/85 sm:text-base">
                A Loja Artes em Aroma foi inaugurada em outubro de 2026. Ela surgiu da experiência de Cilene Simões com o artesanato e do desejo de facilitar o acesso a matérias-primas para artesãos da região.
              </p>
              <p className="text-sm leading-relaxed text-marrom/80">
                Atendemos artesãos, fabricantes de velas aromáticas, saboaria artesanal, empreendedores de perfumaria artesanal, pequenos negócios de aromatização e pessoas que estão dando os primeiros passos na criação manual em Suzano e região.
              </p>
            </div>

            <div className="lg:col-span-5">
              <img
                src="/images/atelier-artisan-shelf.svg"
                alt="Espaço Artes em Aroma em Suzano"
                className="w-full rounded-2xl border border-dourado/40 bg-brancoQuente p-2 shadow-md"
              />
            </div>
          </div>

          {/* Pilares */}
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-dourado/25 bg-brancoQuente p-6">
              <Palette className="h-7 w-7 text-oliva" />
              <h2 className="mt-3 font-serif text-2xl font-semibold text-marrom">
                Variedade para Criar
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                Reunimos essências aromáticas de diferentes famílias olfativas, ceras vegetais, bases glicerinadas, veículos para perfumaria, pavios e frascos em um só lugar.
              </p>
            </div>

            <div className="rounded-2xl border border-dourado/25 bg-brancoQuente p-6">
              <Sparkles className="h-7 w-7 text-oliva" />
              <h2 className="mt-3 font-serif text-2xl font-semibold text-marrom">
                Inspiração Autoral
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                Acreditamos no valor do feito à mão. Nossos insumos ajudam você a desenvolver desde presentes afetivos até coleções comerciais com identidade própria.
              </p>
            </div>

            <div className="rounded-2xl border border-dourado/25 bg-brancoQuente p-6">
              <HeartHandshake className="h-7 w-7 text-oliva" />
              <h2 className="mt-3 font-serif text-2xl font-semibold text-marrom">
                Atendimento Próximo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                Seja presencialmente na Vila Costa em Suzano ou pelo nosso atendimento no WhatsApp, acompanhamos cada pedido com transparência e agilidade.
              </p>
            </div>
          </div>

          {/* Convite para visita */}
          <div className="mt-12 rounded-3xl border border-dourado/30 bg-creme/60 p-8 text-center">
            <MapPin className="mx-auto h-7 w-7 text-oliva" />
            <h2 className="mt-2 font-serif text-2xl font-semibold text-marrom">
              Onde estamos em Suzano/SP
            </h2>
            <p className="mt-2 text-sm text-marrom/80">
              {settings?.addressStreet || "Rua Rui Barbosa, 310"},{" "}
              {settings?.addressNeighborhood || "Vila Costa"} —{" "}
              {settings?.addressCity || "Suzano"}/{settings?.addressState || "SP"} • CEP{" "}
              {settings?.addressZip || "08675-060"}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/produtos"
                className="rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
              >
                Explorar Catálogo de Produtos
              </Link>
              <Link
                href="/contato"
                className="rounded-xl border border-dourado/50 bg-brancoQuente px-6 py-3 text-xs font-semibold text-marrom hover:bg-creme"
              >
                Ver Horários e Mapa
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
