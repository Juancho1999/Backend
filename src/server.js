import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import configRoutes from "./routes/config.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import estadisticasRoutes from "./routes/estadisticas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
import { inicializarFirestore } from "./config/init-firestore.js";
import { db } from "./config/firebase-admin.js";

// ✅ Configuración de CORS
const allowedOrigins = [
  "http://localhost:5173",         // React local
  "https://viggo-gym.netlify.app",  // Frontend en Netlify
  "https://backend-production-08b3.up.railway.app",  // Backend en Railway
  "https://backend-nine-sigma-24.vercel.app",  // Backend en Vercel
  "https://backend-jz4ljhl6q-juans-projects-fd1bd95b.vercel.app"  // Otro backend en Vercel
];

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS no permitido"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/configuracion", configRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/reportes", reportesRoutes);

// Endpoint raíz para testear server
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀 con Firebase");
});


const PORT = process.env.PORT || 4000;

// ✅ Para Vercel: exportar app
if (process.env.VERCEL) {
  // En Vercel, la inicialización se hace en cada request
  if (db) {
    inicializarFirestore();
  }
} else {
  // Local/Railway: servidor normal
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });

  if (db) {
    inicializarFirestore();
  }
}

export default app;
