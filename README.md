# 🚀 Skedy API

> API REST moderne et sécurisée pour la gestion de calendriers scolaires avec système de logging avancé.

---

<p align="left">
    <img src="https://img.shields.io/badge/API-REST-blue?style=flat-square" alt="API REST">
    <img src="https://img.shields.io/badge/Node.js-v20.17.0-339933?logo=node.js&logoColor=white&style=flat-square" alt="Node.js 20">
    <img src="https://img.shields.io/badge/Express-5.1.0-000000?logo=express&logoColor=white&style=flat-square" alt="Express">
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white&style=flat-square" alt="MySQL">
    <img src="https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white&style=flat-square" alt="JWT">
</p>

---

## 🚀 Fonctionnalités

### 🔐 Authentification & Sécurité
- Authentification JWT sécurisée
- Gestion des rôles et permissions (admin, write, read)
- Middleware de vérification d'autorisation
- Protection CORS configurée

### 📅 Gestion du Calendrier
- CRUD complet des événements
- Gestion des groupes d'événements
- Attribution par rôles et permissions
- Validation des données entrantes

### 👥 Gestion des Utilisateurs
- Système d'inscription et connexion
- Hashage sécurisé des mots de passe (bcrypt)
- Gestion des profils utilisateurs
- Attribution de rôles

### 📊 Système de Logging Avancé
- Logging automatique de toutes les requêtes HTTP
- Fichiers de logs séparés par jour et par type
- Logs de sécurité (tentatives de connexion, accès non autorisés)
- Logs de performance et d'erreurs
- Format JSON structuré pour l'analyse

## 🛠️ Installation

### Prérequis
- Node.js v20.17.0 ou supérieur
- MySQL 8.0 ou supérieur
- NPM 10.8.2 ou supérieur

### Étapes d'installation

1. **Clonez le projet**
```bash
git clone https://github.com/votre-username/skedy-api.git
cd skedy-api
```

2. **Installez les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
```bash
# Importez le schéma de base de données
mysql -u votre_utilisateur -p votre_base < database_2025-06-25.sql
```

4. **Configuration des variables d'environnement**
```bash
# Créez un fichier .env à la racine du projet
cp .env.example .env
```

Configurez les variables suivantes dans `.env` :
```env
# Base de données
DB_HOST=localhost
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=skedy_calendar
DB_TIMEOUT=60000

# JWT
JWT_SECRET=votre_secret_jwt_ultra_securise

# Serveur
PORT=3000
NODE_ENV=development

# Logging (optionnel)
DEBUG=true
```

## 💡 Utilisation en mode développement

1. **Démarrez l'API en mode développement**
```bash
npm run dev
# ou
node index.js
```

2. **Accédez à l'API**
```
Base URL: http://localhost:3000
```

3. **Testez le système de logging**
```bash
./test-logging.sh
```

4. **Consultez les logs**
```bash
# Logs du jour
tail -f logs/$(date +%Y-%m-%d)-all.log

# Erreurs uniquement
tail -f logs/$(date +%Y-%m-%d)-errors.log
```

## ⚙️ Utilisation en mode production

1. **Variables d'environnement production**
```env
NODE_ENV=production
DEBUG=false
PORT=3000
```

2. **Démarrage avec PM2 (recommandé)**
```bash
npm install -g pm2
pm2 start index.js --name "skedy-api"
pm2 startup
pm2 save
```

3. **Configuration reverse proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📡 API Endpoints

### Authentification
```http
POST /login          # Connexion utilisateur
POST /register       # Inscription (admin requis)
```

### Calendrier
```http
GET    /calendar/events      # Liste des événements
POST   /calendar/event       # Créer un événement
PUT    /calendar/event/:id   # Modifier un événement
DELETE /calendar/event/:id   # Supprimer un événement
```

### Groupes
```http
GET    /groups     # Liste des groupes (admin)
POST   /group      # Créer un groupe (admin)
PUT    /group/:id  # Modifier un groupe (admin)
DELETE /group/:id  # Supprimer un groupe (admin)
```

### Rôles
```http
GET    /roles     # Liste des rôles (admin)
POST   /role      # Créer un rôle (admin)
PUT    /role/:id  # Modifier un rôle (admin)
DELETE /role/:id  # Supprimer un rôle (admin)
```

## 🔑 Authentification

### Format des requêtes authentifiées
```http
Authorization: Bearer <votre_jwt_token>
Content-Type: application/json
```

### Exemple de connexion
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "motdepasse"
  }'
```

## 📊 Système de Logging

> [Voir le fichier explicatif du logging ici](./LOGGING.md)

### Monitoring recommandé
```bash
# Surveiller les erreurs en temps réel
tail -f logs/$(date +%Y-%m-%d)-errors.log

# Rotation automatique des logs (crontab)
0 0 * * * find /path/to/logs -name "*.log" -mtime +30 -delete
```

## 📦 Stack technique

### Backend
- **Node.js** v20.17.0 - Runtime JavaScript
- **Express.js** v5.1.0 - Framework web
- **MySQL2** v3.14.1 - Driver base de données
- **bcrypt** v6.0.0 - Hashage des mots de passe
- **jsonwebtoken** v9.0.2 - Authentification JWT
- **cors** v2.8.5 - Gestion CORS
- **dotenv** v16.5.0 - Variables d'environnement

### Architecture
- **RESTful API** - Architecture REST standard
- **JWT Authentication** - Authentification stateless
- **Middleware Pattern** - Gestion modulaire des requêtes
- **Custom Logging** - Système de logs personnalisé
- **Error Handling** - Gestion centralisée des erreurs

## 🔧 Développement

### Structure du projet
```
skedy-api/
├── index.js                 # Point d'entrée principal
├── routes/                  # Routes de l'API
│   ├── calendar.js         # Gestion des événements
│   ├── users.js            # Gestion des utilisateurs
│   ├── groups.js           # Gestion des groupes
│   └── role.js             # Gestion des rôles
├── utils/                   # Utilitaires
│   ├── db.js               # Connexion base de données
│   ├── logger.js           # Système de logging
│   ├── helper.js           # Fonctions d'aide
│   └── returnResponse.js   # Formatage des réponses
├── middleware/              # Middlewares
│   └── verif_auth.js       # Vérification d'authentification
├── logs/                   # Fichiers de logs (généré)
├── database_2025-06-25.sql # Schéma de base de données
└── test-logging.sh         # Script de test du logging
```

### Scripts disponibles
```bash
npm start          # Démarrage en production
npm run dev        # Démarrage en développement (avec nodemon)
npm test           # Tests (à implémenter)
./test-logging.sh  # Test du système de logging
```

## 📝 Licence

Ce projet est sous licence MIT.

> Pour tout problème rencontrez, vous pouvez [créer une issues via cette page](https://github.com/flojucv/skedy-back/issues)

## 🔗 Liens utiles

- **Frontend Skedy** : [skedy-front](https://github.com/flojucv/skedy-front.git)
- **Monitoring** : Consultez les logs dans `/logs`

---

> ⚠️ **Note importante** : Assurez-vous de configurer correctement les variables d'environnement avant le déploiement en production. Ne jamais exposer vos secrets JWT ou mots de passe de base de données.

---

© 2025 Skedy API. Tous droits réservés.
