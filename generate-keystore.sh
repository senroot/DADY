#!/bin/bash

echo "🔐 Générateur de Keystore Android - EduPlatform"
echo "=============================================="

# Vérifier que keytool est disponible
if ! command -v keytool &> /dev/null; then
    echo "❌ keytool n'est pas trouvé. Assurez-vous que Java JDK est installé."
    exit 1
fi

echo "✅ keytool trouvé"
echo ""

# Menu de choix
echo "Choisissez le type de keystore à générer:"
echo "1. Debug keystore (pour développement)"
echo "2. Release keystore (pour production)"
echo "3. Afficher les informations d'un keystore existant"
echo ""

read -p "Votre choix (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Génération du keystore de debug..."
        
        keytool -genkey -v \
          -keystore debug.keystore \
          -alias androiddebugkey \
          -keyalg RSA \
          -keysize 2048 \
          -validity 10000 \
          -storepass android \
          -keypass android \
          -dname "CN=Android Debug, OU=Android, O=Android, L=Mountain View, ST=CA, C=US"
        
        echo "✅ Keystore de debug créé: debug.keystore"
        echo "📋 Mot de passe: android"
        echo "📋 Alias: androiddebugkey"
        ;;
        
    2)
        echo ""
        echo "🏭 Génération du keystore de production..."
        echo ""
        
        read -p "Nom de l'application (ex: EduPlatform): " APP_NAME
        read -p "Nom de l'organisation: " ORG_NAME
        read -p "Ville: " CITY
        read -p "Pays (code 2 lettres, ex: FR): " COUNTRY
        echo ""
        echo "⚠️  IMPORTANT: Notez bien ce mot de passe, vous ne pourrez pas le récupérer!"
        read -s -p "Mot de passe du keystore: " PASSWORD
        echo ""
        read -s -p "Confirmez le mot de passe: " PASSWORD_CONFIRM
        echo ""
        
        if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
            echo "❌ Les mots de passe ne correspondent pas!"
            exit 1
        fi
        
        KEYSTORE_NAME="${APP_NAME,,}-release.keystore"
        
        keytool -genkey -v \
          -keystore "$KEYSTORE_NAME" \
          -alias release \
          -keyalg RSA \
          -keysize 2048 \
          -validity 25000 \
          -storepass "$PASSWORD" \
          -keypass "$PASSWORD" \
          -dname "CN=$APP_NAME, OU=Mobile, O=$ORG_NAME, L=$CITY, C=$COUNTRY"
        
        echo "✅ Keystore de production créé: $KEYSTORE_NAME"
        echo "📋 Alias: release"
        echo ""
        echo "🔐 GARDEZ CES INFORMATIONS EN SÉCURITÉ:"
        echo "   - Fichier: $KEYSTORE_NAME"
        echo "   - Mot de passe: [CONFIDENTIEL]"
        echo "   - Alias: release"
        echo ""
        echo "📤 Pour obtenir les empreintes (Firebase, etc.):"
        echo "   keytool -list -v -keystore $KEYSTORE_NAME -alias release"
        ;;
        
    3)
        echo ""
        read -p "Chemin vers le keystore: " KEYSTORE_PATH
        
        if [ ! -f "$KEYSTORE_PATH" ]; then
            echo "❌ Fichier keystore non trouvé: $KEYSTORE_PATH"
            exit 1
        fi
        
        echo ""
        echo "📋 Informations du keystore:"
        keytool -list -v -keystore "$KEYSTORE_PATH"
        ;;
        
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

echo ""
echo "🎉 Opération terminée!"
