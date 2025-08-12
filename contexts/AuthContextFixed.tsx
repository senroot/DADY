import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_CONFIG, buildApiUrl } from '../app/api';
import { 
  storeAuthToken, 
  getAuthToken, 
  storeUserData, 
  getUserData, 
  clearAuthData,
  fetchUserFromApi
} from '../utils/authUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  login: (phone: string, password: string) => Promise<{ requireSecretCode: boolean; phone?: string }>;
  verifySecretCode: (secretCode: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  sendRegistrationOTP: (phone: string) => Promise<void>;
  signupWithOTP: (phone: string, otp: string, userData: SignupData) => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAwaitingSecretCode, setIsAwaitingSecretCode] = useState(false);

  const isAuthenticated = !!user && !!token && !isAwaitingSecretCode;

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('🔄 Chargement des données d\'authentification...');
      
      const storedToken = await getAuthToken();
      const storedUser = await getUserData();
      const awaitingSecretCode = await AsyncStorage.getItem('awaitingSecretCode');
      const tempPhone = await AsyncStorage.getItem('tempPhone');
      
      console.log('📱 Données trouvées:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser, 
        awaitingSecretCode,
        tempPhone 
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
        setUser(storedUser);
        setIsAwaitingSecretCode(false);
        console.log('✅ Authentification restaurée:', storedUser.firstName || storedUser.phone);
        
        // Optionnel: rafraîchir les données utilisateur depuis le serveur
        try {
          await refreshUserFromServer(storedToken);
        } catch (e) {
          console.log('⚠️ Impossible de rafraîchir depuis le serveur, utilisation des données locales');
        }
      } else {
        console.log('❌ Aucune session trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'auth:', error);
      await clearAuthData(); // Nettoyer en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserFromServer = async (authToken?: string) => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return;
    
    try {
      const response = await fetch(buildApiUrl('/profile/getUserDetails'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
        },
      });

      const data = await response.json();

      if (data.success && (data.data || data.user)) {
        const updatedUser = data.data || data.user;
        setUser(updatedUser);
        await storeUserData(updatedUser);
        console.log('🔄 Données utilisateur mises à jour depuis le serveur');
      }
    } catch (error) {
      console.error('⚠️ Erreur lors du rafraîchissement:', error);
      // Ne pas lever d'erreur ici, utiliser les données locales
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Tentative de connexion pour:', phone);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

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
        
        await storeAuthToken(authToken);
        await storeUserData(userData);
        await AsyncStorage.removeItem('awaitingSecretCode');
        await AsyncStorage.removeItem('tempPhone');
        
        console.log('✅ Connexion réussie:', userData.firstName || userData.phone);
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
      
      await storeAuthToken(authToken);
      await storeUserData(userData);
      await AsyncStorage.removeItem('awaitingSecretCode');
      await AsyncStorage.removeItem('tempPhone');
      
      console.log('✅ Code secret vérifié - connexion complète');
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
        throw new Error(data.message || 'Erreur lors de l\'envoi de l\'OTP');
      }

      console.log('✅ OTP envoyé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'OTP:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOTP = async (phone: string, otp: string, userData: SignupData) => {
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
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      console.log('✅ Inscription avec OTP réussie');
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'inscription avec OTP:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createSecretCode = async (secretCode: string) => {
    try {
      if (!user?.phone) {
        throw new Error('Aucune session active ou numéro de téléphone manquant');
      }

      setIsLoading(true);
      
      const response = await fetch(buildApiUrl('/auth/create-secret-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: user.phone,
          secretCode 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création du code secret');
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
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du statut');
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
      
      // ✅ SÉCURISÉ: Ne pas inclure d'OTP hardcodé
      console.log('📝 Inscription en cours...', userData.phone);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData), // ✅ Utilise l'OTP fourni par l'utilisateur
      });

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
      
      await clearAuthData();
      await AsyncStorage.removeItem('awaitingSecretCode');
      await AsyncStorage.removeItem('tempPhone');
      
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
      console.log('🔄 Rafraîchissement des données utilisateur...');
      const userObj = await fetchUserFromApi();
      setUser(userObj);
      console.log('✅ Données utilisateur rafraîchies');
    } catch (e) {
      console.error('❌ Erreur lors du rafraîchissement:', e);
      // En cas d'erreur, déconnecter l'utilisateur
      await logout();
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
