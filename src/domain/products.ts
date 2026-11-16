import { z } from "zod";
import { db, ensureDatabaseInitialized } from "@/db";
import {
  products,
  productVariants,
  productImages,
  productAttributes,
  categories,
  auditLogs,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { slugify } from "@/lib/utils";
import { generateProgrammaticSeoSuggestions, validateProductSeoAndIntegrity } from "./seo";

export interface ProductWithRelations {
  id: number;
  name: string;
  slug: string;
  previousSlugs: string[];
  sku: string;
  brand: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  volumeOrWeight: string;
  usageTypes: string[];
  olfactoryFamily: string | null;
  recommendedApplications: string | null;
  careInstructions: string | null;
  specificFaqs: Array<{ question: string; answer: string }>;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  isDeleted: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  seoReviewedByHuman: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{
    id: number;
    url: string;
    alt: string;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  variants: Array<{
    id: number;
    name: string;
    sku: string;
    priceCents: number;
    volumeOrWeight: string;
    isAvailable: boolean;
    stockQuantity: number;
    displayOrder: number;
  }>;
  attributes: Array<{
    id: number;
    attributeKey: string;
    attributeValue: string;
  }>;
}

export async function getAllCatalogProducts(options?: {
  includeInactive?: boolean;
  search?: string;
  categorySlug?: string;
  usageType?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  onlyAvailable?: boolean;
  onlyFeatured?: boolean;
  onlyNew?: boolean;
  sortBy?: "featured" | "price_asc" | "price_desc" | "newest" | "name_asc";
  page?: number;
  pageSize?: number;
}): Promise<{
  items: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  await ensureDatabaseInitialized();

  const allProds = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false))
    .orderBy(desc(products.createdAt));

  const allCats = await db.select().from(categories);
  const allImgs = await db.select().from(productImages);
  const allVars = await db.select().from(productVariants);
  const allAttrs = await db.select().from(productAttributes);

  const catMap = new Map(allCats.map((c) => [c.id, c]));

  let enriched: ProductWithRelations[] = allProds.map((p) => {
    const cat = catMap.get(p.categoryId);
    const imgs = allImgs
      .filter((i) => i.productId === p.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const vars = allVars
      .filter((v) => v.productId === p.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const attrs = allAttrs.filter((a) => a.productId === p.id);

    return {
      ...p,
      categoryName: cat?.name || "Sem categoria",
      categorySlug: cat?.slug || "geral",
      images: imgs,
      variants: vars,
      attributes: attrs,
    };
  });

  if (!options?.includeInactive) {
    enriched = enriched.filter((p) => p.isActive);
  }

  if (options?.categorySlug && options.categorySlug !== "todas") {
    enriched = enriched.filter((p) => p.categorySlug === options.categorySlug);
  }

  if (options?.usageType && options.usageType !== "todos") {
    enriched = enriched.filter((p) =>
      p.usageTypes.some((u) => u.toLowerCase() === options.usageType?.toLowerCase())
    );
  }

  if (options?.minPriceCents !== undefined && !Number.isNaN(options.minPriceCents)) {
    enriched = enriched.filter((p) => p.priceCents >= (options.minPriceCents ?? 0));
  }

  if (options?.maxPriceCents !== undefined && !Number.isNaN(options.maxPriceCents)) {
    enriched = enriched.filter((p) => p.priceCents <= (options.maxPriceCents ?? Infinity));
  }

  if (options?.onlyAvailable) {
    enriched = enriched.filter((p) => p.isAvailable);
  }

  if (options?.onlyFeatured) {
    enriched = enriched.filter((p) => p.isFeatured);
  }

  if (options?.onlyNew) {
    enriched = enriched.filter((p) => p.isNew);
  }

  if (options?.search && options.search.trim() !== "") {
    const q = options.search.trim().toLowerCase();
    enriched = enriched.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchDesc = p.shortDescription.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchFamily = (p.olfactoryFamily || "").toLowerCase().includes(q);
      const matchUsage = p.usageTypes.some((u) => u.toLowerCase().includes(q));
      const matchAttrs = p.attributes.some(
        (a) =>
          a.attributeKey.toLowerCase().includes(q) ||
          a.attributeValue.toLowerCase().includes(q)
      );
      return matchName || matchBrand || matchDesc || matchFamily || matchUsage || matchAttrs;
    });
  }

  const sortBy = options?.sortBy || "featured";
  enriched.sort((a, b) => {
    // Produtos disponíveis aparecem primeiro quando na ordenação padrão
    if (sortBy === "featured") {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "price_asc") return a.priceCents - b.priceCents;
    if (sortBy === "price_desc") return b.priceCents - a.priceCents;
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    return 0;
  });

  const total = enriched.length;
  const page = Math.max(1, options?.page || 1);
  const pageSize = Math.max(1, options?.pageSize || 12);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = enriched.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Busca produto por slug atual ou verifica se pertence a um slug anterior (para redirecionamento 308 permanente).
 */
export async function getProductBySlugOrRedirect(slug: string): Promise<{
  product: ProductWithRelations | null;
  redirectToSlug: string | null;
}> {
  await ensureDatabaseInitialized();
  const { items } = await getAllCatalogProducts({
    includeInactive: false,
    pageSize: 1000,
  });

  const exact = items.find((p) => p.slug === slug);
  if (exact) {
    return { product: exact, redirectToSlug: null };
  }

  const redirected = items.find(
    (p) => Array.isArray(p.previousSlugs) && p.previousSlugs.includes(slug)
  );
  if (redirected) {
    return { product: null, redirectToSlug: redirected.slug };
  }

  return { product: null, redirectToSlug: null };
}

export const ProductUpsertSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(3, "Nome comercial deve ter ao menos 3 caracteres"),
  slug: z.string().optional(),
  sku: z.string().min(2, "Informe o SKU do produto"),
  brand: z.string().default("Artes em Aroma"),
  categoryId: z.number().int().positive("Selecione uma categoria válida"),
  shortDescription: z.string().min(10, "Informe uma descrição resumida"),
  description: z.string().min(20, "A descrição completa deve ter ao menos 20 caracteres"),
  priceCents: z.number().int().min(1, "O preço deve ser maior que zero"),
  volumeOrWeight: z.string().min(1, "Informe o volume ou peso (ex: 100 ml, 1 kg)"),
  usageTypes: z.array(z.string()).default([]),
  olfactoryFamily: z.string().optional().nullable(),
  recommendedApplications: z.string().optional().nullable(),
  careInstructions: z.string().optional().nullable(),
  specificFaqs: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isActive: z.boolean().default(true),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  seoReviewedByHuman: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().min(1),
        isPrimary: z.boolean().default(false),
      })
    )
    .default([]),
  variants: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        sku: z.string().min(1),
        priceCents: z.number().int().min(1),
        volumeOrWeight: z.string().min(1),
        isAvailable: z.boolean().default(true),
        stockQuantity: z.number().int().default(100),
      })
    )
    .default([]),
  attributes: z
    .array(
      z.object({
        attributeKey: z.string().min(1),
        attributeValue: z.string().min(1),
      })
    )
    .default([]),
});

