"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import styles from "./ResourcePanel.module.css";

const NO_CREATE_FIELDS = [];

export default function ResourcePanel({
  title,
  endpoint,
  columns,
  createFields = NO_CREATE_FIELDS,
}) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [values, setValues] = useState({});
  const [related, setRelated] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function load() {
    setBusy(true);
    try {
      setRows(await apiFetch(endpoint));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    apiFetch(endpoint)
      .then((value) => {
        if (active) {
          setRows(value);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    const relatedFields = createFields.filter(
      (field) => field.type === "related",
    );
    Promise.all(
      relatedFields.map((field) =>
        apiFetch(field.endpoint).then((value) => [
          field.name,
          value.filter((row) => row.ativo !== false),
        ]),
      ),
    )
      .then((entries) => {
        if (active) setRelated(Object.fromEntries(entries));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [endpoint, createFields]);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = { ...values };
      for (const field of createFields)
        if (["number", "related"].includes(field.type) && body[field.name])
          body[field.name] = Number(body[field.name]);
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      setValues({});
      setNotice("Cadastro realizado.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.kicker}>CADASTROS DO SISTEMA</span>
          <h1>{title}</h1>
          <p>Informações carregadas diretamente dos registros da plataforma.</p>
        </div>
        <button onClick={load} className={styles.refresh}>
          ↻ Atualizar
        </button>
      </div>
      {createFields.length > 0 && (
        <form className={styles.form} onSubmit={submit}>
          <h2>Novo cadastro</h2>
          <div>
            {createFields.map((field) => {
              const choices =
                field.type === "related"
                  ? (related[field.name] || []).map((row) => ({
                      value: row[field.valueKey],
                      label: row[field.labelKey],
                    }))
                  : field.options || [];
              return (
                <label key={field.name}>
                  {field.label}
                  {["select", "related"].includes(field.type) ? (
                    <select
                      required={field.required !== false}
                      value={values[field.name] || ""}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [field.name]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {choices.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required={field.required !== false}
                      type={field.type || "text"}
                      value={values[field.name] || ""}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [field.name]: e.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
          <button disabled={saving}>
            {saving ? "Salvando…" : "Adicionar"}
          </button>
        </form>
      )}
      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.error}>{error}</div>}
      <section className={styles.card}>
        {busy ? (
          <p className={styles.empty}>Carregando registros…</p>
        ) : rows.length === 0 ? (
          <p className={styles.empty}>Nenhum registro cadastrado.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row[columns[0].key] ?? index}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.format === "active"
                          ? row[column.key]
                            ? "Ativo"
                            : "Inativo"
                          : (row[column.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
