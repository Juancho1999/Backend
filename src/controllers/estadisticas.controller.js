import { obtenerTodosPagos, obtenerPagosPorAnio, obtenerAniosConPagos, obtenerMesesPorAnio } from "../config/firestore.js";

// 👉 Obtener estadísticas anuales
export const obtenerEstadisticas = async (req, res) => {
  try {
    const anioActual = new Date().getFullYear().toString();
    
    // 1. Obtener todos los pagos
    const todosPagos = await obtenerTodosPagos();
    
    // 2. Pagos del año actual agrupados por mes
    const pagosAnioActual = todosPagos.filter(p => p.mes && p.mes.startsWith(anioActual));
    
    const pagosPorMes = {};
    pagosAnioActual.forEach(p => {
      if (!pagosPorMes[p.mes]) {
        pagosPorMes[p.mes] = { cantidad: 0, total: 0 };
      }
      pagosPorMes[p.mes].cantidad++;
      pagosPorMes[p.mes].total += parseFloat(p.monto) || 0;
    });

    const pagosPorMesArray = Object.keys(pagosPorMes).sort().map(mes => ({
      mes,
      cantidad: pagosPorMes[mes].cantidad,
      total: pagosPorMes[mes].total
    }));

    // 3. Total de socios únicos (histórico)
    const sociosUnicos = new Set(todosPagos.map(p => p.nombre).filter(n => n));
    const totalSociosHistoricos = sociosUnicos.size;

    // 4. Pagos del mes actual
    const mesActual = `${anioActual}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const pagosDelMes = pagosAnioActual.filter(p => p.mes === mesActual);
    const totalMesActual = pagosDelMes.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);

    // 5. Últimos 5 pagos de personas únicas
    const ultimosSocios = new Map();
    todosPagos.forEach(p => {
      if (p.nombre && !ultimosSocios.has(p.nombre)) {
        ultimosSocios.set(p.nombre, p);
      }
    });
    const ultimosPagos = Array.from(ultimosSocios.values())
      .sort((a, b) => new Date(b.fecha_pago || 0) - new Date(a.fecha_pago || 0))
      .slice(0, 5);

    // 6. Total recaudado en el año
    const totalAnual = Object.values(pagosPorMes).reduce((acc, m) => acc + m.total, 0);

    res.json({
      anio: anioActual,
      pagosPorMes: pagosPorMesArray,
      totalSociosHistoricos,
      mesActual: {
        cantidad: pagosDelMes.length,
        total: totalMesActual
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
