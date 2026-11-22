import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { db, ensureDatabaseInitialized } from "@/db";
import { storeSettings } from "@/db/schema";
import {
  buildOrganizationAndLocalBusinessJsonLd,
  buildBreadcrumbJsonLd,
} from "@/domain/jsonld";
import {
  MapPin,
  Phone,
  Clock,
  Instagram,
  Navigation,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

const SITE_URL = "https://artesemaroma.konnexy.com.br";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Localização e Contato em Suzano/SP | Loja Artes em Aroma",
  description:
    "Visite a Loja Artes em Aroma na Rua Rui Barbosa, 310, Vila Costa, Suzano/SP (CEP 08675-060). Telefone (11) 91077-1820, Instagram e informações de retirada.",
  alternates: {
    canonical: `${SITE_URL}/contato`,
  },
};

export default async function ContactPage() {
  await ensureDatabaseInitialized();
  const [settings] = await db.select().from(storeSettings).limit(1);

  const orgJsonLd = settings
    ? buildOrganizationAndLocalBusinessJsonLd(settings)
    : null;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Início", path: "/" },
    { name: "Contato e Localização", path: "/contato" },
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      {orgJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Header />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-marrom/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-oliva">
                  Início
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-marrom">
                Localização e Contato
              </li>
            </ol>
          </nav>

          <div className="rounded-3xl border border-dourado/35 bg-creme p-8 sm:p-12">
            <span className="text-xs font-semibold tracking-wider text-oliva uppercase">
              Atendimento em Suzano — São Paulo
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-marrom sm:text-5xl">
              {settings?.storeName || "Loja Artes em Aroma"} — Contato &amp; Visita
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-marrom/80 sm:text-base">
              Confira nosso endereço na Vila Costa em Suzano/SP, horários de atendimento, orientações para visita presencial e retirada de pedidos solicitados pelo site.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Card Endereço e Mapa */}
              <div className="space-y-4 rounded-2xl border border-dourado/30 bg-brancoQuente p-6">
                <div className="flex items-center gap-2.5 font-serif text-2xl font-semibold text-marrom">
                  <MapPin className="h-6 w-6 text-oliva" />
                  <h2>Endereço em Suzano</h2>
                </div>
                <p className="text-sm leading-relaxed text-marrom/85">
                  <strong>{settings?.storeName || "Loja Artes em Aroma"}</strong>
                  <br />
                  {settings?.addressStreet || "Rua Rui Barbosa, 310"}
                  <br />
                  Bairro: {settings?.addressNeighborhood || "Vila Costa"}
                  <br />
                  Cidade: {settings?.addressCity || "Suzano"} /{" "}
                  {settings?.addressState || "SP"}
                  <br />
                  CEP: {settings?.addressZip || "08675-060"}
                </p>

                <div className="pt-2">
                  <a
                    href={
                      settings?.googleMapsUrl ||
                      "https://www.google.com/maps/search/?api=1&query=Rua+Rui+Barbosa+310+Vila+Costa+Suzano+SP+08675-060"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-oliva px-5 py-3 text-xs font-semibold text-brancoQuente transition hover:bg-marrom"
                  >
                    <Navigation className="h-4 w-4" />
                    Abrir rota no Google Maps
                  </a>
                </div>
              </div>

              {/* Card Telefone, Instagram e Horários */}
              <div className="space-y-4 rounded-2xl border border-dourado/30 bg-brancoQuente p-6">
                <div className="flex items-center gap-2.5 font-serif text-2xl font-semibold text-marrom">
                  <Phone className="h-6 w-6 text-oliva" />
                  <h2>Canais e Horários</h2>
                </div>

                <div className="space-y-3 text-sm text-marrom/85">
                  <p>
                    <strong>Telefone público de referência:</strong>{" "}
                    {settings?.publicPhone || "(11) 91077-1820"}
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-oliva" />
                    <span>
                      <strong>Horário de funcionamento:</strong>
                      <br />
                      {"Segunda a sexta: 9h às 18h30 | Sábado: consulte o horário de funcionamento | Domingo: fechado"}
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 shrink-0 text-oliva" />
                    <a
                      href={
                        "https://www.instagram.com/lojaartesemaroma/"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-oliva underline"
                    >
                      instagram.com/lojaartesemaroma
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Orientações de Visita, Retirada e Pagamento */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-brancoQuente p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-marrom">
                  <ShoppingBag className="h-5 w-5 text-oliva" />
                  Retirada de Pedidos
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-marrom/80">
                  {settings?.deliveryNotice ||
                    "Monte sua sacola no site e envie pelo WhatsApp para deixarmos seus itens separados antes da sua visita em Suzano."}
                </p>
              </div>

              <div className="rounded-2xl bg-brancoQuente p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-marrom">
                  <CreditCard className="h-5 w-5 text-oliva" />
                  Formas de Pagamento
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-marrom/80">
                  {settings?.paymentMethodsInfo ||
                    "PIX, Cartão de Crédito/Débito e Dinheiro no atendimento ou retirada."}
                </p>
              </div>

              <div className="rounded-2xl bg-brancoQuente p-5">
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-marrom">
                  <CheckCircle2 className="h-5 w-5 text-oliva" />
                  Orientações de Visita
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-marrom/80">
                  Caso precise de uma quantidade maior de base glicerinada, cera de coco ou essência específica, recomendamos consultar a pronta-entrega antes de se deslocar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
