-- Migration 0000: Initial Schema for Artes em Aroma (Neon PostgreSQL / Drizzle ORM)

CREATE TABLE IF NOT EXISTS "roles" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role_id" integer REFERENCES "roles"("id"),
  "role_name" text DEFAULT 'admin' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_login_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE TABLE IF NOT EXISTS "categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "image_url" text,
  "image_alt" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "seo_title" text,
  "seo_description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "previous_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "sku" text NOT NULL UNIQUE,
  "brand" text DEFAULT 'Artes em Aroma' NOT NULL,
  "category_id" integer NOT NULL REFERENCES "categories"("id"),
  "short_description" text NOT NULL,
  "description" text NOT NULL,
  "price_cents" integer NOT NULL,
  "volume_or_weight" text NOT NULL,
  "usage_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "olfactory_family" text,
  "recommended_applications" text,
  "care_instructions" text,
  "specific_faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  "is_new" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "seo_title" text,
  "seo_description" text,
  "canonical_url" text,
  "seo_reviewed_by_human" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" ("category_id");
CREATE INDEX IF NOT EXISTS "products_active_idx" ON "products" ("is_active", "is_deleted");

CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sku" text NOT NULL,
  "price_cents" integer NOT NULL,
  "volume_or_weight" text NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "stock_quantity" integer DEFAULT 100 NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "variants_product_idx" ON "product_variants" ("product_id");

CREATE TABLE IF NOT EXISTS "product_images" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "alt" text NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "images_product_idx" ON "product_images" ("product_id");

CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "attribute_key" text NOT NULL,
  "attribute_value" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "attributes_product_idx" ON "product_attributes" ("product_id");

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" integer REFERENCES "product_variants"("id"),
  "movement_type" text NOT NULL,
  "quantity" integer NOT NULL,
  "reason" text,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "privacy_consent_at" timestamp DEFAULT now() NOT NULL,
  "retention_expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers" ("phone");

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_code" text NOT NULL UNIQUE,
  "idempotency_key" text UNIQUE,
  "customer_id" integer REFERENCES "customers"("id"),
  "customer_name" text NOT NULL,
  "customer_phone" text NOT NULL,
  "fulfillment_mode" text DEFAULT 'retirada' NOT NULL,
  "customer_notes" text,
  "subtotal_cents" integer NOT NULL,
  "total_items_count" integer NOT NULL,
  "commercial_status" text DEFAULT 'solicitacao_iniciada' NOT NULL,
  "communication_status" text DEFAULT 'link_gerado' NOT NULL,
  "cancel_reason" text,
  "whatsapp_link_triggered_at" timestamp,
  "contact_confirmed_at" timestamp,
  "confirmed_at" timestamp,
  "finalized_at" timestamp,
  "cancelled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_code_idx" ON "orders" ("order_code");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("commercial_status");
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders" ("created_at");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" integer REFERENCES "products"("id"),
  "variant_id" integer REFERENCES "product_variants"("id"),
  "product_name_snapshot" text NOT NULL,
  "sku_snapshot" text NOT NULL,
  "variant_name_snapshot" text NOT NULL,
  "unit_price_cents_snapshot" integer NOT NULL,
  "quantity" integer NOT NULL,
  "subtotal_cents_snapshot" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");

CREATE TABLE IF NOT EXISTS "order_status_history" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "previous_commercial_status" text,
  "new_commercial_status" text NOT NULL,
  "previous_communication_status" text,
  "new_communication_status" text,
  "changed_by" text DEFAULT 'sistema' NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "status_history_order_idx" ON "order_status_history" ("order_id");

CREATE TABLE IF NOT EXISTS "order_notes" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "author" text DEFAULT 'Admin' NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "order_notes_order_idx" ON "order_notes" ("order_id");

CREATE TABLE IF NOT EXISTS "store_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "store_name" text DEFAULT 'Loja Artes em Aroma' NOT NULL,
  "tagline" text DEFAULT 'Essências, bases, ceras e matérias-primas para dar vida às suas criações.' NOT NULL,
  "public_phone" text DEFAULT '(11) 91077-1820' NOT NULL,
  "whatsapp_number" text DEFAULT '5511910771820' NOT NULL,
  "whatsapp_enabled" boolean DEFAULT true NOT NULL,
  "is_data_confirmed_for_publication" boolean DEFAULT false NOT NULL,
  "address_street" text DEFAULT 'Rua Rui Barbosa, 310' NOT NULL,
  "address_neighborhood" text DEFAULT 'Vila Costa' NOT NULL,
  "address_city" text DEFAULT 'Suzano' NOT NULL,
  "address_state" text DEFAULT 'SP' NOT NULL,
  "address_zip" text DEFAULT '08675-060' NOT NULL,
  "google_maps_url" text DEFAULT 'https://www.google.com/maps/search/?api=1&query=Rua+Rui+Barbosa+310+Vila+Costa+Suzano+SP+08675-060' NOT NULL,
  "instagram_url" text DEFAULT 'https://www.instagram.com/lojartesemaroma/' NOT NULL,
  "opening_hours" text DEFAULT 'Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h (Sujeito a confirmação)' NOT NULL,
  "pickup_enabled" boolean DEFAULT true NOT NULL,
  "delivery_enabled" boolean DEFAULT true NOT NULL,
  "delivery_notice" text DEFAULT 'Retirada na loja em Suzano/SP ou entrega local mediante consulta de disponibilidade e taxa pelo WhatsApp.' NOT NULL,
  "payment_methods_info" text DEFAULT 'PIX, Cartão de Crédito/Débito e Dinheiro no atendimento ou retirada.' NOT NULL,
  "data_retention_days" integer DEFAULT 365 NOT NULL,
  "ga4_measurement_id" text DEFAULT '',
  "gsc_connected" boolean DEFAULT false NOT NULL,
  "ga4_connected" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "site_content" (
  "id" serial PRIMARY KEY NOT NULL,
  "section_key" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "subtitle" text,
  "body" text,
  "cta_primary_text" text,
  "cta_primary_href" text,
  "cta_secondary_text" text,
  "cta_secondary_href" text,
  "image_url" text,
  "image_alt" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_content_key_idx" ON "site_content" ("section_key");

CREATE TABLE IF NOT EXISTS "faqs" (
  "id" serial PRIMARY KEY NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" text DEFAULT 'Geral' NOT NULL,
  "related_product_slug" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "seo_metadata" (
  "id" serial PRIMARY KEY NOT NULL,
  "route_path" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "canonical_url" text,
  "og_image_url" text,
  "no_index" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "seo_route_idx" ON "seo_metadata" ("route_path");

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor" text NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "details" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "audit_created_idx" ON "audit_logs" ("created_at");
