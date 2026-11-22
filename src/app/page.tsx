import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/catalog/ProductCard";
import { db, ensureDatabaseInitialized } from "@/db";
import {
  categories,
  storeSettings,
  siteContent,
  faqs,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getAllCatalogProducts } from "@/domain/products";
import { EDITORIAL_GUIDES } from "@/domain/guides";
import {
  buildOrganizationAndLocalBusinessJsonLd,
  buildFaqPageJsonLd,
} from "@/domain/jsonld";
import {
  Sparkles,
  Flame,
  Droplets,
  Wind,
  MapPin,
  Phone,
  Clock,
  Instagram,
  ArrowRight,
  BookOpen,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDatabaseInitialized();

  const [settings] = await db.select().from(storeSettings).limit(1);
  const allContents = await db.select().from(siteContent);
  const activeCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.displayOrder));

  const activeFaqs = await db
    .select()
    .from(faqs)
    .where(eq(faqs.isActive, true))
    .orderBy(asc(faqs.displayOrder));

  const { items: allProducts } = await getAllCatalogProducts({
    includeInactive: false,
    pageSize: 24,
  });

  const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 4);
  const newProducts = allProducts.filter((p) => p.isNew).slice(0, 4);

  const heroContent = allContents.find((c) => c.sectionKey === "hero");
  const aboutContent = allContents.find((c) => c.sectionKey === "about");
  const startContent = allContents.find((c) => c.sectionKey === "start_creating");

  const orgJsonLd = settings
    ? buildOrganizationAndLocalBusinessJsonLd(settings)
    : null;
  const faqJsonLd = buildFaqPageJsonLd(activeFaqs.slice(0, 6));

  return (
    <div className="flex min-h-screen flex-col">
      {orgJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Header />
      {settings && !settings.isDataConfirmedForPublication && (
        <div role="status" className="border-b border-dourado/30 bg-brancoQuente px-4 py-3 text-center text-sm text-marrom">
          <strong>Catálogo em atualização:</strong> produtos e valores ilustrativos, sujeitos à confirmação da loja. Pedidos online ainda não estão liberados.
        </div>
      )}

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden border-b border-dourado/25 bg-creme py-14 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-dourado/40 bg-brancoQuente px-4 py-1.5 text-xs font-medium text-oliva">
                <Sparkles className="h-3.5 w-3.5 text-dourado" />
                <span>Atelier de Insumos &amp; Essências em Suzano, SP</span>
              </div>

              <h1 className="font-serif text-4xl leading-tight font-semibold text-marrom sm:text-5xl lg:text-6xl">
                Essências e materiais para velas e sabonetes artesanais em Suzano
              </h1>

              <p className="text-lg leading-relaxed text-marrom/85 sm:text-xl">
                {heroContent?.subtitle ||
                  "Essências, bases, ceras e matérias-primas para dar vida às suas criações."}
              </p>

              <p className="text-sm leading-relaxed text-marrom/75">
                {heroContent?.body ||
                  "Para artesãos, fabricantes de velas, saboaria artesanal, empreendedores de perfumaria e quem deseja criar com qualidade e atendimento próximo."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a href="https://wa.me/5511910771820?text=Ol%C3%A1%21%20Gostaria%20de%20consultar%20os%20materiais%20dispon%C3%ADveis%20para%20artesanato." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-oliva px-7 py-4 text-sm font-semibold text-brancoQuente hover:bg-marrom">Consultar produtos no WhatsApp</a>
                <Link
                  href={heroContent?.ctaPrimaryHref || "/produtos"}
                  className="inline-flex items-center gap-2 rounded-xl bg-oliva px-7 py-4 text-sm font-semibold text-brancoQuente shadow-sm transition hover:bg-marrom"
                >
                  {heroContent?.ctaPrimaryText || "Explorar produtos"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={heroContent?.ctaSecondaryHref || "/sobre"}
                  className="inline-flex items-center gap-2 rounded-xl border border-dourado/50 bg-brancoQuente px-7 py-4 text-sm font-semibold text-marrom transition hover:border-oliva hover:bg-creme"
                >
                  {heroContent?.ctaSecondaryText || "Conhecer a loja"}
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-dourado/25 pt-6 text-xs text-marrom/80">
                <div>
                  <strong className="block font-serif text-base text-marrom">
                    Saboaria &amp; Velas
                  </strong>
                  <span>Ceras vegetais, bases glicerinadas e pavios</span>
                </div>
                <div>
                  <strong className="block font-serif text-base text-marrom">
                    Perfumaria &amp; Casa
                  </strong>
                  <span>Essências concentradas, bases e frascos</span>
                </div>
                <div>
                  <strong className="block font-serif text-base text-marrom">
                    Suzano e Região
                  </strong>
                  <span>Retirada em loja ou pedido fácil no WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-dourado/35 bg-brancoQuente p-3 shadow-lg">
                <img
                  src={
                    heroContent?.imageUrl ||
                    "/images/hero-botanical-composition.svg"
                  }
                  alt={
                    heroContent?.imageAlt ||
                    "Composição fotográfica artesanal com essências, velas vegetais e sabonetes"
                  }
                  className="h-auto w-full rounded-2xl object-cover"
                />
                <div className="mt-3 flex items-center justify-between px-2 text-xs text-marrom/75">
                  <span className="font-script text-lg text-oliva">
                    Curadoria botânica para suas formulações
                  </span>
                  <span>Itens reais disponíveis no catálogo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PRINCIPAIS CATEGORIAS */}
        <section id="categorias" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="font-script text-2xl text-oliva">
                  Matérias-primas essenciais
                </span>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                  Principais Categorias
                </h2>
              </div>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-oliva hover:text-marrom"
              >
                Ver todo o catálogo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/produtos?categoria=${cat.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-dourado/25 bg-creme/55 p-5 transition hover:-translate-y-1 hover:border-oliva hover:bg-creme hover:shadow-md"
                >
                  <div>
                    <div className="mb-4 aspect-4/3 overflow-hidden rounded-xl bg-brancoQuente">
                      <img
                        src={cat.imageUrl || "/images/cat-essencias.svg"}
                        alt={cat.imageAlt || cat.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-marrom group-hover:text-oliva">
                      {cat.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-marrom/75">
                      {cat.description}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-oliva">
                    Explorar categoria
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. PRODUTOS EM DESTAQUE */}
        <section className="border-y border-dourado/20 bg-creme/45 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="font-script text-2xl text-oliva">
                  Preferidos dos artesãos
                </span>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                  Produtos em Destaque
                </h2>
                <p className="mt-2 text-sm text-marrom/75">
                  Insumos selecionados para velas aromáticas, sabonetes glicerinados e difusores de ambiente.
                </p>
              </div>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-oliva hover:text-marrom"
              >
                Ver catálogo completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* 4. COMECE SUA CRIAÇÃO (POR PROJETO ARTESANAL) */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="font-script text-2xl text-oliva">
                Inspiração prática
              </span>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                {startContent?.title || "Comece sua criação artesanal"}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-marrom/80 sm:text-base">
                {startContent?.subtitle ||
                  "Escolha seu caminho criativo e filtre rapidamente os insumos recomendados para o seu projeto."}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-dourado/30 bg-creme/60 p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-oliva text-brancoQuente">
                  <Flame className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-marrom">
                  Velas Aromáticas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                  Cera vegetal de coco para potes, essências lipossolúveis com ótima projeção, pavios de algodão encerados e potes de vidro.
                </p>
                <Link
                  href="/produtos?uso=Velas"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-oliva hover:text-marrom"
                >
                  Ver insumos para velas
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-creme/60 p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-oliva text-brancoQuente">
                  <Droplets className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-marrom">
                  Saboaria Artesanal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                  Base glicerinada vegetal branca e transparente, essências cosméticas suaves e insumos para barras botânicas e lembrancinhas.
                </p>
                <Link
                  href="/produtos?uso=Sabonetes"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-oliva hover:text-marrom"
                >
                  Ver insumos para sabonetes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-creme/60 p-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-oliva text-brancoQuente">
                  <Wind className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-marrom">
                  Difusores &amp; Home Spray
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                  Base veículo pronta para aromatizadores, frascos de vidro âmbar estilo boticário, varetas difusoras, tampas e válvulas spray.
                </p>
                <Link
                  href="/produtos?uso=Aromatizadores"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-oliva hover:text-marrom"
                >
                  Ver insumos para aromatizadores
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. NOVIDADES & GUIAS EDITORIAIS GEO */}
        <section className="border-t border-dourado/20 bg-creme/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {newProducts.length > 0 && (
              <div className="mb-16">
                <span className="font-script text-2xl text-oliva">
                  Lotes recentes
                </span>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom">
                  Novidades no Catálogo
                </h2>
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {newProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* Base Editorial GEO */}
            <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6 sm:p-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                    <BookOpen className="h-4 w-4" />
                    Conteúdo Técnico Verificado
                  </span>
                  <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom">
                    Guias de Escolha &amp; Formulação Artesanal
                  </h2>
                </div>
                <Link
                  href="/guias"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-oliva hover:text-marrom"
                >
                  Ler todos os 6 guias completos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
                {EDITORIAL_GUIDES.slice(0, 3).map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guias/${guide.slug}`}
                    className="flex flex-col justify-between rounded-2xl border border-dourado/25 bg-creme/50 p-5 transition hover:border-oliva hover:bg-creme"
                  >
                    <div>
                      <span className="text-[11px] font-medium text-oliva">
                        Leitura: {guide.readingTime} • Para: {guide.targetAudience.slice(0, 45)}...
                      </span>
                      <h3 className="mt-1.5 font-serif text-lg font-semibold text-marrom">
                        {guide.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-marrom/80">
                        {guide.mainAnswer}
                      </p>
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-oliva">
                      Ler orientação completa
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 6. CONHEÇA A ARTES EM AROMA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-5">
              <img
                src={
                  aboutContent?.imageUrl || "/images/atelier-artisan-shelf.svg"
                }
                alt={
                  aboutContent?.imageAlt ||
                  "Prateleira artesanal da Loja Artes em Aroma em Suzano"
                }
                className="w-full rounded-3xl border border-dourado/30 shadow-md"
              />
            </div>
            <div className="space-y-5 lg:col-span-7">
              <span className="font-script text-2xl text-oliva">
                Nossa essência em Suzano
              </span>
              <h2 className="font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                {aboutContent?.title ||
                  "Um espaço para transformar criatividade em produtos aromáticos"}
              </h2>
              <p className="text-base font-medium text-oliva">
                {aboutContent?.subtitle ||
                  "Variedade, inspiração e atendimento próximo em Suzano, São Paulo."}
              </p>
              <p className="text-sm leading-relaxed text-marrom/80 sm:text-base">
                {aboutContent?.body}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/sobre"
                  className="rounded-xl bg-oliva px-6 py-3 text-sm font-semibold text-brancoQuente hover:bg-marrom"
                >
                  Conhecer nossa história
                </Link>
                <Link
                  href="/contato"
                  className="rounded-xl border border-dourado/50 px-6 py-3 text-sm font-semibold text-marrom hover:bg-creme"
                >
                  Ver endereço e horários
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. DÚVIDAS FREQUENTES (AEO) */}
        <section className="border-t border-dourado/25 bg-creme/50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="font-script text-2xl text-oliva">
                Respostas diretas
              </span>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                Dúvidas Frequentes
              </h2>
              <p className="mt-2 text-sm text-marrom/75">
                Informações claras sobre nossos produtos em Suzano, retirada na loja e solicitação pelo WhatsApp.
              </p>
            </div>

            <div className="mt-10 space-y-3.5">
              {activeFaqs.slice(0, 6).map((faq) => (
                <details
                  key={faq.id}
                  className="group rounded-2xl border border-dourado/30 bg-brancoQuente p-5 transition"
                >
                  <summary className="cursor-pointer list-none font-serif text-lg font-semibold text-marrom">
                    <div className="flex items-center justify-between gap-4">
                      <span>{faq.question}</span>
                      <span className="text-sm font-normal text-oliva group-open:rotate-45">
                        +
                      </span>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-marrom/80">
                    {faq.answer}
                  </p>
                  {faq.relatedProductSlug && (
                    <Link
                      href={`/produtos/${faq.relatedProductSlug}`}
                      className="mt-2 inline-block text-xs font-semibold text-oliva underline"
                    >
                      Ver produto relacionado no catálogo →
                    </Link>
                  )}
                </details>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/duvidas"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-oliva hover:text-marrom"
              >
                Ver todas as perguntas e respostas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="encomendas-titulo" className="bg-creme py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 id="encomendas-titulo" className="font-serif text-3xl font-semibold text-marrom">Encomendas de produtos artesanais</h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-marrom/85">A Loja Artes em Aroma recebe consultas para encomendas de sabonetes, lembrancinhas, aromatizadores, velas e perfumes artesanais. Modelos, valores, prazos e disponibilidade são confirmados diretamente com a loja. Consulte também as opções disponíveis para pronta entrega.</p>
            <a href="https://wa.me/5511910771820?text=Ol%C3%A1%21%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20encomendas%20de%20produtos%20artesanais." target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl bg-oliva px-6 py-3 font-semibold text-brancoQuente hover:bg-marrom">Consultar encomenda pelo WhatsApp</a>
          </div>
        </section>

        {/* 8. LOCALIZAÇÃO E CONTATO */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-dourado/35 bg-creme p-8 sm:p-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="space-y-4 lg:col-span-7">
                  <span className="text-xs font-semibold tracking-wider text-oliva uppercase">
                    Atendimento Presencial e Online em Suzano/SP
                  </span>
                  <h2 className="font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                    Visite a Loja Artes em Aroma ou Solicite pelo Site
                  </h2>
                  <p className="text-sm leading-relaxed text-marrom/80">
                    Estamos localizados na Vila Costa, em Suzano/SP. Monte sua sacola online para agilizar a separação dos seus produtos ou venha conhecer nossas fragrâncias pessoalmente.
                  </p>

                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-brancoQuente p-4">
                      <div className="flex items-center gap-2 font-serif text-base font-semibold text-marrom">
                        <MapPin className="h-4 w-4 text-oliva" />
                        Endereço de Referência
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-marrom/80">
                        {settings?.addressStreet || "Rua Rui Barbosa, 310"},{" "}
                        {settings?.addressNeighborhood || "Vila Costa"} —{" "}
                        {settings?.addressCity || "Suzano"}/
                        {settings?.addressState || "SP"} • CEP{" "}
                        {settings?.addressZip || "08675-060"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-brancoQuente p-4">
                      <div className="flex items-center gap-2 font-serif text-base font-semibold text-marrom">
                        <Clock className="h-4 w-4 text-oliva" />
                        Horário de Atendimento
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-marrom/80">
                        {"Segunda a sexta: 9h às 18h30 | Sábado: consulte o horário de funcionamento | Domingo: fechado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3.5 rounded-2xl bg-brancoQuente p-6 lg:col-span-5">
                  <h3 className="font-serif text-xl font-semibold text-marrom">
                    Canais Oficiais
                  </h3>
                  <p className="flex items-center gap-2 text-sm text-marrom/85">
                    <Phone className="h-4 w-4 text-oliva" />
                    Telefone de referência:{" "}
                    <strong>{settings?.publicPhone || "(11) 91077-1820"}</strong>
                  </p>
                  <a
                    href={
                      settings?.googleMapsUrl ||
                      "https://www.google.com/maps/search/?api=1&query=Rua+Rui+Barbosa+310+Vila+Costa+Suzano+SP+08675-060"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-oliva px-5 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
                  >
                    <MapPin className="h-4 w-4" />
                    Abrir localização no Google Maps
                  </a>
                  <a
                    href={
                      settings?.instagramUrl ||
                      "https://www.instagram.com/lojaartesemaroma/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-dourado/40 px-5 py-3 text-xs font-semibold text-marrom hover:bg-creme"
                  >
                    <Instagram className="h-4 w-4 text-oliva" />
                    Seguir @lojaartesemaroma no Instagram
                  </a>
                  <Link
                    href="/produtos"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-oliva/30 bg-creme/60 px-5 py-3 text-xs font-semibold text-oliva hover:bg-creme"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Montar sacola e enviar pedido via WhatsApp
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
