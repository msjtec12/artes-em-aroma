import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Singleton para manter a instância do banco consistente em desenvolvimento/testes e serverless
const globalForDb = globalThis as unknown as {
  dbInstance: ReturnType<typeof drizzlePglite<typeof schema>> | ReturnType<typeof drizzleNeon<typeof schema>> | undefined;
  initPromise: Promise<void> | undefined;
};

function createDbInstance() {
  // Ambiente de testes SEMPRE usa banco isolado, independentemente de DATABASE_URL.
  // Impede que uma suíte automatizada modifique os dados reais da loja.
  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  if (isTest) {
    const client = new PGlite();
    return drizzlePglite(client, { schema });
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel || process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL deve apontar para um PostgreSQL persistente em produção (ex.: Neon).");
  }

  const dataDir = path.join(process.cwd(), "data", "pglite");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  return drizzlePglite(client, { schema });
}

export const db = (globalForDb.dbInstance ??= createDbInstance());

/**
 * Inicializa o schema e dados base (seed idempotente) caso o banco ainda esteja vazio.
 */
export async function ensureDatabaseInitialized(): Promise<void> {
  if (globalForDb.initPromise) {
    return globalForDb.initPromise;
  }

  globalForDb.initPromise = (async () => {
    try {
      // Verifica se a tabela store_settings existe tentando consultá-la
      try {
        const existingSettings = await db.select().from(schema.storeSettings).limit(1);
        if (existingSettings.length > 0) {
          return;
        }
      } catch {
        // Tabela não existe ainda: aplicar migration 0000_initial_schema.sql
        const migrationPath = path.join(process.cwd(), "drizzle", "migrations", "0000_initial_schema.sql");
        if (fs.existsSync(migrationPath)) {
          const sqlContent = fs.readFileSync(migrationPath, "utf-8");
          // Executa os comandos DDL
          const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          for (const stmt of statements) {
            await (db as unknown as { execute: (q: string) => Promise<unknown> }).execute(stmt);
          }
        }
      }

      // Verifica novamente se já há configurações
      const checkSettings = await db.select().from(schema.storeSettings).limit(1);
      if (checkSettings.length > 0) {
        return;
      }

      // Seed inicial com dados reais de referência da Artes em Aroma
      await seedInitialData();
    } catch (err) {
      console.error("Erro ao inicializar banco de dados:", err);
      globalForDb.initPromise = undefined;
      throw err;
    }
  })();

  return globalForDb.initPromise;
}

