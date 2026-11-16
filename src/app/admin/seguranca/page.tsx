"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("As senhas novas não coincidem.");
      return;
    }
    if (newPassword.length < 16) {
      setMessage("Use uma senha de pelo menos 16 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Não foi possível alterar a senha.");
        return;
      }
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setMessage("Erro de conexão ao alterar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-creme px-4 py-12 text-marrom">
      <section className="mx-auto max-w-md rounded-2xl border border-dourado/30 bg-brancoQuente p-7 shadow-sm">
        <Link href="/admin" className="text-sm text-oliva underline">Voltar ao painel</Link>
        <h1 className="mt-5 font-serif text-3xl font-bold">Alterar senha de acesso</h1>
        <p className="mt-2 text-sm text-marrom/75">Após a troca, você precisará entrar novamente.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">
            Senha atual
            <input type="password" autoComplete="current-password" required value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dourado/40 bg-white p-3 text-marrom" />
          </label>
          <label className="block text-sm font-semibold">
            Nova senha (mínimo 16 caracteres)
            <input type="password" autoComplete="new-password" required minLength={16}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dourado/40 bg-white p-3 text-marrom" />
          </label>
          <label className="block text-sm font-semibold">
            Confirmar nova senha
            <input type="password" autoComplete="new-password" required minLength={16}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-dourado/40 bg-white p-3 text-marrom" />
          </label>
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
          <button type="submit" disabled={saving}
            className="w-full rounded-lg bg-oliva p-3 font-bold text-white disabled:opacity-60">
            {saving ? "Salvando..." : "Alterar senha"}
          </button>
        </form>
      </section>
    </main>
  );
}
