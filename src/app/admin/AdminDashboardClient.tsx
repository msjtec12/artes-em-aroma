"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductWithRelations } from "@/domain/products";
import { formatCurrency, formatDateTimeBR, sanitizePhone } from "@/lib/utils";
import {
  COMMERCIAL_STATUS_LABELS,
  COMMUNICATION_STATUS_LABELS,
  CommercialStatus,
  CommunicationStatus,
} from "@/domain/order-constants";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Globe,
  LogOut,
  Plus,
  Copy,
  Trash2,
  Edit3,
  MessageCircle,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Kanban,
  List,
  Database,
  Upload,
} from "lucide-react";

interface AdminShellProps {
  adminUser: { name: string; email: string };
  metrics: {
    activeProductsCount: number;
    unavailableProductsCount: number;
    totalRequestsRegistered: number;
    confirmedOrdersCount: number;
    inProgressOrdersCount: number;
    finalizedOrdersCount: number;
    cancelledOrdersCount: number;
    confirmedOrdersValueCents: number;
    finalizedSalesValueCents: number;
    mostRequestedProducts: Array<{
      name: string;
      totalQuantity: number;
      requestsCount: number;
      totalValueCents: number;
    }>;
    funnel: {
      viewItemList: number;
      viewItem: number;
      addToCart: number;
      viewCart: number;
      orderRequestCreated: number;
      whatsappCheckoutClick: number;
      orderConfirmed: number;
      orderFinalized: number;
    };
  };
  products: ProductWithRelations[];
  categories: Array<{ id: number; name: string; slug: string }>;
  orders: Array<{
    id: number;
    orderCode: string;
    customerName: string;
    customerPhone: string;
    fulfillmentMode: string;
    customerNotes: string | null;
    subtotalCents: number;
    totalItemsCount: number;
    commercialStatus: string;
    communicationStatus: string;
    cancelReason: string | null;
    createdAt: Date | string;
    items: Array<{
      id: number;
      productNameSnapshot: string;
      variantNameSnapshot: string;
      skuSnapshot: string;
      unitPriceCentsSnapshot: number;
      quantity: number;
      subtotalCentsSnapshot: number;
    }>;
    history: Array<{
      id: number;
      newCommercialStatus: string;
      newCommunicationStatus: string | null;
      changedBy: string;
      note: string | null;
      createdAt: Date | string;
    }>;
    notes: Array<{
      id: number;
      author: string;
      content: string;
      createdAt: Date | string;
    }>;
  }>;
  visibilityChecklist: {
    totalProducts: number;
    completeSeoCount: number;
    withoutDescriptionCount: number;
    withoutImageCount: number;
    withoutAltCount: number;
    invalidCanonicalCount: number;
    unpublishedCount: number;
    deactivatedCount: number;
  };
  storeSettings: {
    storeName: string;
    tagline: string;
    publicPhone: string;
    whatsappNumber: string;
    whatsappEnabled: boolean;
    isDataConfirmedForPublication: boolean;
    addressStreet: string;
    addressNeighborhood: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    googleMapsUrl: string;
    instagramUrl: string;
    openingHours: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryNotice: string;
    paymentMethodsInfo: string;
    gscConnected: boolean;
    ga4Connected: boolean;
  };
  siteContents: Array<{
    sectionKey: string;
    title: string;
    subtitle: string | null;
    body: string | null;
    ctaPrimaryText: string | null;
    ctaPrimaryHref: string | null;
  }>;
  faqs: Array<{
    id: number;
    question: string;
    answer: string;
    category: string;
  }>;
}

