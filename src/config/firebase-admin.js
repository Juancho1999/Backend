import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let db = null;
let app = null;

try {
  // Verificar si tenemos las credenciales
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (credentialsJson) {
    let serviceAccount;
    
    try {
      serviceAccount = JSON.parse(credentialsJson);
    } catch (parseError) {
      // Si falla el parseo, quizás está en formato de ruta de archivo
      console.error("Error parseando credenciales:", parseError.message);
      serviceAccount = null;
    }
    
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount)
      });
      db = getFirestore(app);
      console.log("✅ Firebase Admin inicializado correctamente");
    } else {
      console.log("⚠️ Firebase Admin: credenciales inválidas");
    }
  } else {
    console.log("⚠️ Firebase Admin: No hay GOOGLE_APPLICATION_CREDENTIALS");
  }
} catch (error) {
  console.error("❌ Error inicializando Firebase Admin:", error.message);
}

export { db, app };
