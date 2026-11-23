import { pool } from "./database.js";

// The database/init/01-schema.sql file is the source of truth. Startup only
// checks that its tables exist and normalizes known typos in catalog names.
const requiredTables = [
  "usuarios",
  "setores",
  "maquinas",
  "tipos_ocorrencia",
  "ocorrencias",
  "historico_ocorrencias",
  "evidencias",
];

export async function migrateDatabase() {
  const [rows] = await pool.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE()",
  );
  const available = new Set(
    rows.map((row) => row.TABLE_NAME || row.table_name),
  );
  const missing = requiredTables.filter((table) => !available.has(table));
  if (missing.length) {
    throw new Error(
      `O banco configurado não corresponde a database/init/01-schema.sql. Tabelas ausentes: ${missing.join(", ")}`,
    );
  }

  await pool.execute(
    "UPDATE setores SET nome='Logística' WHERE LOWER(nome)='logstica'",
  );
  await pool.execute(
    "UPDATE setores SET nome='Manutenção' WHERE LOWER(nome)='manuteno'",
  );
  await pool.execute(
    "UPDATE tipos_ocorrencia SET nome='Logística' WHERE LOWER(nome)='logstica'",
  );
  await pool.execute(
    "UPDATE tipos_ocorrencia SET nome='Manutenção' WHERE LOWER(nome)='manuteno'",
  );
}
