"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api.js";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      localStorage.setItem("industri-alert-token", data.token);
      localStorage.setItem("industri-alert-user", JSON.stringify(data.usuario));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/imagens/Industrialert.jpg"
          alt="Logo IndustriAlert"
          width={36}
          height={36}
        />
        Industri<b>Alert</b>
      </Link>
      <form className={styles.card} onSubmit={submit}>
        <span className={styles.label}>ACESSO AO SISTEMA</span>
        <h1>Bem-vindo de volta</h1>
        <p>Entre com suas credenciais para acompanhar a operação.</p>
        {error && <div className={styles.error}>{error}</div>}
        <label>
          E-mail
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </label>
        <label>
          Senha
          <input
            required
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />
        </label>
        <button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
        <small>O acesso é criado pelo administrador da plataforma.</small>
      </form>
      <Link className={styles.back} href="/">
        ← Voltar ao portal
      </Link>
    </main>
  );
}
