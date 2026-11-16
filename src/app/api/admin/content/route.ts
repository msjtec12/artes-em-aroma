import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { db, ensureDatabaseInitialized } from "@/db";
import {
  storeSettings,
  siteContent,
  faqs,
  categories,
  seoMetadata,
  auditLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createDatabaseBackup } from "@/db/backup";

export async function GET() {
  try {
    await requireAdminSession();
    await ensureDatabaseInitialized();

    const [settings] = await db.select().from(storeSettings).limit(1);
    const contents = await db.select().from(siteContent);
    const faqList = await db.select().from(faqs);
    const categoryList = await db.select().from(categories);
    const seoList = await db.select().from(seoMetadata);

    return NextResponse.json({
      settings,
      contents,
      faqs: faqList,
      categories: categoryList,
      seoMetadata: seoList,
    });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdminSession();
    await ensureDatabaseInitialized();
    const body = await request.json();

    if (body.type === "store_settings") {
      const [existing] = await db.select().from(storeSettings).limit(1);
      if (existing) {
        await db
          .update(storeSettings)
          .set({
            storeName: body.storeName ?? existing.storeName,
            tagline: body.tagline ?? existing.tagline,
            publicPhone: body.publicPhone ?? existing.publicPhone,
            whatsappNumber: body.whatsappNumber ?? existing.whatsappNumber,
            whatsappEnabled: body.whatsappEnabled ?? existing.whatsappEnabled,
            isDataConfirmedForPublication:
              body.isDataConfirmedForPublication ?? existing.isDataConfirmedForPublication,
            addressStreet: body.addressStreet ?? existing.addressStreet,
            addressNeighborhood: body.addressNeighborhood ?? existing.addressNeighborhood,
            addressCity: body.addressCity ?? existing.addressCity,
            addressState: body.addressState ?? existing.addressState,
            addressZip: body.addressZip ?? existing.addressZip,
            googleMapsUrl: body.googleMapsUrl ?? existing.googleMapsUrl,
            instagramUrl: body.instagramUrl ?? existing.instagramUrl,
            openingHours: body.openingHours ?? existing.openingHours,
            pickupEnabled: body.pickupEnabled ?? existing.pickupEnabled,
            deliveryEnabled: body.deliveryEnabled ?? existing.deliveryEnabled,
            deliveryNotice: body.deliveryNotice ?? existing.deliveryNotice,
            paymentMethodsInfo: body.paymentMethodsInfo ?? existing.paymentMethodsInfo,
            updatedAt: new Date(),
          })
          .where(eq(storeSettings.id, existing.id));
      }
      await db.insert(auditLogs).values({
        actor: session.email,
        action: "settings.update",
        entityType: "settings",
        entityId: "1",
        details: { isDataConfirmedForPublication: body.isDataConfirmedForPublication },
      });
    } else if (body.type === "site_content") {
      await db
        .update(siteContent)
        .set({
          title: body.title,
          subtitle: body.subtitle,
          body: body.body,
          ctaPrimaryText: body.ctaPrimaryText,
          ctaPrimaryHref: body.ctaPrimaryHref,
          updatedAt: new Date(),
        })
        .where(eq(siteContent.sectionKey, body.sectionKey));
    } else if (body.type === "faq_create") {
      await db.insert(faqs).values({
        question: body.question,
        answer: body.answer,
        category: body.category || "Geral",
        relatedProductSlug: body.relatedProductSlug || null,
        displayOrder: Number(body.displayOrder || 10),
        isActive: true,
      });
    } else if (body.type === "faq_delete") {
      await db.delete(faqs).where(eq(faqs.id, Number(body.id)));
    } else if (body.type === "backup") {
      const backupRes = await createDatabaseBackup();
      return NextResponse.json({ ok: true, backup: backupRes });
    }

    revalidatePath("/");
    revalidatePath("/sobre");
    revalidatePath("/contato");
    revalidatePath("/duvidas");

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao atualizar conteúdo.";
    return NextResponse.json(
      { error: msg },
      { status: msg === "UNAUTHORIZED_ADMIN_ACCESS" ? 401 : 400 }
    );
  }
}
