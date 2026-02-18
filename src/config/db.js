// Importamos mysql2 con soporte para promesas
import mysql from "mysql2/promise";

import dotenv from "dotenv";

dotenv.config();


// Creamos un "pool" de conexiones a MySQL
// Esto nos permite reutilizar conexiones en vez de abrir una nueva en cada query
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false
});


