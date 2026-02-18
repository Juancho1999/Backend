import express from 'express';
import { obtenerEstadisticas } from "../controllers/estadisticas.controller.js";
import { verificarToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verificarToken, obtenerEstadisticas);

export default router;
