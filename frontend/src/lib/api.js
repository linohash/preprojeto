export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const catalogNameCorrections = new Map([
  ["logstica", "Logística"],
  ["manuteno", "Manutenção"],
  ["produo", "Produto"],
  ["eltrica", "Elétrica"],
  ["mecnica", "Mecânica"],
  ["manuteno preventiva", "Manutenção preventiva"],
  ["falha eltrica", "Falha elétrica"],
  ["falha mecanica", "Falha mecânica"],
]);

const priorityCorrections = new Map([
  ["mdia", "Média"],
  ["media", "Média"],
]);

export function normalizePriority(value) {
  if (typeof value !== "string") return value;
  return priorityCorrections.get(value.trim().toLocaleLowerCase("pt-BR")) || value;
}

function normalizePriorities(value) {
  if (Array.isArray(value)) return value.map(normalizePriorities);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      key === "prioridade" || key === "nome"
        ? normalizePriority(item)
        : normalizePriorities(item),
    ]),
  );
}

export function normalizeCatalogName(name) {
  return (
    catalogNameCorrections.get(String(name).trim().toLocaleLowerCase("pt-BR")) ||
    name
  );
}

export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("industri-alert-token")
      : null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(options.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data?.message || `Falha na requisição (${response.status}).`,
    );
  return normalizePriorities(data);
}

export async function apiDownload(path) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("industri-alert-token")
      : null;
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Não foi possível baixar o arquivo.");
  }
  return response.blob();
}

export function isAuthenticated() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("industri-alert-token"))
  );
}
