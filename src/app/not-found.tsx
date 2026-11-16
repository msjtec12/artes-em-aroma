import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sparkles, ArrowRight } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-lg rounded-3xl border border-dourado/30 bg-creme p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-oliva" />
          <h1 className="mt-3 font-serif text-3xl font-semibold text-marrom sm:text-4xl">
            Página ou Produto Não Encontrado
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-marrom/80">
            O endereço acessado pode ter sido removido ou está temporariamente desativado. Explore nosso catálogo atualizado de essências, ceras e bases.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/produtos"
              className="inline-flex items-center gap-1.5 rounded-xl bg-oliva px-6 py-3 text-xs font-semibold text-brancoQuente hover:bg-marrom"
            >
              Ir para o Catálogo de Produtos
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-dourado/40 bg-brancoQuente px-6 py-3 text-xs font-semibold text-marrom hover:bg-creme"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
