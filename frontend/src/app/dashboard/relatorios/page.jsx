"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api.js";
import styles from "../ocorrencias/ocorrencias.module.css";
import reportStyles from "./reports.module.css";

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch("/ocorrencias")
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  function download() {
    const columns = [
      "id_ocorrencia",
      "titulo",
      "setor",
      "maquina",
      "prioridade",
      "status",
      "responsavel",
      "prazo",
    ];
    const csv = [
      columns.join(";"),
      ...rows.map((r) =>
        columns
          .map((c) => `"${String(r[c] ?? "").replaceAll('"', '""')}"`)
          .join(";"),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "industri-alert-ocorrencias.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className={reportStyles.page}>
      <div className={reportStyles.heading}>
        <div>
          <span className={reportStyles.kicker}>DADOS DA OPERAÇÃO</span>
          <h1>Relatórios</h1>
          <p>Exporte ou consulte os registros reais de ocorrências.</p>
        </div>
        <button
          onClick={download}
          disabled={!rows.length}
          className={reportStyles.download}
        >
          ↓ Exportar CSV
        </button>
      </div>
      {error && (
        <div className={reportStyles.error}>
          {error}{" "}
          {error.includes("Autenticação") && (
            <Link href="/login">Entrar →</Link>
          )}
        </div>
      )}
      <div className={styles.card}>
        <div className={styles.tableTop}>
          {loading ? "Carregando registros…" : `${rows.length} registro(s)`}
        </div>
        <div className={styles.scroll}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>TÍTULO</th>
                <th>SETOR</th>
                <th>PRIORIDADE</th>
                <th>STATUS</th>
                <th>RESPONSÁVEL</th>
                <th>PRAZO</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id_ocorrencia}>
                  <td>OC-{r.id_ocorrencia}</td>
                  <td>
                    <Link href={`/dashboard/ocorrencias/${r.id_ocorrencia}`}>
                      {r.titulo}
                    </Link>
                  </td>
                  <td>{r.setor}</td>
                  <td>{r.prioridade}</td>
                  <td>{r.status}</td>
                  <td>{r.responsavel || "—"}</td>
                  <td>
                    {r.prazo
                      ? new Date(r.prazo).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && !rows.length && (
            <div className={styles.empty}>
              Ainda não há dados para este relatório.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
