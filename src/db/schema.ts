import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 1. Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'admin', 'editor', 'viewer'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Users
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    roleId: integer("role_id").references(() => roles.id),
    roleName: text("role_name").default("admin").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

// 3. Categories
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)]
);

// 4. Products
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    previousSlugs: jsonb("previous_slugs").$type<string[]>().default([]).notNull(),
    sku: text("sku").notNull().unique(),
    brand: text("brand").default("Artes em Aroma").notNull(),
    categoryId: integer("category_id")
      .references(() => categories.id)
      .notNull(),
    shortDescription: text("short_description").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents").notNull(), // Preço base em centavos
    volumeOrWeight: text("volume_or_weight").notNull(), // ex: "100 ml", "1 kg"
    usageTypes: jsonb("usage_types").$type<string[]>().default([]).notNull(), // ex: ["Velas", "Sabonetes", "Aromatizadores"]
    olfactoryFamily: text("olfactory_family"), // ex: "Floral", "Amadeirado", "Cítrico", "Herbal"
    recommendedApplications: text("recommended_applications"), // Somente quando fornecido pela loja
    careInstructions: text("care_instructions"), // Cuidados pertinentes informados pela loja
    specificFaqs: jsonb("specific_faqs")
      .$type<Array<{ question: string; answer: string }>>()
      .default([])
      .notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isNew: boolean("is_new").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(), // Exclusão lógica
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    seoReviewedByHuman: boolean("seo_reviewed_by_human").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    index("products_category_idx").on(table.categoryId),
    index("products_active_idx").on(table.isActive, table.isDeleted),
  ]
);

// 5. Product Variants
export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(), // ex: "100 ml", "500 ml", "1 L"
    sku: text("sku").notNull(),
    priceCents: integer("price_cents").notNull(),
    volumeOrWeight: text("volume_or_weight").notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    stockQuantity: integer("stock_quantity").default(100).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("variants_product_idx").on(table.productId)]
);

// 6. Product Images
export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("images_product_idx").on(table.productId)]
);

// 7. Product Attributes
export const productAttributes = pgTable(
  "product_attributes",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    attributeKey: text("attribute_key").notNull(), // ex: "Família Olfativa", "Base", "Origem"
    attributeValue: text("attribute_value").notNull(),
  },
  (table) => [index("attributes_product_idx").on(table.productId)]
);

// 8. Inventory Movements
export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  variantId: integer("variant_id").references(() => productVariants.id),
  movementType: text("movement_type").notNull(), // 'in', 'out', 'adjustment'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Customers (Minimização de dados LGPD: apenas nome e telefone necessários ao atendimento)
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    privacyConsentAt: timestamp("privacy_consent_at").defaultNow().notNull(),
    retentionExpiresAt: timestamp("retention_expires_at"), // Política de retenção LGPD
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("customers_phone_idx").on(table.phone)]
);

// 10. Orders
// Status comerciais distintos:
// 'solicitacao_iniciada' | 'aguardando_contato' | 'em_atendimento' | 'pedido_confirmado' | 'em_preparacao' | 'pronto_retirada_envio' | 'finalizado' | 'cancelado'
// Status de comunicação distintos:
// 'link_gerado' | 'whatsapp_acionado' | 'contato_confirmado_manualmente' | 'sem_resposta'
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderCode: text("order_code").notNull().unique(), // ex: AA-2026-000123
    idempotencyKey: text("idempotency_key").unique(), // Evita duplicação por clique repetido
    customerId: integer("customer_id").references(() => customers.id),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    fulfillmentMode: text("fulfillment_mode").notNull().default("retirada"), // 'retirada' | 'entrega_consultar'
    customerNotes: text("customer_notes"),
    subtotalCents: integer("subtotal_cents").notNull(),
    totalItemsCount: integer("total_items_count").notNull(),
    commercialStatus: text("commercial_status")
      .notNull()
      .default("solicitacao_iniciada"),
    communicationStatus: text("communication_status")
      .notNull()
      .default("link_gerado"),
    cancelReason: text("cancel_reason"),
    whatsappLinkTriggeredAt: timestamp("whatsapp_link_triggered_at"),
    contactConfirmedAt: timestamp("contact_confirmed_at"),
    confirmedAt: timestamp("confirmed_at"),
    finalizedAt: timestamp("finalized_at"),
    cancelledAt: timestamp("cancelled_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_code_idx").on(table.orderCode),
    index("orders_status_idx").on(table.commercialStatus),
    index("orders_created_idx").on(table.createdAt),
  ]
);

// 11. Order Items (Snapshot imutável no momento do pedido)
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: integer("product_id").references(() => products.id),
    variantId: integer("variant_id").references(() => productVariants.id),
    productNameSnapshot: text("product_name_snapshot").notNull(),
    skuSnapshot: text("sku_snapshot").notNull(),
    variantNameSnapshot: text("variant_name_snapshot").notNull(),
    unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
    subtotalCentsSnapshot: integer("subtotal_cents_snapshot").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)]
);

