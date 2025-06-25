const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
require("dotenv").config();

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Allow requests from your Angular app
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // If you need to send cookies or auth headers
}));

app.use(express.json()); // Pour parser le JSON

// Ajouter le middleware de logging
app.use(logger.middleware());

const routesPath = path.join(__dirname, "routes");

// Parcours tous les fichiers .js dans le dossier routes
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const route = require(path.join(routesPath, file));
    // On suppose que chaque fichier exporte un router Express
    app.use(route);
  }
});

const PORT = process.env.PORT || 3000;

app.use((req, res) => {
    logger.warn(`Ressource non trouvée: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress
    });
    
    res.status(404).json({
        error: true,
        messages: {
            fr: "La ressource demandée n'existe pas.",
            en: "The requested resource does not exist."
        }
    })
})

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`API démarrée sur http://localhost:${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});