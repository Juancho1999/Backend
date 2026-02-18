import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { enviarEmailRecupero } from "../config/email.js";

console.log("JWT_SECRET:", process.env.JWT_SECRET);

// 👉 Login de administrador
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    

    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    // 1. Buscar admin por email
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const admin = rows[0];

     //2. Comparar contraseñas
    const esValido = await bcrypt.compare(password, admin.password);
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
    
    const [rows] = await pool.query(
      "SELECT id, email, nombre, telefono, imagen_perfil FROM admin WHERE id = ?",
      [adminId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    res.json(rows[0]);
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
    const [adminRows] = await pool.query("SELECT * FROM admin WHERE id = ?", [adminId]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    // Verificar si el email ya está en uso por otro admin
    if (email !== undefined) {
      const [emailRows] = await pool.query("SELECT id FROM admin WHERE email = ? AND id != ?", [email, adminId]);
      if (emailRows.length > 0) {
        return res.status(400).json({ message: "El email ya está en uso" });
      }
    }

    // Actualizar solo los campos proporcionados
    const campos = [];
    const valores = [];

    if (email !== undefined) {
      campos.push("email = ?");
      valores.push(email);
    }
    if (nombre !== undefined) {
      campos.push("nombre = ?");
      valores.push(nombre);
    }
    if (telefono !== undefined) {
      campos.push("telefono = ?");
      valores.push(telefono);
    }
    if (imagen_perfil !== undefined) {
      campos.push("imagen_perfil = ?");
      valores.push(imagen_perfil);
    }

    if (campos.length === 0) {
      return res.status(400).json({ message: "No se proporcionaron datos para actualizar" });
    }

    valores.push(adminId);

    await pool.query(
      `UPDATE admin SET ${campos.join(", ")} WHERE id = ?`,
      valores
    );

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
    const [rows] = await pool.query("SELECT password FROM admin WHERE id = ?", [adminId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    const admin = rows[0];

    // Verificar contraseña actual
    const esValido = await bcrypt.compare(password_actual, admin.password);
    if (!esValido) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_nueva, salt);

    // Actualizar contraseña
    await pool.query("UPDATE admin SET password = ? WHERE id = ?", [passwordHash, adminId]);

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
    const [rows] = await pool.query("SELECT id, email FROM admin WHERE email = ?", [email]);
    
    if (rows.length === 0) {
      // Si el email no existe, no hacemos nada (por seguridad no revelamos si existe)
      return res.json({ message: "Si el email está registrado, recibirás un enlace para restablecer tu contraseña." });
    }

    // Generar token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // Eliminar tokens anteriores para este email
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);

    // Guardar nuevo token
    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)",
      [email, token, expiresAt]
    );

    // Enviar email con el enlace de recupero
    const emailEnviado = await enviarEmailRecupero(email, token);

    // Siempre mostrar el enlace en consola para respaldo
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
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()",
      [email, token]
    );

    if (rows.length === 0) {
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
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()",
      [email, token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Token inválido o expirado" });
    }

    // Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password_nueva, salt);

    // Actualizar contraseña
    await pool.query("UPDATE admin SET password = ? WHERE email = ?", [passwordHash, email]);

    // Eliminar token usado
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);

    res.json({ message: "Contraseña restablecida correctamente. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("Error en restablecerPassword:", error);
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
};

