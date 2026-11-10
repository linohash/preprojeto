import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler } from "./middlewares/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ocorrenciasRoutes from "./routes/ocorrenciasRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { setoresRoutes, maquinasRoutes, usuariosRoutes, tiposRoutes } from "./routes/crudRoutes.js";

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((origin) => origin.trim());

app.use(helmet());
app.use(
  cors({ origin(origin, callback) { callback(null, !origin || allowedOrigins.includes(origin)); } }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (request, response) => {
  response.json({
    message: "API IndustriAlert",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ocorrencias", ocorrenciasRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/setores", setoresRoutes);
app.use("/api/maquinas", maquinasRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tipos-ocorrencia", tiposRoutes);

app.use((request, response) => response.status(404).json({ message: "Rota não encontrada." }));
app.use(errorHandler);

export default app;
