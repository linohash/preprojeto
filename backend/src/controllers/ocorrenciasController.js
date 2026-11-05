import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/database.js";

const statuses = ["Aberta", "Em andamento", "Aguardando", "Resolvida", "Cancelada"];
const priorities = ["Baixa", "Média", "Alta", "Crítica"];
const selectFields = `o.*, s.nome AS setor, m.nome AS maquina, t.nome AS tipo,
  u.nome AS responsavel, (o.status NOT IN ('Resolvida','Cancelada') AND o.prazo < NOW()) AS atrasada`;
const joins = `FROM ocorrencias o JOIN setores s ON s.id_setor=o.id_setor
  LEFT JOIN maquinas m ON m.id_maquina=o.id_maquina JOIN tipos_ocorrencia t ON t.id_tipo=o.id_tipo
  LEFT JOIN usuarios u ON u.id_usuario=o.id_responsavel`;

function idParam(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) { res.status(400).json({ message: "Identificador inválido." }); return null; }
  return id;
}
async function recordHistory(connection, occurrence, user, action, detail) {
  await connection.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [occurrence, user, action, detail]);
}

export async function list(req, res, next) {
  try {
    const clauses = [], values = [];
    if (req.query.status) { clauses.push("o.status=?"); values.push(req.query.status); }
    if (req.query.prioridade) { clauses.push("o.prioridade=?"); values.push(req.query.prioridade); }
    if (req.query.setor) { clauses.push("s.nome LIKE ?"); values.push(`%${String(req.query.setor).slice(0,100)}%`); }
    if (req.query.busca) { const q = `%${String(req.query.busca).slice(0,150)}%`; clauses.push("(o.titulo LIKE ? OR o.descricao LIKE ? OR m.nome LIKE ?)"); values.push(q,q,q); }
    const [rows] = await pool.execute(`SELECT ${selectFields} ${joins} ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""} ORDER BY o.data_abertura DESC LIMIT 500`, values);
    res.json(rows);
  } catch (error) { next(error); }
}

