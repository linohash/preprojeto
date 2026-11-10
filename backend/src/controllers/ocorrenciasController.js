import { pool } from "../config/database.js";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

function parseUpload(request) {
  const match = request.headers["content-type"]?.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match || !Buffer.isBuffer(request.body)) return null;
  const boundary = Buffer.from(`--${(match[1] || match[2]).trim()}`);
  let cursor = request.body.indexOf(boundary);
  while (cursor !== -1) {
    const start = cursor + boundary.length + 2;
    const end = request.body.indexOf(boundary, start);
    if (end === -1) break;
    const part = request.body.subarray(start, end - 2);
    const divider = part.indexOf(Buffer.from("\r\n\r\n"));
    if (divider !== -1) {
      const headers = part.subarray(0, divider).toString("latin1");
      const fileName = headers.match(/filename="([^"]*)"/i)?.[1];
      if (fileName !== undefined) return { fileName: path.basename(fileName), mime: headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase(), data: part.subarray(divider + 4) };
    }
    cursor = end;
  }
  return null;
}

function isAllowedFile(file) {
  if (!file || !file.data.length || file.data.length > 5 * 1024 * 1024) return false;
  if (file.mime === "image/jpeg") return file.data[0] === 0xff && file.data[1] === 0xd8 && file.data[2] === 0xff;
  if (file.mime === "image/png") return file.data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mime === "application/pdf") return file.data.subarray(0, 5).toString() === "%PDF-";
  return false;
}

