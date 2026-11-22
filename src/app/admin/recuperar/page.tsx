"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function RecoverAdminPage() {
  const [recoveryToken, setRecoveryToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword || newPassword.length < 16) {
      setMessage("Confirme a nova senha com pelo menos 16 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ recoveryToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível recuperar o acesso.");
      setOk(true);
      setRecoveryToken("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha definida. Remova ADMIN_RECOVERY_TOKEN do ambiente de produção na Vercel antes de usar o painel.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao recuperar acesso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-creme px-4 py-12 text-marrom">
      <section className="mx-auto max-w-md rounded-3xl border border-dourado/30 bg-brancoQuente p-7 shadow-sm">
        <h1 className="font-serif text-3xl font-semibold">Recuperar acesso administrativo</h1>
        <p className="mt-3 text-sm leading-relaxed">Para recuperar o acesso, configure uma chave temporária forte na variável <code>ADMIN_RECOVERY_TOKEN</code> do ambiente Production da Vercel e faça um novo deploy. Após a recuperação, exclua a variável e faça outro deploy.</p>
        {!ok && <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Chave temporária de recuperação
            <input type="password" autoComplete="off" required minLength={32} value={recoveryToken} onChange={e => setRecoveryToken(e.target.value)} className="mt-1 w-full rounded-xl border border-dourado/40 bg-white p-3" />
          </label>
          <label className="block text-sm font-semibold">Nova senha (mínimo 16 caracteres)
            <input type="password" autoComplete="new-password" required minLength={16} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-dourado/40 bg-white p-3" />
          </label>
          <label className="block text-sm font-semibold">Confirme a nova senha
            <input type="password" autoComplete="new-password" required minLength={16} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-dourado/40 bg-white p-3" />
          </label>
          <button disabled={busy} type="submit" className="w-full rounded-xl bg-oliva px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Verificando..." : "Definir nova senha"}</button>
        </form>}
        {message && <p role="status" className="mt-4 text-sm">{message}</p>}
        <Link href="/admin/login" className="mt-6 inline-block text-sm text-oliva underline">Voltar ao login</Link>
      </section>
    </main>
  );
}
