#!/bin/bash

echo "🔐 Génération du Keystore de Production - EduPlatform"
echo "=================================================="

# Commande pour générer le keystore
echo "Exécutez cette commande pour générer votre keystore de production:"
echo ""
echo "keytool -genkey -v \\"
echo "  -keystore eduplatform-release.keystore \\"
echo "  -alias eduplatform \\"
echo "  -keyalg RSA \\"
echo "  -keysize 2048 \\"
echo "  -validity 25000"
echo ""

echo "📋 Informations à renseigner:"
echo "   - Mot de passe du keystore: [CHOISISSEZ UN MOT DE PASSE FORT]"
echo "   - Nom et prénom: EduPlatform"  
echo "   - Unité organisationnelle: Mobile"
echo "   - Organisation: EduPlatform"
echo "   - Ville: [Votre ville]"
echo "   - État/Province: [Votre région]"
echo "   - Code pays: FR"
echo ""

echo "⚠️  IMPORTANT:"
echo "   - Notez bien le mot de passe choisi"
echo "   - Sauvegardez le fichier eduplatform-release.keystore"
echo "   - Ne partagez jamais ces informations"
echo ""

echo "📤 Pour obtenir les empreintes SHA (Firebase, Google APIs):"
echo "keytool -list -v -keystore eduplatform-release.keystore -alias eduplatform"
