const mysql = require('mysql2/promise');
require('dotenv').config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: process.env.DB_TIMEOUT || 60000
};

async function query(sql, params) {
    const connection = await mysql.createConnection(config);
    const [results,] = await connection.execute(sql, params);

    await connection.destroy();
    return results
}

module.exports = {
    query
}