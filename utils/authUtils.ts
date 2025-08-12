import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl } from '../app/api';

export const storeAuthToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (e) {
    // Gestion d'erreur
    console.error('Erreur stockage token', e);
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (e) {
    console.error('Erreur lecture token', e);
    return null;
  }
};

export const storeUserData = async (user: any) => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (e) {
    console.error('Erreur stockage user', e);
  }
};

export const getUserData = async (): Promise<any | null> => {
  try {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    console.error('Erreur lecture user', e);
    return null;
  }
};

export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['token', 'user']);
  } catch (e) {
    console.error('Erreur suppression auth', e);
  }
};

// Rafraîchir le user depuis l'API (endpoint /auth/me)
export const fetchUserFromApi = async () => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Token manquant');
    const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.ME), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Erreur lors du rafraîchissement du profil');
    const data = await res.json();
    if (!data.success || !data.user) throw new Error('Utilisateur non trouvé');
    await storeUserData(data.user);
    return data.user;
  } catch (e) {
    console.error('Erreur fetchUserFromApi', e);
    throw e;
  }
};
