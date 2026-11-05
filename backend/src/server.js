import dotenv from "dotenv";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const projectDirectory = path.resolve(backendDirectory, "..");
const envPath = [
  path.join(backendDirectory, ".env"),
  path.join(projectDirectory, ".env"),
].find(existsSync);

if (envPath) dotenv.config({ path: envPath });

// Import the application only after environment variables have been loaded.
const [{ default: app }, { migrateDatabase }, { pool }] = await Promise.all([
  import("./app.js"),
  import("./config/migrate.js"),
  import("./config/database.js"),
]);

const port = Number(process.env.PORT || 8080);

try {
  await migrateDatabase();
  console.log("Database schema is ready");
} catch (error) {
  console.error("Database schema validation failed:", error.message);
  await pool.end();
  process.exitCode = 1;
  process.exit();
}

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
