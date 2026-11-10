"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api.js";
import styles from "./ocorrencias.module.css";

const priorityClass = { Baixa: "baixa", Média: "media", Alta: "alta", Crítica: "critica" };
const statusClass = { Aberta: "aberta", "Em andamento": "emandamento", Aguardando: "aguardando", Resolvida: "resolvida", Cancelada: "cancelada" };

export default function Occurrences() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState(""); const [sector, setSector] = useState(""); const [status, setStatus] = useState(""); const [priority, setPriority] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [sectors, setSectors] = useState([]);
  useEffect(() => { Promise.resolve().then(() => { const params = new URLSearchParams(window.location.search); setQ(params.get("busca") || ""); setSector(params.get("setor") || ""); setStatus(params.get("status") || ""); setPriority(params.get("prioridade") || ""); }); apiFetch("/setores").then(setSectors).catch(() => { }); }, []);
  useEffect(() => { let live = true; const timer = setTimeout(() => { setLoading(true); const params = new URLSearchParams(); if (q.trim()) params.set("busca", q.trim()); if (sector) params.set("setor", sector); if (status) params.set("status", status); if (priority) params.set("prioridade", priority); apiFetch(`/ocorrencias?${params}`).then((value) => { if (live) { setRows(value); setError(""); } }).catch((e) => { if (live) { setError(e.message); setRows([]); } }).finally(() => { if (live) setLoading(false); }); }, 180); return () => { live = false; clearTimeout(timer); }; }, [q, sector, status, priority]);
  return <section className={styles.page}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>CENTRAL DE ATENDIMENTO</span><h1>Ocorrências</h1><p>Pesquise, filtre e acompanhe os chamados da operação.</p></div><Link href="/dashboard/nova-ocorrencia" className={styles.primary}>＋ Nova ocorrência</Link></div>
    <div className={styles.filters}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar ocorrência, máquina ou equipamento" aria-label="Pesquisar ocorrência" /><select aria-label="Filtrar por setor" value={sector} onChange={(e) => setSector(e.target.value)}><option value="">Todos os setores</option>{sectors.map((item) => <option key={item.id_setor} value={item.nome}>{item.nome}</option>)}</select><select aria-label="Filtrar por status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos os status</option>{["Aberta", "Em andamento", "Aguardando", "Resolvida", "Cancelada"].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por prioridade" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">Todas as prioridades</option>{["Baixa", "Média", "Alta", "Crítica"].map((item) => <option key={item}>{item}</option>)}</select></div>
    {error && <div className={styles.error}>{error} {error.includes("Autenticação") && <Link href="/login">Faça login →</Link>}</div>}
    <div className={styles.card}><div className={styles.tableTop}>{loading ? "Consultando…" : `${rows.length} ocorrência(s)`}</div><div className={styles.scroll}><table><thead><tr><th>IDENTIFICAÇÃO</th><th>SETOR / MÁQUINA</th><th>PRIORIDADE</th><th>RESPONSÁVEL</th><th>PRAZO</th><th>STATUS</th><th /></tr></thead><tbody>{rows.map((item) => <tr key={item.id_ocorrencia}><td><Link href={`/dashboard/ocorrencias/${item.id_ocorrencia}`}><b>{item.titulo}</b><small>OC-{item.id_ocorrencia}</small></Link></td><td>{item.setor}<small>{item.maquina || "Sem máquina vinculada"}</small></td><td><span className={`${styles.priority} ${styles[priorityClass[item.prioridade]]}`}>{item.prioridade}</span></td><td>{item.responsavel || "Não atribuído"}</td><td>{item.prazo ? new Date(item.prazo).toLocaleDateString("pt-BR") : "—"}{item.atrasada && <small className={styles.overdue}>Atrasada</small>}</td><td><span className={`${styles.status} ${styles[statusClass[item.status]]}`}>{item.status}</span>{Number(item.escalonada) === 1 && item.prioridade === "Crítica" && (
    <small className={styles.critical}>Escalonada</small>
)}</td><td><Link className={styles.detail} href={`/dashboard/ocorrencias/${item.id_ocorrencia}`}>Detalhes →</Link></td></tr>)}</tbody></table>{!loading && !error && rows.length === 0 && <div className={styles.empty}>Nenhuma ocorrência corresponde aos filtros selecionados.</div>}</div></div>
  </section>;
}
