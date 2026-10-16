const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones a MariaDB / MySQL (XAMPP)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    // Fechas como Date (comportamiento equivalente al de node-postgres)
    dateStrings: false,
    multipleStatements: false,
});

// mysql2 activa CLIENT_FOUND_ROWS por defecto: en un UPDATE, affectedRows cuenta
// las filas que coinciden con el WHERE (no solo las que cambiaron de valor), igual
// que el rowCount de node-postgres. De eso dependen los checks `rowCount === 0`.

// Normaliza el resultado de mysql2 al shape que usaba node-postgres:
//   SELECT  -> { rows: [...], rowCount: n }
//   INSERT/UPDATE/DELETE -> { rows: [], rowCount: affectedRows, insertId }
const shape = (result) => {
    if (Array.isArray(result)) {
        return { rows: result, rowCount: result.length };
    }
    return {
        rows: [],
        rowCount: result?.affectedRows ?? 0,
        affectedRows: result?.affectedRows ?? 0,
        insertId: result?.insertId,
    };
};

// pool.query(sql, params) -> { rows, rowCount, insertId }
const query = async (sql, params = []) => {
    const [result] = await pool.query(sql, params);
    return shape(result);
};

// Conexión dedicada para transacciones.
// Mantiene la API que usaban los controladores con node-postgres:
//   const client = await pool.connect();
//   await client.query('BEGIN'); ... 'COMMIT' / 'ROLLBACK';
//   client.release();
const connect = async () => {
    const conn = await pool.getConnection();
    return {
        async query(sql, params = []) {
            const kw = typeof sql === 'string' ? sql.trim().toUpperCase() : '';
            if (kw === 'BEGIN' || kw === 'START TRANSACTION') {
                await conn.beginTransaction();
                return { rows: [], rowCount: 0 };
            }
            if (kw === 'COMMIT')   { await conn.commit();   return { rows: [], rowCount: 0 }; }
            if (kw === 'ROLLBACK') { await conn.rollback(); return { rows: [], rowCount: 0 }; }
            const [result] = await conn.query(sql, params);
            return shape(result);
        },
        release() { conn.release(); },
    };
};

// Prueba de conexión al arrancar
pool.getConnection()
    .then((conn) => {
        console.log('✅ Conectado a MariaDB:', process.env.DB_NAME);
        conn.release();
    })
    .catch((err) => {
        console.error('❌ Error de conexión MySQL:', err.message);
    });

module.exports = { query, connect, pool };
