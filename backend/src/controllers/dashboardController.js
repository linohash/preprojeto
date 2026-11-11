import { pool } from "../config/database.js";

export async function summary(request, response, next) {
  try {
    let filter = "";
    const params = [];
    if (request.usuario.role === "Técnico") {
      filter = " AND id_usuario=?";
      params.push(request.usuario.sub);
    }
    const [totals] = await pool.execute(
      `SELECT COUNT(*) AS total, COALESCE(SUM(status='Aberta'),0) AS abertas, COALESCE(SUM(status='Em andamento'),0) AS em_andamento, COALESCE(SUM(status='Resolvida'),0) AS resolvidas, COALESCE(SUM(prioridade='Crítica' AND status NOT IN ('Resolvida','Cancelada')),0) AS criticas, COALESCE(SUM(prazo<NOW() AND status NOT IN ('Resolvida','Cancelada')),0) AS atrasadas, ROUND(AVG(CASE WHEN data_conclusao IS NOT NULL THEN TIMESTAMPDIFF(HOUR,data_abertura,data_conclusao) END),1) AS mttr_horas FROM ocorrencias WHERE 1=1${filter}`,
      params,
    );
    const [prioridades] = await pool.execute(
      `SELECT prioridade AS nome, COUNT(*) AS total FROM ocorrencias WHERE status NOT IN ('Resolvida','Cancelada')${filter} GROUP BY prioridade`,
      params,
    );
    const [recentes] = await pool.execute(
      `SELECT id_ocorrencia,titulo,prioridade,status,prazo FROM ocorrencias WHERE 1=1${filter} ORDER BY data_abertura DESC LIMIT 5`,
      params,
    );
    const [status] = await pool.execute(
      `SELECT status AS nome, COUNT(*) AS total FROM ocorrencias WHERE 1=1${filter} GROUP BY status`,
      params,
    );
    response.json({ ...totals[0], prioridades, status, recentes });
  } catch (error) {
    next(error);
  }
}
