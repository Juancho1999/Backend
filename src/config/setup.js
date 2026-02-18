import { pool } from "./db.js";
import bcrypt from "bcrypt";

const crearHash = async () => {
  return await bcrypt.hash("123456", 10);
};

export const inicializarBaseDatos = async () => {
  try {
    console.log("🔧 Verificando estructura de la base de datos...");

    // Crear tablas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        monto_cuota DECIMAL(10,2) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        alias VARCHAR(50),
        mes VARCHAR(7) NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla para recupero de contraseñas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX (email),
        INDEX (token)
      )
    `);

    console.log("✅ Tablas creadas/verificadas");

    // Verificar si ya hay admin
    const [admins] = await pool.query("SELECT * FROM admin LIMIT 1");
    
    if (admins.length === 0) {
      console.log("👤 Creando admin por defecto...");
      const hash = await crearHash();
      await pool.query(
        "INSERT INTO admin (email, password) VALUES (?, ?)",
        ["admin@gym.com", hash]
      );
      console.log("✅ Admin creado: admin@gym.com / 123456");
    }

    // Verificar si hay configuración
    const [configs] = await pool.query("SELECT * FROM configuracion LIMIT 1");
    if (configs.length === 0) {
      await pool.query("INSERT INTO configuracion (monto_cuota) VALUES (10000.00)");
      console.log("✅ Configuración inicial creada: $10.000");
    }

    // Insertar datos de ejemplo si no hay pagos
    const [pagos] = await pool.query("SELECT COUNT(*) as total FROM pagos");
    if (pagos[0].total === 0) {
      console.log("📊 Insertando datos de ejemplo...");
      
      const datosEjemplo = [
        ['Juan Pérez', 'Juani', '2025-01', 10000],
        ['María García', 'Maru', '2025-01', 10000],
        ['Carlos López', 'Carlitos', '2025-01', 10000],
        ['Ana Martínez', 'Anita', '2025-01', 10000],
        ['Pedro Sánchez', 'Petete', '2025-01', 10000],
        ['Juan Pérez', 'Juani', '2025-02', 10000],
        ['María García', 'Maru', '2025-02', 10000],
        ['Carlos López', 'Carlitos', '2025-02', 10000],
        ['Laura Fernández', 'Lau', '2025-02', 10000],
        ['Juan Pérez', 'Juani', '2025-03', 10000],
        ['María García', 'Maru', '2025-03', 10000],
        ['Ana Martínez', 'Anita', '2025-03', 10000],
        ['Pedro Sánchez', 'Petete', '2025-03', 10000],
        ['Diego Rodríguez', 'Digo', '2025-03', 10000],
        ['Juan Pérez', 'Juani', '2025-04', 10000],
        ['María García', 'Maru', '2025-04', 10000],
        ['Carlos López', 'Carlitos', '2025-04', 10000],
        ['Laura Fernández', 'Lau', '2025-04', 10000],
        ['Sofía Gómez', 'Sofi', '2025-04', 10000],
        ['Juan Pérez', 'Juani', '2025-05', 10000],
        ['María García', 'Maru', '2025-05', 10000],
        ['Ana Martínez', 'Anita', '2025-05', 10000],
        ['Pedro Sánchez', 'Petete', '2025-05', 10000],
        ['Diego Rodríguez', 'Digo', '2025-05', 10000],
        ['Martín Herrera', 'Tincho', '2025-05', 10000],
        ['Juan Pérez', 'Juani', '2025-06', 10000],
        ['Carlos López', 'Carlitos', '2025-06', 10000],
        ['Laura Fernández', 'Lau', '2025-06', 10000],
        ['Sofía Gómez', 'Sofi', '2025-06', 10000],
        ['Valentina Torres', 'Vale', '2025-06', 10000],
        ['Juan Pérez', 'Juani', '2025-07', 15000],
        ['María García', 'Maru', '2025-07', 15000],
        ['Carlos López', 'Carlitos', '2025-07', 15000],
        ['Ana Martínez', 'Anita', '2025-07', 15000],
        ['Pedro Sánchez', 'Petete', '2025-07', 15000],
        ['Laura Fernández', 'Lau', '2025-07', 15000],
        ['Diego Rodríguez', 'Digo', '2025-07', 15000],
        ['Sofía Gómez', 'Sofi', '2025-07', 15000],
        ['Martín Herrera', 'Tincho', '2025-07', 15000],
        ['Valentina Torres', 'Vale', '2025-07', 15000],
      ];

      for (const dato of datosEjemplo) {
        await pool.query(
          "INSERT INTO pagos (nombre, alias, mes, monto) VALUES (?, ?, ?, ?)",
          dato
        );
      }
      console.log("✅ 40 pagos de ejemplo insertados");
    }

    console.log("🎉 Base de datos lista!");
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
  }
};
