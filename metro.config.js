const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter les extensions de fichier TypeScript
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx');

module.exports = config;