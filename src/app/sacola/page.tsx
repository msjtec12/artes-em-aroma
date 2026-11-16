import React from "react";
import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SacolaClientView } from "./SacolaClientView";

export const metadata: Metadata = {
  title: "Minha Sacola de Solicitação | Artes em Aroma",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SacolaPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <SacolaClientView />
      </main>
      <Footer />
    </div>
  );
}
