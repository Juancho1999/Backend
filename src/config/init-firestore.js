// Script para inicializar datos en Firestore
import { db } from "./firebase-admin.js";
import bcrypt from "bcrypt";

const COLECCIONES = {
  ADMIN: "admin",
  CONFIG: "configuracion",
  PAGOS: "pagos"
};

export const inicializarFirestore = async () => {
  try {
    console.log("🔧 Verificando datos en Firestore...");

    // 1. Verificar si ya hay admin
    const adminSnapshot = await db.collection(COLECCIONES.ADMIN).limit(1).get();
    
    if (adminSnapshot.empty) {
      console.log("👤 Creando admin por defecto...");
      const hash = await bcrypt.hash("123456", 10);
      await db.collection(COLECCIONES.ADMIN).add({
        email: "admin@gym.com",
        password: hash,
        nombre: "Administrador",
        createdAt: new Date()
      });
      console.log("✅ Admin creado: admin@gym.com / 123456");
    } else {
      console.log("✅ Admin ya existe");
    }

    // 2. Verificar si hay configuración
    const configSnapshot = await db.collection(COLECCIONES.CONFIG).limit(1).get();
    if (configSnapshot.empty) {
      await db.collection(COLECCIONES.CONFIG).add({
        monto_cuota: 10000
      });
      console.log("✅ Configuración inicial: $10.000");
    } else {
      console.log("✅ Configuración ya existe");
    }

    console.log("🎉 Firestore listo!");
  } catch (error) {
    console.error("❌ Error al inicializar Firestore:", error);
  }
};
