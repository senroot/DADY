import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeRedirect } from '../../../utils/navigation';
import { User } from 'lucide-react-native';
import { BookOpen } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Plus } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { buildApiUrl } from '../../api';
import { getAuthToken } from '../../../utils/authUtils';

// Mock data for development when server is not available
const mockChildren = [
  {
    _id: 'mock1',
    firstName: 'Emma',
    lastName: 'Dupont',
    level: 'CE1',
    enrolledPacks: [
      { displayName: 'Pack Mathématiques', name: 'math-pack', price: 29.99 },
    ],
    courses: [{ name: 'Addition' }, { name: 'Soustraction' }],
  },
  {
    _id: 'mock2',
    firstName: 'Lucas',
    lastName: 'Martin',
    level: 'CP',
    enrolledPacks: [
      { displayName: 'Pack Lecture', name: 'reading-pack', price: 24.99 },
    ],
    courses: [{ name: 'Alphabet' }, { name: 'Syllabes' }],
  },
];

export default function ChildrenScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const token = await getAuthToken();

      if (!token) {
        Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
        safeRedirect.toAuth();
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(buildApiUrl('/parent/children'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 401) {
          Alert.alert('Erreur', 'Session expirée. Veuillez vous reconnecter.');
          safeRedirect.toAuth();
          return;
        }
        throw new Error(`Erreur serveur: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setChildren(data.data || []);
      } else {
        Alert.alert(
          'Erreur',
          data.message || 'Impossible de charger les enfants',
        );
      }
    } catch (e: any) {
      console.error('Fetch children error:', e);

      if (e.name === 'AbortError') {
        Alert.alert(
          'Mode hors ligne',
          "Délai d'attente dépassé. Utilisation des données de démonstration.",
        );
      } else if (e.message.includes('Failed to fetch')) {
        Alert.alert(
          'Mode hors ligne',
          'Impossible de se connecter au serveur. Utilisation des données de démonstration.',
        );
      } else {
        Alert.alert(
          'Mode hors ligne',
          'Erreur réseau. Utilisation des données de démonstration.',
        );
      }

      // Use mock data as fallback
      setChildren(mockChildren);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleViewChild = (child: any) => {
    router.push({
      pathname: '/parent-dashboard/student-details',
      params: {
        studentId: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        level: child.level,
        pack:
          child.enrolledPacks?.[0]?.displayName ||
          child.enrolledPacks?.[0]?.name ||
          'Aucun pack',
        packPrice: child.enrolledPacks?.[0]?.price || 0,
      },
    });
  };

  // Composant mémoïsé pour l'affichage d'un enfant
  const ChildCard = memo(({ child, onPress, styles }: {
    child: any;
    onPress: (child: any) => void;
    styles: any;
  }) => (
    <TouchableOpacity
      key={child._id}
      style={styles.childCard}
      onPress={() => onPress(child)}
    >
      <View style={styles.childAvatar}>
        <Text style={styles.childAvatarText}>
          {child.firstName.charAt(0)}
          {child.lastName.charAt(0)}
        </Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>
          {child.firstName} {child.lastName}
        </Text>
        <Text style={styles.childLevel}>Niveau: {child.level}</Text>
        <Text style={styles.childPack}>
          Pack:{' '}
          {child.enrolledPacks?.[0]?.displayName ||
            child.enrolledPacks?.[0]?.name ||
            'Aucun pack'}
        </Text>
        <Text style={styles.childCourses}>
          {child.courses?.length || 0} cours disponibles
        </Text>
      </View>
      <ChevronRight size={20} color="#6B7280" />
    </TouchableOpacity>
  ));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement des enfants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Enfants</Text>
        <Text style={styles.subtitle}>
          {children.length} enfant{children.length > 1 ? 's' : ''} inscrit
          {children.length > 1 ? 's' : ''}
          {isOfflineMode && ' (Mode démonstration)'}
        </Text>
        {isOfflineMode && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              📱 Mode démonstration - Données d'exemple
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={children}
        renderItem={({ item }) => (
          <ChildCard child={item} onPress={handleViewChild} styles={styles} />
        )}
        keyExtractor={item => item._id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <User size={60} color="#6B7280" />
            <Text style={styles.emptyTitle}>Aucun enfant inscrit</Text>
            <Text style={styles.emptySubtitle}>
              Commencez par ajouter votre premier enfant pour commencer son
              apprentissage
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() =>
                router.push('/parent-dashboard/(tabs)/add-student')
              }
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addFirstButtonText}>
                Ajouter mon premier enfant
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={children.length === 0 ? { flex: 1 } : { paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {children.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/parent-dashboard/(tabs)/add-student')}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  offlineText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  childrenList: {
    paddingBottom: 100,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  childAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  childLevel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  childPack: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  childCourses: {
    fontSize: 12,
    color: '#6B7280',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
