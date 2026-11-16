import type { MetadataRoute } from "next";
import { getAllCatalogProducts } from "@/domain/products";
import { EDITORIAL_GUIDES } from "@/domain/guides";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://artesemaroma.com.br";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items: activeProducts } = await getAllCatalogProducts({
    includeInactive: false,
    pageSize: 1000,
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/produtos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/guias`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/duvidas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Somente produtos ativos e não deletados entram no sitemap
  const productRoutes: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: `${SITE_URL}/produtos/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const guideRoutes: MetadataRoute.Sitemap = EDITORIAL_GUIDES.map((g) => ({
    url: `${SITE_URL}/guias/${g.slug}`,
    lastModified: new Date(g.updatedAt),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticRoutes, ...productRoutes, ...guideRoutes];
}
