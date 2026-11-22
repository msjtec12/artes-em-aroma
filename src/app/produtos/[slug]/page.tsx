import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductDetailPurchase } from "@/components/catalog/ProductDetailPurchase";
import {
  getProductBySlugOrRedirect,
  getAllCatalogProducts,
} from "@/domain/products";
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
} from "@/domain/jsonld";
import { ShieldAlert, Sparkles, CheckCircle, Layers } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.konnexy.com.br";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product, redirectToSlug } = await getProductBySlugOrRedirect(slug);

  if (redirectToSlug) {
    return {
      title: "Redirecionando...",
    };
  }

  if (!product) {
    return {
      title: "Produto não encontrado | Artes em Aroma",
      robots: { index: false, follow: false },
    };
  }

  const canonical =
    product.canonicalUrl || `${SITE_URL}/produtos/${product.slug}`;
  const title =
    product.seoTitle || `${product.name} (${product.volumeOrWeight}) em Suzano`;
  const description =
    product.seoDescription || product.shortDescription || product.description;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: [
        {
          url: product.images[0]?.url || "/images/prod-essencia-lavanda.svg",
          alt: product.images[0]?.alt || product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, redirectToSlug } = await getProductBySlugOrRedirect(slug);

  // Redirecionamento permanente (308) caso o slug tenha sido alterado no painel administrativo
  if (redirectToSlug) {
    permanentRedirect(`/produtos/${redirectToSlug}`);
  }

  if (!product) {
    notFound();
  }

  const { items: allProducts } = await getAllCatalogProducts({
    includeInactive: false,
    pageSize: 50,
  });

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.categoryId === product.categoryId ||
          p.usageTypes.some((u) => product.usageTypes.includes(u)))
    )
    .slice(0, 4);

  const productJsonLd = buildProductJsonLd(product);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Produtos", path: "/produtos" },
    {
      name: product.categoryName,
      path: `/produtos?categoria=${product.categorySlug}`,
    },
    { name: product.name, path: `/produtos/${product.slug}` },
  ]);
  const faqJsonLd =
    product.specificFaqs && product.specificFaqs.length > 0
      ? buildFaqPageJsonLd(product.specificFaqs)
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-marrom/70">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/produtos" className="hover:text-oliva">
                  Produtos
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href={`/produtos?categoria=${product.categorySlug}`}
                  className="hover:text-oliva"
                >
                  {product.categoryName}
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">{product.name}</li>
            </ol>
          </nav>

          {/* Grid Principal do Produto */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            {/* Galeria Fotográfica */}
            <div className="space-y-4 lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-dourado/30 bg-creme p-4">
                <img
                  src={
                    product.images[0]?.url || "/images/prod-essencia-lavanda.svg"
                  }
                  alt={product.images[0]?.alt || product.name}
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((img) => (
                    <div
                      key={img.id}
                      className="overflow-hidden rounded-xl border border-dourado/30 bg-creme p-1"
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informações Comerciais e Seleção */}
            <div className="space-y-6 lg:col-span-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/produtos?categoria=${product.categorySlug}`}
                    className="rounded-full bg-creme px-3 py-1 text-xs font-semibold text-oliva hover:bg-dourado/20"
                  >
                    {product.categoryName}
                  </Link>
                  {product.olfactoryFamily && (
                    <span className="rounded-full border border-dourado/35 px-3 py-1 text-xs text-marrom/80">
                      Família: {product.olfactoryFamily}
                    </span>
                  )}
                </div>

                {/* H1 Único */}
                <h1 className="mt-3 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
                  {product.name}
                </h1>

                <p className="mt-3 text-sm leading-relaxed text-marrom/85 sm:text-base">
                  {product.shortDescription}
                </p>
              </div>

              {/* Componente interativo de Variações, Quantidade e Sacola */}
              <ProductDetailPurchase product={product} />

              {/* Aplicações e Atributos */}
              <div className="space-y-4 rounded-2xl border border-dourado/25 bg-brancoQuente p-5">
                {product.usageTypes.length > 0 && (
                  <div>
                    <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                      <Sparkles className="h-4 w-4" />
                      Projetos Indicados
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.usageTypes.map((u) => (
                        <Link
                          key={u}
                          href={`/produtos?uso=${encodeURIComponent(u)}`}
                          className="rounded-lg border border-salvia/50 bg-creme/70 px-3 py-1 text-xs font-medium text-marrom hover:border-oliva"
                        >
                          {u}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {product.attributes.length > 0 && (
                  <div className="border-t border-dourado/20 pt-4">
                    <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-oliva uppercase">
                      <Layers className="h-4 w-4" />
                      Especificações do Item
                    </h2>
                    <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      {product.attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="rounded-lg bg-creme/50 px-3 py-2"
                        >
                          <dt className="text-marrom/65">{attr.attributeKey}</dt>
                          <dd className="font-semibold text-marrom">
                            {attr.attributeValue}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição Completa, Aplicações Recomendadas e Cuidados */}
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-6 rounded-3xl border border-dourado/30 bg-creme/45 p-6 sm:p-8 lg:col-span-7">
              <h2 className="font-serif text-2xl font-semibold text-marrom">
                Sobre o Produto
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-marrom/85 sm:text-base">
                {product.description}
              </p>

              {product.recommendedApplications && (
                <div className="rounded-2xl border border-salvia/40 bg-brancoQuente p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-marrom">
                    <CheckCircle className="h-5 w-5 text-oliva" />
                    Aplicações Recomendadas pela Loja
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-marrom/80">
                    {product.recommendedApplications}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6 lg:col-span-5">
              {product.careInstructions && (
                <div className="rounded-3xl border border-dourado/35 bg-brancoQuente p-6">
                  <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-marrom">
                    <ShieldAlert className="h-5 w-5 text-dourado" />
                    Cuidados e Boas Práticas Artesanais
                  </h2>
                  <p className="mt-3 text-xs leading-relaxed text-marrom/80 sm:text-sm">
                    {product.careInstructions}
                  </p>
                  <p className="mt-3 border-t border-dourado/20 pt-3 text-[11px] text-marrom/65">
                    Nota de transparência: a Artes em Aroma fornece matérias-primas para criação artesanal. Realize sempre testes de bancada na sua formulação específica.
                  </p>
                </div>
              )}

              {product.specificFaqs && product.specificFaqs.length > 0 && (
                <div className="rounded-3xl border border-dourado/30 bg-creme/60 p-6">
                  <h2 className="font-serif text-xl font-semibold text-marrom">
                    Perguntas sobre este Produto
                  </h2>
                  <div className="mt-4 space-y-3">
                    {product.specificFaqs.map((faq, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-brancoQuente p-4 text-xs"
                      >
                        <h3 className="font-semibold text-marrom">
                          {faq.question}
                        </h3>
                        <p className="mt-1.5 leading-relaxed text-marrom/80">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Produtos Relacionados */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-dourado/25 pt-12">
              <h2 className="font-serif text-3xl font-semibold text-marrom">
                Combine na sua Criação (Produtos Relacionados)
              </h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((rel) => (
                  <ProductCard key={rel.id} product={rel} />
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