export async function list(request, response, next) {
  try {
    const { busca, setor, status, prioridade } = request.query;
    let sql = `SELECT o.*, o.id_usuario AS id_responsavel, s.nome AS setor, m.nome AS maquina, t.nome AS tipo, u.nome AS responsavel,
      (o.prazo < NOW() AND o.status NOT IN ('Resolvida','Cancelada')) AS atrasada,
      (o.status NOT IN ('Resolvida','Cancelada') AND (o.prioridade='Crítica' OR o.prazo < NOW())) AS escalonada
      FROM ocorrencias o JOIN setores s ON s.id_setor=o.id_setor LEFT JOIN maquinas m ON m.id_maquina=o.id_maquina
      JOIN tipos_ocorrencia t ON t.id_tipo=o.id_tipo LEFT JOIN usuarios u ON u.id_usuario=o.id_usuario`;
    const where = []; const params = [];
    if (busca) { where.push("(o.titulo LIKE ? OR o.descricao LIKE ? OR m.nome LIKE ?)"); params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`); }
    if (setor) { where.push("s.nome LIKE ?"); params.push(`%${setor}%`); }
    if (status) { where.push("o.status=?"); params.push(status); }
    if (prioridade) { where.push("o.prioridade=?"); params.push(prioridade); }
    if (request.usuario.role === "Técnico") { where.push("o.id_usuario=?"); params.push(request.usuario.sub); }
    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += " ORDER BY escalonada DESC, o.data_abertura DESC";
    const [rows] = await pool.execute(sql, params); response.json(rows);
  } catch (error) { next(error); }
}

export async function create(request, response, next) {
  try {
    const { titulo, descricao, prioridade, id_setor, id_maquina, id_tipo, id_responsavel, prazo } = request.body;
    if (typeof titulo !== "string" || typeof descricao !== "string" || !titulo.trim() || !descricao.trim() || !prioridade || !id_setor || !id_tipo || !prazo) return response.status(400).json({ message: "Preencha título, descrição, prioridade, setor, tipo e prazo." });
    if (!['Baixa', 'Média', 'Alta', 'Crítica'].includes(prioridade)) return response.status(400).json({ message: "Prioridade inválida." });
    if (String(titulo).trim().length > 180 || String(descricao).trim().length < 8 || !Number.isInteger(Number(id_setor)) || !Number.isInteger(Number(id_tipo)) || (id_maquina && !Number.isInteger(Number(id_maquina))) || (id_responsavel && !Number.isInteger(Number(id_responsavel))) || Number.isNaN(Date.parse(prazo))) return response.status(400).json({ message: "Revise o título, a descrição, os cadastros selecionados e o prazo." });
    const [sectorRows] = await pool.execute("SELECT id_setor FROM setores WHERE id_setor=? AND ativo=1", [id_setor]);
    if (!sectorRows.length) return response.status(400).json({ message: "Selecione um setor ativo." });
    if (id_maquina) { const [machineRows] = await pool.execute("SELECT id_maquina FROM maquinas WHERE id_maquina=? AND id_setor=? AND status='ativa'", [id_maquina, id_setor]); if (!machineRows.length) return response.status(400).json({ message: "A máquina selecionada não pertence ao setor escolhido ou está inativa." }); }
    const [typeRows] = await pool.execute("SELECT id_tipo FROM tipos_ocorrencia WHERE id_tipo=? AND ativo=1", [id_tipo]);
    if (!typeRows.length) return response.status(400).json({ message: "Selecione um tipo de ocorrência válido." });
    if (id_responsavel) { const [users] = await pool.execute("SELECT id_usuario FROM usuarios WHERE id_usuario=? AND ativo=1", [id_responsavel]); if (!users.length) return response.status(400).json({ message: "O responsável precisa ser um usuário ativo." }); }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute("INSERT INTO ocorrencias (titulo,descricao,prioridade,status,id_setor,id_maquina,id_tipo,id_usuario,prazo) VALUES (?,?,?,'Aberta',?,?,?,?,?)", [titulo.trim(), descricao.trim(), prioridade, id_setor, id_maquina || null, id_tipo, id_responsavel || request.usuario.sub, prazo]);
      await connection.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [result.insertId, request.usuario.sub, "Abertura", "Ocorrência registrada"]);
      await connection.commit();
      response.status(201).json({ id_ocorrencia: result.insertId, message: "Ocorrência criada." });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { next(error); }
}

export async function detail(request, response, next) {
  try {
    const id = Number(request.params.id);
    if (!Number.isInteger(id) || id < 1) return response.status(400).json({ message: "Identificador inválido." });
    const [rows] = await pool.execute("SELECT o.*,o.id_usuario AS id_responsavel,s.nome AS setor,m.nome AS maquina,t.nome AS tipo,u.nome AS responsavel,(o.prazo<NOW() AND o.status NOT IN ('Resolvida','Cancelada')) AS atrasada FROM ocorrencias o JOIN setores s ON s.id_setor=o.id_setor LEFT JOIN maquinas m ON m.id_maquina=o.id_maquina JOIN tipos_ocorrencia t ON t.id_tipo=o.id_tipo LEFT JOIN usuarios u ON u.id_usuario=o.id_usuario WHERE o.id_ocorrencia=?", [id]);
    if (!rows[0]) return response.status(404).json({ message: "Ocorrência não encontrada." });
    if (request.usuario.role === "Técnico" && rows[0].id_responsavel !== request.usuario.sub) return response.status(403).json({ message: "Ocorrência não atribuída a você." });
    const [history] = await pool.execute("SELECT h.*,u.nome AS usuario FROM historico_ocorrencias h JOIN usuarios u ON u.id_usuario=h.id_usuario WHERE h.id_ocorrencia=? ORDER BY h.data_hora DESC", [id]);
    const [evidencias] = await pool.execute("SELECT id_evidencia,nome_arquivo,tipo,tamanho,data_envio FROM evidencias WHERE id_ocorrencia=? ORDER BY data_envio DESC", [id]);
    response.json({ ...rows[0], historico: history, evidencias });
  } catch (error) { next(error); }
}

export async function updateStatus(request, response, next) {
  return updateDetails(request, response, next);
}

export async function updateDetails(request, response, next) {
  const connection = await pool.getConnection();
  try {
    const id = Number(request.params.id);
    const fields = ["titulo", "descricao", "prioridade", "status", "id_responsavel", "prazo", "causa", "solucao"];
    const updates = fields.filter((field) => request.body[field] !== undefined);
    if (!Number.isInteger(id) || id < 1) return response.status(400).json({ message: "Identificador inválido." });
    if (!updates.length) return response.status(400).json({ message: "Informe ao menos um campo para atualizar." });
    const [found] = await connection.execute("SELECT id_usuario AS id_responsavel,status FROM ocorrencias WHERE id_ocorrencia=?", [id]);
    if (!found[0]) return response.status(404).json({ message: "Ocorrência não encontrada." });
    if (request.usuario.role === "Técnico" && found[0].id_responsavel !== request.usuario.sub) return response.status(403).json({ message: "Ocorrência não atribuída a você." });
    if (request.usuario.role === "Técnico" && updates.some((field) => !["status", "causa", "solucao"].includes(field))) return response.status(403).json({ message: "Técnicos podem atualizar status, causa e solução das ocorrências atribuídas." });
    if (request.body.prioridade && !["Baixa", "Média", "Alta", "Crítica"].includes(request.body.prioridade)) return response.status(400).json({ message: "Prioridade inválida." });
    if (request.body.status && !["Aberta", "Em andamento", "Aguardando", "Resolvida", "Cancelada"].includes(request.body.status)) return response.status(400).json({ message: "Status inválido." });
    if (request.body.id_responsavel && !Number.isInteger(Number(request.body.id_responsavel))) return response.status(400).json({ message: "Responsável inválido." });
    if (request.body.id_responsavel) { const [users] = await connection.execute("SELECT id_usuario FROM usuarios WHERE id_usuario=? AND ativo=1", [request.body.id_responsavel]); if (!users.length) return response.status(400).json({ message: "O responsável precisa ser um usuário ativo." }); }
    if (request.body.prazo && Number.isNaN(Date.parse(request.body.prazo))) return response.status(400).json({ message: "Prazo inválido." });
    if (request.body.status === "Resolvida" && !String(request.body.solucao || "").trim()) return response.status(400).json({ message: "Registre a solução antes de concluir a ocorrência." });
    const finalResponsible = request.body.id_responsavel !== undefined ? request.body.id_responsavel : found[0].id_responsavel;
    if (request.body.status === "Em andamento" && !finalResponsible) return response.status(400).json({ message: "Atribua um responsável antes de iniciar o atendimento." });
    const values = updates.map((field) => request.body[field] === "" && field === "id_responsavel" ? null : request.body[field]);
    const sets = updates.map((field) => `${field === "id_responsavel" ? "id_usuario" : field}=?`);
    if (request.body.status) { sets.push("data_conclusao=IF(?='Resolvida',NOW(),NULL)"); values.push(request.body.status); }
    await connection.beginTransaction();
    await connection.execute(`UPDATE ocorrencias SET ${sets.join(",")} WHERE id_ocorrencia=?`, [...values, id]);
    const action = updates.includes("status") ? "Atualização" : "Edição";
    await connection.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [id, request.usuario.sub, action, `Campos atualizados: ${updates.join(", ")}`]);
    await connection.commit();
    response.json({ message: "Ocorrência atualizada.", escalonada: request.body.status !== "Resolvida" && request.body.status !== "Cancelada" });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function uploadEvidence(request, response, next) {
  let savedPath; let connection;
  try {
    const file = parseUpload(request);
    if (!isAllowedFile(file)) return response.status(400).json({ message: "Envie um arquivo JPEG, PNG ou PDF válido de até 5 MB." });
    const [rows] = await pool.execute("SELECT id_usuario AS id_responsavel FROM ocorrencias WHERE id_ocorrencia=?", [request.params.id]);
    if (!rows[0]) return response.status(404).json({ message: "Ocorrência não encontrada." });
    if (request.usuario.role === "Técnico" && rows[0].id_responsavel !== request.usuario.sub) return response.status(403).json({ message: "Ocorrência não atribuída a você." });
    const extension = { "image/jpeg": ".jpg", "image/png": ".png", "application/pdf": ".pdf" }[file.mime];
    const storedName = `${randomUUID()}${extension}`;
    const uploadDirectory = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    savedPath = path.join(uploadDirectory, storedName);
    await writeFile(savedPath, file.data, { flag: "wx" });
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [result] = await connection.execute("INSERT INTO evidencias (id_ocorrencia,id_usuario,nome_arquivo,caminho,tipo,tamanho) VALUES (?,?,?,?,?,?)", [request.params.id, request.usuario.sub, file.fileName.slice(0, 255), storedName, file.mime, file.data.length]);
    await connection.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [request.params.id, request.usuario.sub, "Evidência", `Arquivo anexado: ${file.fileName.slice(0, 200)}`]);
    await connection.commit();
    response.status(201).json({ id_evidencia: result.insertId, nome_arquivo: file.fileName, message: "Evidência anexada." });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    if (savedPath) await unlink(savedPath).catch(() => {});
    next(error);
  } finally { connection?.release(); }
}

export async function downloadEvidence(request, response, next) {
  try {
    if (!Number.isInteger(Number(request.params.id)) || !Number.isInteger(Number(request.params.evidenceId))) return response.status(400).json({ message: "Identificador inválido." });
    const [rows] = await pool.execute("SELECT e.*,o.id_usuario AS id_responsavel FROM evidencias e JOIN ocorrencias o ON o.id_ocorrencia=e.id_ocorrencia WHERE e.id_evidencia=? AND e.id_ocorrencia=?", [request.params.evidenceId, request.params.id]);
    const evidence = rows[0];
    if (!evidence) return response.status(404).json({ message: "Arquivo não encontrado." });
    if (request.usuario.role === "Técnico" && evidence.id_responsavel !== request.usuario.sub) return response.status(403).json({ message: "Ocorrência não atribuída a você." });
    const filePath = path.join(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"), path.basename(evidence.caminho));
    const file = await readFile(filePath);
    response.setHeader("Content-Type", evidence.tipo);
    response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(evidence.nome_arquivo)}`);
    response.setHeader("Content-Length", file.length);
    response.send(file);
  } catch (error) { if (error.code === "ENOENT") return response.status(404).json({ message: "Arquivo não encontrado no armazenamento." }); next(error); }
}

