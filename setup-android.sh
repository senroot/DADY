#!/bin/bash

echo "🚀 Configuration de l'application Android - EduPlatform"
echo "================================================="

# Vérifier si EAS CLI est installé
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé"
    echo "📦 Installation d'EAS CLI..."
    npm install -g eas-cli
fi

# Vérifier si Expo CLI est installé  
if ! command -v expo &> /dev/null; then
    echo "❌ Expo CLI n'est pas installé"
    echo "📦 Installation d'Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ Outils installés!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Connectez-vous à Expo: eas login"
echo "2. Configurez le projet: eas build:configure"
echo "3. Lancez un build de test: npm run preview:android"
echo ""
echo "📖 Consultez BUILD_ANDROID.md pour plus de détails"
