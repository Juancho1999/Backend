import { pool } from "../config/db.js";

// 👉 Obtener años con pagos
export const obtenerAniosConPagos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT SUBSTRING(mes, 1, 4) as anio 
       FROM pagos 
       ORDER BY anio DESC`
    );

    const anios = rows.map(r => r.anio);
    res.json(anios);
  } catch (error) {
    console.error("Error en obtenerAniosConPagos:", error);
    res.status(500).json({ message: "Error al obtener años" });
  }
};

// 👉 Obtener meses disponibles para un año específico
export const obtenerMesesPorAnio = async (req, res) => {
  try {
    const { anio } = req.params;
    
    const [rows] = await pool.query(
      `SELECT DISTINCT mes 
       FROM pagos 
       WHERE mes LIKE ? 
       ORDER BY mes ASC`,
      [`${anio}-%`]
    );

    const meses = rows.map(r => r.mes);
    res.json(meses);
  } catch (error) {
    console.error("Error en obtenerMesesPorAnio:", error);
    res.status(500).json({ message: "Error al obtener meses" });
  }
};

// 👉 Obtener reporte anual (cantidad de personas y dinero por año)
export const obtenerReporteAnual = async (req, res) => {
  try {
    const { anio } = req.params;
    
    // Obtener resumen por mes del año especificado
    const [rows] = await pool.query(
      `SELECT 
         mes,
         COUNT(*) as cantidad_pagos,
         SUM(monto) as total_recaudado
       FROM pagos 
       WHERE mes LIKE ? 
       GROUP BY mes 
       ORDER BY mes ASC`,
      [`${anio}-%`]
    );

    // Calcular totales del año
    const totalPagosAnio = rows.reduce((acc, r) => acc + parseInt(r.cantidad_pagos), 0);
    const totalRecaudadoAnio = rows.reduce((acc, r) => acc + parseFloat(r.total_recaudado || 0), 0);

    // Obtener cantidad de personas únicas que pagaron en el año
    const [sociosAnio] = await pool.query(
      `SELECT COUNT(DISTINCT nombre) as cantidad_personas 
       FROM pagos 
       WHERE mes LIKE ?`,
      [`${anio}-%`]
    );

    res.json({
      anio,
      meses: rows,
      totalPagos: totalPagosAnio,
      totalRecaudado: totalRecaudadoAnio,
      personasUnicas: sociosAnio[0]?.cantidad_personas || 0,
    });
  } catch (error) {
    console.error("Error en obtenerReporteAnual:", error);
    res.status(500).json({ message: "Error al obtener reporte anual" });
  }
};
