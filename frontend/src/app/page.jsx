"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch, isAuthenticated } from "../lib/api.js";
import styles from "./page.module.css";

const shortcuts = [
  ["▦", "Dashboard", "/dashboard"],
  ["⚑", "Ocorrências", "/dashboard/ocorrencias"],
  ["▤", "Setores & Máquinas", "/dashboard/setores-maquinas"],
  ["♙", "Responsáveis", "/dashboard/responsaveis"],
  ["⌁", "Indicadores & SLA", "/dashboard/indicadores"],
  ["▧", "Relatórios", "/dashboard/relatorios"],
];
const features = [
  [
    "▦",
    "Cadastros Estruturados",
    "Cadastre setores, máquinas, tipos de ocorrência e equipes responsáveis de forma simples e integrada.",
    "/dashboard/setores-maquinas",
  ],
  [
    "⚑",
    "Abertura com Prioridade",
    "Abra ocorrências definindo níveis de criticidade e anexe fotos e evidências da falha no ato.",
    "/dashboard/nova-ocorrencia",
  ],
  [
    "⇢",
    "Atribuição & Escalonamento",
    "Direcione os chamados aos técnicos corretos com regras de escalonamento por atraso.",
    "/dashboard/ocorrencias",
  ],
  [
    "◷",
    "Acompanhamento de Prazo",
    "Controle o SLA e os status de atendimento em tempo real com alertas visuais e contadores.",
    "/dashboard/indicadores",
  ],
  [
    "⌕",
    "Causa Raiz & Solução",
    "Registre as causas identificadas e as soluções aplicadas para documentar o histórico.",
    "/dashboard/ocorrencias",
  ],
  [
    "▤",
    "Dashboards & Relatórios",
    "Consulte métricas de recorrência, criticidade e tempo médio de atendimento.",
    "/dashboard/relatorios",
  ],
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function search(event) {
    event.preventDefault();
    setRows(null);
    setError("");
    if (!isAuthenticated()) {
      setError("Faça login para pesquisar as ocorrências da sua equipe.");
      return;
    }
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("busca", query.trim());
      if (sector.trim()) params.set("setor", sector.trim());
      setRows(await apiFetch(`/ocorrencias?${params}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>⚙</span>
          <span>
            Industri<b>Alert</b>
            <small>GESTÃO DE OCORRÊNCIAS</small>
          </span>
        </Link>
        <nav>
          <Link href="/login">Login / Cadastro</Link>
          <Link className={styles.topButton} href="/dashboard/nova-ocorrencia">
            ＋ Nova Ocorrência
          </Link>
        </nav>
      </header>
      <div className={styles.container}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>
            <i /> CENTRAL PARA REGISTRO E GESTÃO DE OCORRÊNCIAS INDUSTRIAIS
          </span>
          <h1>
            Gestão de Ocorrências
            <br />
            <em>Rápida, Priorizada &amp; Eficiente</em>
          </h1>
          <p>
            Centralize a abertura de chamados, controle o escalonamento,
            acompanhe SLAs em tempo real e reduza o tempo de parada de máquinas
            na sua fábrica.
          </p>
          <form className={styles.search} onSubmit={search}>
            <label>
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Máquina, equipamento ou ocorrência"
                aria-label="Pesquisar máquina, equipamento ou ocorrência"
              />
            </label>
            <label>
              <span>⌖</span>
              <input
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Setor ou fábrica"
                aria-label="Setor ou fábrica"
              />
            </label>
            <button disabled={busy}>
              {busy ? "Buscando…" : "Buscar"}
              <span>→</span>
            </button>
          </form>
          {error && (
            <div className={styles.searchMessage}>
              {error}{" "}
              {error.startsWith("Faça login") && (
                <Link href="/login">Entrar →</Link>
              )}
            </div>
          )}
          {rows && (
            <div className={styles.results}>
              <div className={styles.resultHead}>
                {rows.length} resultado(s)
                <button onClick={() => setRows(null)}>Fechar</button>
              </div>
              {rows.length ? (
                rows.map((row) => (
                  <Link
                    href={`/dashboard/ocorrencias/${row.id_ocorrencia}`}
                    key={row.id_ocorrencia}
                  >
                    <span>
                      <b>{row.titulo}</b>
                      <small>
                        OC-{row.id_ocorrencia} · {row.setor} ·{" "}
                        {row.maquina || "Sem máquina"}
                      </small>
                    </span>
                    <i>
                      {row.prioridade} · {row.status}
                    </i>
                  </Link>
                ))
              ) : (
                <p>Nenhuma ocorrência encontrada com esses critérios.</p>
              )}
            </div>
          )}
          <div className={styles.heroFoot}>
            <span>✓ Dados centralizados</span>
            <span>✓ Prioridades claras</span>
            <span>✓ Equipes alinhadas</span>
          </div>
        </section>
        <section className={styles.quick}>
          <div className={styles.sectionLabel}>ACESSO RÁPIDO</div>
          <div className={styles.shortcutGrid}>
            {shortcuts.map(([icon, title, href]) => (
              <Link href={href} key={title}>
                <span>{icon}</span>
                <b>{title}</b>
                <i>↗</i>
              </Link>
            ))}
          </div>
        </section>
        <section className={styles.resources}>
          <div className={styles.sectionTop}>
            <div>
              <span className={styles.sectionLabel}>
                CONTROLE DE PONTA A PONTA
              </span>
              <h2>
                Recursos da Plataforma <em>IndustrialAlert</em>
              </h2>
            </div>
            <span className={styles.slogan}>Sua indústria. Sob controle.</span>
          </div>
          <div className={styles.featureGrid}>
            {features.map(([icon, title, description, href], i) => (
              <Link href={href} className={styles.feature} key={title}>
                <span className={styles.featureIcon}>{icon}</span>
                <span className={styles.number}>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className={styles.cardLink}>
                  Acessar recurso <b>→</b>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <footer className={styles.footer}>
          <Link className={styles.brand} href="/">
            <span className={styles.mark}>⚙</span>
            <span>
              Industri<b>Alert</b>
            </span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
