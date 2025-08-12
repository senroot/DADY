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
  forceReloadAuth: () => Promise<boolean>; // ✅ Nouvelle fonction
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
  console.log('🚀 AuthProvider: Composant monté/re-rendu');
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAwaitingSecretCode, setIsAwaitingSecretCode] = useState(false);
  const [isRefreshingUser, setIsRefreshingUser] = useState(false);

  console.log('📊 AuthProvider: État actuel:', {
    hasUser: !!user,
    userName: user?.firstName,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : null,
    isLoading,
    isAwaitingSecretCode
  });

  // Wrapper pour setUser avec logs
  const updateUser = (newUser: User | null) => {
    console.log('👤 AuthContext: updateUser appelé avec:', newUser ? `${newUser.firstName} (${newUser.children?.length || 0} enfants)` : 'null');
    setUser(newUser);
  };

  // Wrapper pour setToken avec logs  
  const updateToken = (newToken: string | null) => {
    console.log('🔑 AuthContext: updateToken appelé avec:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
    setToken(newToken);
  };

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
        updateUser(null);
        updateToken(null);
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

        updateUser(null);
        updateToken(null);
        setIsAwaitingSecretCode(false);
        router.replace('/');
      }

      return null;
    }
  };

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    console.log('🚀 AuthContext useEffect: Démarrage du chargement des données d\'authentification');
    loadStoredAuth();
  }, []); // Pas de dépendances pour éviter les boucles

  // ✅ NOUVELLE FONCTION : Force le rechargement des données depuis AsyncStorage
  const forceReloadAuth = useCallback(async () => {
    try {
      console.log('🔄 forceReloadAuth: Rechargement forcé des données d\'authentification...');
      
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      console.log('📱 forceReloadAuth: Données trouvées:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null,
        userName: storedUser ? JSON.parse(storedUser).firstName : null,
      });

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ forceReloadAuth: Restauration des données dans l\'AuthContext...');
        updateToken(storedToken);
        updateUser(parsedUser);
        setIsAwaitingSecretCode(false);
        console.log('✅ forceReloadAuth: Données restaurées avec succès!');
        return true;
      } else {
        console.log('❌ forceReloadAuth: Aucune donnée à restaurer');
        return false;
      }
    } catch (error) {
      console.error('❌ forceReloadAuth: Erreur lors du rechargement forcé:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Optimisation : useCallback pour éviter les re-renders
  const loadStoredAuth = useCallback(async () => {
    try {
      console.log("🔄 loadStoredAuth: Début du chargement des données d'authentification...");

      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const awaitingSecretCode =
        await AsyncStorage.getItem('awaitingSecretCode');
      const tempPhone = await AsyncStorage.getItem('tempPhone');

      console.log('📱 loadStoredAuth: Données trouvées dans AsyncStorage:', {
        hasToken: !!storedToken,
        tokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : null,
        hasUser: !!storedUser,
        userPreview: storedUser ? JSON.parse(storedUser).firstName : null,
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
        updateUser(tempUser);
        setIsAwaitingSecretCode(true);
        console.log('⏳ loadStoredAuth: Mode attente code secret activé pour:', tempPhone);
      } else if (storedToken && storedUser) {
        // Charger les données locales en premier
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ loadStoredAuth: Définition du token et user dans l\'état...');
        updateToken(storedToken);
        updateUser(parsedUser);
        setIsAwaitingSecretCode(false);
        console.log('✅ loadStoredAuth: Authentification restaurée depuis le stockage local:', {
          name: parsedUser.firstName || parsedUser.phone,
          childrenCount: parsedUser.children?.length || 0,
          tokenSet: !!storedToken
        });

        // APRÈS avoir chargé les données locales, essayer de rafraîchir depuis le serveur
        // Cela se fait en arrière-plan sans bloquer l'interface
        setTimeout(async () => {
          try {
            console.log('🔄 loadStoredAuth: Lancement du rafraîchissement serveur en arrière-plan...');
            await refreshUserFromServer(storedToken);
          } catch (e) {
            console.log(
              '⚠️ loadStoredAuth: Impossible de rafraîchir depuis le serveur, utilisation des données locales',
            );
          }
        }, 100); // Petit délai pour laisser l'interface se charger d'abord
      } else {
        console.log('❌ loadStoredAuth: Aucune session trouvée - storedToken:', !!storedToken, 'storedUser:', !!storedUser);
      }
    } catch (error) {
      console.error("❌ loadStoredAuth: Erreur lors du chargement de l'auth:", error);
      await AsyncStorage.multiRemove([
        'token',
        'user',
        'awaitingSecretCode',
        'tempPhone',
      ]); // Nettoyer en cas d'erreur
    } finally {
      console.log('🏁 loadStoredAuth: Définition de isLoading à false');
      setIsLoading(false);
    }
  }, []); // ✅ Pas de dépendances car on utilise les setters

  const refreshUserFromServer = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) {
      logger.log('❌ refreshUserFromServer: Pas de token disponible');
      return;
    }

    // Éviter les appels multiples
    if (isRefreshingUser) {
      logger.log('⚠️ refreshUserFromServer: Rafraîchissement déjà en cours');
      return;
    }

    logger.log('🔄 refreshUserFromServer: Début du rafraîchissement des données utilisateur');
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

      logger.log('📡 refreshUserFromServer: Réponse reçue, status:', response.status);

      const data = await handleApiResponse(response);
      if (!data) {
        logger.log('❌ refreshUserFromServer: handleApiResponse a retourné null');
        return;
      }

      logger.log('📋 refreshUserFromServer: Données reçues:', {
        success: data.success,
        hasData: !!(data.data || data.user),
        childrenCount: (data.data || data.user)?.children?.length || 0
      });

      if (data.success && (data.data || data.user)) {
        const updatedUser = data.data || data.user;
        updateUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        logger.log('✅ refreshUserFromServer: Données utilisateur mises à jour depuis le serveur');
      } else {
        logger.log('❌ refreshUserFromServer: Données non valides reçues du serveur');
      }
    } catch (error) {
      logger.error('⚠️ refreshUserFromServer: Erreur lors du rafraîchissement:', error);
      // Ne pas lever d'erreur ici, utiliser les données locales
    } finally {
      setIsRefreshingUser(false);
      logger.log('🏁 refreshUserFromServer: Terminé');
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

        updateUser(tempUser);
        updateToken('');
        setIsAwaitingSecretCode(true);

        await AsyncStorage.setItem('tempPhone', data.phone || phone);
        await AsyncStorage.setItem('awaitingSecretCode', 'true');

        console.log('🔑 Code secret requis');
        return { requireSecretCode: true, phone: data.phone || phone };
      }

      // Login complet avec token
      if (data.token && data.user) {
        const { token: authToken, user: userData } = data;

        updateToken(authToken);
        updateUser(userData);
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

      updateToken(authToken);
      updateUser(userData);
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

      updateUser(null);
      updateToken(null);
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

      updateUser(updatedUser);
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
    forceReloadAuth, // ✅ Nouvelle fonction exposée
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
