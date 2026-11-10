import { createHmac, timingSafeEqual } from "node:crypto";

export function authenticate(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return response.status(401).json({ message: "Autenticação necessária." });
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return response.status(401).json({ message: "Token inválido ou configuração de autenticação ausente." });
  const expected = createHmac("sha256", process.env.JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return response.status(401).json({ message: "Token inválido." });
  try {
    request.usuario = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!Number.isFinite(request.usuario.exp) || request.usuario.exp * 1000 < Date.now()) return response.status(401).json({ message: "Token expirado." });
    next();
  } catch { response.status(401).json({ message: "Token inválido." }); }
}

export function allowRoles(...roles) {
  return (request, response, next) => roles.includes(request.usuario?.role) ? next() : response.status(403).json({ message: "Acesso não permitido." });
}
