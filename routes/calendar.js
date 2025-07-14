const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const logger = require('../utils/logger');
require('dotenv').config();
const returnResponse = require('../utils/returnResponse');
const { authenticateToken, adminPermission } = require('../middleware/verif_auth');

router.post('/calendar/event', authenticateToken, async (req, res) => {
    const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;

    logger.info('Tentative de création d\'événement', { userId });

    try {
        const verifSQL = `SELECT T_role.permission FROM T_users INNER JOIN T_role ON T_users.role_id = T_role.id WHERE T_users.id = ?`;
        const verif = await db.query(verifSQL, [userId]);
        if (verif.length === 0 || !(verif[0].permission.includes('write') || verif[0].permission.includes('admin'))) {
            logger.warn('Tentative de création d\'événement sans permissions', { userId });
            return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
                fr: 'Nom d\'utilisateur et role requis',
                en: 'Username and role are required'
            });
        }

        const { title, group_id, start, end } = req.body;

        if (!title || !group_id || !start || !end) {
            logger.warn('Tentative de création d\'événement avec des champs manquants', { userId, missingFields: { title: !title, group_id: !group_id, start: !start, end: !end } });
            return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
                fr: 'Titre, groupe, date de début et de fin requis',
                en: 'Title, group, start date and end date are required'
            });
        }

        const insertSQL = `INSERT INTO T_events (title, group_id, start, end, user_id) VALUES (?, ?, ?, ?, ?)`;
        await db.query(insertSQL, [title, group_id, start.slice(0, 19).replace('T', ' '), end.slice(0, 19).replace('T', ' '), userId]);
        
        logger.info('Événement créé avec succès', { 
            userId, 
            eventData: { title, group_id, start, end, userId }
        });

        return returnResponse.responseSucess(res, {}, {
            fr: 'Événement créé avec succès',
            en: 'Event created successfully'
        });
    } catch (error) {
        logger.error('Erreur lors de la création de l\'événement', {
            userId,
            error: error.message,
            eventData: req.body
        });
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur lors de la création de l\'événement',
            en: 'Error creating event'
        });
    }
});

router.put('/calendar/event/:id', authenticateToken, async (req, res) => {
    const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;
    const eventId = req.params.id;

    const verifSQL = `SELECT T_role.permission FROM T_users INNER JOIN T_role ON T_users.role_id = T_role.id WHERE T_users.id = ?`;
    const verif = await db.query(verifSQL, [userId]);
    if (verif.length === 0 || !(verif[0].permission.includes('write') || verif[0].permission.includes('admin'))) {
        return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
            fr: 'Nom d\'utilisateur et role requis',
            en: 'Username and role are required'
        });
    }

    const { title, group_id, start, end } = req.body;

    if (!title || !group_id || !start || !end) return returnResponse.responseError(res, 'HTTP_BAD_REQUEST', {
        fr: 'Titre, groupe, date de début et de fin requis',
        en: 'Title, group, start date and end date are required'
    });

    const updateSQL = `UPDATE T_events SET title = ?, group_id = ?, start = ?, end = ? WHERE id = ?`;
    try {
        await db.query(updateSQL, [title, group_id, start.slice(0, 19).replace('T', ' '), end.slice(0, 19).replace('T', ' '), eventId]);
        return returnResponse.responseSucess(res, {}, {
            fr: 'Événement mis à jour avec succès',
            en: 'Event updated successfully'
        });
    } catch (error) {
        console.error(error);
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur lors de la mise à jour de l\'événement',
            en: 'Error updating event'
        });
    }
});

