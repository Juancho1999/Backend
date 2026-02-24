import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Credenciales desde variables de entorno (JSON stringificado)
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

let db = null;

try {
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    db = getFirestore();
    console.log("Firebase Admin inicializado correctamente");
  } else {
    console.log("Firebase Admin: No hay credenciales, usando modo desarrollo");
  }
} catch (error) {
  console.error("Error inicializando Firebase Admin:", error.message);
}

export { db };
