# 🚀 Guide Rapide - Génération de Keystore

## 1. Générer le Keystore de Production

Ouvrez un terminal et exécutez:

```bash
keytool -genkey -v \
  -keystore eduplatform-release.keystore \
  -alias eduplatform \
  -keyalg RSA \
  -keysize 2048 \
  -validity 25000
```

**Quand l'outil vous demande:**

- **Mot de passe du keystore**: Choisissez un mot de passe FORT
- **Nom et prénom**: `EduPlatform`
- **Unité organisationnelle**: `Mobile`
- **Organisation**: `EduPlatform`
- **Ville**: Votre ville
- **État**: Votre région/département
- **Code pays**: `FR`

## 2. Créer le Fichier Credentials

Copiez `credentials.example.json` vers `credentials.json`:

```bash
cp credentials.example.json credentials.json
```

Éditez `credentials.json` avec vos informations:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "./eduplatform-release.keystore",
      "keystorePassword": "VOTRE_MOT_DE_PASSE",
      "keyAlias": "eduplatform",
      "keyPassword": "VOTRE_MOT_DE_PASSE"
    }
  }
}
```

## 3. Build avec Keystore Local

```bash
eas build --platform android --local
```

## 4. Obtenir les Empreintes (pour Firebase)

```bash
keytool -list -v -keystore eduplatform-release.keystore -alias eduplatform
```

Copiez les valeurs **SHA1** et **SHA256** pour Firebase ou Google APIs.

---

## ⚠️ Sécurité

- **Sauvegardez** `eduplatform-release.keystore`
- **Notez** le mot de passe dans un gestionnaire sécurisé
- **Ne jamais** commiter le keystore ou credentials.json

---

✅ **C'est tout! Votre keystore est prêt pour signer l'application.**
