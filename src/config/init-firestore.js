// Script para inicializar datos en Firestore - simplificado
import { db } from "./firebase-admin.js";

const COLECCIONES = {
  ADMIN: "admin",
  CONFIG: "configuracion",
  PAGOS: "pagos"
};

export const inicializarFirestore = async () => {
  if (!db) {
    console.log("❌ Sin conexión a Firebase");
    return;
  }
  
  console.log("🔧 Iniciando...");
  
  try {
    // Crear admin directamente (sobrescribir si existe)
    const hashAnterior = "$2b$10$Rdvn6.sDO/jwfMXn2r32lO43bKqMPQjTP4.PqBHH1IBvHOqgA2432"; // hash de "123456"
    
    // Intentar borrar admin existente
    const existingAdmin = await db.collection(COLECCIONES.ADMIN).where("email", "==", "admin@gym.com").get();
    if (!existingAdmin.empty) {
      existingAdmin.forEach(doc => doc.ref.delete());
      console.log("🗑️ Admin anterior borrado");
    }
    
    // Crear nuevo admin
    const docRef = await db.collection(COLECCIONES.ADMIN).add({
      email: "admin@gym.com",
      password: hashAnterior,
      nombre: "Administrador",
      createdAt: new Date().toISOString()
    });
    console.log("✅ Admin creado! ID:", docRef.id);
    
    // Crear configuración
    const existingConfig = await db.collection(COLECCIONES.CONFIG).limit(1).get();
    if (existingConfig.empty) {
      await db.collection(COLECCIONES.CONFIG).add({
        monto_cuota: 10000
      });
      console.log("✅ Config creada");
    }
    
    console.log("🎉 Todo listo!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};
