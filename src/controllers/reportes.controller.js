import { obtenerTodosPagos, getAniosConPagos, getMesesPorAnio } from "../config/firestore.js";

// 👉 Obtener años con pagos
export const obtenerAniosConPagos = async (req, res) => {
  try {
    const anios = await getAniosConPagos();
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
    const meses = await getMesesPorAnio(anio);
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
    
    // Obtener todos los pagos
    const todosPagos = await obtenerTodosPagos();
    
    // Filtrar por año
    const pagosDelAnio = todosPagos.filter(p => p.mes && p.mes.startsWith(anio));
    
    // Agrupar por mes
    const mesesData = {};
    pagosDelAnio.forEach(p => {
      if (!mesesData[p.mes]) {
        mesesData[p.mes] = { cantidad_pagos: 0, total_recaudado: 0 };
      }
      mesesData[p.mes].cantidad_pagos++;
      mesesData[p.mes].total_recaudado += parseFloat(p.monto) || 0;
    });

    const rows = Object.keys(mesesData).sort().map(mes => ({
      mes,
      cantidad_pagos: mesesData[mes].cantidad_pagos,
      total_recaudado: mesesData[mes].total_recaudado
    }));

    // Calcular totales del año
    const totalPagosAnio = rows.reduce((acc, r) => acc + r.cantidad_pagos, 0);
    const totalRecaudadoAnio = rows.reduce((acc, r) => acc + r.total_recaudado, 0);

    // Obtener cantidad de personas únicas que pagaron en el año
    const personasUnicas = new Set(pagosDelAnio.map(p => p.nombre).filter(n => n));

    res.json({
      anio,
      meses: rows,
      totalPagos: totalPagosAnio,
      totalRecaudado: totalRecaudadoAnio,
      personasUnicas: personasUnicas.size,
    });
  } catch (error) {
    console.error("Error en obtenerReporteAnual:", error);
    res.status(500).json({ message: "Error al obtener reporte anual" });
  }
};
