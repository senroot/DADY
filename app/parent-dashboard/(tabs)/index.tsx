import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { Plus } from 'lucide-react-native';
import { BookOpen } from 'lucide-react-native';
import { Settings } from 'lucide-react-native';
import { ChartBar as BarChart3 } from 'lucide-react-native';
import { Package } from 'lucide-react-native';
import { Bell } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { buildApiUrl, API_CONFIG } from '../../api';
import { handleTokenValidation, fetchWithRetry } from '../../../utils/apiUtils';
import { getAuthToken } from '../../../utils/authUtils';

function ParentDashboardScreen() {
  const router = useRouter();
  const { user, token, isLoading: isAuthLoading, refreshUser, forceReloadAuth } = useAuth();
  
  // Log initial pour débogage
  console.log('🏁 ParentDashboardScreen render - isAuthLoading:', isAuthLoading, 'token:', !!token, 'user:', !!user, 'userType:', user?.accountType);

  // DÉBOGAGE : Vérifier directement AsyncStorage au démarrage
  useEffect(() => {
    const checkAsyncStorage = async () => {
      const directToken = await AsyncStorage.getItem('token');
      const directUser = await AsyncStorage.getItem('user');
      console.log('🔍 DÉBOGAGE AsyncStorage direct:', {
        hasDirectToken: !!directToken,
        hasDirectUser: !!directUser,
        directTokenPreview: directToken ? directToken.substring(0, 20) + '...' : null,
        directUserName: directUser ? JSON.parse(directUser).firstName : null,
        directUserChildren: directUser ? JSON.parse(directUser).children?.length : 0,
        authContextToken: !!token,
        authContextUser: !!user,
        authContextUserName: user?.firstName,
        authContextChildren: user?.children?.length || 0
      });
    };
    checkAsyncStorage();
  }, [token, user]);

  // ✅ SOLUTION : Force le rechargement si AuthContext vide mais AsyncStorage plein
  useEffect(() => {
    const forceReloadIfNeeded = async () => {
      // Attendre que l'AuthContext ait fini de charger
      if (isAuthLoading) {
        console.log('⏳ Attente fin de chargement AuthContext...');
        return;
      }

      // Si l'AuthContext n'a pas de données
      if (!token || !user) {
        console.log('🔄 AuthContext vide, vérification AsyncStorage...');
        
        // Vérifier AsyncStorage directement
        const directToken = await AsyncStorage.getItem('token');
        const directUser = await AsyncStorage.getItem('user');
        
        // Si AsyncStorage contient des données mais pas l'AuthContext
        if (directToken && directUser && (!token || !user)) {
          console.log('🚨 Données trouvées dans AsyncStorage mais pas dans AuthContext!');
          console.log('🔄 Force le rechargement...');
          
          const success = await forceReloadAuth();
          if (success) {
            console.log('✅ Rechargement forcé réussi!');
          } else {
            console.log('❌ Échec du rechargement forcé');
          }
        }
      }
    };

    forceReloadIfNeeded();
  }, [isAuthLoading, token, user, forceReloadAuth]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [packs, setPacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Nouvel état pour stocker les détails utilisateur récupérés
  const [userDetails, setUserDetails] = useState<any>(null);

  // États pour les données dynamiques du dashboard
  const [childrenProgress, setChildrenProgress] = useState<{[key: string]: any}>({});
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalSubjects: 0,
    averageProgress: 0,
    totalCourses: 0
  });

  const [notifications] = useState([
    {
      id: '1',
      title: 'Nouveau cours disponible',
      message: 'Un nouveau cours de mathématiques a été ajouté pour Emma',
      time: 'Il y a 10 min',
      isRead: false,
    },
    {
      id: '2',
      title: 'Progrès de votre enfant',
      message: 'Lucas a terminé le chapitre 3 de français',
      time: 'Il y a 1h',
      isRead: false,
    },
    {
      id: '3',
      title: 'Rappel de paiement',
      message: 'Votre abonnement expire dans 3 jours',
      time: 'Il y a 2h',
      isRead: true,
    },
  ]);

  // Charger les packs seulement au montage du composant
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        setIsLoadingPacks(true);
        
        // Essayer de charger les données utilisateur d'abord
        const storedToken = await getAuthToken();
        
        if (storedToken) {
          console.log('👤 Chargement des détails utilisateur avec token stocké...');
          
          // Charger les détails utilisateur en premier
          const userResponse = await fetchWithRetry(
            buildApiUrl('/profile/getUserDetails'),
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.success) {
              setUserDetails(userData.data);
              console.log('✅ Détails utilisateur chargés:', userData.data?.firstName || 'N/A');
            }
          }
        }
        
        console.log('📦 Chargement initial des packs...');
        
        const packsResponse = await fetchWithRetry(
          buildApiUrl('/course/getAllPacks'),
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (packsResponse.ok) {
          const packsData = await packsResponse.json();
          if (packsData.success) {
            setPacks(packsData.data || []);
            console.log('✅ Packs chargés avec succès:', packsData.data?.length || 0);
          } else {
            console.error('❌ Erreur chargement packs:', packsData.message);
          }
        }

        // Essayer de charger les enfants si on a récupéré un token
        // Note: Les enfants sont gérés par un useEffect séparé
        console.log('📦 Packs chargés avec succès');

      } catch (error: any) {
        console.error('❌ Erreur réseau packs:', error);
      } finally {
        setIsLoadingPacks(false);
      }
    };

    fetchPacks();
  }, []); // Chargement uniquement au montage, sans dépendances

  // Fonction pour charger les détails utilisateur
  const loadUserDetails = useCallback(async () => {
    if (!token || isLoadingUser) return;

    try {
      setIsLoadingUser(true);
      console.log('👤 Chargement des détails utilisateur...');

      const userResponse = await fetchWithRetry(
        buildApiUrl('/profile/getUserDetails'),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUserDetails(userData.data);
          console.log('✅ Détails utilisateur chargés:', userData.data?.firstName || 'N/A');
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des détails utilisateur:', error);
    } finally {
      setIsLoadingUser(false);
    }
  }, [token]);

  // Charger les données utilisateur dès que token et user sont disponibles
  useEffect(() => {
    console.log('🔍 useEffect des enfants - isAuthLoading:', isAuthLoading, 'token:', !!token, 'user:', !!user, 'userAccountType:', user?.accountType);
    
    // Attendre que l'AuthContext ait fini de charger avant de procéder
    if (isAuthLoading) {
      console.log('⏳ AuthContext en cours de chargement...');
      return;
    }

    if (!token || !user) {
      console.log('⏳ En attente du token et des données utilisateur...', { hasToken: !!token, hasUser: !!user });
      return;
    }

    // Petit délai pour s'assurer que tout est bien initialisé
    const timer = setTimeout(() => {
      // Charger les détails utilisateur
      console.log('🔄 Démarrage du chargement des données utilisateur...');
      loadUserDetails();
      
      // Charger les enfants si c'est un parent
      if (user.accountType === 'Parent') {
        console.log('👥 Utilisateur parent détecté - chargement des enfants...');
        loadStudents();
      } else {
        console.log('ℹ️ Utilisateur non-parent détecté:', user.accountType);
      }
    }, 100); // Petit délai de 100ms

    return () => clearTimeout(timer);
  }, [token, user, isAuthLoading]); // Simplifier les dépendances

  // Fonction pour charger les matières disponibles depuis le backend
  const loadAvailableSubjects = useCallback(async () => {
    if (!token) return;

    try {
      console.log('📚 Chargement des matières disponibles...');
      
      const response = await fetchWithRetry(
        buildApiUrl('/course/getAllCategories'), // ou /course/subjects selon votre API
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const subjects = data.data || [];
        setAvailableSubjects(subjects);
        setGlobalStats(prev => ({
          ...prev,
          totalSubjects: subjects.length
        }));
        console.log('✅ Matières chargées:', subjects.length);
      } else {
        // Fallback vers les matières par défaut si API échoue
        const defaultSubjects = ['Français', 'Mathématiques', 'Anglais'];
        setAvailableSubjects(defaultSubjects);
        setGlobalStats(prev => ({
          ...prev,
          totalSubjects: defaultSubjects.length
        }));
        console.log('⚠️ Utilisation des matières par défaut');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement matières:', error);
      // Fallback vers les matières par défaut
      const defaultSubjects = ['Français', 'Mathématiques', 'Anglais'];
      setAvailableSubjects(defaultSubjects);
      setGlobalStats(prev => ({
        ...prev,
        totalSubjects: defaultSubjects.length
      }));
    }
  }, [token]);

  // Fonction pour charger la progression réelle des enfants (inspirée de l'ancien projet)
  const loadChildrenProgress = useCallback(async () => {
    if (!token || user?.accountType !== 'Parent' || students.length === 0) return;
    
    try {
      console.log('👨‍👩‍👧‍👦 Chargement de la progression des enfants...');
      
      const progressPromises = students.map(async (student) => {
        try {
          const response = await fetchWithRetry(
            buildApiUrl(`/parent/child/${student._id}/detailed-progress`),
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          if (data.success) {
            return {
              studentId: student._id,
              progress: data.data
            };
          }
          return {
            studentId: student._id,
            progress: {
              totalPoints: 0,
              completedLessons: 0,
              totalLessons: 0,
              averageProgress: 0
            }
          };
        } catch (error) {
          console.error(`❌ Erreur chargement progression pour ${student.firstName}:`, error);
          return {
            studentId: student._id,
            progress: {
              totalPoints: 0,
              completedLessons: 0,
              totalLessons: 0,
              averageProgress: 0
            }
          };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMap: {[key: string]: any} = {};
      
      // Calculs pour les statistiques globales
      let totalCourses = 0;
      let totalProgressPoints = 0;
      let validProgressCount = 0;
      
      progressResults.forEach(result => {
        progressMap[result.studentId] = result.progress;
        totalCourses += result.progress.totalLessons || 0;
        if (result.progress.averageProgress > 0) {
          totalProgressPoints += result.progress.averageProgress;
          validProgressCount++;
        }
      });
      
      setChildrenProgress(progressMap);
      
      // Mettre à jour les statistiques globales
      const averageProgress = validProgressCount > 0 ? Math.round(totalProgressPoints / validProgressCount) : 0;
      setGlobalStats(prev => ({
        ...prev,
        totalCourses,
        averageProgress
      }));
      
      console.log('✅ Progression des enfants chargée:', {
        totalCourses,
        averageProgress,
        studentsCount: students.length
      });
      
    } catch (error) {
      console.error('❌ Error loading children progress:', error);
    }
  }, [token, user?.accountType, students]);

  const loadPacks = useCallback(async () => {
    // Éviter les appels multiples
    if (isLoadingPacks) {
      console.log('⏳ Chargement des packs déjà en cours...');
      return;
    }

    try {
      setIsLoadingPacks(true);
      const response = await fetchWithRetry(
        buildApiUrl('/course/getAllPacks'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPacks(data.data || []);
        console.log('✅ Packs chargés:', data.data?.length || 0);
      } else {
        console.error('❌ Erreur chargement packs:', data.message);
      }
    } catch (error: any) {
      console.error('❌ Erreur réseau packs:', error);

      // Ne pas afficher d'alerte pour les packs car ce n'est pas critique
      if (error.message.includes('connexion internet')) {
        console.log('⚠️ Problème de connexion pour charger les packs');
      }
    } finally {
      setIsLoadingPacks(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    console.log('🔍 loadStudents appelée - token:', !!token, 'isLoadingStudents:', isLoadingStudents);
    
    if (!token) {
      console.log('❌ Pas de token disponible pour charger les enfants');
      return;
    }

    // Éviter les appels multiples
    if (isLoadingStudents) {
      console.log('⏳ Chargement des enfants déjà en cours...');
      return;
    }

    try {
      setIsLoadingStudents(true);
      setNetworkError(false);
      console.log('📡 Chargement des enfants...');

      const response = await fetchWithRetry(
        buildApiUrl(API_CONFIG.ENDPOINTS.PARENT.GET_CHILDREN),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('❌ Erreur lecture JSON:', jsonError);

        // Si on ne peut pas lire le JSON et que c'est une erreur 401, considérer le token comme invalide
        if (response.status === 401) {
          console.log("🔒 Erreur 401 détectée - redirection vers l'accueil");
          await handleTokenValidation({
            success: false,
            message: 'token is invalid',
          });
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Vérifier si le token est invalide et rediriger si nécessaire
      const isTokenInvalid = await handleTokenValidation(data);
      if (isTokenInvalid) {
        return;
      }

      // Vérifier le status après la validation du token
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setStudents(data.data || []);
        console.log('✅ Enfants chargés:', data.data?.length || 0);
      } else {
        console.error('❌ Erreur chargement enfants:', data.message);
        Alert.alert(
          'Erreur',
          data.message || 'Erreur lors du chargement des élèves',
        );
      }
    } catch (error: any) {
      console.error('❌ Erreur réseau enfants:', error);
      setNetworkError(true);

      let errorMessage = 'Impossible de charger les élèves';
      if (error.message.includes('connexion internet')) {
        errorMessage =
          'Problème de connexion internet. Vérifiez votre réseau et réessayez.';
      } else if (error.message.includes('serveur')) {
        errorMessage =
          'Le serveur est temporairement indisponible. Réessayez dans quelques instants.';
      }

      Alert.alert('Erreur de connexion', errorMessage);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [token]);

  // Charger les matières disponibles au montage
  useEffect(() => {
    if (user?.accountType === 'Parent' && token) {
      loadAvailableSubjects();
    }
  }, [user?.accountType, token, loadAvailableSubjects]);

  // Charger la progression des enfants quand la liste des étudiants change
  useEffect(() => {
    if (user?.accountType === 'Parent' && students.length > 0) {
      loadChildrenProgress();
    }
  }, [students, loadChildrenProgress, user?.accountType]);

  // Recharger les données quand l'écran devient actif (seulement si nécessaire)
  useFocusEffect(
    useCallback(() => {
      if (user?.accountType === 'Parent' && token) {
        console.log('🔄 Écran en focus - vérification des données...');
        
        // Seulement recharger si on n'a vraiment pas de données et qu'on n'est pas en train de charger
        // Les données sont déjà chargées par le useEffect principal, donc pas besoin de recharger à chaque focus
        console.log('� Données actuelles:', { studentsCount: students.length, isLoading, isLoadingStudents });
      }
    }, [user?.accountType, token, students.length, isLoading, isLoadingStudents]),
  );

  const onRefresh = async () => {
    if (isRefreshing) return; // Éviter les rafraîchissements multiples

    setIsRefreshing(true);
    console.log('🔄 Rafraîchissement manuel des données...');
    
    try {
      // Recharger les étudiants et les packs en parallèle
      await Promise.all([loadStudents(), loadPacks()]);
      // Recharger aussi les données de progression et matières
      await Promise.all([loadChildrenProgress(), loadAvailableSubjects()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Utiliser les enfants chargés depuis l'API au lieu de user.children
  const children = students;

  // Interfaces pour les props des composants
  interface ChildCardProps {
    child: any;
    router: any;
    styles: any;
  }

  interface PackCardProps {
    pack: any;
    styles: any;
  }

  // Composant mémoïsé pour l'affichage d'un enfant
  const ChildCard = memo(({ child, router, styles }: ChildCardProps) => (
    <TouchableOpacity
      key={child._id || child.id}
      style={styles.studentCard}
      onPress={() =>
        router.push({
          pathname: '/parent-dashboard/student-details',
          params: {
            studentId: child._id || child.id,
            firstName: child.firstName,
            lastName: child.lastName,
            packName: child.enrolledPacks?.[0]?.name || 'Aucun pack',
            packPrice: child.enrolledPacks?.[0]?.price || '0',
          },
        })
      }
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>
            {child.firstName?.[0] || '?'}
            {child.lastName?.[0] || ''}
          </Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {child.firstName} {child.lastName}
          </Text>
          <Text style={styles.studentLevel}>
            🎓 {child.level || 'Niveau non défini'}
          </Text>
          <Text style={styles.studentId}>
            🆔 {child.studentId || 'ID non disponible'}
          </Text>
          {child.enrolledPacks && child.enrolledPacks.length > 0 && (
            <Text style={styles.studentPack}>
              📚 {child.enrolledPacks[0].name}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.studentMenuButton}>
          <Settings size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Progression globale</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { 
              width: `${childrenProgress[child._id]?.averageProgress || 0}%` 
            }]}
          />
        </View>
        <Text style={styles.progressText}>
          {childrenProgress[child._id]?.averageProgress || 0}%
        </Text>
      </View>
      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{child.courses?.length || 0}</Text>
          <Text style={styles.statLabel}>Cours</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {child.enrolledPacks?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Packs</Text>
        </View>
      </View>
    </TouchableOpacity>
  ));

  // Composant mémoïsé pour l'affichage d'un pack
  const PackCard = memo(({ pack, styles }: PackCardProps) => (
    <TouchableOpacity key={pack._id} style={styles.packCard}>
      <View style={[styles.packHeader, { backgroundColor: '#F3F4F615' }]}>
        <Package size={24} color="#3B82F6" />
        <Text style={[styles.packName, { color: '#1F2937' }]}>
          {pack.displayName || pack.name}
        </Text>
      </View>
      <Text style={styles.packDescription}>{pack.description}</Text>
      <Text style={styles.packLevels}>Classes: {pack.levels.join(', ')}</Text>
      <Text style={styles.packPrice}>
        {pack.price} FCFA/{pack.duration}
      </Text>
      <View style={styles.packFeatures}>
        {pack.features?.slice(0, 2).map((feature: string, index: number) => (
          <Text key={index} style={styles.packFeature}>
            ✓ {feature}
          </Text>
        ))}
        {pack.features?.length > 2 && (
          <Text style={styles.packFeatureMore}>
            +{pack.features.length - 2} autres avantages
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tableau de Bord Parent</Text>
          <Text style={styles.subtitle}>
            Gérez l'apprentissage de vos enfants
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={24} color="#6B7280" />
          {notifications.filter((n) => !n.isRead).length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notifications.filter((n) => !n.isRead).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown des notifications */}
      {showNotifications && (
        <View style={styles.notificationDropdown}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={() => router.push('/parent-dashboard/notifications')}
            >
              <Text style={styles.viewAllButton}>Voir plus</Text>
            </TouchableOpacity>
          </View>

          {notifications.slice(0, 3).map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationItem}
            >
              <View style={styles.notificationContent}>
                <Text
                  style={[
                    styles.notificationItemTitle,
                    !notification.isRead && styles.notificationUnread,
                  ]}
                >
                  {notification.title}
                </Text>
                <Text style={styles.notificationItemMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              {!notification.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}

          {notifications.length === 0 && (
            <View style={styles.emptyNotifications}>
              <Bell size={32} color="#D1D5DB" />
              <Text style={styles.emptyNotificationsText}>
                Aucune notification
              </Text>
            </View>
          )}
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        onTouchStart={() => setShowNotifications(false)}
      >
        

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{children.length}</Text>
            <Text style={styles.statLabel}>Enfants</Text>
          </View>

          <View style={styles.statCard}>
            <BookOpen size={24} color="#10B981" />
            <Text style={styles.statNumber}>
              {isLoading ? '...' : globalStats.totalSubjects || availableSubjects.length}
            </Text>
            <Text style={styles.statLabel}>Matières</Text>
          </View>

          <View style={styles.statCard}>
            <BarChart3 size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>
              {isLoading ? '...' : `${globalStats.averageProgress}%`}
            </Text>
            <Text style={styles.statLabel}>Progression</Text>
          </View>
        </View>

        {/* Students Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Enfants</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push('/parent-dashboard/(tabs)/add-student')
              }
            >
              <Plus size={20} color="#3B82F6" />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {networkError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ Problème de connexion</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setNetworkError(false);
                  loadStudents();
                }}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : isLoadingStudents ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des enfants...</Text>
            </View>
          ) : children.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.emptyTitle}>Aucun enfant ajouté</Text>
              <Text style={styles.emptySubtitle}>
                Ajoutez un compte pour votre enfant pour commencer
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() =>
                  router.push('/parent-dashboard/(tabs)/add-student')
                }
              >
                <Text style={styles.createFirstButtonText}>
                  Ajouter mon premier enfant
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={children.slice(0, 3)}
              renderItem={({ item }) => <ChildCard child={item} router={router} styles={styles} />}
              keyExtractor={item => item._id || item.id}
              ListFooterComponent={children.length > 3 ? (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => router.push('/parent-dashboard/(tabs)/children')}
                >
                  <Text style={styles.viewMoreText}>
                    Voir tous les enfants ({children.length})
                  </Text>
                  <Users size={16} color="#3B82F6" />
                </TouchableOpacity>
              ) : null}
            />
          )}
        </View>

        {/* Subscription Packs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Packs d'Abonnement</Text>
          <Text style={styles.sectionSubtitle}>
            Choisissez le pack adapté au niveau de votre enfant
          </Text>

          {isLoadingPacks ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des packs...</Text>
            </View>
          ) : packs.length > 0 ? (
            <FlatList
              data={packs}
              renderItem={({ item }) => <PackCard pack={item} styles={styles} />}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.packsScroll}
            />
          ) : (
            <View style={styles.emptyPacksContainer}>
              <Package size={48} color="#D1D5DB" />
              <Text style={styles.emptyPacksText}>Aucun pack disponible</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (!isLoadingPacks) {
                    console.log('🔄 Rechargement manuel des packs via bouton...');
                    loadPacks();
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ParentDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationDropdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1000,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationUnread: {
    color: '#10B981',
  },
  notificationItemMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 8,
    marginLeft: 8,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    marginLeft: 4,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentLevel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  studentPack: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  studentMenuButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    minWidth: 35,
  },
  studentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  packsScroll: {
    marginBottom: 10,
  },
  packCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    width: 200,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  packName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  packDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  packLevels: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  packPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  packFeatures: {
    marginTop: 5,
  },
  packFeature: {
    fontSize: 11,
    color: '#059669',
    marginBottom: 2,
  },
  packFeatureMore: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 10,
  },
  emptyPacksContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 10,
  },
  emptyPacksText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  viewMoreButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 8,
  },
});