export async function seedInitialData() {
  // 1. Roles e Usuário Administrador
  const [adminRole] = await db
    .insert(schema.roles)
    .values({
      name: "admin",
      description: "Proprietária / Administradora com acesso total à loja",
    })
    .onConflictDoNothing()
    .returning();

  // Nunca criar uma conta administrativa com senha previsível.
  // Configure ADMIN_INITIAL_PASSWORD (mínimo 16 caracteres) no ambiente seguro.
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  if (initialPassword) {
    if (initialPassword.length < 16) {
      throw new Error("ADMIN_INITIAL_PASSWORD precisa ter pelo menos 16 caracteres.");
    }
    const passwordHash = await bcrypt.hash(initialPassword, 12);
    await db
      .insert(schema.users)
      .values({
        name: "Administração Artes em Aroma",
        email: (process.env.ADMIN_INITIAL_EMAIL || "admin@artesemaroma.com.br").toLowerCase(),
        passwordHash,
        roleId: adminRole?.id ?? 1,
        roleName: "admin",
        isActive: true,
      })
      .onConflictDoNothing();
  }

  // 2. Store Settings (Informações da seção 2 do Prompt Master)
  await db.insert(schema.storeSettings).values({
    storeName: "Loja Artes em Aroma",
    tagline: "Essências, bases, ceras e matérias-primas para dar vida às suas criações.",
    publicPhone: "(11) 91077-1820",
    whatsappNumber: "5511910771820",
    whatsappEnabled: true,
    isDataConfirmedForPublication: false, // Exige confirmação antes da publicação conforme requisito
    addressStreet: "Rua Rui Barbosa, 310",
    addressNeighborhood: "Vila Costa",
    addressCity: "Suzano",
    addressState: "SP",
    addressZip: "08675-060",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Rua+Rui+Barbosa+310+Vila+Costa+Suzano+SP+08675-060",
    instagramUrl: "https://www.instagram.com/lojartesemaroma/",
    openingHours: "Segunda a Sexta: 09h às 18h | Sábado: 09h às 13h (Confirmar antes da visita)",
    pickupEnabled: true,
    deliveryEnabled: true,
    deliveryNotice:
      "Retirada presencial na loja em Suzano/SP ou entrega mediante consulta de disponibilidade no atendimento via WhatsApp.",
    paymentMethodsInfo:
      "PIX, Cartões de Débito e Crédito ou Dinheiro (confirmados diretamente no atendimento).",
    dataRetentionDays: 365,
    ga4MeasurementId: "",
    gscConnected: false,
    ga4Connected: false,
  });

  // 3. Site Content (Hero, Sobre, Comece sua criação)
  await db.insert(schema.siteContent).values([
    {
      sectionKey: "hero",
      title: "Transforme ideias em aromas.",
      subtitle: "Essências, bases, ceras e matérias-primas para dar vida às suas criações.",
      body: "Um espaço em Suzano pensado para artesãos, empreendedores de perfumaria artesanal, fabricantes de velas, sabonetes e apaixonados pelo universo olfativo.",
      ctaPrimaryText: "Explorar produtos",
      ctaPrimaryHref: "/produtos",
      ctaSecondaryText: "Conhecer a loja",
      ctaSecondaryHref: "/sobre",
      imageUrl: "/images/hero-botanical-composition.svg",
      imageAlt: "Composição artesanal com frascos âmbar de essências, ceras vegetais, sabonetes e botânicos secos",
    },
    {
      sectionKey: "about",
      title: "Um espaço para transformar criatividade em produtos aromáticos",
      subtitle: "Variedade, inspiração e atendimento próximo em Suzano, São Paulo.",
      body: "A Artes em Aroma nasceu para apoiar quem cria com as próprias mãos. Mais do que uma loja de essências, reunimos matérias-primas selecionadas, bases glicerinadas, ceras vegetais, frascos, pavios e acessórios para fabricação artesanal de velas aromáticas, sabonetes, difusores e perfumaria fina.",
      ctaPrimaryText: "Visitar nossa loja em Suzano",
      ctaPrimaryHref: "/contato",
      ctaSecondaryText: "Tirar dúvidas",
      ctaSecondaryHref: "/duvidas",
      imageUrl: "/images/atelier-artisan-shelf.svg",
      imageAlt: "Bancada artesanal com matérias-primas aromáticas organizadas",
    },
    {
      sectionKey: "start_creating",
      title: "Comece sua criação artesanal",
      subtitle: "Organizamos os insumos essenciais de acordo com o projeto que você deseja produzir.",
      body: "Seja para produzir suas primeiras velas aromáticas em pote, criar sabonetes glicerinados botânicos ou montar difusores de varetas para sua marca ou presente, escolha os materiais certos com praticidade.",
      ctaPrimaryText: "Ver guias de escolha",
      ctaPrimaryHref: "/guias",
      ctaSecondaryText: "Explorar catálogo",
      ctaSecondaryHref: "/produtos",
    },
  ]);

  // 4. Categorias Principais
  const insertedCategories = await db
    .insert(schema.categories)
    .values([
      {
        name: "Essências Aromáticas",
        slug: "essencias-aromaticas",
        description:
          "Essências concentradas de famílias florais, herbais, cítricas, amadeiradas e adocicadas para velas, sabonetes e aromatizadores.",
        imageUrl: "/images/cat-essencias.svg",
        imageAlt: "Frascos âmbar de essências aromáticas concentradas",
        displayOrder: 1,
        seoTitle: "Essências Aromáticas para Velas, Sabonetes e Difusores em Suzano | Artes em Aroma",
        seoDescription:
          "Encontre essências aromáticas em Suzano para fabricação artesanal de velas, sabonetes, home spray e difusores de ambiente na Artes em Aroma.",
      },
      {
        name: "Ceras e Insumos para Velas",
        slug: "ceras-e-velas",
        description:
          "Cera vegetal de coco, blends de soja e palma, pavios de algodão e madeira, ilhós e acessórios para velas artesanais.",
        imageUrl: "/images/cat-ceras.svg",
        imageAlt: "Cera vegetal em flocos, pavios de algodão e potes para velas",
        displayOrder: 2,
        seoTitle: "Cera para Velas e Materiais para Velas Artesanais em Suzano | Artes em Aroma",
        seoDescription:
          "Cera de coco, cera vegetal, pavios e acessórios para fabricação de velas aromáticas em Suzano/SP.",
      },
      {
        name: "Bases para Saboaria e Perfumaria",
        slug: "bases-saboaria-perfumaria",
        description:
          "Base glicerinada vegetal branca e transparente, base para veículo de perfumes e aromatizadores, extratos e lauril.",
        imageUrl: "/images/cat-bases.svg",
        imageAlt: "Barras de base glicerinada vegetal e insumos para saboaria artesanal",
        displayOrder: 3,
        seoTitle: "Base Glicerinada e Matérias-Primas para Sabonetes em Suzano | Artes em Aroma",
        seoDescription:
          "Base glicerinada vegetal, insumos para sabonetes artesanais e bases para aromatizadores em Suzano na Loja Artes em Aroma.",
      },
      {
        name: "Frascos, Potes e Acessórios",
        slug: "frascos-potes-acessorios",
        description:
          "Vidros para difusores, potes para velas, válvulas spray, tampas, varetas de fibra e madeira, formas de silicone e medidores.",
        imageUrl: "/images/cat-frascos.svg",
        imageAlt: "Frascos de vidro, potes para velas, válvulas e varetas difusoras",
        displayOrder: 4,
        seoTitle: "Frascos para Difusor, Potes para Velas e Acessórios em Suzano | Artes em Aroma",
        seoDescription:
          "Frascos de vidro, varetas difusoras, potes para velas e acessórios para produção artesanal em Suzano.",
      },
    ])
    .returning();

  const catEssencias = insertedCategories[0].id;
  const catCeras = insertedCategories[1].id;
  const catBases = insertedCategories[2].id;
  const catFrascos = insertedCategories[3].id;

  // 5. Produtos do Catálogo (Representativos reais do segmento, com avisos transparentes e sem alegações médicas/químicas não validadas)
  const sampleProducts = [
    {
      name: "Essência Lavanda Provençal",
      slug: "essencia-lavanda-100ml",
      sku: "AA-ESS-LAV-100",
      categoryId: catEssencias,
      shortDescription:
        "Nota floral aromática clássica com nuances herbais suaves, ideal para linhas de home fragrance e saboaria artesanal.",
      description:
        "A Essência Lavanda Provençal da Artes em Aroma apresenta perfil olfativo floral aromático equilibrado, muito procurado por artesãos para compor coleções relaxantes de difusores de varetas, águas de lençóis, home sprays e sabonetes em barra. Disponível em frascos com proteção contra luz para preservar a integridade olfativa.",
      priceCents: 2890,
      volumeOrWeight: "100 ml",
      usageTypes: ["Velas", "Sabonetes", "Aromatizadores", "Perfumaria Artesanal"],
      olfactoryFamily: "Floral Herbal",
      recommendedApplications:
        "Indicada para aromatizadores de ambiente, águas perfumadas, sachês e sabonetes artesanais (verifique a versão lipossolúvel ou hidrossolúvel na seleção de variante conforme a base utilizada).",
      careInstructions:
        "Manter o frasco bem fechado, ao abrigo da luz solar direta e do calor excessivo. Produto concentrado destinado à formulação artesanal — não aplicar puro diretamente sobre a pele. Realize sempre teste de pré-formulação em pequeno lote.",
      specificFaqs: [
        {
          question: "Esta essência pode ser utilizada em difusores de varetas?",
          answer:
            "Sim, combina perfeitamente com base veículo para aromatizador e varetas de madeira ou fibra.",
        },
        {
          question: "Devo fazer teste piloto antes de produzir em maior escala?",
          answer:
            "Sim. Como cada cera ou base glicerinada possui características próprias, recomendamos sempre testar em um lote reduzido.",
        },
      ],
      isAvailable: true,
      isFeatured: true,
      isNew: false,
      seoTitle: "Essência Lavanda Provençal (100 ml e 500 ml) em Suzano | Artes em Aroma",
      seoDescription:
        "Essência Lavanda Provençal para sabonetes, aromatizadores e criações artesanais em Suzano. Confira disponibilidade e solicite pelo WhatsApp.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-essencia-lavanda.svg",
      imageAlt: "Frasco âmbar de Essência Lavanda Provençal 100 ml com ramo botânico de lavanda",
      variants: [
        { name: "100 ml (Frasco Âmbar)", sku: "AA-ESS-LAV-100", priceCents: 2890, volumeOrWeight: "100 ml", isAvailable: true },
        { name: "500 ml (Frasco Profissional)", sku: "AA-ESS-LAV-500", priceCents: 11990, volumeOrWeight: "500 ml", isAvailable: true },
      ],
      attributes: [
        { key: "Família Olfativa", value: "Floral Herbal" },
        { key: "Embalagem", value: "Frasco PET/Vidro Âmbar com lacre" },
      ],
    },
    {
      name: "Essência Bamboo & Chá Branco Premium",
      slug: "essencia-bamboo-cha-branco-100ml",
      sku: "AA-ESS-BAM-100",
      categoryId: catEssencias,
      shortDescription:
        "Fragrância fresca, limpa e sofisticada com saída cítrica verde e fundo levemente almiscarado para ambientes e velas.",
      description:
        "Uma das fragrâncias mais versáteis para marcas autorais de home fragrance. O acorde de Bamboo com Chá Branco entrega sensação de frescor botânico e elegância contemporânea, sendo excelente para difusores de varetas, home sprays e velas vegetais.",
      priceCents: 3250,
      volumeOrWeight: "100 ml",
      usageTypes: ["Velas", "Aromatizadores", "Sabonetes"],
      olfactoryFamily: "Cítrico Verde Floral",
      recommendedApplications:
        "Aromatizadores de varetas, home spray, velas aromáticas em pote (versão lipossolúvel) e sabonete líquido.",
      careInstructions:
        "Armazenar em local seco e arejado. Não ingerir. Manter fora do alcance de crianças e animais domésticos.",
      specificFaqs: [
        {
          question: "Posso usar em velas de cera de coco?",
          answer:
            "Para uso em ceras vegetais, selecione ou confirme no atendimento a variante lipossolúvel apropriada para velas.",
        },
      ],
      isAvailable: true,
      isFeatured: true,
      isNew: true,
      seoTitle: "Essência Bamboo e Chá Branco para Velas e Difusores em Suzano | Artes em Aroma",
      seoDescription:
        "Essência Bamboo & Chá Branco em Suzano para velas aromáticas, home spray e difusores de ambiente na Artes em Aroma.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-essencia-bamboo.svg",
      imageAlt: "Frasco de Essência Bamboo e Chá Branco 100 ml",
      variants: [
        { name: "100 ml — Uso Geral / Difusores", sku: "AA-ESS-BAM-100", priceCents: 3250, volumeOrWeight: "100 ml", isAvailable: true },
        { name: "100 ml — Lipossolúvel para Velas", sku: "AA-ESS-BAM-VEL-100", priceCents: 3690, volumeOrWeight: "100 ml", isAvailable: true },
        { name: "500 ml — Lipossolúvel para Velas", sku: "AA-ESS-BAM-VEL-500", priceCents: 14900, volumeOrWeight: "500 ml", isAvailable: true },
      ],
      attributes: [
        { key: "Família Olfativa", value: "Cítrico Verde Floral" },
        { key: "Indicação Principal", value: "Home Spray, Difusores e Velas" },
      ],
    },
    {
      name: "Cera Vegetal de Coco T-02 para Velas em Pote",
      slug: "cera-vegetal-coco-t02-1kg",
      sku: "AA-CER-COC-1KG",
      categoryId: catCeras,
      shortDescription:
        "Blend vegetal de alta performance com acabamento cremoso, queima limpa e excelente ancoragem aromática para velas em recipiente.",
      description:
        "A Cera Vegetal de Coco T-02 é amplamente utilizada por fabricantes de velas artesanais que buscam superfície lisa, toque aveludado e ótima liberação de aroma a frio e a quente. Fácil de manusear por vir em flocos ou pastilhas, facilitando a pesagem precisa em pequenos ou médios lotes.",
      priceCents: 4690,
      volumeOrWeight: "1 kg",
      usageTypes: ["Velas"],
      olfactoryFamily: "Neutra (Sem fragrância)",
      recommendedApplications:
        "Desenvolvida especificamente para velas aromáticas em recipientes (potes de vidro, cerâmica ou latas). Não indicada para velas desmoldadas (pillar) sem aditivos endurecedores.",
      careInstructions:
        "Derreter em banho-maria ou derretedeira com controle térmico, evitando superaquecimento. Conservar em local fresco para evitar aglomeração dos flocos.",
      specificFaqs: [
        {
          question: "Essa cera serve para velas em molde de silicone?",
          answer:
            "Não. Por ser uma cera macia de recipiente (container), ela adere ao pote. Para velas de molde, consulte nossas opções de ceras para desmolde no atendimento.",
        },
      ],
      isAvailable: true,
      isFeatured: true,
      isNew: false,
      seoTitle: "Cera Vegetal de Coco para Velas Artesanais em Suzano (1 kg e 5 kg) | Artes em Aroma",
      seoDescription:
        "Compre Cera Vegetal de Coco para velas aromáticas em Suzano na Artes em Aroma. Acabamento aveludado e excelente difusão de aroma.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-cera-coco.svg",
      imageAlt: "Embalagem de Cera Vegetal de Coco em flocos para velas artesanais",
      variants: [
        { name: "Pacote 1 kg", sku: "AA-CER-COC-1KG", priceCents: 4690, volumeOrWeight: "1 kg", isAvailable: true },
        { name: "Caixa 5 kg", sku: "AA-CER-COC-5KG", priceCents: 21500, volumeOrWeight: "5 kg", isAvailable: true },
      ],
      attributes: [
        { key: "Tipo de Cera", value: "Blend Vegetal de Coco para Recipientes" },
        { key: "Formato", value: "Flocos / Pastilhas" },
      ],
    },
    {
      name: "Base Glicerinada Vegetal Branca",
      slug: "base-glicerinada-vegetal-branca-1kg",
      sku: "AA-BAS-GLI-BRA-1KG",
      categoryId: catBases,
      shortDescription:
        "Base glicerinada de origem vegetal com espuma cremosa e fácil derretimento para produção de sabonetes artesanais em barra.",
      description:
        "A Base Glicerinada Vegetal Branca é o ponto de partida ideal tanto para quem está começando na saboaria artesanal quanto para pequenos produtores. Possui corte macio, derretimento uniforme e aceita bem essências cosméticas, extratos glicólicos, argilas e pigmentos próprios para saboaria.",
      priceCents: 3490,
      volumeOrWeight: "1 kg",
      usageTypes: ["Sabonetes"],
      olfactoryFamily: "Neutra",
      recommendedApplications:
        "Fabricação de sabonetes artesanais em barra pelo método melt & pour (derreter e verter em formas).",
      careInstructions:
        "Evitar fervura durante o derretimento para não ressecar a base ou gerar suor no sabonete pronto. Embalar os sabonetes finalizados em filme plástico apropriado após o resfriamento completo.",
      specificFaqs: [
        {
          question: "Qual a diferença entre a base branca e a transparente?",
          answer:
            "A base branca produz cores pastéis e aspecto cremoso opaco, enquanto a transparente realça cores vibrantes e permite incluir elementos botânicos visíveis no interior.",
        },
      ],
      isAvailable: true,
      isFeatured: true,
      isNew: false,
      seoTitle: "Base Glicerinada Vegetal para Sabonetes em Suzano (1 kg) | Artes em Aroma",
      seoDescription:
        "Base glicerinada vegetal branca e transparente em Suzano para fabricação de sabonetes artesanais. Solicite seu pedido na Artes em Aroma.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-base-glicerinada.svg",
      imageAlt: "Barra de Base Glicerinada Vegetal de 1 kg para sabonetes artesanais",
      variants: [
        { name: "1 kg — Branca Opaca", sku: "AA-BAS-GLI-BRA-1KG", priceCents: 3490, volumeOrWeight: "1 kg", isAvailable: true },
        { name: "1 kg — Transparente Cristal", sku: "AA-BAS-GLI-TRA-1KG", priceCents: 3590, volumeOrWeight: "1 kg", isAvailable: true },
      ],
      attributes: [
        { key: "Origem", value: "Vegetal" },
        { key: "Método", value: "Melt & Pour (Derreter e Moldar)" },
      ],
    },
    {
      name: "Base Veículo para Aromatizador e Perfumaria",
      slug: "base-veiculo-aromatizador-1l",
      sku: "AA-BAS-ARO-1L",
      categoryId: catBases,
      shortDescription:
        "Base pronta com álcool de cereais e fixador balanceado para preparo de difusores de varetas, home spray e águas perfumadas.",
      description:
        "Praticidade para quem produz aromatizadores de ambiente: a Base Veículo para Aromatizador já reúne a proporção ideal de solvente cosmético para facilitar a mistura com a essência escolhida, otimizando o tempo de produção artesanal.",
      priceCents: 3990,
      volumeOrWeight: "1 L",
      usageTypes: ["Aromatizadores", "Perfumaria Artesanal"],
      olfactoryFamily: "Neutra",
      recommendedApplications:
        "Preparo de difusor de varetas, home spray e água para lençóis mediante adição da essência aromática desejada.",
      careInstructions:
        "Produto inflamável. Manter longe de chamas, faíscas e fontes de calor. Armazenar em local ventilado.",
      specificFaqs: [],
      isAvailable: true,
      isFeatured: false,
      isNew: true,
      seoTitle: "Base para Aromatizador de Ambiente e Difusor (1 Litro) em Suzano | Artes em Aroma",
      seoDescription:
        "Base pronta para aromatizador de ambiente e home spray em Suzano. Matérias-primas para perfumaria artesanal na Artes em Aroma.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-base-aromatizador.svg",
      imageAlt: "Frasco de 1 Litro de Base Veículo para Aromatizadores",
      variants: [
        { name: "1 Litro", sku: "AA-BAS-ARO-1L", priceCents: 3990, volumeOrWeight: "1 L", isAvailable: true },
      ],
      attributes: [
        { key: "Volume", value: "1 Litro" },
        { key: "Aplicação", value: "Difusores e Home Spray" },
      ],
    },
    {
      name: "Frasco Vidro Âmbar Boticário com Válvula ou Tampa",
      slug: "frasco-vidro-ambar-250ml",
      sku: "AA-FRA-AMB-250",
      categoryId: catFrascos,
      shortDescription:
        "Frasco de vidro âmbar 250 ml estilo boticário com acabamento elegante para difusores de varetas, sabonete líquido ou home spray.",
      description:
        "O clássico vidro âmbar agrega valor imediato às linhas artesanais de perfumaria para casa e cosméticos, além de ajudar a proteger o líquido da luminosidade. Escolha a variante com tampa difusora, válvula spray ou válvula pump para sabonete líquido.",
      priceCents: 1290,
      volumeOrWeight: "250 ml",
      usageTypes: ["Aromatizadores", "Sabonetes", "Perfumaria Artesanal"],
      olfactoryFamily: "Acessório",
      recommendedApplications:
        "Envase de difusores de ambiente, home sprays e sabonetes líquidos artesanais.",
      careInstructions:
        "Higienizar e secar completamente o frasco antes do envase do produto final.",
      specificFaqs: [],
      isAvailable: true,
      isFeatured: true,
      isNew: false,
      seoTitle: "Frasco de Vidro Âmbar 250ml para Difusor e Home Spray em Suzano | Artes em Aroma",
      seoDescription:
        "Frascos de vidro âmbar 250ml com tampa difusora, válvula spray ou pump em Suzano na Artes em Aroma.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-frasco-ambar.svg",
      imageAlt: "Frasco de vidro âmbar 250 ml estilo boticário com varetas e válvula",
      variants: [
        { name: "250 ml + Tampa Difusora Preta + 5 Varetas", sku: "AA-FRA-AMB-250-DIF", priceCents: 1290, volumeOrWeight: "250 ml", isAvailable: true },
        { name: "250 ml + Válvula Spray Preta", sku: "AA-FRA-AMB-250-SPR", priceCents: 1350, volumeOrWeight: "250 ml", isAvailable: true },
        { name: "250 ml + Válvula Pump Saboneteira", sku: "AA-FRA-AMB-250-PMP", priceCents: 1390, volumeOrWeight: "250 ml", isAvailable: true },
      ],
      attributes: [
        { key: "Material", value: "Vidro Âmbar Real" },
        { key: "Rosca", value: "28/410" },
      ],
    },
    {
      name: "Pavio de Algodão Trançado Encerado com Ilhós (Pacote 20 un)",
      slug: "pavio-algodao-encerado-ilhos-20un",
      sku: "AA-PAV-ALG-20",
      categoryId: catCeras,
      shortDescription:
        "Pavios de algodão encerados prontos para uso com suporte metálico (ilhós) para diversos diâmetros de velas em pote.",
      description:
        "A escolha correta do pavio é determinante para uma queima uniforme sem formação de túnel. Nossos pavios de algodão já vêm encerados e montados no ilhós metálico, facilitando a centralização no fundo do recipiente.",
      priceCents: 1490,
      volumeOrWeight: "20 unidades",
      usageTypes: ["Velas"],
      olfactoryFamily: "Acessório",
      recommendedApplications:
        "Velas aromáticas em potes de pequeno e médio diâmetro. Realize teste de queima conforme o diâmetro do seu pote e a porcentagem de essência utilizada.",
      careInstructions:
        "Aparar o pavio para cerca de 0,5 cm antes de cada queima da vela pronta.",
      specificFaqs: [],
      isAvailable: true,
      isFeatured: false,
      isNew: false,
      seoTitle: "Pavio de Algodão Encerado com Ilhós para Velas em Suzano | Artes em Aroma",
      seoDescription:
        "Pavios de algodão encerados com ilhós para fabricação de velas aromáticas artesanais em Suzano.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-pavios.svg",
      imageAlt: "Pavios de algodão encerados com suporte metálico ilhós",
      variants: [
        { name: "Calibre Médio (Potes 6 a 7,5 cm) — 20 un", sku: "AA-PAV-ALG-MED-20", priceCents: 1490, volumeOrWeight: "20 un", isAvailable: true },
        { name: "Calibre Forte (Potes 7,5 a 9 cm) — 20 un", sku: "AA-PAV-ALG-FOR-20", priceCents: 1590, volumeOrWeight: "20 un", isAvailable: true },
      ],
      attributes: [
        { key: "Comprimento", value: "15 cm" },
        { key: "Material", value: "100% Algodão com banho de cera vegetal" },
      ],
    },
    {
      name: "Essência Flor de Figo & Âmbar (Edição Botânica)",
      slug: "essencia-flor-de-figo-ambar-100ml",
      sku: "AA-ESS-FIG-100",
      categoryId: catEssencias,
      shortDescription:
        "Combinação autoral envolvente entre o frescor verde frutado das folhas de figo e a sofisticação aquecida do âmbar.",
      description:
        "Pensada para coleções premium de velas e perfumaria para interiores, a Essência Flor de Figo & Âmbar traz personalidade botânica marcante. Atualmente em reposição de lote — consulte disponibilidade ou solicite aviso no atendimento.",
      priceCents: 3590,
      volumeOrWeight: "100 ml",
      usageTypes: ["Velas", "Aromatizadores"],
      olfactoryFamily: "Frutal Amadeirado",
      recommendedApplications:
        "Linhas autorais de velas vegetais e difusores de ambiente.",
      careInstructions:
        "Conservar ao abrigo de luz e calor.",
      specificFaqs: [],
      isAvailable: false, // Exemplo real de aviso de indisponibilidade no catálogo
      isFeatured: false,
      isNew: true,
      seoTitle: "Essência Flor de Figo e Âmbar 100ml em Suzano | Artes em Aroma",
      seoDescription:
        "Essência Flor de Figo & Âmbar para velas e aromatizadores na Loja Artes em Aroma em Suzano/SP.",
      seoReviewedByHuman: true,
      imageUrl: "/images/prod-essencia-figo.svg",
      imageAlt: "Frasco âmbar de Essência Flor de Figo e Âmbar 100 ml",
      variants: [
        { name: "100 ml", sku: "AA-ESS-FIG-100", priceCents: 3590, volumeOrWeight: "100 ml", isAvailable: false },
      ],
      attributes: [
        { key: "Família Olfativa", value: "Frutal Amadeirado" },
        { key: "Status do Lote", value: "Aguardando reposição" },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const [insertedProd] = await db
      .insert(schema.products)
      .values({
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId: p.categoryId,
        shortDescription: p.shortDescription,
        description: p.description,
        priceCents: p.priceCents,
        volumeOrWeight: p.volumeOrWeight,
        usageTypes: p.usageTypes,
        olfactoryFamily: p.olfactoryFamily,
        recommendedApplications: p.recommendedApplications,
        careInstructions: p.careInstructions,
        specificFaqs: p.specificFaqs,
        isAvailable: p.isAvailable,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        isActive: true,
        isDeleted: false,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoReviewedByHuman: p.seoReviewedByHuman,
      })
      .returning();

    await db.insert(schema.productImages).values({
      productId: insertedProd.id,
      url: p.imageUrl,
      alt: p.imageAlt,
      isPrimary: true,
      displayOrder: 1,
    });

    for (let i = 0; i < p.variants.length; i++) {
      const v = p.variants[i];
      await db.insert(schema.productVariants).values({
        productId: insertedProd.id,
        name: v.name,
        sku: v.sku,
        priceCents: v.priceCents,
        volumeOrWeight: v.volumeOrWeight,
        isAvailable: v.isAvailable,
        displayOrder: i + 1,
      });
    }

    for (const attr of p.attributes) {
      await db.insert(schema.productAttributes).values({
        productId: insertedProd.id,
        attributeKey: attr.key,
        attributeValue: attr.value,
      });
    }
  }

  // 6. FAQs (AEO — todas as 10 perguntas relevantes do Prompt Master Seção 12)
  await db.insert(schema.faqs).values([
    {
      question: "Onde comprar essências em Suzano?",
      answer:
        "Você encontra essências aromáticas, bases, ceras e acessórios na Loja Artes em Aroma, localizada na Rua Rui Barbosa, 310, Vila Costa, em Suzano/SP (CEP 08675-060). Você também pode consultar o catálogo online e iniciar sua solicitação de pedido pelo WhatsApp.",
      category: "Localização",
      relatedProductSlug: "essencia-lavanda-100ml",
      displayOrder: 1,
    },
    {
      question: "A Artes em Aroma vende materiais para fazer velas?",
      answer:
        "Sim! Trabalhamos com ceras vegetais (como cera de coco para velas em pote), essências apropriadas, pavios de algodão encerados com ilhós, potes de vidro e acessórios essenciais para produção de velas aromáticas artesanais.",
      category: "Produtos",
      relatedProductSlug: "cera-vegetal-coco-t02-1kg",
      displayOrder: 2,
    },
    {
      question: "Quais produtos são necessários para começar a fazer sabonetes?",
      answer:
        "Para iniciar na saboaria artesanal pelo método prático de derreter e moldar (melt & pour), os itens básicos são: Base Glicerinada Vegetal (branca ou transparente), essência cosmética para sabonetes, forma de silicone, recipiente para derretimento seguro e, opcionalmente, extratos ou corantes próprios para cosméticos.",
      category: "Iniciantes",
      relatedProductSlug: "base-glicerinada-vegetal-branca-1kg",
      displayOrder: 3,
    },
    {
      question: "Como escolher uma essência?",
      answer:
        "Considere três fatores principais: 1) O tipo de produto que você vai produzir (velas exigem essências lipossolúveis compatíveis com ceras, enquanto difusores e sabonetes utilizam formulações específicas); 2) A família olfativa desejada (floral, cítrica, herbal, amadeirada); e 3) A realização de um teste em pequeno lote.",
      category: "Iniciantes",
      relatedProductSlug: "essencia-bamboo-cha-branco-100ml",
      displayOrder: 4,
    },
    {
      question: "Qual a diferença entre essência e óleo essencial?",
      answer:
        "As essências aromáticas sintéticas ou idênticas às naturais são desenvolvidas para perfumação estável, alta fixação e ampla variedade criativa em velas, sabonetes e difusores. Já os óleos essenciais são extratos puros obtidos diretamente de plantas aromáticas, possuindo composição volátil natural sensível à temperatura.",
      category: "Iniciantes",
      displayOrder: 5,
    },
    {
      question: "Existem opções para produção artesanal?",
      answer:
        "Sim, todo o nosso portfólio é pensado tanto para quem está dando os primeiros passos quanto para artesãos e pequenas marcas de perfumaria artesanal, saboaria e velas, com embalagens fracionadas (como essências de 100 ml e 500 ml e bases a partir de 1 kg).",
      category: "Produtos",
      displayOrder: 6,
    },
    {
      question: "É possível retirar produtos na loja?",
      answer:
        "Sim! Você pode montar sua sacola aqui no site, escolher a preferência de 'Retirada na loja em Suzano' e enviar sua solicitação pelo WhatsApp para confirmarmos a disponibilidade e deixarmos seu pedido separado.",
      category: "Pedidos",
      displayOrder: 7,
    },
    {
      question: "Como solicitar um pedido?",
      answer:
        "Navegue pelo catálogo em /produtos, escolha as variações e quantidades desejadas, adicione à sacola e preencha seu nome e telefone. Ao clicar em 'Enviar solicitação pelo WhatsApp', o sistema registra seu número de pedido e abre uma mensagem formatada para nossa equipe confirmar estoque e pagamento.",
      category: "Pedidos",
      displayOrder: 8,
    },
    {
      question: "A loja trabalha com kits?",
      answer:
        "No catálogo organizamos sugestões de insumos por tipo de criação (velas, sabonetes e aromatizadores) para você montar sua seleção personalizada. Caso deseje verificar combinações disponíveis no momento, fale conosco pelo WhatsApp.",
      category: "Produtos",
      displayOrder: 9,
    },
    {
      question: "Quais são as formas de pagamento?",
      answer:
        "As formas de pagamento aceitas (como PIX, cartões de débito/crédito e dinheiro na retirada) são confirmadas diretamente com nossa equipe durante o atendimento do seu pedido pelo WhatsApp.",
      category: "Pedidos",
      displayOrder: 10,
    },
  ]);

  // 7. SEO Metadata para rotas estáticas
  const canonicalSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://artes-em-aroma-jet.vercel.app").replace(/\/$/, "");
  await db.insert(schema.seoMetadata).values([
    {
      routePath: "/",
      title: "Artes em Aroma | Loja de Essências, Ceras e Saboaria Artesanal em Suzano - SP",
      description:
        "Transforme ideias em aromas. Essências, base glicerinada, cera para velas, frascos e matérias-primas para perfumaria artesanal em Suzano/SP.",
      canonicalUrl: `${canonicalSiteUrl}/`,
      noIndex: false,
    },
    {
      routePath: "/produtos",
      title: "Catálogo de Essências, Ceras para Velas e Bases em Suzano | Artes em Aroma",
      description:
        "Explore nosso catálogo de essências aromáticas, cera vegetal de coco, base glicerinada para sabonetes, pavios e frascos em Suzano/SP.",
      canonicalUrl: `${canonicalSiteUrl}/produtos`,
      noIndex: false,
    },
    {
      routePath: "/guias",
      title: "Guias de Criação Artesanal: Velas, Sabonetes e Aromatizadores | Artes em Aroma",
      description:
        "Aprenda como escolher essências para velas, diferenças entre famílias olfativas, tipos de ceras e materiais básicos para sabonetes artesanais.",
      canonicalUrl: `${canonicalSiteUrl}/guias`,
      noIndex: false,
    },
    {
      routePath: "/sobre",
      title: "Sobre a Loja Artes em Aroma | Perfumaria e Saboaria Artesanal em Suzano",
      description:
        "Conheça a Artes em Aroma em Suzano/SP: um espaço dedicado a quem deseja transformar criatividade em velas aromáticas, sabonetes e perfumes.",
      canonicalUrl: `${canonicalSiteUrl}/sobre`,
      noIndex: false,
    },
    {
      routePath: "/duvidas",
      title: "Dúvidas Frequentes sobre Essências, Velas e Pedidos | Artes em Aroma Suzano",
      description:
        "Respostas diretas sobre onde comprar essências em Suzano, materiais para velas e sabonetes, como solicitar pedidos pelo WhatsApp e retirada na loja.",
      canonicalUrl: `${canonicalSiteUrl}/duvidas`,
      noIndex: false,
    },
    {
      routePath: "/contato",
      title: "Localização e Contato em Suzano/SP | Loja Artes em Aroma",
      description:
        "Visite a Loja Artes em Aroma na Rua Rui Barbosa, 310, Vila Costa, Suzano/SP. Confira telefone, WhatsApp, horários e mapa de localização.",
      canonicalUrl: `${canonicalSiteUrl}/contato`,
      noIndex: false,
    },
  ]);
}
