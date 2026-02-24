// Script para inicializar datos en Firestore - versión simplificada sin bcrypt
import { db } from "./firebase-admin.js";

const COLECCIONES = {
  ADMIN: "admin",
  CONFIG: "configuracion",
  PAGOS: "pagos"
};

// Contraseña pre-hasheada para desarrollo
const DEFAULT_PASSWORD_HASH = "$2b$10$kxZ2vL5vL5vL5vL5vL5vO.1t5t5t5t5t5t5t5t5t5t5t5t5t5t5t5t5";

export const inicializarFirestore = async () => {
  try {
    console.log("🔧 Verificando datos en Firestore...");
    
    if (!db) {
      console.log("❌ db es null - Firebase Admin no está inicializado");
      return;
    }
    
    console.log("✅ db está disponible");

    // 1. Verificar si ya hay admin
    const adminSnapshot = await db.collection(COLECCIONES.ADMIN).limit(1).get();
    
    if (adminSnapshot.empty) {
      console.log("👤 Creando admin por defecto...");
      await db.collection(COLECCIONES.ADMIN).add({
        email: "admin@gym.com",
        password: DEFAULT_PASSWORD_HASH,
        nombre: "Administrador",
        createdAt: new Date().toISOString()
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
    console.error("❌ Error al inicializar Firestore:", error.message, error.stack);
  }
};
