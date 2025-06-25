const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const helper = require('../utils/helper');
const logger = require('../utils/logger');
require('dotenv').config();
const returnResponse = require('../utils/returnResponse');
const {adminPermission, authenticateToken} = require('../middleware/verif_auth');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    logger.info('Tentative de connexion', { username });

    if (!username || !password) {
        logger.warn('Tentative de connexion avec des champs manquants', { username });
        return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
            fr: 'Nom d\'utilisateur et mot de passe requis',
            en: 'Username and password are required'
        });
    }

    try {
        const query = 'SELECT id, username, password FROM T_users WHERE username = ?';
        const row = await db.query(query, [username]);
        const data = await helper.emptyOrRows(row);
        
        if (data.length === 0) {
            logger.warn('Tentative de connexion avec un utilisateur inexistant', { username });
            return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
                fr: 'Nom d\'utilisateur ou mot de passe incorrect',
                en: 'Username or password is incorrect'
            });
        }

        const user = data[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn('Tentative de connexion avec un mot de passe incorrect', { username });
            return returnResponse.responseError(res, 'HTTP_UNAUTHORIZED', {
                fr: 'Nom d\'utilisateur ou mot de passe incorrect',
                en: 'Username or password is incorrect'
            });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
        logger.info('Connexion réussie', { username, userId: user.id });
        return returnResponse.responseSucess(res, { token }, {
            fr: 'Connexion réussie',
            en: 'Login successful'
        });
    } catch (error) {
        logger.error('Erreur lors de la connexion', { username, error: error.message });
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur interne du serveur',
            en: 'Internal server error'
        });
    }
});

router.post('/register', adminPermission, async (req, res) => {
    if(!req.body) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Aucune donnée reçue',
        en: 'No data received'
    });

    const { username, password, role_id, groups } = req.body;

    if (!username || !password || !role_id) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Nom d\'utilisateur, mot de passe et role requis',
        en: 'Username, password and role are required'
    });

    const query = 'SELECT id FROM T_users WHERE username = ?';
    const row = await db.query(query, [username]);
    const data = await helper.emptyOrRows(row);
    
    if (data.length > 0) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Nom d\'utilisateur déjà pris',
        en: 'Username already taken'
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const insert = 'INSERT INTO T_users (username, password, role_id) VALUES (?, ?, ?)';
    const response = await db.query(insert, [username, hashedPassword, role_id]);


    

    if( groups && groups.length > 0) {
        const placeholders = groups.map(() => '(?, ?)').join(', ');
        const values = groups.flatMap(group => [response.insertId, group]);
        const groupInsert = `INSERT INTO A_have_group (user_id, group_id) VALUES ${placeholders}`;
        const query = await db.query(groupInsert, values);
    }

    return returnResponse.responseSucess(res, {}, {
        fr: 'Utilisateur créé avec succès',
        en: 'User created successfully'
    });
});

