import { pool } from "./database.js";

// The database/init/01-schema.sql file is the source of truth. Startup only
// checks that its tables exist; it never changes the database structure/data.
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
  const [columns] = await pool.execute(
    "SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='ocorrencias'",
  );
  const occurrenceColumns = new Set(columns.map((row) => row.COLUMN_NAME || row.column_name));
  if (!occurrenceColumns.has("id_responsavel")) {
    throw new Error("A tabela ocorrencias não possui id_responsavel. Recrie o banco em ambiente local ou aplique a atualização do schema database/init/01-schema.sql.");
  }
}
