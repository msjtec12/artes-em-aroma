import { ensureDatabaseInitialized } from "./index";

async function main() {
  console.log("Iniciando seed do banco de dados da Artes em Aroma...");
  await ensureDatabaseInitialized();
  console.log("Banco de dados inicializado e populado com sucesso!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Falha no seed:", err);
  process.exit(1);
});
