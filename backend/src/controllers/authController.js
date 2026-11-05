import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
  createHash,
} from "node:crypto";
import { pool } from "../config/database.js";

function tokenFor(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres.");
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id_usuario,
      role: user.perfil,
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function roleFor(description) {
  const normalized = String(description || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
  if (normalized === "administrador") return "Administrador";
  if (normalized === "gestor") return "Gestor";
  if (normalized === "técnico" || normalized === "tecnico") return "Técnico";
  return "Técnico";
}

export async function login(request, response, next) {
  try {
    const { email, senha } = request.body || {};
    if (!email || !senha)
      return response.status(400).json({ message: "Informe email e senha." });
    const [rows] = await pool.execute(
      "SELECT id_usuario,nome,email,senha,descricao FROM usuarios WHERE email=? AND ativo=1",
      [String(email).trim()],
    );
    const user = rows[0];
    if (!user)
      return response.status(401).json({ message: "Credenciais inválidas." });

    let valid = false;
    if (user.senha.startsWith("sha256:")) {
      const expected = Buffer.from(user.senha.slice(7), "hex");
      const actual = createHash("sha256").update(String(senha)).digest();
      valid =
        expected.length === actual.length && timingSafeEqual(actual, expected);
    } else if (user.senha.startsWith("scrypt:")) {
      const [, salt, hash] = user.senha.split(":");
      if (salt && hash) {
        const expected = Buffer.from(hash, "hex");
        const actual = scryptSync(String(senha), salt, 64);
        valid =
          expected.length === actual.length &&
          timingSafeEqual(actual, expected);
      }
    }
    if (!valid)
      return response.status(401).json({ message: "Credenciais inválidas." });
    if (user.senha.startsWith("sha256:")) {
      await pool.execute("UPDATE usuarios SET senha=? WHERE id_usuario=?", [
        hashPassword(String(senha)),
        user.id_usuario,
      ]);
    }

    // 01-schema.sql stores a user's role in the existing descricao field.
    const sessionUser = {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
      perfil: roleFor(user.descricao),
    };
    response.json({ token: tokenFor(sessionUser), usuario: sessionUser });
  } catch (error) {
    next(error);
  }
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
