import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { 
  obtenerAdminPorEmail, 
  obtenerAdminPorId, 
  crearAdmin, 
  actualizarAdmin 
} from "../config/firestore.js";
import { db } from "../config/firebase-admin.js";

console.log("JWT_SECRET:", process.env.JWT_SECRET);

// Colección para password_resets
const PASSWORD_RESETS = "password_resets";

// 👉 Login de administrador
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    // 1. Buscar admin por email en Firestore
    const admin = await obtenerAdminPorEmail(email);
    
    if (!admin) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 2. Comparar contraseñas (temporal: aceptar cualquier contraseña)
    // const esValido = await bcrypt.compare(password, admin.password);
    // Por ahora, aceptar cualquier contraseña
    const esValido = true;
    if (!esValido) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 3. Generar token JWT
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Login exitoso", 
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
        telefono: admin.telefono,
        imagen_perfil: admin.imagen_perfil
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno en el servidor" });
  }
};

// 👉 Obtener perfil del administrador
export const obtenerPerfil = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const admin = await obtenerAdminPorId(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    res.json({
      id: admin.id,
      email: admin.email,
      nombre: admin.nombre,
      telefono: admin.telefono,
      imagen_perfil: admin.imagen_perfil
    });
  } catch (error) {
    console.error("Error en obtenerPerfil:", error);
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};

// 👉 Actualizar perfil del administrador
export const actualizarPerfil = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { nombre, telefono, imagen_perfil, email } = req.body;

    // Verificar que el admin existe
    const adminExistente = await obtenerAdminPorId(adminId);
    if (!adminExistente) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    // Verificar si el email ya está en uso por otro admin
    if (email !== undefined && email !== adminExistente.email) {
      const adminConEmail = await obtenerAdminPorEmail(email);
      if (adminConEmail && adminConEmail.id !== adminId) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
    }

    // Actualizar solo los campos proporcionados
    const datosActualizar = {};
    if (email !== undefined) datosActualizar.email = email;
    if (nombre !== undefined) datosActualizar.nombre = nombre;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (imagen_perfil !== undefined) datosActualizar.imagen_perfil = imagen_perfil;

    if (Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({ message: "No se proporcionaron datos para actualizar" });
    }

    await actualizarAdmin(adminId, datosActualizar);

    res.json({ message: "Perfil actualizado correctamente" });
  } catch (error) {
    console.error("Error en actualizarPerfil:", error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

// 👉 Cambiar contraseña del administrador
export const cambiarPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { password_actual, password_nueva } = req.body;

    if (!password_actual || !password_nueva) {
      return res.status(400).json({ message: "Ambas contraseñas son requeridas" });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    // Obtener contraseña actual del admin
    const admin = await obtenerAdminPorId(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    // Verificar contraseña actual
    const esValido = await bcrypt.compare(password_actual, admin.password);
    if (!esValido) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_nueva, salt);

    // Actualizar contraseña
    await actualizarAdmin(adminId, { password: passwordHash });

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en cambiarPassword:", error);
    res.status(500).json({ message: "Error al cambiar contraseña" });
  }
};

// 👉 Solicitar recupero de contraseña
export const solicitarRecupero = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email es requerido" });
    }

    // Verificar si el email existe
    const admin = await obtenerAdminPorEmail(email);
    
    if (!admin) {
      // Si el email no existe, no hacemos nada (por seguridad)
      return res.json({ message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
    }

    // Generar token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Eliminar tokens anteriores para este email
    const tokensAnteriores = await db.collection(PASSWORD_RESETS)
      .where("email", "==", email)
      .get();
    
    for (const doc of tokensAnteriores.docs) {
      await doc.ref.delete();
    }

    // Guardar nuevo token
    await db.collection(PASSWORD_RESETS).add({
      email,
      token,
      expiresAt: expiresAt.toISOString()
    });

    // Mostrar enlace en consola
    console.log("═══════════════════════════════════════════");
    console.log("📧 ENLACE DE RECUPERO DE CONTRASEÑA:");
    console.log(`   http://localhost:5173/recuperar-password?token=${token}&email=${email}`);
    console.log("═══════════════════════════════════════════");

    res.json({ 
      message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." 
    });
  } catch (error) {
    console.error("Error en solicitarRecupero:", error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
};

// 👉 Verificar token de recupero
export const verificarTokenRecupero = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ message: "Token y email son requeridos" });
    }

    // Verificar token
    const snapshot = await db.collection(PASSWORD_RESETS)
      .where("email", "==", email)
      .where("token", "==", token)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Verificar que no haya expirado
    const doc = snapshot.docs[0];
    const data = doc.data();
    if (new Date(data.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    res.json({ message: "Token válido" });
  } catch (error) {
    console.error("Error en verificarTokenRecupero:", error);
    res.status(500).json({ message: "Error al verificar token" });
  }
};

// 👉 Restablecer contraseña con token
export const restablecerPassword = async (req, res) => {
  try {
    const { token, email, password_nueva } = req.body;

    if (!token || !email || !password_nueva) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    if (password_nueva.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar token
    const snapshot = await db.collection(PASSWORD_RESETS)
      .where("email", "==", email)
      .where("token", "==", token)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Verificar que no haya expirado
    if (new Date(data.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_nueva, salt);

    // Actualizar contraseña
    const admin = await obtenerAdminPorEmail(email);
    if (admin) {
      await actualizarAdmin(admin.id, { password: passwordHash });
    }

    // Eliminar token usado
    await doc.ref.delete();

    res.json({ message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en restablecerPassword:", error);
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
};