router.get('/users', adminPermission, async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id,
                u.username,
                r.label AS role_label,
                r.id AS role_id,
                g.id AS group_id,
                g.label AS group_label,
                g.color AS group_color
            FROM T_users u
            INNER JOIN T_role r ON r.id = u.role_id
            LEFT JOIN A_have_group ahg ON u.id = ahg.user_id
            LEFT JOIN T_group g ON g.id = ahg.group_id
            ORDER BY u.id, g.label
        `;

        const rows = await db.query(query);
        const data = helper.emptyOrRows(rows);

        if (data.length === 0) {
            return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
                fr: 'Aucun utilisateur trouvé',
                en: 'No users found'
            });
        }

        // Regrouper les données par utilisateur
        const usersMap = new Map();

        data.forEach(row => {
            if (!usersMap.has(row.id)) {
                usersMap.set(row.id, {
                    id: row.id,
                    username: row.username,
                    role_label: row.role_label,
                    role_id: row.role_id,
                    groups: []
                });
            }

            // Ajouter le groupe s'il existe
            if (row.group_id) {
                usersMap.get(row.id).groups.push({
                    id: row.group_id,
                    label: row.group_label,
                    color: row.group_color
                });
            }
        });

        const usersWithGroups = Array.from(usersMap.values());

        return returnResponse.responseSucess(res, usersWithGroups, {
            fr: 'Utilisateurs récupérés avec succès',
            en: 'Users retrieved successfully'
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur serveur lors de la récupération des utilisateurs',
            en: 'Server error while retrieving users'
        });
    }
});

router.get('/user/:id', adminPermission, async (req, res) => {
    const userId = req.params.id;
    const query = 'SELECT T_users.id, username, T_role.label AS role_label, T_role.id AS role_id FROM T_users INNER JOIN T_role ON T_role.id = T_users.role_id WHERE T_users.id = ?';
    const row = await db.query(query, [userId]);
    const data = await helper.emptyOrRows(row);
    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Utilisateur non trouvé',
        en: 'User not found'
    });
    const user = data[0];
    user.groups = [];
    const groupQuery = 'SELECT group_id FROM A_have_group WHERE user_id = ?';
    const groups = await db.query(groupQuery, [user.id]);
    user.groups = helper.emptyOrRows(groups);
    return returnResponse.responseSucess(res, user, {
        fr: 'Utilisateur récupéré avec succès',
        en: 'User retrieved successfully'
    });
});

router.put('/user/:id', adminPermission, async (req, res) => {
    const jwtDecoded = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET);
    const userId = req.params.id;

    if (jwtDecoded.userId == userId) return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
        fr: 'Vous ne pouvez pas modifier cet utilisateur',
        en: 'You cannot modify this user'
    });

    const { username, role_id, groups } = req.body;

    if (!username || !role_id) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Nom d\'utilisateur et role requis',
        en: 'Username and role are required'
    });

    const query = 'SELECT id FROM T_users WHERE id = ?';
    const row = await db.query(query, [userId]);
    const data = await helper.emptyOrRows(row);
    
    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Utilisateur non trouvé',
        en: 'User not found'
    });

    const updateQuery = 'UPDATE T_users SET username = ?, role_id = ? WHERE id = ?';
    await db.query(updateQuery, [username, role_id, userId]);

    if (groups && groups.length > 0) {
        const deleteGroupsQuery = 'DELETE FROM A_have_group WHERE user_id = ?';
        await db.query(deleteGroupsQuery, [userId]);

        const placeholders = groups.map(() => '(?, ?)').join(', ');
        const values = groups.flatMap(group => [userId, group]);
        const groupInsert = `INSERT INTO A_have_group (user_id, group_id) VALUES ${placeholders}`;
        await db.query(groupInsert, values);
    }

    const updatedUserQuery = 'SELECT T_users.id, username, T_role.label AS role_label, T_role.id AS role_id FROM T_users INNER JOIN T_role ON T_role.id = T_users.role_id WHERE T_users.id = ?';
    const updatedRow = await db.query(updatedUserQuery, [userId]);
    const updatedData = await helper.emptyOrRows(updatedRow);
    if (updatedData.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Utilisateur non trouvé après mise à jour',
        en: 'User not found after update'
    });
    const updatedUser = updatedData[0];
    updatedUser.groups = [];
    const groupQuery = 'SELECT group_id FROM A_have_group WHERE user_id = ?';
    const resGroups = await db.query(groupQuery, [updatedUser.id]);
    updatedUser.groups = helper.emptyOrRows(resGroups);

    return returnResponse.responseSucess(res, updatedUser, {
        fr: 'Utilisateur mis à jour avec succès',
        en: 'User updated successfully'
    });
});

router.get('/user', authenticateToken, async (req, res) => {
    const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;

    const query = 'SELECT T_users.id, username, T_role.label AS role_label, T_role.id AS role_id FROM T_users INNER JOIN T_role ON T_role.id = T_users.role_id WHERE T_users.id = ?';
    const row = await db.query(query, [userId]);
    const data = await helper.emptyOrRows(row);
    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Utilisateur non trouvé',
        en: 'User not found'
    });
    const user = data[0];
    user.groups = [];
    const groupQuery = (user.role_id == 1) ? 'SELECT T_group.label AS label, T_group.id AS id FROM T_group' : 'SELECT T_group.label AS label, T_group.id AS id FROM A_have_group INNER JOIN T_group ON T_group.id = A_have_group.group_id WHERE A_have_group.user_id = ?';
    const groups = await db.query(groupQuery, [user.id]);
    user.groups = helper.emptyOrRows(groups);
    return returnResponse.responseSucess(res, user, {
        fr: 'Utilisateur récupéré avec succès',
        en: 'User retrieved successfully'
    });
})

router.delete('/user/:id', adminPermission, async (req, res) => {
    const userId = req.params.id;

    const query = 'SELECT id FROM T_users WHERE id = ?';
    const row = await db.query(query, [userId]);
    const data = await helper.emptyOrRows(row);

    if (data.length == 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Utilisateur non trouvé',
        en: 'User not found'
    });
    await dbnod.query('DELETE FROM A_have_group WHERE user_id = ?', [userId]);
    const deleteQuery = 'DELETE FROM T_users WHERE id = ?';
    await db.query(deleteQuery, [userId]);
    return returnResponse.responseSucess(res, {}, {
        fr: 'Utilisateur supprimé avec succès',
        en: 'User deleted successfully'
    });
});

router.get('/permissions/:permission', adminPermission, async (req, res) => {
    const permission = req.params.permission;
    const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;

    const query = 'SELECT permission FROM T_role INNER JOIN T_users ON T_role.id = T_users.role_id WHERE T_users.id = ?';
    const row = await db.query(query, [userId]);
    const data = await helper.emptyOrRows(row);
    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Permission non trouvée',
        en: 'Permission not found'
    });

    const userPermission = data[0].permission;
    if (userPermission.includes(permission)) return returnResponse.responseSucess(res, { hasPermission: true }, {
        fr: 'Permission accordée',
        en: 'Permission granted'
    });

    return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
        fr: 'Permission refusée',
        en: 'Permission denied'
    });
})
module.exports = router;
