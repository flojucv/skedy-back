const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../utils/db');
const helper = require('../utils/helper');
const returnResponse = require('../utils/returnResponse');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
            fr: 'Token manquant ou mal formé',
            en: 'Missing or malformed token'
        });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const query = 'SELECT id FROM T_users WHERE id = ?';
        const rows = await db.query(query, [decoded.userId]);
        const results = helper.emptyOrRows(rows);
        if (results.length === 0) {
            return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
                fr: 'Token invalide',
                en: 'Invalid token'
            });
        }
        
        req.user = { id: results[0].id };
        next();
    } catch (error) {
        return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
            fr: 'Token invalide',
            en: 'Invalid token'
        });
    }
};

const adminPermission = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
            fr: 'Token manquant ou mal formé',
            en: 'Missing or malformed token'
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId };
    } catch (error) {
        return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
            fr: 'Token invalide',
            en: 'Invalid token'
        });
    }

    if (!req.user || !req.user.id) {
        return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
            fr: 'Token invalide',
            en: 'Invalid token'
        });
    }

    const query = 'SELECT T_role.permission FROM T_users INNER JOIN T_role ON T_role.id = T_users.role_id WHERE T_users.id = ?';
    const rows = await db.query(query, [req.user.id]);
    const results = helper.emptyOrRows(rows);
    
    if (results.length === 0 || !results[0].permission.includes('admin')) { // Assuming role_id 1 is admin
        return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
            fr: 'Accès interdit',
            en: 'Access forbidden'
        });
    }
    
    next();
}

module.exports = {authenticateToken, adminPermission};