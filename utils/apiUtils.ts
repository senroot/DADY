import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fonction utilitaire pour faire une requête avec retry et gestion d'erreur réseau
 */
export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 2,
): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`🌐 Tentative ${i + 1}/${retries + 1} - ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      console.error(`❌ Erreur tentative ${i + 1}:`, error.message);

      if (i === retries) {
        // Si c'est la dernière tentative, lancer l'erreur
        if (error.name === 'AbortError') {
          throw new Error(
            "Délai d'attente dépassé - Vérifiez votre connexion internet",
          );
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error(
            'Impossible de contacter le serveur - Vérifiez votre connexion internet',
          );
        } else {
          throw error;
        }
      }

      // Attendre avant de réessayer (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error('Toutes les tentatives ont échoué');
};

/**
 * Fonction utilitaire pour vérifier si une réponse API indique un token invalide
 * et rediriger vers la page d'accueil le cas échéant
 */
export const handleTokenValidation = async (data: any): Promise<boolean> => {
  if (!data.success && data.message === 'token is invalid') {
    console.log(
      "🔒 Token invalide détecté - déconnexion et redirection vers l'accueil",
    );

    // Nettoyer le stockage local
    await AsyncStorage.multiRemove([
      'token',
      'user',
      'awaitingSecretCode',
      'tempPhone',
    ]);

    // Rediriger vers l'accueil
    router.replace('/');
    return true; // Indique que le token était invalide
  }
  return false; // Token valide
};

/**
 * Fonction utilitaire pour faire une requête API avec gestion automatique du token invalide
 */
export const fetchWithTokenValidation = async (
  url: string,
  options: RequestInit,
  onTokenInvalid?: () => void,
): Promise<any> => {
  try {
    const response = await fetchWithRetry(url, options);

    // Toujours lire la réponse JSON d'abord pour vérifier le token
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(
        '❌ Erreur lecture JSON dans fetchWithTokenValidation:',
        jsonError,
      );

      // Si on ne peut pas lire le JSON et que c'est une erreur 401, considérer le token comme invalide
      if (response.status === 401) {
        console.log('🔒 Erreur 401 détectée dans fetchWithTokenValidation');
        await handleTokenValidation({
          success: false,
          message: 'token is invalid',
        });
        onTokenInvalid?.();
        return null;
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Vérifier si le token est invalide
    const isTokenInvalid = await handleTokenValidation(data);
    if (isTokenInvalid) {
      onTokenInvalid?.();
      return null;
    }

    // Vérifier le status après la validation du token
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
};
