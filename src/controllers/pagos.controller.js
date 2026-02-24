// src/controllers/pagos.controller.js
import { 
  obtenerPagosPorMes, 
  crearPago, 
  eliminarPago,
  obtenerTodosPagos,
  obtenerSociosUnicos,
  obtenerConfiguracion
} from "../config/firestore.js";
import { db } from "../config/firebase-admin.js";

// 👉 Agregar un nuevo pago
export const agregarPago = async (req, res) => {
  try {
    const { nombre, alias, mes } = req.body;

    // Validación básica
    if (!nombre || !mes) {
      return res.status(400).json({ message: "Faltan datos obligatorios (nombre, mes)" });
    }

    // 1. Verificar si ya existe un pago para este socio en este mes
    const pagosMes = await obtenerPagosPorMes(mes);
    const pagoExistente = pagosMes.find(p => p.nombre === nombre);

    if (pagoExistente) {
      return res.status(409).json({ 
        message: `El guerrero "${nombre}" ya tiene un pago registrado para ${mes}`,
        duplicate: true
      });
    }

    // 2. Traemos el monto fijo de la configuración
    const config = await obtenerConfiguracion();
    const monto = config.monto_cuota;

    // 3. Insertamos el pago
    const nuevoPago = await crearPago({ nombre, alias: alias || "", mes, monto });

    res.status(201).json({
      message: "Pago registrado con éxito",
      pago: { id: nuevoPago.id, nombre, alias, mes, monto },
    });
  } catch (error) {
    console.error("Error en agregarPago:", error);
    res.status(500).json({ message: "Error al registrar el pago" });
  }
};

// 👉 Obtener pagos por mes
export const obtenerPagosPorMes = async (req, res) => {
  try {
    const { mes } = req.params;

    // 1. Traemos todos los pagos de ese mes
    const pagos = await obtenerPagosPorMes(mes);

    // 2. Calcular totales
    const totalRecaudado = pagos.reduce((acc, pago) => acc + (parseFloat(pago.monto) || 0), 0);
    const cantidad = pagos.length;

    // 3. Total de socios únicos (histórico)
    const todosPagos = await obtenerTodosPagos();
    const sociosUnicos = new Set(todosPagos.map(p => p.nombre).filter(n => n));
    const totalSociosHistoricos = sociosUnicos.size;

    res.json({
      mes,
      cantidad,
      totalRecaudado,
      totalSociosHistoricos,
      pagos: pagos,
    });
  } catch (error) {
    console.error("Error en obtenerPagosPorMes:", error);
    res.status(500).json({ message: "Error al obtener los pagos" });
  }
};

// 👉 Obtener lista de nombres de socios únicos
export const obtenerSociosHistoricos = async (req, res) => {
  try {
    const pagos = await obtenerTodosPagos();
    
    // Obtener socios únicos con sus alias
    const sociosMap = new Map();
    pagos.forEach(p => {
      if (p.nombre) {
        if (!sociosMap.has(p.nombre)) {
          sociosMap.set(p.nombre, { nombre: p.nombre, alias: p.alias || "" });
        }
      }
    });

    const socios = Array.from(sociosMap.values()).sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );

    res.json(socios);
  } catch (error) {
    console.error("Error al obtener socios históricos:", error);
    res.status(500).json({ message: "Error al obtener socios históricos" });
  }
};

// 👉 Eliminar un pago
export const deletePago = async (req, res) => {
  const { id } = req.params;
  try {
    // En Firestore, verificamos si existe buscando en la colección
    const pagosSnapshot = await db.collection("pagos").doc(id).get();
    
    if (!pagosSnapshot.exists) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    await eliminarPago(id);

    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
