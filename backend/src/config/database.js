import mysql from "mysql2/promise";

const requiredDatabaseVariables = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
const missingDatabaseVariables = requiredDatabaseVariables.filter((name) =>
  name === "DB_PASSWORD" ? process.env[name] === undefined : !process.env[name]?.trim(),
);

if (missingDatabaseVariables.length) {
  throw new Error(`Missing required database environment variable(s): ${missingDatabaseVariables.join(", ")}`);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function checkDatabaseConnection() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}
