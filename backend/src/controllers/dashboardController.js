import { pool } from "../config/database.js";

export async function summary(request, response, next) {
  try {
    const [[counts]] = await pool.query(`SELECT COUNT(*) AS total,
      SUM(status='Aberta') AS abertas, SUM(status='Em andamento') AS em_andamento,
      SUM(status='Resolvida') AS resolvidas, SUM(prioridade='Crítica' AND status NOT IN ('Resolvida','Cancelada')) AS criticas,
      SUM(prazo<NOW() AND status NOT IN ('Resolvida','Cancelada')) AS atrasadas FROM ocorrencias`);
    const [[prioridades], [recentes]] = await Promise.all([
      pool.query("SELECT prioridade AS nome,COUNT(*) AS total FROM ocorrencias WHERE status NOT IN ('Resolvida','Cancelada') GROUP BY prioridade ORDER BY FIELD(prioridade,'Crítica','Alta','Média','Baixa')"),
      pool.query("SELECT id_ocorrencia,titulo,status,prioridade FROM ocorrencias ORDER BY data_abertura DESC LIMIT 5"),
    ]);
    response.json({ ...counts, prioridades, recentes });
  } catch (error) { next(error); }
}