export type ProductUpsertInput = z.infer<typeof ProductUpsertSchema>;

export async function upsertProductAdmin(
  rawInput: unknown,
  adminEmail: string
) {
  await ensureDatabaseInitialized();
  const input = ProductUpsertSchema.parse(rawInput);

  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, input.categoryId))
    .limit(1);

  const suggestions = generateProgrammaticSeoSuggestions({
    name: input.name,
    volumeOrWeight: input.volumeOrWeight,
    categoryName: cat?.name,
    shortDescription: input.shortDescription,
  });

  const finalSlug = input.slug?.trim() ? slugify(input.slug) : suggestions.slug;
  const finalSeoTitle = input.seoTitle?.trim() || suggestions.seoTitle;
  const finalSeoDescription = input.seoDescription?.trim() || suggestions.seoDescription;

  const validation = await validateProductSeoAndIntegrity({
    id: input.id,
    name: input.name,
    slug: finalSlug,
    seoTitle: finalSeoTitle,
    seoDescription: finalSeoDescription,
    description: input.description,
    categoryId: input.categoryId,
    canonicalUrl: input.canonicalUrl,
    images: input.images,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(" "));
  }

  let productId = input.id;

  if (productId) {
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      throw new Error("Produto não encontrado para edição.");
    }

    const updatedPrevSlugs = Array.isArray(existing.previousSlugs)
      ? [...existing.previousSlugs]
      : [];
    if (existing.slug !== finalSlug && !updatedPrevSlugs.includes(existing.slug)) {
      updatedPrevSlugs.push(existing.slug);
    }

    await db
      .update(products)
      .set({
        name: input.name.trim(),
        slug: finalSlug,
        previousSlugs: updatedPrevSlugs,
        sku: input.sku.trim(),
        brand: input.brand.trim(),
        categoryId: input.categoryId,
        shortDescription: input.shortDescription.trim(),
        description: input.description.trim(),
        priceCents: input.priceCents,
        volumeOrWeight: input.volumeOrWeight.trim(),
        usageTypes: input.usageTypes,
        olfactoryFamily: input.olfactoryFamily || null,
        recommendedApplications: input.recommendedApplications || null,
        careInstructions: input.careInstructions || null,
        specificFaqs: input.specificFaqs,
        isAvailable: input.isAvailable,
        isFeatured: input.isFeatured,
        isNew: input.isNew,
        isActive: input.isActive,
        seoTitle: finalSeoTitle,
        seoDescription: finalSeoDescription,
        canonicalUrl: input.canonicalUrl || null,
        seoReviewedByHuman: input.seoReviewedByHuman,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));

    await db.insert(auditLogs).values({
      actor: adminEmail,
      action: "product.update",
      entityType: "product",
      entityId: String(productId),
      details: { name: input.name, slug: finalSlug, priceCents: input.priceCents },
    });
  } else {
    const [created] = await db
      .insert(products)
      .values({
        name: input.name.trim(),
        slug: finalSlug,
        previousSlugs: [],
        sku: input.sku.trim(),
        brand: input.brand.trim(),
        categoryId: input.categoryId,
        shortDescription: input.shortDescription.trim(),
        description: input.description.trim(),
        priceCents: input.priceCents,
        volumeOrWeight: input.volumeOrWeight.trim(),
        usageTypes: input.usageTypes,
        olfactoryFamily: input.olfactoryFamily || null,
        recommendedApplications: input.recommendedApplications || null,
        careInstructions: input.careInstructions || null,
        specificFaqs: input.specificFaqs,
        isAvailable: input.isAvailable,
        isFeatured: input.isFeatured,
        isNew: input.isNew,
        isActive: input.isActive,
        isDeleted: false,
        seoTitle: finalSeoTitle,
        seoDescription: finalSeoDescription,
        canonicalUrl: input.canonicalUrl || null,
        seoReviewedByHuman: input.seoReviewedByHuman,
      })
      .returning();

    productId = created.id;

    await db.insert(auditLogs).values({
      actor: adminEmail,
      action: "product.create",
      entityType: "product",
      entityId: String(productId),
      details: { name: input.name, slug: finalSlug, priceCents: input.priceCents },
    });
  }

  // Atualiza imagens se fornecidas
  if (input.images.length > 0) {
    await db.delete(productImages).where(eq(productImages.productId, productId));
    for (let i = 0; i < input.images.length; i++) {
      const img = input.images[i];
      await db.insert(productImages).values({
        productId,
        url: img.url.trim(),
        alt: img.alt.trim() || suggestions.imageAltSuggestion,
        isPrimary: i === 0 ? true : img.isPrimary,
        displayOrder: i + 1,
      });
    }
  }

  // Atualiza variantes se fornecidas
  if (input.variants.length > 0) {
    await db.delete(productVariants).where(eq(productVariants.productId, productId));
    for (let i = 0; i < input.variants.length; i++) {
      const v = input.variants[i];
      await db.insert(productVariants).values({
        productId,
        name: v.name.trim(),
        sku: v.sku.trim(),
        priceCents: v.priceCents,
        volumeOrWeight: v.volumeOrWeight.trim(),
        isAvailable: v.isAvailable,
        stockQuantity: v.stockQuantity,
        displayOrder: i + 1,
      });
    }
  } else {
    // Cria variante padrão equivalente ao produto
    const existingVars = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
    if (existingVars.length === 0) {
      await db.insert(productVariants).values({
        productId,
        name: input.volumeOrWeight.trim(),
        sku: input.sku.trim(),
        priceCents: input.priceCents,
        volumeOrWeight: input.volumeOrWeight.trim(),
        isAvailable: input.isAvailable,
        displayOrder: 1,
      });
    }
  }

  // Atualiza atributos se fornecidos
  if (input.attributes.length > 0) {
    await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
    for (const attr of input.attributes) {
      await db.insert(productAttributes).values({
        productId,
        attributeKey: attr.attributeKey.trim(),
        attributeValue: attr.attributeValue.trim(),
      });
    }
  }

  return { productId, slug: finalSlug, warnings: validation.warnings };
}

