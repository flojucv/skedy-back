const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const helper = require('../utils/helper');
const logger = require('../utils/logger');
require('dotenv').config();
const returnResponse = require('../utils/returnResponse');
const {adminPermission} = require('../middleware/verif_auth');

router.get('/roles', adminPermission, async (req, res) => {
    logger.info('Récupération de la liste des rôles');
    
    try {
        const query = 'SELECT id, label, permission FROM T_role';
        const rows = await db.query(query);
        const data = await helper.emptyOrRows(rows);

        if (data.length === 0) {
            logger.warn('Aucun rôle trouvé dans la base de données');
            return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
                fr: 'Aucun rôle trouvé',
                en: 'No roles found'
            });
        }

        logger.info('Rôles récupérés avec succès', { roleCount: data.length });
        return returnResponse.responseSucess(res, data, {
            fr: 'Rôles récupérés avec succès',
            en: 'Roles retrieved successfully'
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des rôles', { error: error.message });
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur interne du serveur',
            en: 'Internal server error'
        });
    }
});

router.post('/role', adminPermission, async (req, res) => {
    const { label, permission } = req.body;

    if (!label || !permission) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Le label et les permissions du rôle est requis',
        en: 'Role label and permissions are required'
    });

    const sql = 'SELECT id FROM T_role WHERE label = ?';
    const existingRole = await db.query(sql, [label]);
    if (existingRole.length > 0) return returnResponse.responseError(res, 'HTTP_CONFLICT', {
        fr: 'Un rôle avec ce label existe déjà',
        en: 'A role with this label already exists'
    });

    const insert = 'INSERT INTO T_role (label, permission) VALUES (?, ?)';
    await db.query(insert, [label, permission || '']);

    return returnResponse.responseSucess(res, {}, {
        fr: 'Rôle créé avec succès',
        en: 'Role created successfully'
    });
});

router.put('/role/:id', adminPermission, async (req, res) => {
    const roleId = req.params.id;
    const { label, permission } = req.body;

    if (!label || !permission) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Le label et les permission du rôle est requis',
        en: 'Role label and permission are required'
    });

    const update = 'UPDATE T_role SET label = ?, permission = ? WHERE id = ?';
    const response = await db.query(update, [label, permission, roleId]);

    if (response.affectedRows === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Rôle non trouvé',
        en: 'Role not found'
    });

    return returnResponse.responseSucess(res, {}, {
        fr: 'Rôle mis à jour avec succès',
        en: 'Role updated successfully'
    });
});

router.delete('/role/:id', adminPermission, async (req, res) => {
    const roleId = req.params.id;

    if(!roleId) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'ID du rôle requis',
        en: 'Role ID is required'
    });

    if(roleId === '1') return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
        fr: 'Le rôle administrateur ne peut pas être supprimé',
        en: 'The admin role cannot be deleted'
    });

    const deleteQuery = 'DELETE FROM T_role WHERE id = ?';
    const response = await db.query(deleteQuery, [roleId]);

    if (response.affectedRows === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Rôle non trouvé',
        en: 'Role not found'
    });

    return returnResponse.responseSucess(res, {}, {
        fr: 'Rôle supprimé avec succès',
        en: 'Role deleted successfully'
    });
});

router.get('/role/:id', adminPermission, async (req, res) => {
    const roleId = req.params.id;

    if (!roleId) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'ID du rôle requis',
        en: 'Role ID is required'
    });

    const query = 'SELECT id, label, permission FROM T_role WHERE id = ?';
    const rows = await db.query(query, [roleId]);
    const data = await helper.emptyOrRows(rows);

    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Rôle non trouvé',
        en: 'Role not found'
    });

    return returnResponse.responseSucess(res, data[0], {
        fr: 'Rôle récupéré avec succès',
        en: 'Role retrieved successfully'
    });
});

module.exports = router;