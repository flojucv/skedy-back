const mysql = require('mysql2/promise');
const logger = require('./logger');
require('dotenv').config();
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: process.env.DB_TIMEOUT || 60000
};

async function query(sql, params) {
    try {
        logger.debug('Exécution de requête SQL', { sql, params });
        const connection = await mysql.createConnection(config);
        const [results,] = await connection.execute(sql, params);

        await connection.destroy();
        logger.debug('Requête SQL exécutée avec succès', { 
            sql, 
            resultCount: Array.isArray(results) ? results.length : 'N/A' 
        });
        return results;
    } catch (error) {
        logger.error('Erreur lors de l\'exécution de la requête SQL', { 
            sql, 
            params, 
            error: error.message 
        });
        throw error;
    }
}

module.exports = {
    query
}