router.get('/calendar/events', authenticateToken, async (req, res) => {
    try {
        const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;
        const startDate = req.query.start ? new Date(req.query.start.split('T')[0]) : new Date();
        const endDate = req.query.end ? new Date(req.query.end.split('T')[0]) : new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());

        // Vérifier si l'utilisateur est admin
        const verifSQL = `SELECT T_role.permission FROM T_users INNER JOIN T_role ON T_users.role_id = T_role.id WHERE T_users.id = ?`;
        const verif = await db.query(verifSQL, [userId]);
        const isAdmin = verif.length > 0 && verif[0].permission.includes('admin');

        let events;
        if (isAdmin) {
            // Si admin, afficher tous les événements qui se chevauchent avec la période
            const eventsSQL = "SELECT T_events.id, title, T_group.color AS color, T_group.label AS group_label, T_group.id AS group_id, start, end FROM T_events INNER JOIN T_group ON T_group.id = T_events.group_id WHERE start <= ? AND end >= ?";
            events = await db.query(eventsSQL, [endDate.toISOString().slice(0, 19).replace('T', ' '), startDate.toISOString().slice(0, 19).replace('T', ' ')]);
        } else {
            // Sinon, récupérer les groupes de l'utilisateur
            const userGroupsSQL = "SELECT group_id FROM A_have_group WHERE user_id = ?";
            const userGroups = await db.query(userGroupsSQL, [userId]);

            if (userGroups.length === 0) {
                // L'utilisateur n'appartient à aucun groupe
                return returnResponse.responseSucess(res, [], {
                    fr: 'Aucun événement disponible',
                    en: 'No events available'
                });
            }

            // Créer une liste des IDs de groupe pour la clause IN
            const groupIds = userGroups.map(group => group.group_id);
            const placeholders = groupIds.map(() => '?').join(',');

            // Récupérer uniquement les événements des groupes de l'utilisateur qui se chevauchent avec la période
            const eventsSQL = `SELECT T_events.id, title, T_group.color AS color, T_group.label AS group_label, T_group.id AS group_id, start, end 
                               FROM T_events 
                               INNER JOIN T_group ON T_group.id = T_events.group_id 
                               WHERE T_events.group_id IN (${placeholders}) AND start <= ? AND end >= ?`;

            events = await db.query(eventsSQL, [...groupIds, endDate.toISOString().slice(0, 19).replace('T', ' '), startDate.toISOString().slice(0, 19).replace('T', ' ')]);
        }

        return returnResponse.responseSucess(res, events, {
            fr: 'Événements récupérés avec succès',
            en: 'Events retrieved successfully'
        });
    } catch (error) {
        console.error(error);
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur lors de la récupération des événements',
            en: 'Error retrieving events'
        });
    }
});

router.delete('/calendar/event/:id', authenticateToken, async (req, res) => {
    const userId = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET).userId;
    const eventId = req.params.id;

    logger.info('Tentative de suppression d\'événement', { userId, eventId });

    try {
        // Vérifier les permissions de l'utilisateur
        const verifSQL = `SELECT T_role.permission FROM T_users INNER JOIN T_role ON T_users.role_id = T_role.id WHERE T_users.id = ?`;
        const verif = await db.query(verifSQL, [userId]);
        if (verif.length === 0 || !(verif[0].permission.includes('write') || verif[0].permission.includes('admin'))) {
            logger.warn('Tentative de suppression d\'événement sans permissions', { userId, eventId });
            return returnResponse.responseError(res, 'HTTP_FORBIDDEN', {
                fr: 'Permissions insuffisantes pour supprimer cet événement',
                en: 'Insufficient permissions to delete this event'
            });
        }

        // Vérifier si l'événement existe
        const eventExistsSQL = `SELECT id FROM T_events WHERE id = ?`;
        const eventExists = await db.query(eventExistsSQL, [eventId]);
        
        if (eventExists.length === 0) {
            logger.warn('Tentative de suppression d\'un événement inexistant', { userId, eventId });
            return returnResponse.responseError(res, 'HTTP_NOT_FOUND', {
                fr: 'Événement non trouvé',
                en: 'Event not found'
            });
        }

        // Supprimer l'événement
        const deleteSQL = `DELETE FROM T_events WHERE id = ?`;
        await db.query(deleteSQL, [eventId]);
        
        logger.info('Événement supprimé avec succès', { userId, eventId });
        
        return returnResponse.responseSucess(res, {}, {
            fr: 'Événement supprimé avec succès',
            en: 'Event deleted successfully'
        });
    } catch (error) {
        logger.error('Erreur lors de la suppression de l\'événement', { 
            userId, 
            eventId,
            error: error.message
        });
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur lors de la suppression de l\'événement',
            en: 'Error deleting event'
        });
    }
});

router.get('/calendar/export', adminPermission, async (req, res) => {
    try {
        const eventsSQL = "SELECT T_events.id, title, T_group.color AS color, T_group.label AS group_label, T_group.id AS group_id, start, end FROM T_events INNER JOIN T_group ON T_group.id = T_events.group_id";
        events = await db.query(eventsSQL);

        return returnResponse.responseSucess(res, events, {
            fr: 'Événements récupérés avec succès',
            en: 'Events retrieved successfully'
        });
    } catch (error) {
        console.error(error);
        return returnResponse.responseError(res, 'HTTP_INTERNAL_SERVER_ERROR', {
            fr: 'Erreur lors de la récupération des événements',
            en: 'Error retrieving events'
        });
    }
})
module.exports = router;