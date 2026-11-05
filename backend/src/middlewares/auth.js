import { createHmac, timingSafeEqual } from "node:crypto";

export function authenticate(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");
  const secret = process.env.JWT_SECRET;
  if (scheme !== "Bearer" || !token || !secret || secret.length < 32)
    return response.status(401).json({ message: "Autenticação necessária." });
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("invalid token");
    const expected = createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest();
    const supplied = Buffer.from(parts[2], "base64url");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error("invalid signature");
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString());
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (header.alg !== "HS256" || !payload.sub || !payload.exp || payload.exp <= Date.now() / 1000) throw new Error("expired token");
    request.user = { id_usuario: Number(payload.sub), perfil: payload.role };
    request.userId = request.user.id_usuario;
    next();
  } catch {
    response.status(401).json({ message: "Token inválido ou expirado." });
  }
}

export function allowRoles(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.user?.perfil)) return response.status(403).json({ message: "Você não tem permissão para esta operação." });
    next();
  };
}
