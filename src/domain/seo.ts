import { slugify } from "@/lib/utils";
import { db, ensureDatabaseInitialized } from "@/db";
import { products, productImages, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface SeoSuggestions {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  imageAltSuggestion: string;
  shortDescriptionSuggestion: string;
}

/**
 * Gera sugestões de metadados SEO programáticos sem publicar alegações médicas/químicas artificiais.
 */
export function generateProgrammaticSeoSuggestions(input: {
  name: string;
  volumeOrWeight: string;
  categoryName?: string;
  shortDescription?: string;
}): SeoSuggestions {
  const baseSlug = slugify(`${input.name} ${input.volumeOrWeight}`);
  const cleanName = input.name.trim();
  const vol = input.volumeOrWeight.trim();
  const cat = input.categoryName?.trim() || "Insumos Artesanais";

  const seoTitle = `${cleanName} (${vol}) em Suzano | Artes em Aroma`;
  const seoDescription = input.shortDescription?.trim()
    ? `${input.shortDescription.trim().slice(0, 115)} Confira disponibilidade em Suzano na Artes em Aroma.`
    : `${cleanName} (${vol}) na categoria ${cat}. Matérias-primas para produção artesanal em Suzano/SP na Loja Artes em Aroma.`;

  const imageAltSuggestion = `${cleanName} - ${vol} (${cat}) | Loja Artes em Aroma Suzano`;
  const shortDescriptionSuggestion =
    input.shortDescription?.trim() ||
    `${cleanName} (${vol}) selecionado para formulações e criações artesanais na Artes em Aroma.`;

  return {
    slug: baseSlug,
    seoTitle: seoTitle.slice(0, 70),
    seoDescription: seoDescription.slice(0, 160),
    imageAltSuggestion,
    shortDescriptionSuggestion,
  };
}

export interface SeoValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export async function validateProductSeoAndIntegrity(input: {
  id?: number;
  name: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  description?: string | null;
  categoryId?: number | null;
  canonicalUrl?: string | null;
  images?: Array<{ url: string; alt: string }>;
}): Promise<SeoValidationResult> {
  await ensureDatabaseInitialized();
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!input.slug || input.slug.trim().length < 3) {
    errors.push("Slug inválido ou muito curto.");
  }

  if (!input.description || input.description.trim().length < 20) {
    errors.push("Descrição vazia ou insuficiente.");
  }

  if (!input.categoryId) {
    errors.push("Produto sem categoria associada.");
  }

  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));

  const duplicateSlug = allProducts.find(
    (p) => p.slug === input.slug.trim() && p.id !== input.id
  );
  if (duplicateSlug) {
    errors.push(`Slug repetido: já utilizado pelo produto "${duplicateSlug.name}".`);
  }

  if (input.seoTitle) {
    const duplicateTitle = allProducts.find(
      (p) =>
        p.seoTitle?.toLowerCase() === input.seoTitle?.trim().toLowerCase() &&
        p.id !== input.id
    );
    if (duplicateTitle) {
      warnings.push(`Título SEO duplicado com o produto "${duplicateTitle.name}".`);
    }
  } else {
    warnings.push("Título SEO não preenchido.");
  }

  if (!input.seoDescription || input.seoDescription.trim().length < 40) {
    warnings.push("Meta description ausente ou muito curta (recomendado entre 70 e 160 caracteres).");
  }

  if (!input.images || input.images.length === 0) {
    warnings.push("Produto sem fotografia cadastrada.");
  } else {
    const missingAlt = input.images.some((img) => !img.alt || img.alt.trim().length < 3);
    if (missingAlt) {
      warnings.push("Há imagem(ns) sem texto alternativo (alt).");
    }
  }

  if (input.canonicalUrl && input.canonicalUrl.trim() !== "") {
    try {
      const parsed = new URL(input.canonicalUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push("URL canônica com protocolo inválido.");
      }
    } catch {
      errors.push("URL canônica malformada.");
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

export async function getDigitalVisibilityChecklist() {
  await ensureDatabaseInitialized();
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false));
  const allImages = await db.select().from(productImages);
  const allCategories = await db.select().from(categories);

  const imagesByProduct = new Map<number, typeof allImages>();
  for (const img of allImages) {
    const list = imagesByProduct.get(img.productId) || [];
    list.push(img);
    imagesByProduct.set(img.productId, list);
  }

  const validCategoryIds = new Set(allCategories.map((c) => c.id));

  const productsWithCompleteSeo: typeof allProducts = [];
  const productsWithoutDescription: typeof allProducts = [];
  const productsWithoutImage: typeof allProducts = [];
  const productsWithoutAlt: typeof allProducts = [];
  const productsWithInvalidCanonical: typeof allProducts = [];
  const unpublishedProducts: typeof allProducts = [];
  const deactivatedProducts: typeof allProducts = [];

  for (const p of allProducts) {
    const imgs = imagesByProduct.get(p.id) || [];
    const hasDesc = Boolean(p.description && p.description.trim().length >= 20);
    const hasImg = imgs.length > 0 && imgs.every((i) => i.url && i.url.trim().length > 0);
    const hasAlt = imgs.length > 0 && imgs.every((i) => i.alt && i.alt.trim().length >= 3);
    const hasValidCategory = validCategoryIds.has(p.categoryId);

    let canonicalInvalid = false;
    if (p.canonicalUrl && p.canonicalUrl.trim() !== "") {
      try {
        new URL(p.canonicalUrl);
      } catch {
        canonicalInvalid = true;
      }
    }

    if (!hasDesc) productsWithoutDescription.push(p);
    if (!hasImg) productsWithoutImage.push(p);
    if (hasImg && !hasAlt) productsWithoutAlt.push(p);
    if (canonicalInvalid) productsWithInvalidCanonical.push(p);
    if (!p.isActive) {
      deactivatedProducts.push(p);
      unpublishedProducts.push(p);
    }

    const hasSeoMeta = Boolean(
      p.seoTitle &&
        p.seoTitle.trim().length > 10 &&
        p.seoDescription &&
        p.seoDescription.trim().length > 30
    );

    if (
      hasDesc &&
      hasImg &&
      hasAlt &&
      hasValidCategory &&
      !canonicalInvalid &&
      hasSeoMeta &&
      p.isActive
    ) {
      productsWithCompleteSeo.push(p);
    }
  }

  return {
    totalProducts: allProducts.length,
    completeSeoCount: productsWithCompleteSeo.length,
    withoutDescriptionCount: productsWithoutDescription.length,
    withoutImageCount: productsWithoutImage.length,
    withoutAltCount: productsWithoutAlt.length,
    invalidCanonicalCount: productsWithInvalidCanonical.length,
    unpublishedCount: unpublishedProducts.length,
    deactivatedCount: deactivatedProducts.length,
    details: {
      productsWithCompleteSeo,
      productsWithoutDescription,
      productsWithoutImage,
      productsWithoutAlt,
      productsWithInvalidCanonical,
      unpublishedProducts,
      deactivatedProducts,
    },
  };
}
