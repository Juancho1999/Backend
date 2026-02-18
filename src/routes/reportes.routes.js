import express from "express";
import { 
  obtenerAniosConPagos, 
  obtenerMesesPorAnio,
  obtenerReporteAnual
} from "../controllers/reportes.controller.js";

const router = express.Router();

router.get("/anios", obtenerAniosConPagos);
router.get("/meses/:anio", obtenerMesesPorAnio);
router.get("/anual/:anio", obtenerReporteAnual);

export default router;