export async function duplicateProductAdmin(productId: number, adminEmail: string) {
  await ensureDatabaseInitialized();
  const { items } = await getAllCatalogProducts({
    includeInactive: true,
    pageSize: 1000,
  });
  const source = items.find((p) => p.id === productId);
  if (!source) throw new Error("Produto de origem não encontrado.");

  const suffix = Math.floor(100 + Math.random() * 900);
  const newName = `${source.name} (Cópia)`;
  const newSlug = `${source.slug}-copia-${suffix}`;
  const newSku = `${source.sku}-CP${suffix}`;

  return upsertProductAdmin(
    {
      name: newName,
      slug: newSlug,
      sku: newSku,
      brand: source.brand,
      categoryId: source.categoryId,
      shortDescription: source.shortDescription,
      description: source.description,
      priceCents: source.priceCents,
      volumeOrWeight: source.volumeOrWeight,
      usageTypes: source.usageTypes,
      olfactoryFamily: source.olfactoryFamily,
      recommendedApplications: source.recommendedApplications,
      careInstructions: source.careInstructions,
      specificFaqs: source.specificFaqs,
      isAvailable: source.isAvailable,
      isFeatured: false,
      isNew: false,
      isActive: false, // Duplicado nasce desativado para revisão antes de publicar
      seoTitle: `${newName} | Artes em Aroma`,
      seoDescription: source.seoDescription,
      seoReviewedByHuman: false,
      images: source.images.map((i) => ({ url: i.url, alt: i.alt, isPrimary: i.isPrimary })),
      variants: source.variants.map((v, idx) => ({
        name: v.name,
        sku: `${v.sku}-CP${suffix}-${idx + 1}`,
        priceCents: v.priceCents,
        volumeOrWeight: v.volumeOrWeight,
        isAvailable: v.isAvailable,
        stockQuantity: v.stockQuantity,
      })),
      attributes: source.attributes.map((a) => ({
        attributeKey: a.attributeKey,
        attributeValue: a.attributeValue,
      })),
    },
    adminEmail
  );
}

export async function softDeleteProductAdmin(productId: number, adminEmail: string) {
  await ensureDatabaseInitialized();
  await db
    .update(products)
    .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
    .where(eq(products.id, productId));

  await db.insert(auditLogs).values({
    actor: adminEmail,
    action: "product.soft_delete",
    entityType: "product",
    entityId: String(productId),
    details: {},
  });
}

export async function toggleProductStateAdmin(
  productId: number,
  patch: { isAvailable?: boolean; isActive?: boolean; isFeatured?: boolean },
  adminEmail: string
) {
  await ensureDatabaseInitialized();
  const [updated] = await db
    .update(products)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.isDeleted, false)))
    .returning();

  await db.insert(auditLogs).values({
    actor: adminEmail,
    action: "product.toggle_state",
    entityType: "product",
    entityId: String(productId),
    details: patch,
  });

  return updated;
}
