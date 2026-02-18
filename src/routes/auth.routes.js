import express from 'express';
import { login, obtenerPerfil, actualizarPerfil, cambiarPassword, solicitarRecupero, verificarTokenRecupero, restablecerPassword } from '../controllers/auth.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Endpoint real (cuando conectemos DB)
router.post('/login', login);

// Endpoints de perfil
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.post('/cambiar-password', verificarToken, cambiarPassword);

// Endpoints de recupero de contraseña
router.post('/solicitar-recupero', solicitarRecupero);
router.post('/verificar-token', verificarTokenRecupero);
router.post('/restablecer-password', restablecerPassword);

// Endpoint de prueba
router.get('/test', (req, res) => {
  res.json({ message: "Ruta de auth funcionando ✅" });
});

export default router;
