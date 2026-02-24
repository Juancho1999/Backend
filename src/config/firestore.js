// Helper para Firestore
import { db } from "./firebase-admin.js";

// Colecciones de Firestore
const COLECCIONES = {
  ADMIN: "admin",
  CONFIG: "configuracion",
  PAGOS: "pagos",
  PASSWORD_RESETS: "password_resets"
};

// ============ ADMIN ============

export const obtenerAdminPorEmail = async (email) => {
  const snapshot = await db.collection(COLECCIONES.ADMIN)
    .where("email", "==", email)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

export const crearAdmin = async (email, passwordHash) => {
  const docRef = await db.collection(COLECCIONES.ADMIN).add({
    email,
    password: passwordHash,
    createdAt: new Date()
  });
  return { id: docRef.id, email, password: passwordHash };
};

export const obtenerAdminPorId = async (id) => {
  const doc = await db.collection(COLECCIONES.ADMIN).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const actualizarAdmin = async (id, datos) => {
  await db.collection(COLECCIONES.ADMIN).doc(id).update(datos);
};

// ============ CONFIGURACIÓN ============

export const obtenerConfiguracion = async () => {
  const snapshot = await db.collection(COLECCIONES.CONFIG).limit(1).get();
  
  if (snapshot.empty) {
    // Crear configuración inicial
    const docRef = await db.collection(COLECCIONES.CONFIG).add({
      monto_cuota: 10000
    });
    return { id: docRef.id, monto_cuota: 10000 };
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

export const actualizarConfiguracion = async (monto_cuota) => {
  const snapshot = await db.collection(COLECCIONES.CONFIG).limit(1).get();
  
  if (snapshot.empty) {
    const docRef = await db.collection(COLECCIONES.CONFIG).add({ monto_cuota });
    return { id: docRef.id, monto_cuota };
  }
  
  const docId = snapshot.docs[0].id;
  await db.collection(COLECCIONES.CONFIG).doc(docId).update({ monto_cuota });
  return { id: docId, monto_cuota };
};

// ============ PAGOS ============

export const obtenerPagosPorMes = async (mes) => {
  const snapshot = await db.collection(COLECCIONES.PAGOS)
    .where("mes", "==", mes)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const crearPago = async (pago) => {
  const docRef = await db.collection(COLECCIONES.PAGOS).add({
    ...pago,
    fecha_pago: new Date()
  });
  return { id: docRef.id, ...pago };
};

export const eliminarPago = async (id) => {
  await db.collection(COLECCIONES.PAGOS).doc(id).delete();
};

export const obtenerTodosPagos = async () => {
  const snapshot = await db.collection(COLECCIONES.PAGOS)
    .orderBy("fecha_pago", "desc")
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const obtenerSociosUnicos = async () => {
  const snapshot = await db.collection(COLECCIONES.PAGOS).get();
  
  const nombres = new Set();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.nombre) nombres.add(data.nombre);
  });
  
  return Array.from(nombres).sort();
};

// ============ ESTADÍSTICAS ============

export const obtenerEstadisticas = async () => {
  const pagos = await obtenerTodosPagos();
  
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  
  // Pagos del mes actual
  const pagosMesActual = pagos.filter(p => p.mes === mesActual);
  
  // Total socios activos (con pago en el mes actual)
  const sociosActivos = pagosMesActual.length;
  
  // Total recaudado
  const totalRecaudado = pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
  
  // Mes actual
  const totalMesActual = pagosMesActual.reduce((sum, p) => sum + (p.monto || 0), 0);
  
  return {
    sociosActivos,
    totalRecaudado,
    totalMesActual,
    mesActual
  };
};

// ============ REPORTES ============

export const obtenerPagosPorAnio = async (anio) => {
  const pagos = await obtenerTodosPagos();
  
  return pagos.filter(p => p.mes && p.mes.startsWith(String(anio)));
};

export const obtenerAniosConPagos = async () => {
  const pagos = await obtenerTodosPagos();
  
  const anios = new Set();
  pagos.forEach(p => {
    if (p.mes && p.mes.length >= 4) {
      anios.add(p.mes.substring(0, 4));
    }
  });
  
  return Array.from(anios).sort().reverse();
};

export const obtenerMesesPorAnio = async (anio) => {
  const pagos = await obtenerPagosPorAnio(anio);
  
  const meses = new Set();
  pagos.forEach(p => {
    if (p.mes) meses.add(p.mes);
  });
  
  return Array.from(meses).sort().reverse();
};
