import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { API_CONFIG, buildApiUrl } from '../app/api';
import { router } from 'expo-router';
import { fetchWithRetry } from '../utils/apiUtils';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  accountType: 'Student' | 'Parent' | 'Admin';
  image?: string;
  children?: User[];
  parent?: string;
  active?: boolean;
  approved?: boolean;
  phoneVerified?: boolean;
  secretCode?: string;
  level?: string; // Pour les étudiants (CM1, CM2, etc.)
  studentId?: string; // Pour les étudiants
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAwaitingSecretCode: boolean;
  login: (
    phone: string,
    password: string,
  ) => Promise<{ requireSecretCode: boolean; phone?: string }>;
  verifySecretCode: (secretCode: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  sendRegistrationOTP: (phone: string) => Promise<void>;
  signupWithOTP: (
    phone: string,
    otp: string,
    userData: SignupData,
  ) => Promise<void>;
  createSecretCode: (secretCode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getUserStatus: () => Promise<any>;
}

interface SignupData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: 'Student' | 'Parent' | 'Admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAwaitingSecretCode, setIsAwaitingSecretCode] = useState(false);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  const isAuthenticated = useMemo(
    () => !!user && !!token && !isAwaitingSecretCode,
    [user, token, isAwaitingSecretCode],
  );

  // Fonction utilitaire pour vérifier les réponses d'API et gérer l'invalidité du token
  const handleApiResponse = async (response: Response) => {
    try {
      const data = await response.json();

      // Vérifier si le token est invalide
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

        // Réinitialiser l'état
        setUser(null);
        setToken(null);
        setIsAwaitingSecretCode(false);

        // Rediriger vers l'accueil
        router.replace('/');
        return null;
      }

      // Vérifier le status après la validation du token
      if (!response.ok) {
        console.log(`⚠️ Réponse HTTP non valide: ${response.status}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la lecture de la réponse JSON:', error);

      // Si on ne peut pas lire le JSON et que c'est une erreur 401, considérer le token comme invalide
      if (response.status === 401) {
        console.log('🔒 Erreur 401 détectée - déconnexion');

        await AsyncStorage.multiRemove([
          'token',
          'user',
          'awaitingSecretCode',
          'tempPhone',
        ]);

        setUser(null);
        setToken(null);
        setIsAwaitingSecretCode(false);
        router.replace('/');
      }

      return null;
    }
  };

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // ✅ Optimisation : useCallback pour éviter les re-renders
  const loadStoredAuth = useCallback(async () => {
    try {
      logger.log("🔄 Chargement des données d'authentification...");

      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const awaitingSecretCode =
        await AsyncStorage.getItem('awaitingSecretCode');
      const tempPhone = await AsyncStorage.getItem('tempPhone');

      logger.log('📱 Données trouvées:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        awaitingSecretCode,
        tempPhone,
      });

      if (awaitingSecretCode === 'true' && tempPhone) {
        // L'utilisateur est en attente de saisie du code secret
        const tempUser = {
          id: '',
          firstName: '',
          lastName: '',
          phone: tempPhone,
          accountType: 'Parent' as const,
        };
        setUser(tempUser);
        setIsAwaitingSecretCode(true);
        console.log('⏳ Mode attente code secret activé');
      } else if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAwaitingSecretCode(false);
        console.log(
          '✅ Authentification restaurée:',
          JSON.parse(storedUser).firstName || JSON.parse(storedUser).phone,
        );

        // Optionnel: rafraîchir les données utilisateur depuis le serveur
        try {
          await refreshUserFromServer(storedToken);
        } catch (e) {
          console.log(
            '⚠️ Impossible de rafraîchir depuis le serveur, utilisation des données locales',
          );
        }
      } else {
        logger.log('❌ Aucune session trouvée');
      }
    } catch (error) {
      logger.error("❌ Erreur lors du chargement de l'auth:", error);
      await AsyncStorage.multiRemove([
        'token',
        'user',
        'awaitingSecretCode',
        'tempPhone',
      ]); // Nettoyer en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Pas de dépendances car on utilise les setters

  const refreshUserFromServer = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;

    // Éviter les appels multiples
    if (isRefreshingUser) return;

    setIsRefreshingUser(true);
    try {
      const response = await fetchWithRetry(
        buildApiUrl('/profile/getUserDetails'),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      if (!data) return;

      if (data.success && (data.data || data.user)) {
        const updatedUser = data.data || data.user;
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('🔄 Données utilisateur mises à jour depuis le serveur');
      }
    } catch (error) {
      console.error('⚠️ Erreur lors du rafraîchissement:', error);
      // Ne pas lever d'erreur ici, utiliser les données locales
    } finally {
      setIsRefreshingUser(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Tentative de connexion pour:', phone);

      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone, password }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Si le login est réussi mais que l'utilisateur doit entrer son code secret
      if (data.requireSecretCode) {
        const tempUser = {
          id: '',
          firstName: '',
          lastName: '',
          phone: data.phone || phone,
          accountType: 'Parent' as const,
        };

        setUser(tempUser);
        setToken('');
        setIsAwaitingSecretCode(true);

        await AsyncStorage.setItem('tempPhone', data.phone || phone);
        await AsyncStorage.setItem('awaitingSecretCode', 'true');

        console.log('🔑 Code secret requis');
        return { requireSecretCode: true, phone: data.phone || phone };
      }

      // Login complet avec token
      if (data.token && data.user) {
        const { token: authToken, user: userData } = data;

        setToken(authToken);
        setUser(userData);
        setIsAwaitingSecretCode(false);

        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.removeItem('awaitingSecretCode');
        await AsyncStorage.removeItem('tempPhone');

        console.log(
          '✅ Connexion réussie:',
          userData.firstName || userData.phone,
        );
      }

      return { requireSecretCode: false };
    } catch (error) {
      console.error('❌ Erreur dans login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySecretCode = async (secretCode: string) => {
    try {
      setIsLoading(true);

      const tempPhone = await AsyncStorage.getItem('tempPhone');
      if (!tempPhone) {
        throw new Error('Aucune session de connexion active');
      }

      const response = await fetch(buildApiUrl('/auth/verify-secret-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: tempPhone, secretCode }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Code secret incorrect');
      }

      const { token: authToken, user: userData } = data;

      setToken(authToken);
      setUser(userData);
      setIsAwaitingSecretCode(false);

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.removeItem('awaitingSecretCode');
      await AsyncStorage.removeItem('tempPhone');

      console.log('✅ Code secret vérifié - connexion complète', {
        userId: userData?.id,
        userFirstName: userData?.firstName,
        accountType: userData?.accountType,
        hasToken: !!authToken,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du code secret:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendRegistrationOTP = async (phone: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(buildApiUrl('/auth/send-registration-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erreur lors de l'envoi de l'OTP");
      }

      console.log('✅ OTP envoyé avec succès');
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi de l'OTP:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOTP = async (
    phone: string,
    otp: string,
    userData: SignupData,
  ) => {
    try {
      setIsLoading(true);

      const response = await fetch(buildApiUrl('/auth/signup-with-otp'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          phone,
          otp,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      console.log('✅ Inscription avec OTP réussie');
      return data;
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription avec OTP:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createSecretCode = async (secretCode: string) => {
    try {
      if (!user?.phone) {
        throw new Error(
          'Aucune session active ou numéro de téléphone manquant',
        );
      }

      setIsLoading(true);

      const response = await fetch(buildApiUrl('/auth/create-secret-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: user.phone,
          secretCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.message || 'Erreur lors de la création du code secret',
        );
      }

      console.log('✅ Code secret créé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la création du code secret:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserStatus = async () => {
    try {
      if (!user || !token) {
        throw new Error('Aucune session active');
      }

      setIsLoading(true);

      const response = await fetch(buildApiUrl('/auth/user-status'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await handleApiResponse(response);
      if (!data) return;

      if (!data.success) {
        throw new Error(
          data.message || 'Erreur lors de la récupération du statut',
        );
      }

      return data.status;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      setIsLoading(true);

      const signupData = {
        ...userData,
        otp: '123456', // OTP de développement
      };

      console.log('📝 Inscription en cours...', signupData.phone);

      const response = await fetch(
        buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupData),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      console.log('✅ Inscription réussie');
    } catch (error) {
      console.error('❌ Erreur inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Déconnexion en cours...');
      setIsLoading(true);

      await AsyncStorage.multiRemove([
        'token',
        'user',
        'awaitingSecretCode',
        'tempPhone',
      ]);

      setUser(null);
      setToken(null);
      setIsAwaitingSecretCode(false);

      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) {
        throw new Error('Pas de token disponible');
      }

      // Éviter les appels multiples
      if (isLoading) return;

      console.log('🔄 Rafraîchissement des données utilisateur...');

      const response = await fetchWithRetry(
        buildApiUrl('/profile/getUserDetails'),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await handleApiResponse(response);
      if (!data) return;

      if (!data.success) {
        throw new Error(
          data.message || 'Erreur lors de la récupération du profil',
        );
      }

      const updatedUser = data.data || data.user;

      console.log('📊 Données utilisateur reçues du serveur:', {
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        image: updatedUser?.image,
        email: updatedUser?.email,
      });

      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      console.log('✅ Données utilisateur actualisées dans le contexte');
    } catch (e) {
      console.error('❌ Erreur lors du rafraîchissement:', e);
      // En cas d'erreur, déconnecter l'utilisateur
      await logout();
      router.replace('/');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    verifySecretCode,
    signup,
    sendRegistrationOTP,
    signupWithOTP,
    createSecretCode,
    logout,
    refreshUser,
    getUserStatus,
    isAuthenticated,
    isAwaitingSecretCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
