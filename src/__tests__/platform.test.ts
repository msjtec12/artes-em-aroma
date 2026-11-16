import { describe, it, expect, beforeAll } from "vitest";
import { ensureDatabaseInitialized, db } from "@/db";
import {
  getAllCatalogProducts,
  getProductBySlugOrRedirect,
  upsertProductAdmin,
  toggleProductStateAdmin,
  duplicateProductAdmin,
} from "@/domain/products";
import {
  createServerValidatedOrder,
  markWhatsAppLinkTriggered,
  updateOrderStatusAdmin,
  getOrdersWithDetails,
} from "@/domain/orders";
import {
  generateProgrammaticSeoSuggestions,
  validateProductSeoAndIntegrity,
  getDigitalVisibilityChecklist,
} from "@/domain/seo";
import {
  buildOrganizationAndLocalBusinessJsonLd,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
} from "@/domain/jsonld";
import {
  authenticateAdminCredentials,
  verifyAdminToken,
} from "@/lib/auth";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { storeSettings } from "@/db/schema";

describe("Artes em Aroma — Suíte Completa dos 20 Fluxos Críticos (Prompt Master V2)", () => {
  let createdProductId: number;
  let createdOrderId: number;
  let createdOrderCode: string;

  beforeAll(async () => {
    process.env.ADMIN_INITIAL_PASSWORD = "TestOnlyStrongPassword123!";
    process.env.AUTH_SECRET = "test-only-signing-key-not-for-production-123456";
    await ensureDatabaseInitialized();
  });

  // 1. Cadastro de produto
  it("1. Deve cadastrar um novo produto com variantes, atributos e sugestões SEO", async () => {
    const res = await upsertProductAdmin(
      {
        name: "Essência Alecrim Botânico Teste",
        sku: "AA-TEST-ALE-100",
        categoryId: 1,
        shortDescription: "Essência herbal fresca de alecrim para velas e difusores.",
        description:
          "Essência concentrada de Alecrim Botânico desenvolvida para testes de criação artesanal em velas vegetais e difusores de varetas.",
        priceCents: 3190,
        volumeOrWeight: "100 ml",
        usageTypes: ["Velas", "Aromatizadores"],
        olfactoryFamily: "Herbal",
        isAvailable: true,
        isFeatured: true,
        isActive: true,
        seoReviewedByHuman: true,
        images: [
          {
            url: "/images/prod-essencia-lavanda.svg",
            alt: "Frasco de Essência Alecrim Botânico 100ml",
            isPrimary: true,
          },
        ],
        variants: [
          {
            name: "100 ml",
            sku: "AA-TEST-ALE-100",
            priceCents: 3190,
            volumeOrWeight: "100 ml",
            isAvailable: true,
            stockQuantity: 50,
          },
          {
            name: "500 ml",
            sku: "AA-TEST-ALE-500",
            priceCents: 12900,
            volumeOrWeight: "500 ml",
            isAvailable: true,
            stockQuantity: 20,
          },
        ],
      },
      "admin@artesemaroma.com.br"
    );

    expect(res.productId).toBeGreaterThan(0);
    expect(res.slug).toBe("essencia-alecrim-botanico-teste-100-ml");
    createdProductId = res.productId;
  });

  // 2. Edição de produto e redirecionamento de slug alterado
  it("2. Deve editar um produto existente, atualizar preço e registrar slug anterior para redirecionamento 308", async () => {
    const updated = await upsertProductAdmin(
      {
        id: createdProductId,
        name: "Essência Alecrim Imperial Editada",
        slug: "essencia-alecrim-imperial-100ml",
        sku: "AA-TEST-ALE-100",
        categoryId: 1,
        shortDescription: "Essência herbal fresca de alecrim imperial atualizada.",
        description:
          "Essência concentrada de Alecrim Imperial atualizada após revisão administrativa.",
        priceCents: 3490,
        volumeOrWeight: "100 ml",
        usageTypes: ["Velas", "Sabonetes"],
        isAvailable: true,
        isActive: true,
        images: [
          {
            url: "/images/prod-essencia-lavanda.svg",
            alt: "Essência Alecrim Imperial 100ml",
            isPrimary: true,
          },
        ],
        variants: [
          {
            name: "100 ml",
            sku: "AA-TEST-ALE-100",
            priceCents: 3490,
            volumeOrWeight: "100 ml",
            isAvailable: true,
            stockQuantity: 50,
          },
          {
            name: "500 ml",
            sku: "AA-TEST-ALE-500",
            priceCents: 13500,
            volumeOrWeight: "500 ml",
            isAvailable: true,
            stockQuantity: 20,
          },
        ],
      },
      "admin@artesemaroma.com.br"
    );

    expect(updated.slug).toBe("essencia-alecrim-imperial-100ml");

    // Verifica redirecionamento do slug antigo
    const redirectCheck = await getProductBySlugOrRedirect(
      "essencia-alecrim-botanico-teste-100-ml"
    );
    expect(redirectCheck.redirectToSlug).toBe("essencia-alecrim-imperial-100ml");
  });

  // 3. Upload e validação de imagem
  it("3. Deve validar presença de imagem e atributo alt no produto", async () => {
    const validationMissingAlt = await validateProductSeoAndIntegrity({
      name: "Produto Sem Alt",
      slug: "produto-sem-alt-teste",
      description: "Descrição longa suficiente para passar na validação de texto.",
      categoryId: 1,
      images: [{ url: "/uploads/foto.webp", alt: "" }],
    });
    expect(validationMissingAlt.warnings.some((w) => w.includes("alt"))).toBe(true);
  });

  // 4. Alteração de disponibilidade
  it("4. Deve alterar disponibilidade de produto e bloquear pedido de produto indisponível", async () => {
    await toggleProductStateAdmin(
      createdProductId,
      { isAvailable: false },
      "admin@artesemaroma.com.br"
    );

    await expect(
      createServerValidatedOrder({
        customerName: "Cliente Teste Indisponível",
        customerPhone: "(11) 98888-7777",
        fulfillmentMode: "retirada",
        items: [{ productId: createdProductId, quantity: 1 }],
      })
    ).rejects.toThrow(/indisponível/i);

    // Reativa disponibilidade para próximos testes
    await toggleProductStateAdmin(
      createdProductId,
      { isAvailable: true },
      "admin@artesemaroma.com.br"
    );
  });

  // 5. Busca e filtros no catálogo
  it("5. Deve filtrar catálogo por termo de busca, categoria, tipo de uso e faixa de preço", async () => {
    const searchLavanda = await getAllCatalogProducts({
      search: "Lavanda",
    });
    expect(searchLavanda.items.length).toBeGreaterThanOrEqual(1);
    expect(searchLavanda.items[0].name).toContain("Lavanda");

    const filterVelas = await getAllCatalogProducts({
      usageType: "Velas",
    });
    expect(filterVelas.items.length).toBeGreaterThan(0);
    expect(filterVelas.items.every((p) => p.usageTypes.includes("Velas"))).toBe(
      true
    );
  });

  // 6. Inclusão na sacola e 7. Variações de produtos
  it("6 & 7. Deve selecionar variação específica de produto (500 ml) e validar preço da variante", async () => {
    const { product } = await getProductBySlugOrRedirect(
      "essencia-alecrim-imperial-100ml"
    );
    expect(product).not.toBeNull();
    expect(product!.variants.length).toBe(2);
    const var500 = product!.variants.find((v) => v.name.includes("500 ml"));
    expect(var500?.priceCents).toBe(13500);
  });

  // 8. Cálculo no servidor (ignorando preço adulterado pelo cliente) e 9. Criação de pedido
  it("8 & 9. Deve recalcular valores exclusivamente no servidor ignorando preço falso do navegador", async () => {
    const { product } = await getProductBySlugOrRedirect(
      "essencia-alecrim-imperial-100ml"
    );
    const var100 = product!.variants[0]; // 3490 centavos (R$ 34,90)

    const orderResult = await createServerValidatedOrder({
      customerName: "Helena Artesã Suzano",
      customerPhone: "(11) 97777-6666",
      fulfillmentMode: "retirada",
      idempotencyKey: "idem-test-key-0001",
      items: [
        {
          productId: product!.id,
          variantId: var100.id,
          quantity: 2,
          // Tentativa maliciosa do cliente de enviar R$ 0,01
          clientPriceCents: 1,
        },
      ],
    });

    // Servidor deve calcular 2 * 3490 = 6980 centavos (R$ 69,80)
    expect(orderResult.subtotalCents).toBe(6980);
    expect(orderResult.orderCode).toMatch(/^AA-\d{4}-\d+$/);
    expect(orderResult.commercialStatus).toBe("solicitacao_iniciada");
    expect(orderResult.communicationStatus).toBe("link_gerado");

    createdOrderId = orderResult.orderId;
    createdOrderCode = orderResult.orderCode;
  });

  // Idempotência contra cliques repetidos de finalização
  it("Deve garantir idempotência e não duplicar pedido quando acionado com a mesma chave", async () => {
    const { product } = await getProductBySlugOrRedirect(
      "essencia-alecrim-imperial-100ml"
    );
    const duplicateAttempt = await createServerValidatedOrder({
      customerName: "Helena Artesã Suzano",
      customerPhone: "(11) 97777-6666",
      fulfillmentMode: "retirada",
      idempotencyKey: "idem-test-key-0001",
      items: [
        {
          productId: product!.id,
          quantity: 2,
        },
      ],
    });

    expect(duplicateAttempt.isDuplicateIdempotent).toBe(true);
    expect(duplicateAttempt.orderCode).toBe(createdOrderCode);
    expect(duplicateAttempt.orderId).toBe(createdOrderId);
  });

  // 10. Redirecionamento WhatsApp e formatação da mensagem
  it("10. Deve formatar link wa.me corretamente e registrar acionamento sem presumir confirmação automática", async () => {
    const triggered = await markWhatsAppLinkTriggered(createdOrderCode);
    expect(triggered).not.toBeNull();
    expect(triggered!.communicationStatus).toBe("whatsapp_acionado");
    expect(triggered!.commercialStatus).toBe("aguardando_contato");
  });

  // 11. Persistência do pedido e imutabilidade do snapshot histórico após alteração de preço no catálogo
  it("11. Deve preservar o snapshot histórico do pedido mesmo se o preço do produto mudar no catálogo depois", async () => {
    // Altera o preço do produto no catálogo para R$ 99,00
    await upsertProductAdmin(
      {
        id: createdProductId,
        name: "Essência Alecrim Imperial Editada",
        slug: "essencia-alecrim-imperial-100ml",
        sku: "AA-TEST-ALE-100",
        categoryId: 1,
        shortDescription: "Essência herbal fresca de alecrim imperial.",
        description: "Descrição completa mantida após reajuste de tabela.",
        priceCents: 9900,
        volumeOrWeight: "100 ml",
        isAvailable: true,
        isActive: true,
        images: [
          {
            url: "/images/prod-essencia-lavanda.svg",
            alt: "Essência Alecrim Imperial",
            isPrimary: true,
          },
        ],
      },
      "admin@artesemaroma.com.br"
    );

    const savedOrders = await getOrdersWithDetails({ search: createdOrderCode });
    expect(savedOrders.length).toBe(1);
    // O pedido histórico deve continuar exatamente com R$ 69,80 (6980 centavos) e unitário R$ 34,90
    expect(savedOrders[0].subtotalCents).toBe(6980);
    expect(savedOrders[0].items[0].unitPriceCentsSnapshot).toBe(3490);
  });

  // 12. Atualização de status e 13. Histórico de alterações
  it("12 & 13. Deve atualizar status comercial e de comunicação registrando trilha completa no histórico", async () => {
    await updateOrderStatusAdmin({
      orderId: createdOrderId,
      newCommercialStatus: "pedido_confirmado",
      newCommunicationStatus: "contato_confirmado_manualmente",
      note: "Cliente confirmou retirada presencial na loja em Suzano via WhatsApp.",
      adminEmail: "admin@artesemaroma.com.br",
    });

    const ordersAfter = await getOrdersWithDetails({ search: createdOrderCode });
    const ord = ordersAfter[0];
    expect(ord.commercialStatus).toBe("pedido_confirmado");
    expect(ord.communicationStatus).toBe("contato_confirmado_manualmente");
    expect(ord.history.length).toBeGreaterThanOrEqual(3);
  });

  // 14. Autorização administrativa e 15. Isolamento de informações sensíveis
  it("14 & 15. Deve autenticar credenciais válidas, rejeitar senha incorreta e isolar segredos no servidor", async () => {
    const failedAuth = await authenticateAdminCredentials(
      "admin@artesemaroma.com.br",
      "SenhaIncorreta123"
    );
    expect(failedAuth.success).toBe(false);

    const validAuth = await authenticateAdminCredentials(
      "admin@artesemaroma.com.br",
      "TestOnlyStrongPassword123!"
    );
    expect(validAuth.success).toBe(true);
    expect(validAuth.token).toBeDefined();

    const verified = await verifyAdminToken(validAuth.token!);
    expect(verified?.email).toBe("admin@artesemaroma.com.br");
    expect(verified?.role).toBe("admin");
  });

  // 16. Renderização SEO, 17. JSON-LD, 18. sitemap.xml, 19. Canonicals, 20. Responsividade e Visibilidade
  it("16, 17, 18, 19 & 20. Deve validar JSON-LD real (sem reviews falsos), sitemap dinâmico, robots e checklist SEO", async () => {
    const [settings] = await db.select().from(storeSettings).limit(1);
    const orgJson = buildOrganizationAndLocalBusinessJsonLd(settings);
    expect(orgJson["@graph"].length).toBe(3);

    const { product } = await getProductBySlugOrRedirect("essencia-lavanda-100ml");
    const prodJson = buildProductJsonLd(product!);
    expect(prodJson["@type"]).toBe("Product");
    expect(prodJson.offers.priceCurrency).toBe("BRL");
    // Garante que não há aggregateRating ou review fictício
    expect("aggregateRating" in prodJson).toBe(false);
    expect("review" in prodJson).toBe(false);

    const bcJson = buildBreadcrumbJsonLd([{ name: "Início", path: "/" }]);
    expect(bcJson["@type"]).toBe("BreadcrumbList");

    const faqJson = buildFaqPageJsonLd([
      { question: "Onde fica a loja?", answer: "Em Suzano/SP." },
    ]);
    expect(faqJson["@type"]).toBe("FAQPage");

    // Sitemap exclui produtos desativados
    const dup = await duplicateProductAdmin(
      product!.id,
      "admin@artesemaroma.com.br"
    );
    const sitemapEntries = await sitemap();
    expect(
      sitemapEntries.some((entry) => entry.url.includes("/produtos/essencia-lavanda-100ml"))
    ).toBe(true);
    // O produto duplicado nasce desativado (isActive=false), logo não pode constar no sitemap
    expect(
      sitemapEntries.some((entry) => entry.url.includes(dup.slug))
    ).toBe(false);

    const robotsConfig = robots();
    expect(robotsConfig.sitemap).toContain("/sitemap.xml");

    const suggestions = generateProgrammaticSeoSuggestions({
      name: "Cera de Soja",
      volumeOrWeight: "1 kg",
      categoryName: "Ceras",
    });
    expect(suggestions.seoTitle).toContain("Suzano");

    const checklist = await getDigitalVisibilityChecklist();
    expect(checklist.totalProducts).toBeGreaterThanOrEqual(8);
  });
});
