"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@artesemaroma.com.br");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao entrar.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-creme px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-dourado/35 bg-brancoQuente p-8 shadow-lg">
        <div className="text-center">
          <img
            src="/images/logo-artes-em-aroma.jpg"
            alt="Artes em Aroma"
            className="mx-auto h-20 w-20 rounded-full border border-dourado/40 object-cover shadow-xs"
          />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-marrom">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-xs text-marrom/70">
            Acesso restrito à gestão comercial da Loja Artes em Aroma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-semibold text-marrom"
            >
              E-mail administrativo
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3.5 py-2.5 text-sm text-marrom focus:border-oliva focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-marrom"
            >
              Senha
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="mt-1 w-full rounded-xl border border-dourado/40 bg-creme/40 px-3.5 py-2.5 text-sm text-marrom focus:border-oliva focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-oliva px-5 py-3.5 text-sm font-semibold text-brancoQuente transition hover:bg-marrom disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Verificando sessão..." : "Entrar no Painel"}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <Link href="/admin/recuperar" className="block text-xs font-medium text-oliva hover:underline">Recuperar ou configurar acesso administrativo</Link>
          <Link href="/" className="text-xs font-medium text-oliva hover:underline">
            ← Voltar para a vitrine pública
          </Link>
        </div>
      </div>
    </div>
  );
}
