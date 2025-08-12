import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_CONFIG, buildApiUrl } from '../app/api';
import { 
  storeAuthToken, 
  getAuthToken, 
  storeUserData, 
  getUserData, 
  clearAuthData 
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
  login: (phone: string, password: string) => Promise<{ requireSecretCode: boolean; phone?: string }>;
  verifySecretCode: (secretCode: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  sendRegistrationOTP: (phone: string) => Promise<void>;
  signupWithOTP: (phone: string, otp: string, userData: SignupData) => Promise<void>;
  createSecretCode: (secretCode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getUserStatus: () => Promise<any>;
  isAuthenticated: boolean;
  isAwaitingSecretCode: boolean;
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

  // Protection contre les re-calculs inutiles
  const isAuthenticated = useMemo(() => 
    !!user && !!token && !isAwaitingSecretCode, 
    [user, token, isAwaitingSecretCode]
  );

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await getAuthToken();
      const storedUser = await getUserData();
      const awaitingSecretCode = await AsyncStorage.getItem('awaitingSecretCode');
      const tempPhone = await AsyncStorage.getItem('tempPhone');
      
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
      } else if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAwaitingSecretCode(false);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      
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
        // Créer un utilisateur temporaire avec les infos de base
        const tempUser = {
          id: '',
          firstName: '',
          lastName: '',
          phone: data.phone || phone,
          accountType: 'Parent' as const,
        };
        
        setUser(tempUser);
        setToken(''); // Pas de token encore, on l'aura après vérification du code secret
        setIsAwaitingSecretCode(true);
        
        await AsyncStorage.setItem('tempPhone', data.phone || phone);
        await AsyncStorage.setItem('awaitingSecretCode', 'true');
        
        // Retourner un indicateur que le code secret est requis
        return { requireSecretCode: true, phone: data.phone || phone };
      }

      // Login complet (ne devrait pas arriver avec notre backend actuel)
      const { token: authToken, user: userData } = data;
      
      setToken(authToken);
      setUser(userData);
      setIsAwaitingSecretCode(false);
      
      await storeAuthToken(authToken);
      await storeUserData(userData);
      await AsyncStorage.removeItem('awaitingSecretCode');
      
      return { requireSecretCode: false };
    } catch (error) {
      console.error('❌ Erreur dans AuthContext.login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySecretCode = async (secretCode: string) => {
    try {
      setIsLoading(true);
      
      // Récupérer le numéro de téléphone temporaire
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

      // Code secret vérifié avec succès - connexion complète
      const { token: authToken, user: userData } = data;
      
      setToken(authToken);
      setUser(userData);
      setIsAwaitingSecretCode(false);
      
      await storeAuthToken(authToken);
      await storeUserData(userData);
      await AsyncStorage.removeItem('awaitingSecretCode');
      await AsyncStorage.removeItem('tempPhone');
      
      console.log('✅ Code secret vérifié avec succès - connexion complète');
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

      console.log('✅ Code secret créé avec succès - compte activé');
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
      
      // Ajouter l'OTP de développement pour les tests
      const signupData = {
        ...userData,
        otp: '123456' // OTP de développement
      };
      
      console.log('Sending signup data:', signupData);
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      // After successful signup, user would typically need to verify OTP
      // then login
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Début de la déconnexion...');
      setIsLoading(true);
      
      // Supprimer d'abord d'AsyncStorage
      await clearAuthData();
      await AsyncStorage.removeItem('awaitingSecretCode');
      await AsyncStorage.removeItem('tempPhone');
      
      // Vérifier que les données sont supprimées
      const checkToken = await getAuthToken();
      const checkUser = await getUserData();
      console.log('📱 Vérification après suppression - token:', checkToken, 'user:', checkUser);
      
      // Puis mettre à jour l'état
      setUser(null);
      setToken(null);
      setIsAwaitingSecretCode(false);
      
      console.log('✅ Déconnexion réussie - données supprimées');
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

      console.log('🔄 Actualisation des données utilisateur...');
      
      const response = await fetch(buildApiUrl('/profile/getUserDetails'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du profil');
      }

      const updatedUser = data.data || data.user;
      
      console.log('📊 Données utilisateur reçues du serveur:', {
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        image: updatedUser?.image,
        email: updatedUser?.email
      });
      
      setUser(updatedUser);
      await storeUserData(updatedUser);
      
      console.log('✅ Données utilisateur actualisées dans le contexte');
    } catch (error) {
      console.error('❌ Erreur lors de l\'actualisation:', error);
      throw error;
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
