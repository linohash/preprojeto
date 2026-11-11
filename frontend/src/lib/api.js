export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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
  return data;
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
