import { ProductWithRelations } from "./products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.com.br";

export function buildOrganizationAndLocalBusinessJsonLd(settings: {
  storeName: string;
  tagline: string;
  publicPhone: string;
  addressStreet: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  instagramUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: settings.storeName,
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo-artes-em-aroma.jpg`,
        description: settings.tagline,
        sameAs: [settings.instagramUrl],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: settings.publicPhone,
          contactType: "customer service",
          areaServed: "BR",
          availableLanguage: "Portuguese",
        },
      },
      {
        "@type": "Store",
        "@id": `${SITE_URL}/#localbusiness`,
        name: settings.storeName,
        description:
          "Matérias-primas, essências, bases glicerinadas, ceras vegetais e acessórios para fabricação artesanal de perfumes, sabonetes e velas aromáticas em Suzano/SP.",
        url: SITE_URL,
        telephone: settings.publicPhone,
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.addressStreet,
          addressLocality: settings.addressCity,
          addressRegion: settings.addressState,
          postalCode: settings.addressZip,
          addressCountry: "BR",
        },
        areaServed: {
          "@type": "City",
          name: "Suzano",
        },
        sameAs: [settings.instagramUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: settings.storeName,
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/produtos?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Gera JSON-LD de Product e Offer correspondendo estritamente às informações reais visíveis.
 * Não insere reviews, classificações ou estoques fictícios.
 */
export function buildProductJsonLd(product: ProductWithRelations) {
  const primaryImage = product.images[0]?.url
    ? product.images[0].url.startsWith("http")
      ? product.images[0].url
      : `${SITE_URL}${product.images[0].url}`
    : `${SITE_URL}/images/hero-botanical-composition.svg`;

  const productUrl = `${SITE_URL}/produtos/${product.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription || product.description,
    image: [primaryImage],
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Loja Artes em Aroma",
      },
    },
  };
}

export function buildFaqPageJsonLd(
  faqItems: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}
