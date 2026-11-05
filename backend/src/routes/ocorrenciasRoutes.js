import { Router } from "express";
import express from "express";
import { authenticate, allowRoles } from "../middlewares/auth.js";
import {
  list,
  create,
  detail,
  updateStatus,
  updateDetails,
  uploadEvidence,
  downloadEvidence,
  assignResponsible,
} from "../controllers/ocorrenciasController.js";
const router = Router();
router.use(authenticate);
router.get("/", list);
router.post("/", create);
router.get("/:id", detail);
router.patch(
  "/:id/responsavel",
  allowRoles("Administrador", "Gestor"),
  assignResponsible,
);
router.patch("/:id", updateDetails);
router.patch("/:id/status", updateStatus);
router.post(
  "/:id/evidencias",
  express.raw({ type: "multipart/form-data", limit: "5.1mb" }),
  uploadEvidence,
);
router.get("/:id/evidencias/:evidenceId", downloadEvidence);
export default router;
