import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth";
import { getAdminDashboardMetrics } from "@/domain/dashboard";
import { getAllCatalogProducts } from "@/domain/products";
import { getOrdersWithDetails } from "@/domain/orders";
import { getDigitalVisibilityChecklist } from "@/domain/seo";
import { db, ensureDatabaseInitialized } from "@/db";
import { categories, storeSettings, siteContent, faqs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Painel Administrativo | Artes em Aroma",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerAdminSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }

  await ensureDatabaseInitialized();

  const metrics = await getAdminDashboardMetrics();
  const { items: productsList } = await getAllCatalogProducts({
    includeInactive: true,
    pageSize: 500,
  });
  const ordersList = await getOrdersWithDetails();
  const visibilityChecklist = await getDigitalVisibilityChecklist();
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder));
  const [settings] = await db.select().from(storeSettings).limit(1);
  const contents = await db.select().from(siteContent);
  const faqList = await db
    .select()
    .from(faqs)
    .orderBy(asc(faqs.displayOrder));

  return (
    <AdminDashboardClient
      adminUser={{ name: session.name, email: session.email }}
      metrics={metrics}
      products={productsList}
      categories={allCategories}
      orders={ordersList}
      visibilityChecklist={visibilityChecklist}
      storeSettings={settings}
      siteContents={contents}
      faqs={faqList}
    />
  );
}
