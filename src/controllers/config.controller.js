import { obtenerConfiguracion, actualizarConfiguracion } from "../config/firestore.js";

// Obtener monto fijo
export async function getMonto(req, res) {
  try {
    const config = await obtenerConfiguracion();
    res.json({ monto_cuota: config.monto_cuota });
  } catch (err) {
    console.error("Error al obtener monto:", err);
    res.status(500).json({ error: "Error al obtener monto" });
  }
}

// Actualizar monto fijo
export async function updateMonto(req, res) {
  const { monto_cuota } = req.body;
  try {
    await actualizarConfiguracion(monto_cuota);
    res.json({ message: "Monto actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar monto:", err);
    res.status(500).json({ error: "Error al actualizar monto" });
  }
}
