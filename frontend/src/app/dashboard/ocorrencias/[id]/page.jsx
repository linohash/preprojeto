"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiDownload, apiFetch } from "../../../../lib/api.js";
import styles from "../../forms.module.css";

export default function OccurrenceDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({
    status: "",
    causa: "",
    solucao: "",
    id_responsavel: "",
  });
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  function assign(value) {
    setItem(value);
    setForm({
      status: value.status,
      causa: value.causa || "",
      solucao: value.solucao || "",
      id_responsavel: String(value.id_responsavel || ""),
    });
  }
  async function load() {
    assign(await apiFetch(`/ocorrencias/${id}`));
  }
  useEffect(() => {
    if (id) {
      apiFetch(`/ocorrencias/${id}`)
        .then(assign)
        .catch((e) => setError(e.message));
      apiFetch("/usuarios")
        .then(setUsers)
        .catch(() => {});
      Promise.resolve().then(() => {
        try {
          setUserRole(
            JSON.parse(localStorage.getItem("industri-alert-user") || "{}")
              .perfil || "",
          );
        } catch {
          setUserRole("");
        }
      });
    }
  }, [id]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiFetch(`/ocorrencias/${id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      await load();
      setNotice("Alterações registradas no histórico.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(event) {
    event.preventDefault();
    if (!file) return;
    const formElement = event.currentTarget;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.append("arquivo", file);
      await apiFetch(`/ocorrencias/${id}/evidencias`, { method: "POST", body });
      setFile(null);
      formElement.reset();
      await load();
      setNotice("Evidência anexada à ocorrência.");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  async function download(evidence) {
    try {
      const blob = await apiDownload(
        `/ocorrencias/${id}/evidencias/${evidence.id_evidencia}`,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = evidence.nome_arquivo;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    }
  }
  if (!item)
    return (
      <div className={styles.page}>
        <div className={styles.heading}>
          <div>
            <span className={styles.eyebrow}>DETALHE DA OCORRÊNCIA</span>
            <h1>{error ? "Não foi possível carregar" : "Carregando…"}</h1>
            {error && <p>{error}</p>}
          </div>
          <Link href="/dashboard/ocorrencias">← Voltar à lista</Link>
        </div>
        {error.includes("Autenticação") && <Link href="/login">Entrar →</Link>}
      </div>
    );
  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            OC-{item.id_ocorrencia} · {item.setor}
          </span>
          <h1>{item.titulo}</h1>
          <p>
            Aberta em {new Date(item.data_abertura).toLocaleString("pt-BR")} ·{" "}
            {item.maquina || "Sem máquina vinculada"}
          </p>
        </div>
        <Link href="/dashboard/ocorrencias">← Todas as ocorrências</Link>
      </div>
      <div className={styles.detailGrid}>
        <article className={styles.form}>
          <h2>Informações da ocorrência</h2>
          <p className={styles.description}>{item.descricao}</p>
          <dl>
            <div>
              <dt>Tipo</dt>
              <dd>{item.tipo}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>{item.prioridade}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{item.status}</dd>
            </div>
            <div>
              <dt>Responsável</dt>
              <dd>{item.responsavel || "Não atribuído"}</dd>
            </div>
            <div>
              <dt>Prazo</dt>
              <dd>
                {new Date(item.prazo).toLocaleString("pt-BR")}
                {item.atrasada ? " · Atrasada" : ""}
              </dd>
            </div>
            <div>
              <dt>Causa</dt>
              <dd>{item.causa || "Ainda não registrada"}</dd>
            </div>
            <div>
              <dt>Solução</dt>
              <dd>{item.solucao || "Ainda não registrada"}</dd>
            </div>
          </dl>
        </article>
        <form className={styles.form} onSubmit={save}>
          <h2>Atualizar atendimento</h2>
          <div className={styles.grid}>
            <label className={styles.wide}>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((value) => ({ ...value, status: e.target.value }))
                }
              >
                {[
                  "Aberta",
                  "Em andamento",
                  "Aguardando",
                  "Resolvida",
                  "Cancelada",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            {userRole !== "Técnico" && (
              <label className={styles.wide}>
                Responsável
                <select
                  value={form.id_responsavel}
                  onChange={(e) =>
                    setForm((value) => ({
                      ...value,
                      id_responsavel: e.target.value,
                    }))
                  }
                >
                  <option value="">Não atribuído</option>
                  {users
                    .filter((user) => user.ativo && user.perfil === "Técnico")
                    .map((user) => (
                      <option key={user.id_usuario} value={user.id_usuario}>
                        {user.nome}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label className={styles.wide}>
              Causa identificada
              <textarea
                value={form.causa}
                onChange={(e) =>
                  setForm((value) => ({ ...value, causa: e.target.value }))
                }
              />
            </label>
            <label className={styles.wide}>
              Solução aplicada
              <textarea
                value={form.solucao}
                onChange={(e) =>
                  setForm((value) => ({ ...value, solucao: e.target.value }))
                }
              />
            </label>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          {notice && <div className={styles.success}>{notice}</div>}
          <div className={styles.actions}>
            <button disabled={busy}>
              {busy ? "Salvando…" : "Salvar atualização"}
            </button>
          </div>
        </form>
      </div>
      <section className={styles.detailGrid}>
        <form className={styles.form} onSubmit={upload}>
          <h2>Anexar evidência</h2>
          <p className={styles.description}>
            Envie uma imagem JPEG/PNG ou PDF com até 5 MB.
          </p>
          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button disabled={uploading || !file}>
              {uploading ? "Enviando…" : "Enviar arquivo"}
            </button>
          </div>
        </form>
        <article className={styles.form}>
          <h2>Evidências anexadas</h2>
          {item.evidencias?.length ? (
            item.evidencias.map((evidence) => (
              <button
                className={styles.evidence}
                onClick={() => download(evidence)}
                key={evidence.id_evidencia}
              >
                <span>▧</span>
                <b>{evidence.nome_arquivo}</b>
                <small>
                  {(evidence.tamanho / 1024).toFixed(0)} KB · baixar
                </small>
              </button>
            ))
          ) : (
            <p className={styles.notice}>Nenhuma evidência anexada.</p>
          )}
        </article>
      </section>
      <article className={styles.form}>
        <h2>Histórico de alterações</h2>
        {item.historico?.length ? (
          item.historico.map((entry) => (
            <div className={styles.history} key={entry.id_historico}>
              <b>{entry.acao}</b>
              <span>
                {entry.detalhe}
                <small className={styles.actor}> por {entry.usuario}</small>
              </span>
              <small>{new Date(entry.data_hora).toLocaleString("pt-BR")}</small>
            </div>
          ))
        ) : (
          <p className={styles.notice}>Nenhuma alteração registrada.</p>
        )}
      </article>
    </section>
  );
}
