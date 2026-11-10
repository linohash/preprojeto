import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { summary } from "../controllers/dashboardController.js";
const router = Router();
router.get("/", authenticate, summary);
export default router;
