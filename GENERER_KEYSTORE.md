# 🔐 Génération d'un Keystore Android Local

## Prérequis

1. **Java JDK** installé sur votre système
2. **Outil keytool** (inclus avec Java)

## Vérifier Java

```bash
# Vérifier que Java est installé
java -version

# Vérifier que keytool est disponible
keytool -help
```

## Générer le Keystore

### 1. Création du keystore de debug (développement)

```bash
keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000
```

**Informations à renseigner:**

- Password: `android` (standard pour debug)
- Nom et prénom: `Android Debug`
- Unité organisationnelle: `Android`
- Organisation: `Android`
- Ville: `Mountain View`
- État: `CA`
- Code pays: `US`

### 2. Création du keystore de production

```bash
keytool -genkey -v -keystore release.keystore -alias release -keyalg RSA -keysize 2048 -validity 25000
```

**Informations importantes pour production:**

- **Password**: Choisissez un mot de passe FORT (gardez-le secret!)
- **Alias**: `release` (ou le nom de votre choix)
- Remplissez avec vos vraies informations d'organisation

### 3. Création avec paramètres personnalisés

```bash
keytool -genkey -v \
  -keystore eduplatform-release.keystore \
  -alias eduplatform \
  -keyalg RSA \
  -keysize 2048 \
  -validity 25000 \
  -storepass VOTRE_MOT_DE_PASSE \
  -keypass VOTRE_MOT_DE_PASSE \
  -dname "CN=EduPlatform, OU=Mobile, O=EduPlatform, L=Paris, ST=Ile-de-France, C=FR"
```

## Vérifier le Keystore

```bash
# Lister les certificats dans le keystore
keytool -list -v -keystore release.keystore

# Obtenir l'empreinte SHA1 et SHA256
keytool -list -v -keystore release.keystore -alias release
```

## Utilisation avec Expo/EAS

### 1. Configuration pour EAS Build

Créez un fichier `credentials.json`:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "./release.keystore",
      "keystorePassword": "VOTRE_MOT_DE_PASSE",
      "keyAlias": "release",
      "keyPassword": "VOTRE_MOT_DE_PASSE"
    }
  }
}
```

### 2. Build avec le keystore local

```bash
# Build avec credentials locales
eas build --platform android --local-credentials
```

### 3. Mettre à jour eas.json

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab",
        "credentialsSource": "local"
      }
    }
  }
}
```

## Scripts de Génération

### Script automatisé (debug)

```bash
#!/bin/bash
echo "🔐 Génération du keystore de debug..."

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
```

### Script automatisé (production)

```bash
#!/bin/bash
echo "🔐 Génération du keystore de production..."

read -p "Nom de l'application: " APP_NAME
read -p "Nom de l'organisation: " ORG_NAME
read -p "Ville: " CITY
read -p "Pays (code 2 lettres): " COUNTRY
read -s -p "Mot de passe du keystore: " PASSWORD
echo

keytool -genkey -v \
  -keystore "${APP_NAME,,}-release.keystore" \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 25000 \
  -storepass "$PASSWORD" \
  -keypass "$PASSWORD" \
  -dname "CN=$APP_NAME, OU=Mobile, O=$ORG_NAME, L=$CITY, C=$COUNTRY"

echo "✅ Keystore de production créé: ${APP_NAME,,}-release.keystore"
```

## Sécurité du Keystore

### ⚠️ **IMPORTANT - Sauvegarde**

1. **Sauvegardez votre keystore** dans un endroit sûr
2. **Ne jamais perdre le mot de passe**
3. **Ne jamais commiter le keystore dans Git**
4. **Utiliser un gestionnaire de mots de passe**

### .gitignore

Ajoutez à votre `.gitignore`:

```
# Keystores
*.keystore
*.jks
credentials.json
```

## Obtenir les Empreintes

### SHA1 et SHA256 (pour Firebase, Google APIs)

```bash
# SHA1
keytool -list -v -keystore release.keystore -alias release | grep SHA1

# SHA256
keytool -list -v -keystore release.keystore -alias release | grep SHA256
```

## Conversion de Format

### Convertir JKS vers PKCS12

```bash
keytool -importkeystore \
  -srckeystore release.keystore \
  -destkeystore release.p12 \
  -deststoretype PKCS12
```

## Dépannage

### Erreur "keytool command not found"

```bash
# Trouver Java
which java

# Ajouter au PATH (Linux/Mac)
export PATH=$PATH:$JAVA_HOME/bin

# Windows
set PATH=%PATH%;%JAVA_HOME%\bin
```

### Oublié le mot de passe

❌ **Impossible de récupérer** - Vous devez créer un nouveau keystore.

⚠️ **Pour production**: Cela signifie une nouvelle version de l'app sur le store.

---

🔐 **Votre keystore est maintenant prêt pour signer votre application Android!**
