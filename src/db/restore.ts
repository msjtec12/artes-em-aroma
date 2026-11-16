import fs from "fs";
import path from "path";
import { ensureDatabaseInitialized } from "./index";

async function restoreBackup() {
  await ensureDatabaseInitialized();
  const backupFile = process.argv[2];
  const backupDir = path.join(process.cwd(), "backups");

  let targetPath = backupFile;
  if (!targetPath) {
    if (!fs.existsSync(backupDir)) {
      console.error("Diretório de backups não encontrado.");
      process.exit(1);
    }
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) {
      console.error("Nenhum arquivo de backup encontrado em ./backups.");
      process.exit(1);
    }
    targetPath = path.join(backupDir, files[0]);
  }

  const raw = fs.readFileSync(targetPath, "utf-8");
  const parsed = JSON.parse(raw);
  console.log(`Arquivo de backup validado (${parsed.createdAt}). Produtos: ${parsed.products?.length ?? 0}, Pedidos: ${parsed.orders?.length ?? 0}`);
  process.exit(0);
}

if (require.main === module) {
  restoreBackup().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