// 12. Order Status History
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    previousCommercialStatus: text("previous_commercial_status"),
    newCommercialStatus: text("new_commercial_status").notNull(),
    previousCommunicationStatus: text("previous_communication_status"),
    newCommunicationStatus: text("new_communication_status"),
    changedBy: text("changed_by").notNull().default("sistema"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("status_history_order_idx").on(table.orderId)]
);

// 13. Order Notes (Observações internas da loja)
export const orderNotes = pgTable(
  "order_notes",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    author: text("author").notNull().default("Admin"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_notes_order_idx").on(table.orderId)]
);

// 14. Store Settings (Configurações comerciais, WhatsApp, endereço, horários, LGPD)
export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Loja Artes em Aroma"),
  tagline: text("tagline")
    .notNull()
    .default("Essências, bases, ceras e matérias-primas para dar vida às suas criações."),
  publicPhone: text("public_phone").notNull().default("(11) 91077-1820"),
  whatsappNumber: text("whatsapp_number").notNull().default("5511910771820"),
  whatsappEnabled: boolean("whatsapp_enabled").default(true).notNull(),
  isDataConfirmedForPublication: boolean("is_data_confirmed_for_publication")
    .default(false)
    .notNull(),
  addressStreet: text("address_street").notNull().default("Rua Rui Barbosa, 310"),
  addressNeighborhood: text("address_neighborhood").notNull().default("Vila Costa"),
  addressCity: text("address_city").notNull().default("Suzano"),
  addressState: text("address_state").notNull().default("SP"),
  addressZip: text("address_zip").notNull().default("08675-060"),
  googleMapsUrl: text("google_maps_url")
    .notNull()
    .default("https://www.google.com/maps/search/?api=1&query=Rua+Rui+Barbosa+310+Vila+Costa+Suzano+SP+08675-060"),
  instagramUrl: text("instagram_url")
    .notNull()
    .default("https://www.instagram.com/lojartesemaroma/"),
  openingHours: text("opening_hours")
    .notNull()
    .default("Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h (Sujeito a confirmação)"),
  pickupEnabled: boolean("pickup_enabled").default(true).notNull(),
  deliveryEnabled: boolean("delivery_enabled").default(true).notNull(),
  deliveryNotice: text("delivery_notice")
    .notNull()
    .default("Retirada na loja em Suzano/SP ou entrega local mediante consulta de disponibilidade e taxa pelo WhatsApp."),
  paymentMethodsInfo: text("payment_methods_info")
    .notNull()
    .default("PIX, Cartão de Crédito/Débito e Dinheiro no atendimento ou retirada."),
  dataRetentionDays: integer("data_retention_days").default(365).notNull(),
  ga4MeasurementId: text("ga4_measurement_id").default(""),
  gscConnected: boolean("gsc_connected").default(false).notNull(),
  ga4Connected: boolean("ga4_connected").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 15. Site Content (Conteúdo administrável da Home, Sobre, Guias Editoriais GEO)
export const siteContent = pgTable(
  "site_content",
  {
    id: serial("id").primaryKey(),
    sectionKey: text("section_key").notNull().unique(), // 'hero', 'about', 'start_creating', 'editorial_guides'
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    body: text("body"),
    ctaPrimaryText: text("cta_primary_text"),
    ctaPrimaryHref: text("cta_primary_href"),
    ctaSecondaryText: text("cta_secondary_text"),
    ctaSecondaryHref: text("cta_secondary_href"),
    imageUrl: text("image_url"),
    imageAlt: text("image_alt"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("site_content_key_idx").on(table.sectionKey)]
);

// 16. FAQs (AEO — Perguntas frequentes gerais e locais editáveis)
export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("Geral"), // 'Localização', 'Produtos', 'Pedidos', 'Iniciantes'
  relatedProductSlug: text("related_product_slug"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 17. SEO Metadata & Redirects (Controle de slugs antigos e configurações de SEO por rota)
export const seoMetadata = pgTable(
  "seo_metadata",
  {
    id: serial("id").primaryKey(),
    routePath: text("route_path").notNull().unique(), // ex: '/', '/produtos', '/sobre', '/contato', '/duvidas', '/guias'
    title: text("title").notNull(),
    description: text("description").notNull(),
    canonicalUrl: text("canonical_url"),
    ogImageUrl: text("og_image_url"),
    noIndex: boolean("no_index").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("seo_route_idx").on(table.routePath)]
);

// 18. Audit Logs & Funnel Events
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    actor: text("actor").notNull(), // email do admin ou 'public_funnel'
    action: text("action").notNull(), // ex: 'product.create', 'order.status_change', 'funnel.add_to_cart'
    entityType: text("entity_type").notNull(), // 'product', 'order', 'settings', 'funnel'
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_action_idx").on(table.action),
    index("audit_created_idx").on(table.createdAt),
  ]
);
