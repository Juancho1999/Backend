import { pool } from "../config/db.js";

// 👉 Obtener estadísticas anuales
export const obtenerEstadisticas = async (req, res) => {
  try {
    const anioActual = new Date().getFullYear().toString();
    
    // 1. Obtener pagos agrupados por mes del año actual
    const [pagosPorMes] = await pool.query(
      `SELECT 
        mes,
        COUNT(*) as cantidad,
        SUM(monto) as total
      FROM pagos 
      WHERE mes LIKE ? 
      GROUP BY mes 
      ORDER BY mes ASC`,
      [`${anioActual}-%`]
    );

    // 2. Total de socios únicos (histórico)
    const [totalSocios] = await pool.query(
      `SELECT COUNT(DISTINCT nombre) as total FROM pagos`
    );

    // 3. Pagos del mes actual
    const mesActual = `${anioActual}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const [pagosMesActual] = await pool.query(
      `SELECT COUNT(*) as cantidad, SUM(monto) as total FROM pagos WHERE mes = ?`,
      [mesActual]
    );

    // 4. Últimos 5 pagos de personas únicas
    const [ultimosPagos] = await pool.query(
      `SELECT DISTINCT nombre, alias, mes, MAX(id) as id, MAX(fecha_pago) as fecha_pago
       FROM pagos 
       GROUP BY nombre 
       ORDER BY id DESC 
       LIMIT 5`
    );

    // 5. Total recaudado en el año
    const totalAnual = pagosPorMes.reduce((acc, mes) => acc + parseFloat(mes.total || 0), 0);

    res.json({
      anio: anioActual,
      pagosPorMes: pagosPorMes.map(p => ({
        mes: p.mes,
        cantidad: parseInt(p.cantidad),
        total: parseFloat(p.total || 0)
      })),
      totalSociosHistoricos: parseInt(totalSocios[0].total),
      mesActual: {
        cantidad: parseInt(pagosMesActual[0].cantidad || 0),
        total: parseFloat(pagosMesActual[0].total || 0)
      },
      ultimosPagos: ultimosPagos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        alias: p.alias,
        mes: p.mes,
        fecha_pago: p.fecha_pago
      })),
      totalAnual
    });
  } catch (error) {
    console.error("Error en obtenerEstadisticas:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};
