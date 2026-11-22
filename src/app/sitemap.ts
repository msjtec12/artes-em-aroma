import type { MetadataRoute } from "next";
import { getAllCatalogProducts } from "@/domain/products";
import { EDITORIAL_GUIDES } from "@/domain/guides";
import { db, ensureDatabaseInitialized } from "@/db";
import { storeSettings } from "@/db/schema";

const SITE_URL = "https://artesemaroma.konnexy.com.br";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureDatabaseInitialized();
  const [settings] = await db.select().from(storeSettings).limit(1);
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
  const productRoutes: MetadataRoute.Sitemap = (settings?.isDataConfirmedForPublication ? activeProducts : []).map((p) => ({
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
