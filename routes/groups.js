const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const helper = require('../utils/helper');
require('dotenv').config();
const returnResponse = require('../utils/returnResponse');
const {adminPermission} = require('../middleware/verif_auth');

router.get('/groups', adminPermission, async (req, res) => {
    const query = 'SELECT id, label, color FROM T_group';
    const rows = await db.query(query);
    const data = await helper.emptyOrRows(rows);

    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Aucun groupe trouvé',
        en: 'No groups found'
    });

    return returnResponse.responseSucess(res, data, {
        fr: 'Groupes récupérés avec succès',
        en: 'Groups retrieved successfully'
    });
});

router.post('/group', adminPermission, async (req, res) => {
    const { label, color } = req.body;

    if (!label || !color) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Le label du groupe est requis',
        en: 'Group label is required'
    });

    const sql = 'SELECT id FROM T_group WHERE label = ?';
    const existingGroup = await db.query(sql, [label]);
    if (existingGroup.length > 0) return returnResponse.responseError(res, 'HTTP_CONFLICT', {
        fr: 'Un groupe avec ce label existe déjà',
        en: 'A group with this label already exists'
    });

    const insert = 'INSERT INTO T_group (label, color) VALUES (?, ?)';
    await db.query(insert, [label, color]);

    return returnResponse.responseSucess(res, {}, {
        fr: 'Groupe créé avec succès',
        en: 'Group created successfully'
    });
});

router.put('/group/:id', adminPermission, async (req, res) => {
    const groupId = req.params.id;
    const { label, color } = req.body;

    if (!label || !color) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Le label et la couleur du groupe sont requis',
        en: 'Group label and color are required'
    });

    const update = 'UPDATE T_group SET label = ?, color = ? WHERE id = ?';
    const response = await db.query(update, [label, color, groupId]);

    if (response.affectedRows === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Groupe non trouvé',
        en: 'Group not found'
    });

    return returnResponse.responseSucess(res, {}, {
        fr: 'Groupe mis à jour avec succès',
        en: 'Group updated successfully'
    });
});

router.delete('/group/:id', adminPermission, async (req, res) => {
    const groupId = req.params.id;

    if (!groupId) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'ID du groupe requis',
        en: 'Group ID is required'
    });

    const query = 'DELETE FROM T_group WHERE id = ?';
    const response = await db.query(query, [groupId]);

    if (response.affectedRows === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Groupe non trouvé',
        en: 'Group not found'
    });

    return returnResponse.responseSucess(res, {}, {
        fr: 'Groupe supprimé avec succès',
        en: 'Group deleted successfully'
    });
});

router.get('/group/:id', adminPermission, async (req, res) => {
    const groupId = req.params.id;

    if (!groupId) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'ID du groupe requis',
        en: 'Group ID is required'
    });

    const query = 'SELECT id, label, color FROM T_group WHERE id = ?';
    const rows = await db.query(query, [groupId]);
    const data = await helper.emptyOrRows(rows);

    if (data.length === 0) return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
        fr: 'Groupe non trouvé',
        en: 'Group not found'
    });

    return returnResponse.responseSucess(res, data[0], {
        fr: 'Groupe récupéré avec succès',
        en: 'Group retrieved successfully'
    });
});

module.exports = router;