export function AdminDashboardClient({
  adminUser,
  metrics,
  products: initialProducts,
  categories,
  orders: initialOrders,
  visibilityChecklist,
  storeSettings: initialSettings,
  siteContents,
  faqs,
}: AdminShellProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "products" | "orders" | "content" | "visibility"
  >("dashboard");

  const [orderViewMode, setOrderViewMode] = useState<"table" | "kanban">("table");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("todos");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [newOrderNote, setNewOrderNote] = useState("");
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Estado de formulário de Produto (Criar / Editar)
  const [editingProduct, setEditingProduct] = useState<Partial<ProductWithRelations> | null>(
    null
  );
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState<number>(
    categories[0]?.id ?? 1
  );
  const [prodPriceReais, setProdPriceReais] = useState("29.90");
  const [prodVolume, setProdVolume] = useState("100 ml");
  const [prodShortDesc, setProdShortDesc] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodFamily, setProdFamily] = useState("");
  const [prodUsageTypes, setProdUsageTypes] = useState<string[]>(["Velas", "Aromatizadores"]);
  const [prodApplications, setProdApplications] = useState("");
  const [prodCare, setProdCare] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("/images/prod-essencia-lavanda.svg");
  const [prodImageAlt, setProdImageAlt] = useState("");
  const [prodSeoTitle, setProdSeoTitle] = useState("");
  const [prodSeoDesc, setProdSeoDesc] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodActive, setProdActive] = useState(true);
  const [prodSeoReviewed, setProdSeoReviewed] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Estado de Configurações da Loja
  const [settingsForm, setSettingsForm] = useState(initialSettings);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  const [newFaqCategory, setNewFaqCategory] = useState("Geral");

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  const openProductEditor = (prod?: ProductWithRelations) => {
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdSlug(prod.slug);
      setProdSku(prod.sku);
      setProdCategoryId(prod.categoryId);
      setProdPriceReais((prod.priceCents / 100).toFixed(2));
      setProdVolume(prod.volumeOrWeight);
      setProdShortDesc(prod.shortDescription);
      setProdDesc(prod.description);
      setProdFamily(prod.olfactoryFamily || "");
      setProdUsageTypes(prod.usageTypes);
      setProdApplications(prod.recommendedApplications || "");
      setProdCare(prod.careInstructions || "");
      setProdImageUrl(prod.images[0]?.url || "/images/prod-essencia-lavanda.svg");
      setProdImageAlt(prod.images[0]?.alt || prod.name);
      setProdSeoTitle(prod.seoTitle || "");
      setProdSeoDesc(prod.seoDescription || "");
      setProdAvailable(prod.isAvailable);
      setProdFeatured(prod.isFeatured);
      setProdActive(prod.isActive);
      setProdSeoReviewed(prod.seoReviewedByHuman);
    } else {
      setEditingProduct({});
      setProdName("");
      setProdSlug("");
      setProdSku(`AA-INS-${Math.floor(100 + Math.random() * 900)}`);
      setProdCategoryId(categories[0]?.id ?? 1);
      setProdPriceReais("28.90");
      setProdVolume("100 ml");
      setProdShortDesc("");
      setProdDesc("");
      setProdFamily("Floral");
      setProdUsageTypes(["Velas", "Sabonetes"]);
      setProdApplications("");
      setProdCare("");
      setProdImageUrl("/images/prod-essencia-lavanda.svg");
      setProdImageAlt("");
      setProdSeoTitle("");
      setProdSeoDesc("");
      setProdAvailable(true);
      setProdFeatured(false);
      setProdActive(true);
      setProdSeoReviewed(true);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      setProdImageUrl(data.url);
      if (!prodImageAlt) {
        setProdImageAlt(`${prodName || "Produto"} - Loja Artes em Aroma Suzano`);
      }
      showToast("Imagem enviada e validada com sucesso!");
    } else {
      showToast(data.error || "Erro ao enviar imagem.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = Math.round(Number(prodPriceReais.replace(",", ".")) * 100);
    const payload = {
      id: editingProduct?.id,
      name: prodName,
      slug: prodSlug || undefined,
      sku: prodSku,
      categoryId: Number(prodCategoryId),
      priceCents,
      volumeOrWeight: prodVolume,
      shortDescription: prodShortDesc,
      description: prodDesc,
      olfactoryFamily: prodFamily || null,
      usageTypes: prodUsageTypes,
      recommendedApplications: prodApplications || null,
      careInstructions: prodCare || null,
      isAvailable: prodAvailable,
      isFeatured: prodFeatured,
      isActive: prodActive,
      seoTitle: prodSeoTitle || null,
      seoDescription: prodSeoDesc || null,
      seoReviewedByHuman: prodSeoReviewed,
      images: [
        {
          url: prodImageUrl,
          alt: prodImageAlt || `${prodName} - ${prodVolume}`,
          isPrimary: true,
        },
      ],
    };

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Falha ao salvar produto.");
      return;
    }
    showToast("Produto salvo e catálogo revalidado!");
    setEditingProduct(null);
    router.refresh();
  };

  const handleDuplicateProduct = async (productId: number) => {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", productId }),
    });
    if (res.ok) {
      showToast("Produto duplicado (criado como rascunho desativado para revisão)!");
      router.refresh();
    }
  };

  const handleToggleProductState = async (
    productId: number,
    patch: { isAvailable?: boolean; isActive?: boolean; isFeatured?: boolean }
  ) => {
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...patch }),
    });
    if (res.ok) {
      showToast("Disponibilidade/estado atualizado!");
      router.refresh();
    }
  };

  const handleSoftDeleteProduct = async (productId: number) => {
    const res = await fetch(`/api/admin/products?id=${productId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast("Produto excluído logicamente do catálogo.");
      router.refresh();
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: number,
    commercialStatus?: CommercialStatus,
    communicationStatus?: CommunicationStatus,
    cancelReason?: string
  ) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        commercialStatus,
        communicationStatus,
        cancelReason,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Erro ao atualizar status do pedido.");
      return;
    }
    showToast("Status do pedido atualizado no banco!");
    setCancelReasonInput("");
    router.refresh();
  };

  const handleAddOrderNote = async (orderId: number) => {
    if (!newOrderNote.trim()) return;
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_note",
        orderId,
        content: newOrderNote,
      }),
    });
    if (res.ok) {
      setNewOrderNote("");
      showToast("Observação interna registrada!");
      router.refresh();
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "store_settings",
        ...settingsForm,
      }),
    });
    if (res.ok) {
      showToast("Configurações da loja atualizadas!");
      router.refresh();
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "faq_create",
        question: newFaqQuestion,
        answer: newFaqAnswer,
        category: newFaqCategory,
      }),
    });
    if (res.ok) {
      setNewFaqQuestion("");
      setNewFaqAnswer("");
      showToast("Nova pergunta adicionada ao FAQ!");
      router.refresh();
    }
  };

  const handleTriggerBackup = async () => {
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "backup" }),
    });
    const data = await res.json();
    if (res.ok && data.backup?.payload) {
      const blob = new Blob([JSON.stringify(data.backup.payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = data.backup.filename || "backup-artes-em-aroma.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast(`Backup baixado com sucesso (${data.backup?.timestamp})!`);
    } else {
      showToast(data.error || "Não foi possível baixar o backup.");
    }
  };

  const filteredOrders = initialOrders.filter((o) => {
    if (orderStatusFilter !== "todos" && o.commercialStatus !== orderStatusFilter) {
      return false;
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchCode = o.orderCode.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const selectedOrder = initialOrders.find((o) => o.id === selectedOrderId);

  const kanbanColumns: Array<{
    title: string;
    statuses: CommercialStatus[];
  }> = [
    {
      title: "Novos",
      statuses: ["solicitacao_iniciada", "aguardando_contato"],
    },
    {
      title: "Atendimento",
      statuses: ["em_atendimento"],
    },
    {
      title: "Confirmados",
      statuses: ["pedido_confirmado"],
    },
    {
      title: "Preparação / Retirada",
      statuses: ["em_preparacao", "pronto_retirada_envio"],
    },
    {
      title: "Finalizados",
      statuses: ["finalizado"],
    },
  ];

  return (
    <div className="min-h-screen bg-creme/50 text-marrom">
      {/* Topbar Admin */}
      <header className="sticky top-0 z-30 border-b border-dourado/30 bg-brancoQuente px-4 py-3.5 shadow-xs sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-artes-em-aroma.jpg"
              alt="Artes em Aroma"
              className="h-11 w-11 rounded-full border border-dourado/40 object-cover"
            />
            <div>
              <span className="block font-serif text-lg leading-none font-bold text-marrom">
                Artes em Aroma
              </span>
              <span className="text-[11px] font-semibold text-oliva">
                Gestão Comercial &amp; SEO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden text-marrom/75 sm:inline">
              Logado como: <strong>{adminUser.name}</strong>
            </span>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-xl border border-dourado/40 px-3 py-2 font-medium text-marrom hover:bg-creme"
            >
              Ver Vitrine Pública
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-xl bg-marrom px-3 py-2 font-medium text-brancoQuente hover:bg-oliva"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {feedbackMsg && (
        <div className="fixed right-6 bottom-6 z-50 rounded-2xl border border-oliva bg-marrom px-5 py-3.5 text-xs font-semibold text-brancoQuente shadow-xl">
          {feedbackMsg}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navegação de Módulos */}
        <div className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-dourado/30 bg-brancoQuente p-2">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "dashboard"
                ? "bg-oliva text-brancoQuente"
                : "text-marrom hover:bg-creme"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard &amp; Funil
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "orders"
                ? "bg-oliva text-brancoQuente"
                : "text-marrom hover:bg-creme"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Pedidos WhatsApp ({initialOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "products"
                ? "bg-oliva text-brancoQuente"
                : "text-marrom hover:bg-creme"
            }`}
          >
            <Package className="h-4 w-4" />
            Gestão de Produtos ({initialProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "content"
                ? "bg-oliva text-brancoQuente"
                : "text-marrom hover:bg-creme"
            }`}
          >
            <FileText className="h-4 w-4" />
            Conteúdo, Loja &amp; Backups
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("visibility")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "visibility"
                ? "bg-oliva text-brancoQuente"
                : "text-marrom hover:bg-creme"
            }`}
          >
            <Globe className="h-4 w-4" />
            Visibilidade Digital (SEO / Local)
          </button>
        </div>

        {/* ABA 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-amber-700/30 bg-amber-50/80 p-4 text-xs text-marrom">
              <strong>Regra Comercial Ativa:</strong> Solicitações iniciadas na sacola não são contabilizadas como vendas realizadas. Somente pedidos confirmados e finalizados entram nos indicadores financeiros de receita.
            </div>

            {/* Cards Principais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
                <span className="text-xs text-marrom/70">Produtos Ativos</span>
                <strong className="mt-1 block font-serif text-3xl text-marrom">
                  {metrics.activeProductsCount}
                </strong>
                <span className="text-[11px] text-marrom/60">
                  Indisponíveis/Inativos: {metrics.unavailableProductsCount}
                </span>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
                <span className="text-xs text-marrom/70">Solicitações Registradas</span>
                <strong className="mt-1 block font-serif text-3xl text-marrom">
                  {metrics.totalRequestsRegistered}
                </strong>
                <span className="text-[11px] text-marrom/60">
                  Em andamento: {metrics.inProgressOrdersCount}
                </span>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
                <span className="text-xs text-marrom/70">Pedidos Confirmados</span>
                <strong className="mt-1 block font-serif text-3xl text-oliva">
                  {metrics.confirmedOrdersCount}
                </strong>
                <span className="text-[11px] font-semibold text-oliva">
                  {formatCurrency(metrics.confirmedOrdersValueCents)}
                </span>
              </div>

              <div className="rounded-2xl border border-oliva/40 bg-creme p-5">
                <span className="text-xs font-semibold text-oliva">
                  Vendas Finalizadas
                </span>
                <strong className="mt-1 block font-serif text-3xl text-marrom">
                  {metrics.finalizedOrdersCount}
                </strong>
                <span className="text-xs font-bold text-oliva">
                  {formatCurrency(metrics.finalizedSalesValueCents)}
                </span>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
                <span className="text-xs text-marrom/70">Pedidos Cancelados</span>
                <strong className="mt-1 block font-serif text-3xl text-marrom">
                  {metrics.cancelledOrdersCount}
                </strong>
                <span className="text-[11px] text-marrom/60">
                  Histórico preservado
                </span>
              </div>
            </div>

            {/* Funil de Conversão & Produtos mais solicitados */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-6 lg:col-span-6">
                <h2 className="font-serif text-2xl font-semibold text-marrom">
                  Funil de Conversão (Interesse → Solicitação → Venda)
                </h2>
                <p className="mt-1 text-xs text-marrom/70">
                  Eventos técnicos instrumentados sem envio de dados pessoais ao Analytics.
                </p>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-creme/60 px-4 py-2.5">
                    <span>1. Produtos visualizados (view_item)</span>
                    <strong>{metrics.funnel.viewItem}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-creme/60 px-4 py-2.5">
                    <span>2. Adições à sacola (add_to_cart)</span>
                    <strong>{metrics.funnel.addToCart}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-creme/60 px-4 py-2.5">
                    <span>3. Aberturas de sacola (view_cart)</span>
                    <strong>{metrics.funnel.viewCart}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-2.5 font-medium">
                    <span>4. Solicitações registradas (order_request_created)</span>
                    <strong>{metrics.funnel.orderRequestCreated}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-creme px-4 py-2.5">
                    <span>5. Cliques de abertura no WhatsApp (whatsapp_checkout_click)</span>
                    <strong>{metrics.funnel.whatsappCheckoutClick}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-oliva/15 px-4 py-2.5 font-semibold text-oliva">
                    <span>6. Pedidos confirmados pela loja (order_confirmed)</span>
                    <strong>{metrics.funnel.orderConfirmed}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-oliva px-4 py-2.5 font-semibold text-brancoQuente">
                    <span>7. Vendas concluídas (order_finalized)</span>
                    <strong>{metrics.funnel.orderFinalized}</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dourado/30 bg-brancoQuente p-6 lg:col-span-6">
                <h2 className="font-serif text-2xl font-semibold text-marrom">
                  Produtos Mais Solicitados
                </h2>
                {metrics.mostRequestedProducts.length === 0 ? (
                  <p className="mt-6 text-xs text-marrom/70">
                    Ainda não há itens registrados nas solicitações de pedidos.
                  </p>
                ) : (
                  <ul className="mt-5 divide-y divide-dourado/20 text-xs">
                    {metrics.mostRequestedProducts.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <strong className="text-sm text-marrom">
                            {item.name}
                          </strong>
                          <span className="block text-marrom/65">
                            Presente em {item.requestsCount} pedido(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-oliva">
                            {item.totalQuantity} un.
                          </span>
                          <span className="text-marrom/75">
                            {formatCurrency(item.totalValueCents)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: CONTROLE DE PEDIDOS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por código (#AA-...), cliente ou telefone..."
                  className="w-72 rounded-xl border border-dourado/40 bg-creme/40 px-3.5 py-2 text-xs text-marrom"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs text-marrom"
                >
                  <option value="todos">Todos os status comerciais</option>
                  {Object.entries(COMMERCIAL_STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrderViewMode("table")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                    orderViewMode === "table"
                      ? "bg-oliva text-brancoQuente"
                      : "border border-dourado/40 text-marrom"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  Tabela Acessível
                </button>
                <button
                  type="button"
                  onClick={() => setOrderViewMode("kanban")}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                    orderViewMode === "kanban"
                      ? "bg-oliva text-brancoQuente"
                      : "border border-dourado/40 text-marrom"
                  }`}
                >
                  <Kanban className="h-3.5 w-3.5" />
                  Kanban
                </button>
                <a
                  href="/api/admin/orders?format=csv"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-oliva bg-creme px-3.5 py-2 text-xs font-semibold text-oliva hover:bg-oliva hover:text-brancoQuente"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </a>
              </div>
            </div>

            {orderViewMode === "table" ? (
              <div className="overflow-x-auto rounded-2xl border border-dourado/30 bg-brancoQuente">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-dourado/25 bg-creme text-[11px] font-semibold text-marrom/80 uppercase">
                    <tr>
                      <th className="px-4 py-3.5">Pedido / Data</th>
                      <th className="px-4 py-3.5">Cliente &amp; Contato</th>
                      <th className="px-4 py-3.5">Modalidade</th>
                      <th className="px-4 py-3.5">Itens / Subtotal</th>
                      <th className="px-4 py-3.5">Status Comercial</th>
                      <th className="px-4 py-3.5">Status Comunicação</th>
                      <th className="px-4 py-3.5">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dourado/20">
                    {filteredOrders.map((order) => {
                      const waDirect = `https://wa.me/55${sanitizePhone(
                        order.customerPhone
                      )}?text=${encodeURIComponent(
                        `Olá ${order.customerName}, tudo bem? Aqui é da Loja Artes em Aroma em Suzano sobre o seu pedido #${order.orderCode}.`
                      )}`;

                      return (
                        <tr key={order.id} className="hover:bg-creme/30">
                          <td className="px-4 py-3.5">
                            <strong className="font-mono text-xs text-marrom">
                              #{order.orderCode}
                            </strong>
                            <span className="block text-[11px] text-marrom/65">
                              {formatDateTimeBR(order.createdAt)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <strong className="text-marrom">
                              {order.customerName}
                            </strong>
                            <span className="block text-marrom/75">
                              {order.customerPhone}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {order.fulfillmentMode === "retirada"
                              ? "Retirada em Suzano"
                              : "Consultar Entrega"}
                          </td>
                          <td className="px-4 py-3.5">
                            <strong>{formatCurrency(order.subtotalCents)}</strong>
                            <span className="block text-[11px] text-marrom/65">
                              {order.totalItemsCount} item(ns)
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={order.commercialStatus}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  e.target.value as CommercialStatus
                                )
                              }
                              className="rounded-lg border border-dourado/40 bg-creme px-2.5 py-1.5 text-xs font-semibold text-marrom"
                            >
                              {Object.entries(COMMERCIAL_STATUS_LABELS).map(
                                ([val, label]) => (
                                  <option key={val} value={val}>
                                    {label}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                          <td className="px-4 py-3.5">
                            <select
                              value={order.communicationStatus}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  undefined,
                                  e.target.value as CommunicationStatus
                                )
                              }
                              className="rounded-lg border border-dourado/40 bg-brancoQuente px-2.5 py-1.5 text-[11px] text-marrom"
                            >
                              {Object.entries(COMMUNICATION_STATUS_LABELS).map(
                                ([val, label]) => (
                                  <option key={val} value={val}>
                                    {label}
                                  </option>
                                )
                              )}
                            </select>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <a
                                href={waDirect}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-oliva px-2.5 py-1.5 text-[11px] font-semibold text-brancoQuente hover:bg-marrom"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                WhatsApp
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedOrderId(
                                    selectedOrderId === order.id ? null : order.id
                                  )
                                }
                                className="rounded-lg border border-dourado/40 px-2.5 py-1.5 text-[11px] font-medium text-marrom hover:bg-creme"
                              >
                                Detalhes / Histórico
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Visualização Kanban Opcional */
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {kanbanColumns.map((col) => {
                  const colOrders = filteredOrders.filter((o) =>
                    col.statuses.includes(o.commercialStatus as CommercialStatus)
                  );
                  return (
                    <div
                      key={col.title}
                      className="rounded-2xl border border-dourado/30 bg-creme/70 p-3.5"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-serif text-base font-semibold text-marrom">
                          {col.title}
                        </h3>
                        <span className="rounded-full bg-brancoQuente px-2 py-0.5 text-xs font-bold">
                          {colOrders.length}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {colOrders.map((o) => (
                          <div
                            key={o.id}
                            className="rounded-xl border border-dourado/25 bg-brancoQuente p-3 text-xs shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="font-mono text-[11px]">
                                #{o.orderCode}
                              </strong>
                              <span className="font-bold text-oliva">
                                {formatCurrency(o.subtotalCents)}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-marrom">
                              {o.customerName}
                            </p>
                            <p className="text-[11px] text-marrom/70">
                              {o.totalItemsCount} item(ns)
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(o.id)}
                              className="mt-2 w-full rounded-lg bg-creme py-1 text-[11px] font-medium text-marrom hover:bg-dourado/20"
                            >
                              Abrir pedido
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Painel de Detalhes, Snapshot de Itens, Observações e Histórico do Pedido */}
            {selectedOrder && (
              <div className="rounded-3xl border border-oliva/40 bg-brancoQuente p-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dourado/25 pb-4">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-marrom">
                      Detalhes do Pedido #{selectedOrder.orderCode}
                    </h3>
                    <p className="text-xs text-marrom/75">
                      Cliente: <strong>{selectedOrder.customerName}</strong> • Contato:{" "}
                      <strong>{selectedOrder.customerPhone}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="rounded-xl border border-dourado/40 px-3 py-1.5 text-xs font-medium"
                  >
                    Fechar detalhes
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Coluna 1: Snapshot Imutável dos Itens */}
                  <div className="rounded-2xl bg-creme/60 p-4">
                    <h4 className="font-serif text-lg font-semibold text-marrom">
                      Itens Solicitados (Snapshot Histórico)
                    </h4>
                    <ul className="mt-3 divide-y divide-dourado/20 text-xs">
                      {selectedOrder.items.map((it) => (
                        <li key={it.id} className="py-2.5">
                          <div className="flex justify-between font-semibold">
                            <span>
                              {it.quantity}x {it.productNameSnapshot}
                            </span>
                            <span>{formatCurrency(it.subtotalCentsSnapshot)}</span>
                          </div>
                          <span className="text-[11px] text-marrom/70">
                            Variante: {it.variantNameSnapshot} • SKU: {it.skuSnapshot} (Unit:{" "}
                            {formatCurrency(it.unitPriceCentsSnapshot)})
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex justify-between border-t border-dourado/30 pt-3 text-sm font-bold">
                      <span>Total dos produtos:</span>
                      <span>{formatCurrency(selectedOrder.subtotalCents)}</span>
                    </div>
                  </div>

                  {/* Coluna 2: Observações Internas e Cancelamento com Motivo */}
                  <div className="space-y-4 rounded-2xl bg-creme/60 p-4">
                    <h4 className="font-serif text-lg font-semibold text-marrom">
                      Observações Internas &amp; Ações
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOrderNote}
                        onChange={(e) => setNewOrderNote(e.target.value)}
                        placeholder="Adicionar anotação da loja..."
                        className="flex-1 rounded-xl border border-dourado/40 bg-brancoQuente px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOrderNote(selectedOrder.id)}
                        className="rounded-xl bg-oliva px-3.5 py-2 text-xs font-semibold text-brancoQuente"
                      >
                        Salvar
                      </button>
                    </div>
                    <ul className="space-y-2 text-xs">
                      {selectedOrder.notes.map((n) => (
                        <li
                          key={n.id}
                          className="rounded-lg bg-brancoQuente p-2.5 text-marrom/85"
                        >
                          <strong>{n.author}:</strong> {n.content}
                          <span className="block text-[10px] text-marrom/55">
                            {formatDateTimeBR(n.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-dourado/25 pt-3">
                      <label className="block text-[11px] font-semibold text-red-800">
                        Cancelar pedido com motivo registrado:
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="text"
                          value={cancelReasonInput}
                          onChange={(e) => setCancelReasonInput(e.target.value)}
                          placeholder="Motivo do cancelamento..."
                          className="flex-1 rounded-xl border border-red-200 bg-brancoQuente px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateOrderStatus(
                              selectedOrder.id,
                              "cancelado",
                              undefined,
                              cancelReasonInput || "Cancelado pela administração"
                            )
                          }
                          className="rounded-xl bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 3: Histórico de Alterações */}
                  <div className="rounded-2xl bg-creme/60 p-4">
                    <h4 className="font-serif text-lg font-semibold text-marrom">
                      Histórico de Alterações
                    </h4>
                    <ul className="mt-3 space-y-2.5 text-xs">
                      {selectedOrder.history.map((h) => (
                        <li
                          key={h.id}
                          className="rounded-xl bg-brancoQuente p-3 text-marrom/85"
                        >
                          <div className="font-semibold text-oliva">
                            Status: {h.newCommercialStatus}
                          </div>
                          {h.note && <p className="mt-0.5 text-[11px]">{h.note}</p>}
                          <span className="mt-1 block text-[10px] text-marrom/55">
                            Por {h.changedBy} em {formatDateTimeBR(h.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 3: GESTÃO DE PRODUTOS (CRUD COMPLETO) */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-dourado/30 bg-brancoQuente p-5">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-marrom">
                  Catálogo de Produtos
                </h2>
                <p className="text-xs text-marrom/75">
                  Crie, edite, duplique, altere disponibilidade ou desative produtos com geração automática de sugestões de SEO.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openProductEditor()}
                className="inline-flex items-center gap-2 rounded-xl bg-oliva px-5 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
              >
                <Plus className="h-4 w-4" />
                Novo Produto
              </button>
            </div>

            {editingProduct && (
              <form
                onSubmit={handleSaveProduct}
                className="space-y-5 rounded-3xl border border-oliva/50 bg-brancoQuente p-6 shadow-md"
              >
                <div className="flex items-center justify-between border-b border-dourado/25 pb-3">
                  <h3 className="font-serif text-2xl font-semibold text-marrom">
                    {editingProduct.id
                      ? `Editando: ${editingProduct.name}`
                      : "Cadastrar Novo Produto no Catálogo"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-xs text-marrom/70 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold">
                      Nome Comercial *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Slug URL (deixe vazio p/ sugerir)
                    </label>
                    <input
                      type="text"
                      value={prodSlug}
                      onChange={(e) => setProdSlug(e.target.value)}
                      placeholder="ex: essencia-lavanda-100ml"
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">SKU *</label>
                    <input
                      type="text"
                      required
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold">
                      Categoria *
                    </label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Preço Base (R$) *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodPriceReais}
                      onChange={(e) => setProdPriceReais(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Volume ou Peso *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodVolume}
                      onChange={(e) => setProdVolume(e.target.value)}
                      placeholder="Ex: 100 ml, 1 kg"
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Família Olfativa / Tipo
                    </label>
                    <input
                      type="text"
                      value={prodFamily}
                      onChange={(e) => setProdFamily(e.target.value)}
                      placeholder="Ex: Floral Herbal"
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold">
                      Descrição Resumida *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={prodShortDesc}
                      onChange={(e) => setProdShortDesc(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Descrição Completa *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold">
                      Aplicações Recomendadas (fornecidas pela loja)
                    </label>
                    <textarea
                      rows={2}
                      value={prodApplications}
                      onChange={(e) => setProdApplications(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Cuidados Pertinentes
                    </label>
                    <textarea
                      rows={2}
                      value={prodCare}
                      onChange={(e) => setProdCare(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Upload de Imagem e Alt */}
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-creme/60 p-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold">
                      URL da Fotografia Principal
                    </label>
                    <input
                      type="text"
                      value={prodImageUrl}
                      onChange={(e) => setProdImageUrl(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Enviar nova imagem do computador
                    </label>
                    <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-oliva bg-brancoQuente px-3 py-2 text-xs font-medium text-oliva hover:bg-creme">
                      <Upload className="h-4 w-4" />
                      Selecionar arquivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Texto Alternativo (Alt SEO) *
                    </label>
                    <input
                      type="text"
                      value={prodImageAlt}
                      onChange={(e) => setProdImageAlt(e.target.value)}
                      placeholder="Descreva a foto do produto..."
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* SEO Programático Controlado */}
                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-dourado/30 bg-creme/40 p-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold">
                      Título SEO (gerado automaticamente se vazio)
                    </label>
                    <input
                      type="text"
                      value={prodSeoTitle}
                      onChange={(e) => setProdSeoTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold">
                      Meta Description SEO
                    </label>
                    <input
                      type="text"
                      value={prodSeoDesc}
                      onChange={(e) => setProdSeoDesc(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-dourado/40 bg-brancoQuente px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-5 text-xs">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodAvailable}
                        onChange={(e) => setProdAvailable(e.target.checked)}
                      />
                      Disponível em estoque
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodFeatured}
                        onChange={(e) => setProdFeatured(e.target.checked)}
                      />
                      Destaque na Home
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={prodActive}
                        onChange={(e) => setProdActive(e.target.checked)}
                      />
                      Publicado no catálogo
                    </label>
                    <label className="inline-flex items-center gap-2 font-semibold text-oliva">
                      <input
                        type="checkbox"
                        checked={prodSeoReviewed}
                        onChange={(e) => setProdSeoReviewed(e.target.checked)}
                      />
                      Revisado por humano
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            )}

            {/* Tabela de Produtos */}
            <div className="overflow-x-auto rounded-2xl border border-dourado/30 bg-brancoQuente">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-dourado/25 bg-creme text-[11px] font-semibold text-marrom/80 uppercase">
                  <tr>
                    <th className="px-4 py-3.5">Produto</th>
                    <th className="px-4 py-3.5">Categoria</th>
                    <th className="px-4 py-3.5">Preço Base</th>
                    <th className="px-4 py-3.5">Disponibilidade</th>
                    <th className="px-4 py-3.5">Publicação</th>
                    <th className="px-4 py-3.5">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dourado/20">
                  {initialProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-creme/30">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.images[0]?.url || "/images/prod-essencia-lavanda.svg"
                            }
                            alt={p.name}
                            className="h-10 w-10 rounded-lg border border-dourado/25 object-cover"
                          />
                          <div>
                            <strong className="text-marrom">{p.name}</strong>
                            <span className="block text-[11px] text-marrom/60">
                              /{p.slug} • SKU: {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{p.categoryName}</td>
                      <td className="px-4 py-3.5 font-semibold">
                        {formatCurrency(p.priceCents)} ({p.volumeOrWeight})
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleProductState(p.id, {
                              isAvailable: !p.isAvailable,
                            })
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            p.isAvailable
                              ? "bg-oliva/15 text-oliva"
                              : "bg-amber-900/15 text-amber-900"
                          }`}
                        >
                          {p.isAvailable ? "Em estoque" : "Indisponível"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleProductState(p.id, {
                              isActive: !p.isActive,
                            })
                          }
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            p.isActive
                              ? "bg-oliva text-brancoQuente"
                              : "bg-marrom/20 text-marrom"
                          }`}
                        >
                          {p.isActive ? "Ativo" : "Desativado"}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openProductEditor(p)}
                            className="rounded-lg border border-dourado/40 p-1.5 text-marrom hover:bg-creme"
                            title="Editar produto"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(p.id)}
                            className="rounded-lg border border-dourado/40 p-1.5 text-marrom hover:bg-creme"
                            title="Duplicar produto"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSoftDeleteProduct(p.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                            title="Excluir logicamente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: GESTÃO DE CONTEÚDO, CONFIGURAÇÕES COMERCIAIS E BACKUPS */}
        {activeTab === "content" && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveStoreSettings}
              className="space-y-5 rounded-3xl border border-dourado/30 bg-brancoQuente p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dourado/25 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-marrom">
                    Configurações Comerciais, WhatsApp e Endereço (Suzano/SP)
                  </h2>
                  <p className="text-xs text-marrom/75">
                    O número do WhatsApp comercial é configurável de forma independente do telefone público de referência.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerBackup}
                  className="inline-flex items-center gap-2 rounded-xl border border-oliva bg-creme px-4 py-2.5 text-xs font-semibold text-oliva hover:bg-oliva hover:text-brancoQuente"
                >
                  <Database className="h-4 w-4" />
                  Gerar Backup Instantâneo JSON
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, storeName: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Telefone Público de Referência
                  </label>
                  <input
                    type="text"
                    value={settingsForm.publicPhone}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        publicPhone: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Número WhatsApp Comercial (DDI+DDD+Número)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        whatsappNumber: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Endereço</label>
                  <input
                    type="text"
                    value={settingsForm.addressStreet}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        addressStreet: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Bairro / CEP</label>
                  <input
                    type="text"
                    value={settingsForm.addressNeighborhood}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        addressNeighborhood: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">
                    Horários de Funcionamento
                  </label>
                  <input
                    type="text"
                    value={settingsForm.openingHours}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        openingHours: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-dourado/20 pt-4">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-oliva">
                  <input
                    type="checkbox"
                    checked={settingsForm.isDataConfirmedForPublication}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        isDataConfirmedForPublication: e.target.checked,
                      })
                    }
                  />
                  Confirmo que o endereço, horários e WhatsApp comercial foram validados para publicação
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-oliva px-6 py-2.5 text-xs font-semibold text-brancoQuente hover:bg-marrom"
                >
                  Salvar Configurações da Loja
                </button>
              </div>
            </form>

            {/* Gestão de FAQs (AEO) */}
            <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6">
              <h2 className="font-serif text-2xl font-semibold text-marrom">
                Perguntas Frequentes Editáveis (AEO)
              </h2>
              <form onSubmit={handleCreateFaq} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  required
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="Nova pergunta..."
                  className="rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs sm:col-span-1"
                />
                <input
                  type="text"
                  required
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  placeholder="Resposta clara e objetiva..."
                  className="rounded-xl border border-dourado/40 bg-creme/40 px-3 py-2 text-xs sm:col-span-2"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-oliva px-4 py-2 text-xs font-semibold text-brancoQuente"
                >
                  Adicionar Pergunta
                </button>
              </form>

              <ul className="mt-5 divide-y divide-dourado/20 text-xs">
                {faqs.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <strong className="text-marrom">[{f.category}] {f.question}</strong>
                      <p className="mt-0.5 text-marrom/75">{f.answer}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ABA 5: VISIBILIDADE DIGITAL (SEO, GEO, AEO, GSC & GA4) */}
        {activeTab === "visibility" && (
          <div className="space-y-8">
            {/* Checklist Técnico de SEO */}
            <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6">
              <h2 className="font-serif text-2xl font-semibold text-marrom">
                Módulo Visibilidade Digital — Checklist Técnico do Catálogo
              </h2>
              <p className="mt-1 text-xs text-marrom/75">
                Diagnóstico automático em tempo real sobre os metadados e integridade dos produtos cadastrados.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">SEO Completo</span>
                  <strong className="font-serif text-2xl text-oliva">
                    {visibilityChecklist.completeSeoCount}/{visibilityChecklist.totalProducts}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Sem Descrição</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.withoutDescriptionCount}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Sem Imagem</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.withoutImageCount}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Sem Alt Text</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.withoutAltCount}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Canonical Inválido</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.invalidCanonicalCount}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Não Publicados</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.unpublishedCount}
                  </strong>
                </div>
                <div className="rounded-2xl bg-creme p-4 text-center">
                  <span className="block text-[11px] text-marrom/70">Desativados</span>
                  <strong className="font-serif text-2xl text-marrom">
                    {visibilityChecklist.deactivatedCount}
                  </strong>
                </div>
              </div>
            </div>

            {/* Integrações Google Search Console & GA4 (Sem métricas simuladas) */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-semibold text-marrom">
                    Google Search Console (GSC)
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/15 px-3 py-1 text-[11px] font-semibold text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Integração não configurada
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-marrom/80">
                  Para exibir cliques orgânicos, impressões, CTR, posição média e termos de busca reais em Suzano, conecte a conta de serviço do Google Search Console nas variáveis de ambiente (<code>GSC_SITE_URL</code> e <code>GSC_SERVICE_ACCOUNT_JSON</code>).
                </p>
                <p className="mt-2 text-[11px] text-marrom/60">
                  Transparência técnica: nenhuma métrica simulada é exibida enquanto a conexão OAuth/Service Account não estiver ativa.
                </p>
              </div>

              <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-semibold text-marrom">
                    Google Analytics 4 (GA4)
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/15 px-3 py-1 text-[11px] font-semibold text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Integração não configurada
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-marrom/80">
                  O funil interno da loja já está ativo e registrando eventos locais. Para sincronizar com o Google Analytics 4 com consentimento LGPD, informe o Measurement ID (<code>G-XXXXXXXXXX</code>) em <code>NEXT_PUBLIC_GA4_ID</code>.
                </p>
              </div>
            </div>

            {/* Checklist Operacional do Perfil da Empresa no Google (Seção 10) */}
            <div className="rounded-3xl border border-dourado/30 bg-brancoQuente p-6">
              <h3 className="font-serif text-2xl font-semibold text-marrom">
                Checklist de Consistência Local — Perfil da Empresa no Google (Suzano/SP)
              </h3>
              <p className="mt-1 text-xs text-marrom/75">
                Padronização NAP (Nome, Endereço e Telefone) entre Site, Perfil do Google e Instagram (@lojartesemaroma).
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                {[
                  "Site oficial vinculado no Perfil da Empresa no Google",
                  "URL do catálogo (/produtos) cadastrada na seção de produtos",
                  "Categorias adequadas (Loja de artigos para artesanato / Loja de essências)",
                  "Descrição comercial alinhada ao posicionamento da marca",
                  "Fotografias reais da fachada, prateleiras e produtos em Suzano",
                  "Produtos principais cadastrados com link direto para /produtos/[slug]",
                  "Postagens relevantes e atualização de horários em feriados",
                  "Coleta de avaliações legítimas de clientes atendidos na loja",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-creme/60 px-4 py-2.5 text-marrom"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-oliva" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
