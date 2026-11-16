import { db, ensureDatabaseInitialized } from "./index";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

export async function createDatabaseBackup(): Promise<{ filePath: string; timestamp: string }> {
  await ensureDatabaseInitialized();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const payload = {
    createdAt: new Date().toISOString(),
    storeSettings: await db.select().from(schema.storeSettings),
    categories: await db.select().from(schema.categories),
    products: await db.select().from(schema.products),
    productVariants: await db.select().from(schema.productVariants),
    productImages: await db.select().from(schema.productImages),
    productAttributes: await db.select().from(schema.productAttributes),
    orders: await db.select().from(schema.orders),
    orderItems: await db.select().from(schema.orderItems),
    orderStatusHistory: await db.select().from(schema.orderStatusHistory),
    orderNotes: await db.select().from(schema.orderNotes),
    siteContent: await db.select().from(schema.siteContent),
    faqs: await db.select().from(schema.faqs),
    seoMetadata: await db.select().from(schema.seoMetadata),
  };

  const filePath = path.join(backupDir, `backup-artes-em-aroma-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  return { filePath, timestamp };
}

if (require.main === module) {
  createDatabaseBackup()
    .then((res) => {
      console.log(`Backup concluído em: ${res.filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Erro ao gerar backup:", err);
      process.exit(1);
    });
}
