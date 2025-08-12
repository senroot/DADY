dady_school

# Compilation Android - EduPlatform

## Prérequis

1. **Compte Expo** - Créez un compte sur [expo.dev](https://expo.dev)
2. **EAS CLI** - Déjà installé dans ce projet
3. **Expo CLI** - Déjà installé dans ce projet

## Options de compilation

### Option 1: Build dans le cloud avec EAS (Recommandé)

#### Étape 1: Connexion à Expo

```bash
eas login
```

#### Étape 2: Configurer le projet

```bash
eas build:configure
```

#### Étape 3: Build APK pour test (Preview)

```bash
npm run preview:android
```

#### Étape 4: Build AAB pour production

```bash
npm run build:android
```

### Option 2: Build local (Development)

#### Pour développement avec Expo Go

```bash
npm run android
```

#### Export local pour Android

```bash
npm run build:android-local
```

## Types de builds disponibles

### Development Build

- Pour développement avec Expo Dev Client
- `eas build --profile development --platform android`

### Preview Build

- APK pour tests internes
- `eas build --profile preview --platform android`

### Production Build

- AAB pour Google Play Store
- `eas build --profile production --platform android`

## Téléchargement des builds

Après le build, vous pouvez:

1. Télécharger l'APK/AAB depuis le dashboard Expo
2. Recevoir le lien par email
3. Utiliser le QR code pour installation directe

## Publication sur Google Play Store

```bash
eas submit --platform android
```

## Configuration avancée

### Personnaliser l'icône

- Remplacez `assets/images/icon.png` (1024x1024)
- Remplacez `assets/images/adaptive-icon.png` (1024x1024)

### Modifier le nom de l'app

Éditez `app.json`:

```json
{
  "expo": {
    "name": "Votre Nom d'App",
    "android": {
      "package": "com.votre.package"
    }
  }
}
```

## Commandes utiles

```bash
# Voir l'état des builds
eas build:list

# Voir les détails d'un build
eas build:view [BUILD_ID]

# Voir les logs d'un build
eas build:view [BUILD_ID] --logs

# Annuler un build
eas build:cancel [BUILD_ID]
```

## Dépannage

### Erreur "Project not configured"

```bash
eas build:configure
```

### Build qui échoue

1. Vérifiez les logs avec `eas build:view [BUILD_ID] --logs`
2. Vérifiez la configuration dans `app.json` et `eas.json`
3. Assurez-vous que toutes les dépendances sont compatibles

### Problème de signature

Pour la production, assurez-vous d'avoir configuré les clés de signature dans le dashboard Expo.


# 📱 Guide de Compilation Android - EduPlatform

## ✅ Configuration Terminée

Votre application est maintenant configurée pour la compilation Android avec les éléments suivants:

### 🔧 Fichiers de Configuration

- ✅ `app.json` - Configuration Expo avec support Android
- ✅ `eas.json` - Configuration des builds EAS
- ✅ `package.json` - Scripts de build Android ajoutés
- ✅ Assets Android (icônes adaptatives)

### 📦 Scripts Disponibles

```bash
# Démarrer en mode développement Android
npm run android

# Build APK de test (via EAS)
eas build --platform android --profile preview

# Build AAB de production (via EAS)
eas build --platform android

# Build local avec votre keystore
eas build --platform android --local
```

## 🚀 Étapes de Compilation

### 1. Connexion à Expo (requis pour builds cloud)

```bash
eas login
```

### 2. Configuration initiale du projet

```bash
eas build:configure
```

### 3. Premier build de test (APK)

```bash
eas build --platform android --profile preview
```

### 4. Build de production (AAB pour Play Store)

```bash
eas build --platform android
```

## 📋 Types de Builds

| Type        | Commande                                         | Format | Usage                               |
| ----------- | ------------------------------------------------ | ------ | ----------------------------------- |
| Development | `eas build --profile development`                | APK    | Tests internes avec Expo Dev Client |
| Preview     | `eas build --platform android --profile preview` | APK    | Tests internes, partage             |
| Production  | `eas build --platform android`                   | AAB    | Publication Play Store              |

## 🎯 Options de Développement

### Option A: Expo Go (Plus Simple)

1. Installez l'app Expo Go sur votre téléphone
2. Lancez: `npm run dev`
3. Scannez le QR code

### Option B: Development Build (Plus Avancé)

1. Créez un development build: `eas build --profile development`
2. Installez l'APK sur votre appareil
3. Lancez: `npm run dev`

## 📱 Test sur Appareil Physique

1. **Via Expo Go**: Scannez le QR code
2. **Via APK de test**: Téléchargez et installez l'APK depuis le dashboard Expo
3. **Via ADB**: `adb install app.apk`

## 🔗 Liens Utiles

- **Dashboard Expo**: [expo.dev](https://expo.dev)
- **Google Play Console**: [play.google.com/console](https://play.google.com/console)
- **Documentation EAS**: [docs.expo.dev/build/introduction](https://docs.expo.dev/build/introduction)

## 🛠️ Dépannage

### Problème: Build qui échoue

```bash
# Voir les logs du build
eas build:list
eas build:view [BUILD_ID] --logs
```

### Problème: Erreur de configuration

```bash
# Reconfigurer le projet
eas build:configure
```

### Problème: Permissions Android

Vérifiez `app.json` pour les permissions requises par votre app.

## 📝 Notes importantes

1. **Compte Expo requis** pour les builds cloud
2. **Builds gratuits limités** - vérifiez votre quota
3. **Temps de build**: 5-15 minutes selon la complexité
4. **Notification par email** quand le build est terminé

---

🎉 **Votre application est prête pour la compilation Android!**

Commencez par `eas login` puis `eas build:configure` pour démarrer.
