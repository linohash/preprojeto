"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api.js";
import styles from "./dashboard.module.css";

const shortcuts = [["▦", "Ocorrências", "/dashboard/ocorrencias"], ["▤", "Setores & Máquinas", "/dashboard/setores-maquinas"], ["♙", "Responsáveis", "/dashboard/responsaveis"], ["⌁", "Indicadores & SLA", "/dashboard/indicadores"], ["▧", "Relatórios", "/dashboard/relatorios"]];
const priorityStyles = { Baixa: "baixa", Média: "média", Alta: "alta", Crítica: "critica" };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiFetch("/dashboard").then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const total = Math.max(Number(data?.total) || 0, 1);

  return <div className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.heroContent}><span className={styles.eyebrow}><i /> CENTRAL PARA REGISTRO E GESTÃO DE OCORRÊNCIAS INDUSTRIAIS</span><h1>Gestão de Ocorrências<br /><em>Rápida, Priorizada &amp; Eficiente</em></h1><p>Centralize chamados, controle o escalonamento, acompanhe prazos em tempo real e reduza o tempo de parada de máquinas na sua fábrica.</p><div className={styles.heroActions}><Link href="/dashboard/nova-ocorrencia">＋ Registrar ocorrência</Link><Link href="/dashboard/ocorrencias">Ver ocorrências <span>→</span></Link></div></div>
      <div className={styles.heroStat}><span>MONITORAMENTO OPERACIONAL</span><b>{loading || !data ? "—" : data.total}</b><small>ocorrências registradas</small><i /></div>
    </section>
    <section className={styles.shortcuts}>{shortcuts.map(([icon, title, href]) => <Link key={href} href={href}><span>{icon}</span><b>{title}</b><i>↗</i></Link>)}</section>
    <div className={styles.heading}><div><span className={styles.kicker}>VISÃO DA OPERAÇÃO</span><h2>Resumo de ocorrências</h2><p>Indicadores calculados com base nos registros do sistema.</p></div><Link href="/dashboard/indicadores">Ver indicadores completos →</Link></div>
    {error && <div className={styles.message}><b>Entre para consultar os dados da sua operação.</b><span>{error}</span><Link href="/login">Acessar conta →</Link></div>}
    {loading ? <div className={styles.loading}>Carregando indicadores…</div> : data && <>
      <section className={styles.metrics}><Metric icon="▦" label="Total de ocorrências" value={data.total} /><Metric icon="⚑" label="Abertas" value={data.abertas} accent="red" /><Metric icon="◷" label="Em andamento" value={data.em_andamento} accent="purple" /><Metric icon="✓" label="Resolvidas" value={data.resolvidas} accent="green" /></section>
      <section className={styles.alerts}><div><span className={styles.alertIcon}>!</span><span><b>{data.criticas} ocorrências críticas</b><small>Exigem atenção imediata</small></span></div><div><span className={styles.alertIcon}>◷</span><span><b>{data.atrasadas} prazos ultrapassados</b><small>Ocorrências ainda não resolvidas</small></span></div><Link href="/dashboard/ocorrencias?prioridade=Crítica">Revisar alertas →</Link></section>
      <div className={styles.lower}>
        <section className={styles.panel}><div className={styles.panelHead}><div><h3>Por prioridade</h3><p>Ocorrências não concluídas</p></div><Link href="/dashboard/ocorrencias">Ver todas →</Link></div>{(data.prioridades || []).length ? data.prioridades.map((row) => <div className={styles.barRow} key={row.nome}><span>{row.nome}</span><div><i className={styles[priorityStyles[row.nome] || "priorityOther"]} style={{ width: `${Math.max(Number(row.total) / total * 100, 4)}%` }} /></div><b>{row.total}</b></div>) : <p className={styles.empty}>Sem ocorrências em aberto.</p>}</section>
        <section className={styles.panel}><div className={styles.panelHead}><div><h3>Atualizações recentes</h3><p>Últimos registros da equipe</p></div><Link href="/dashboard/ocorrencias">Abrir lista →</Link></div>{(data.recentes || []).length ? data.recentes.map((row) => <Link className={styles.recent} href={`/dashboard/ocorrencias/${row.id_ocorrencia}`} key={row.id_ocorrencia}><span className={styles.recentIcon}>⚙</span><span className={styles.recentTitle}><b>{row.titulo}</b><small>OC-{row.id_ocorrencia} · {row.status}</small></span><span className={styles.priorityBadge} style={{ color: row.prioridade === "Crítica" ? "#ff9ca4" : row.prioridade === "Alta" ? "#ffb179" : row.prioridade === "Baixa" ? "#7ac5e5" : "#e3c56b" }}>{row.prioridade}</span></Link>) : <p className={styles.empty}>Nenhuma ocorrência registrada.</p>}</section>
      </div>
    </>}
  </div>;
}

function Metric({ icon, label, value, accent = "blue" }) { return <article className={styles.metric}><span className={`${styles.metricIcon} ${styles[accent]}`}>{icon}</span><small>{label}</small><b>{value ?? 0}</b></article>; }