export async function assignResponsible(request, response, next) {
  const connection = await pool.getConnection();
  try {
    const { id_responsavel } = request.body;
    const occurrenceId = Number(request.params.id);
    if (!Number.isInteger(occurrenceId) || occurrenceId < 1 || !Number.isInteger(Number(id_responsavel))) return response.status(400).json({ message: "Informe um responsável válido." });
    const [occurrences] = await connection.execute("SELECT id_ocorrencia FROM ocorrencias WHERE id_ocorrencia=?", [occurrenceId]);
    if (!occurrences.length) return response.status(404).json({ message: "Ocorrência não encontrada." });
    const [users] = await connection.execute("SELECT id_usuario FROM usuarios WHERE id_usuario=? AND ativo=1", [id_responsavel]);
    if (!users.length) return response.status(400).json({ message: "O responsável precisa ser um usuário ativo." });
    await connection.beginTransaction();
    await connection.execute("UPDATE ocorrencias SET id_usuario=? WHERE id_ocorrencia=?", [id_responsavel, occurrenceId]);
    await connection.execute("INSERT INTO historico_ocorrencias (id_ocorrencia,id_usuario,acao,detalhe) VALUES (?,?,?,?)", [occurrenceId, request.usuario.sub, "Responsável", `Ocorrência atribuída ao usuário ${id_responsavel}`]);
    await connection.commit();
    response.json({ message: "Responsável atribuído." });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}