export async function create(req, res, next) {
  const { titulo, descricao, prioridade = "Média", id_setor, id_maquina = null, id_tipo, id_responsavel = null, prazo } = req.body || {};
  if (!String(titulo || "").trim() || !String(descricao || "").trim() || !id_setor || !id_tipo || !prazo || !priorities.includes(prioridade)) return res.status(400).json({ message: "Informe título, descrição, prioridade, setor, tipo e prazo válidos." });
  const parsedDate = new Date(prazo);
  if (Number.isNaN(parsedDate.getTime())) return res.status(400).json({ message: "Prazo inválido." });
  let connection;
  try {
    connection = await pool.getConnection(); await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO ocorrencias (titulo,descricao,prioridade,id_setor,id_maquina,id_tipo,id_usuario,id_responsavel,prazo) VALUES (?,?,?,?,?,?,?,?,?)", [String(titulo).trim(), String(descricao).trim(), prioridade, Number(id_setor), id_maquina ? Number(id_maquina) : null, Number(id_tipo), req.user.id_usuario, id_responsavel ? Number(id_responsavel) : null, parsedDate]);
    await recordHistory(connection, result.insertId, req.user.id_usuario, "Ocorrência criada", "Ocorrência registrada no sistema.");
    await connection.commit(); res.status(201).json({ id_ocorrencia: result.insertId });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { connection?.release(); }
}

export async function detail(req, res, next) {
  const id = idParam(req,res); if (!id) return;
  try {
    const [rows] = await pool.execute(`SELECT ${selectFields}, u0.nome AS solicitante ${joins} LEFT JOIN usuarios u0 ON u0.id_usuario=o.id_usuario WHERE o.id_ocorrencia=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: "Ocorrência não encontrada." });
    const [[evidencias], [historico]] = await Promise.all([
      pool.execute("SELECT id_evidencia,nome_arquivo,tipo,tamanho,data_envio FROM evidencias WHERE id_ocorrencia=? ORDER BY data_envio DESC", [id]),
      pool.execute("SELECT h.id_historico,h.acao,h.detalhe,h.data_hora,u.nome AS usuario FROM historico_ocorrencias h JOIN usuarios u ON u.id_usuario=h.id_usuario WHERE h.id_ocorrencia=? ORDER BY h.data_hora DESC", [id]),
    ]);
    res.json({ ...rows[0], evidencias, historico });
  } catch (error) { next(error); }
}

export async function updateDetails(req, res, next) {
  const id = idParam(req,res); if (!id) return;
  const { status, causa, solucao, id_responsavel } = req.body || {};
  if (status !== undefined && !statuses.includes(status)) return res.status(400).json({ message: "Status inválido." });
  if (id_responsavel !== undefined && req.user.perfil === "Técnico") return res.status(403).json({ message: "Somente gestores podem atribuir responsáveis." });
  const fields = [], values = [], changes = [];
  if (status !== undefined) { fields.push("status=?"); values.push(status); changes.push(`Status alterado para ${status}.`); }
  if (causa !== undefined) { fields.push("causa=?"); values.push(causa || null); changes.push("Causa atualizada."); }
  if (solucao !== undefined) { fields.push("solucao=?"); values.push(solucao || null); changes.push("Solução atualizada."); }
  if (id_responsavel !== undefined) { fields.push("id_responsavel=?"); values.push(id_responsavel ? Number(id_responsavel) : null); changes.push("Responsável atualizado."); }
  if (!fields.length) return res.status(400).json({ message: "Informe ao menos um campo para atualizar." });
  let connection;
  try {
    connection = await pool.getConnection(); await connection.beginTransaction();
    const [result] = await connection.execute(`UPDATE ocorrencias SET ${fields.join(",")} WHERE id_ocorrencia=?`, [...values,id]);
    if (!result.affectedRows) { await connection.rollback(); return res.status(404).json({ message: "Ocorrência não encontrada." }); }
    if (status === "Resolvida") await connection.execute("UPDATE ocorrencias SET data_conclusao=COALESCE(data_conclusao,NOW()) WHERE id_ocorrencia=?", [id]);
    else if (status && statuses.includes(status)) await connection.execute("UPDATE ocorrencias SET data_conclusao=NULL WHERE id_ocorrencia=?", [id]);
    await recordHistory(connection,id,req.user.id_usuario,"Ocorrência atualizada",changes.join(" ")); await connection.commit(); res.json({ message: "Ocorrência atualizada." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { connection?.release(); }
}
export async function updateStatus(req,res,next) { req.body = { ...(req.body || {}), status: req.body?.status }; return updateDetails(req,res,next); }
export async function assignResponsible(req,res,next) { req.body = { id_responsavel: req.body?.id_responsavel }; return updateDetails(req,res,next); }

function parseUpload(buffer, contentType) {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!boundary) return null;
  const marker = Buffer.from(`--${boundary[1] || boundary[2]}`);
  let start = buffer.indexOf(marker) + marker.length;
  while (start >= marker.length && start < buffer.length) {
    if (buffer.subarray(start,start+2).equals(Buffer.from("--"))) break;
    if (buffer.subarray(start,start+2).equals(Buffer.from("\r\n"))) start += 2;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"),start); if (headerEnd < 0) break;
    const headers = buffer.subarray(start,headerEnd).toString("utf8");
    const next = buffer.indexOf(marker,headerEnd+4); if (next < 0) break;
    if (/name="arquivo"/.test(headers)) {
      const filename = /filename="([^"]*)"/i.exec(headers)?.[1];
      const mime = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim();
      if (!filename) return null;
      return { filename: path.basename(filename), mime, data: buffer.subarray(headerEnd+4,next-2) };
    }
    start = next + marker.length;
  }
  return null;
}
export async function uploadEvidence(req,res,next) {
  const id = idParam(req,res); if (!id) return;
  const file = parseUpload(req.body,req.get("content-type"));
  if (!file || !["image/jpeg","image/png","application/pdf"].includes(file.mime)) return res.status(400).json({ message: "Envie um arquivo JPEG, PNG ou PDF válido." });
  if (!file.data.length || file.data.length > 5*1024*1024) return res.status(400).json({ message: "O arquivo deve ter até 5 MB." });
  let connection, destination;
  try {
    const [exists] = await pool.execute("SELECT id_ocorrencia FROM ocorrencias WHERE id_ocorrencia=?", [id]);
    if (!exists.length) return res.status(404).json({ message: "Ocorrência não encontrada." });
    const dir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(),"uploads")); await mkdir(dir,{recursive:true});
    const stored = `${randomUUID()}${file.mime === "image/jpeg" ? ".jpg" : file.mime === "image/png" ? ".png" : ".pdf"}`; destination = path.join(dir,stored); await writeFile(destination,file.data,{flag:"wx"});
    const [result] = await pool.execute("INSERT INTO evidencias (id_ocorrencia,id_usuario,nome_arquivo,caminho,tipo,tamanho) VALUES (?,?,?,?,?,?)", [id,req.user.id_usuario,file.filename,stored,file.mime,file.data.length]);
    await pool.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [id,req.user.id_usuario,"Evidência anexada",file.filename]); res.status(201).json({ id_evidencia: result.insertId });
  } catch(error) { if (destination) await unlink(destination).catch(()=>{}); next(error); }
}
export async function downloadEvidence(req,res,next) {
  const id = idParam(req,res); if (!id) return;
  try {
    const [rows] = await pool.execute("SELECT nome_arquivo,caminho,tipo FROM evidencias WHERE id_evidencia=? AND id_ocorrencia=?", [Number(req.params.evidenceId),id]);
    if (!rows.length) return res.status(404).json({ message: "Evidência não encontrada." });
    const file = rows[0], dir = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(),"uploads")), absolute = path.resolve(dir,file.caminho);
    if (!absolute.startsWith(dir + path.sep)) return res.status(404).json({ message: "Evidência não encontrada." });
    const data = await readFile(absolute); res.type(file.tipo).attachment(file.nome_arquivo).send(data);
  } catch(error) { if (error.code === "ENOENT") return res.status(404).json({ message: "Arquivo de evidência indisponível." }); next(error); }
}
