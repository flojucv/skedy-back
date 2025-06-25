#!/bin/bash

echo "🚀 Test du système de logging de l'API Skedy"
echo "=============================================="

# Démarrer l'API en arrière-plan
echo "📡 Démarrage de l'API..."
cd /Users/florian/Projet_dev/Baudimont/calendrier/skedy-api
node index.js &
API_PID=$!

# Attendre que l'API démarre
sleep 3

echo "🧪 Exécution des tests de logging..."

# Test 1: Route inexistante (404)
echo "Test 1: Route inexistante"
curl -s http://localhost:3000/route-inexistante > /dev/null

# Test 2: Tentative de connexion sans données
echo "Test 2: Login sans données"
curl -s -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{}' > /dev/null

# Test 3: Tentative d'accès sans token
echo "Test 3: Accès sans token"
curl -s http://localhost:3000/groups > /dev/null

# Test 4: Token invalide
echo "Test 4: Token invalide"
curl -s http://localhost:3000/groups \
  -H "Authorization: Bearer invalid_token" > /dev/null

echo "✅ Tests terminés!"

# Arrêter l'API
kill $API_PID

echo ""
echo "📋 Vérifiez les logs dans le dossier logs/ :"
ls -la logs/

echo ""
echo "📄 Dernières lignes du log du jour :"
TODAY=$(date +%Y-%m-%d)
if [ -f "logs/${TODAY}-all.log" ]; then
    tail -5 "logs/${TODAY}-all.log"
else
    echo "Aucun log trouvé pour aujourd'hui"
fi
