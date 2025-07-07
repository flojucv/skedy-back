# Système de Logging - Skedy API

## Vue d'ensemble

Le système de logging a été intégré dans **TOUS** les fichiers de l'API Skedy pour fournir un suivi complet des activités, des erreurs et des performances de l'application.

## ✅ Fichiers avec logging intégré

### Fichiers principaux
- **`index.js`** - Démarrage serveur, middleware global, gestion 404
- **`utils/logger.js`** - Module de logging central

### Routes
- **`routes/users.js`** - Authentification, gestion utilisateurs
- **`routes/calendar.js`** - Gestion des événements de calendrier
- **`routes/groups.js`** - Gestion des groupes
- **`routes/role.js`** - Gestion des rôles

### Utilitaires et Middleware
- **`utils/db.js`** - Requêtes base de données avec logging des erreurs SQL
- **`middleware/verif_auth.js`** - Authentification avec logging des tentatives d'accès

## Types de logs capturés

### 🔐 Sécurité et authentification
- Tentatives de connexion (réussies/échouées)
- Accès non autorisés
- Tokens invalides ou manquants
- Tentatives d'accès sans permissions

### 📊 Base de données
- Exécution des requêtes SQL (mode DEBUG)
- Erreurs de base de données
- Performance des requêtes

### 🌐 Requêtes HTTP
- Toutes les requêtes entrantes (automatique via middleware)
- Codes de statut et durées
- Adresses IP et User-Agent
- Erreurs 404 et autres codes d'erreur

### 📅 Métier
- Création/modification d'événements
- Gestion des groupes et rôles
- Actions administratives

## Fonctionnalités techniques

### Niveaux de log
- **INFO** : Informations générales (couleur cyan dans la console)
- **WARN** : Avertissements (couleur jaune dans la console)
- **ERROR** : Erreurs (couleur rouge dans la console)
- **DEBUG** : Messages de débogage (couleur magenta, visible uniquement en mode développement)

### Sorties de log
- **Console** : Affichage coloré en temps réel (tous les environnements)
- **Fichiers** : Stockage persistent dans le dossier `logs/` (production uniquement)
  - `YYYY-MM-DD-all.log` : Tous les logs du jour
  - `YYYY-MM-DD-errors.log` : Uniquement les erreurs du jour

> ⚠️ **Note** : Si DISABLE_FILE_LOGS= true, les logs ne sont affichés que dans la console et ne sont pas sauvegardés dans les fichiers.

### Middleware automatique
Le système capture automatiquement :
- Toutes les requêtes HTTP (méthode, URL, statut, durée)
- Adresse IP du client
- User-Agent
- Timestamp précis

## Utilisation

### Import du logger
```javascript
const logger = require('./utils/logger');
```

### Méthodes disponibles

#### Logs d'information
```javascript
logger.info('Message d\'information', { 
    userId: 123, 
    action: 'login' 
});
```

#### Logs d'avertissement
```javascript
logger.warn('Tentative de connexion échouée', { 
    username: 'john_doe',
    ip: req.ip 
});
```

#### Logs d'erreur
```javascript
logger.error('Erreur de base de données', { 
    error: error.message,
    query: 'SELECT * FROM users'
});
```

#### Logs de débogage
```javascript
logger.debug('Données reçues', { 
    requestBody: req.body 
});
```

### Intégration dans les routes

```javascript
router.post('/api/endpoint', async (req, res) => {
    try {
        logger.info('Début du traitement', { endpoint: '/api/endpoint' });
        
        // Votre logique métier
        const result = await someOperation();
        
        logger.info('Opération réussie', { 
            endpoint: '/api/endpoint',
            resultCount: result.length 
        });
        
        res.json(result);
    } catch (error) {
        logger.error('Erreur dans l\'endpoint', { 
            endpoint: '/api/endpoint',
            error: error.message,
            stack: error.stack 
        });
        
        res.status(500).json({ error: 'Erreur interne' });
    }
});
```

## Configuration

### Variables d'environnement pour le logging

#### Contrôle de l'écriture des logs
- `DISABLE_FILE_LOGS=true` : Désactive complètement l'écriture des logs dans les fichiers
- `LOG_MODE=console-only` : Mode console uniquement (équivalent à DISABLE_FILE_LOGS=true)
- `NODE_ENV=test` : Les logs ne sont pas écrits dans les fichiers en mode test

#### Autres options
- `NODE_ENV=development` : Active les logs DEBUG
- `DEBUG=true` : Force l'affichage des logs DEBUG même en production

### Exemples de configuration

#### Mode développement - Console uniquement
```env
NODE_ENV=development
DISABLE_FILE_LOGS=true
DEBUG=true
```

#### Mode développement - Avec fichiers de logs
```env
NODE_ENV=development
DISABLE_FILE_LOGS=false
DEBUG=true
```

#### Mode test - Pas de fichiers de logs
```env
NODE_ENV=test
DEBUG=false
```

#### Mode production - Logs complets
```env
NODE_ENV=production
DISABLE_FILE_LOGS=false
DEBUG=false
```

### Comportement selon la configuration

| Configuration | Console | Fichiers | Logs DEBUG |
|---------------|---------|----------|------------|
| `NODE_ENV=development` + `DISABLE_FILE_LOGS=true` | ✅ | ❌ | ✅ |
| `NODE_ENV=development` + `DISABLE_FILE_LOGS=false` | ✅ | ✅ | ✅ |
| `NODE_ENV=production` + `DISABLE_FILE_LOGS=false` | ✅ | ✅ | ❌ |
| `NODE_ENV=test` | ✅ | ❌ | ❌ |
| `LOG_MODE=console-only` | ✅ | ❌ | Selon NODE_ENV |

### Format des logs
Les logs sont stockés au format JSON pour faciliter l'analyse :
```json
{
  "timestamp": "2025-06-25T10:30:00.000Z",
  "level": "INFO",
  "message": "Connexion réussie",
  "username": "john_doe",
  "userId": 123
}
```

## Bonnes pratiques

### 1. Logs de sécurité
```javascript
// ✅ Bon
logger.warn('Tentative de connexion échouée', { username, ip: req.ip });

// ❌ Éviter
logger.info('Password:', password); // Ne jamais logger les mots de passe
```

### 2. Logs d'erreur
```javascript
// ✅ Bon
logger.error('Erreur de validation', { 
    error: error.message,
    field: 'email',
    value: 'invalid-email'
});

// ❌ Éviter
logger.error(error); // Perte du contexte
```

### 3. Logs de performance
```javascript
// ✅ Bon
const start = Date.now();
await heavyOperation();
logger.info('Opération terminée', { 
    operation: 'data-processing',
    duration: Date.now() - start 
});
```

### 4. Logs métier
```javascript
// ✅ Bon
logger.info('Nouvel utilisateur créé', { 
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role 
});
```

## Maintenance

### Rotation des logs
Les logs sont automatiquement organisés par jour. Pour une rotation automatique, vous pouvez ajouter un script de nettoyage :

```bash
# Supprimer les logs de plus de 30 jours
find logs/ -name "*.log" -mtime +30 -delete
```

### Monitoring
Surveillez régulièrement :
- La taille du dossier `logs/`
- Les erreurs fréquentes dans les fichiers d'erreur
- Les patterns suspects dans les logs d'accès

## Exemple complet d'intégration

Voici comment le système a été intégré dans la route de login :

```javascript
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
        // Logique de connexion...
        logger.info('Connexion réussie', { username, userId: user.id });
        // ...
    } catch (error) {
        logger.error('Erreur lors de la connexion', { 
            username, 
            error: error.message 
        });
        // ...
    }
});
```
