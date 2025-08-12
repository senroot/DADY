import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Package,
  Key,
  Calendar,
  Settings,
  Trash2,
  CreditCard as Edit,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl, API_CONFIG } from '../api';

export default function StudentDetailsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const params = useLocalSearchParams();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { studentId, firstName, lastName, packName, packPrice } = params;

  // Ensure firstName and lastName are strings
  const firstNameStr = Array.isArray(firstName)
    ? firstName[0]
    : firstName || '';
  const lastNameStr = Array.isArray(lastName) ? lastName[0] : lastName || '';

  // Charger les détails complets de l'étudiant
  useEffect(() => {
    const loadStudentDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          buildApiUrl(API_CONFIG.ENDPOINTS.PARENT.GET_CHILDREN),
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          // Trouver l'étudiant spécifique par son ID
          const student = data.data?.find(
            (child: any) => child._id === studentId || child.id === studentId,
          );
          if (student) {
            setStudentDetails(student);
            console.log('📊 Détails étudiant chargés:', student);
          } else {
            console.error('❌ Étudiant non trouvé');
            Alert.alert(
              'Erreur',
              'Impossible de trouver les détails de cet élève',
            );
          }
        } else {
          console.error('❌ Erreur API:', data.message);
          Alert.alert(
            'Erreur',
            data.message || 'Erreur lors du chargement des détails',
          );
        }
      } catch (error) {
        console.error('❌ Erreur réseau:', error);
        Alert.alert('Erreur', "Impossible de charger les détails de l'élève");
      } finally {
        setIsLoading(false);
      }
    };

    if (token && studentId) {
      loadStudentDetails();
    }
  }, [token, studentId]);

  const handleEditStudent = () => {
    Alert.alert("Modifier l'élève", 'Fonctionnalité en cours de développement');
  };

  const handleDeleteStudent = () => {
    Alert.alert(
      "Supprimer l'élève",
      `Êtes-vous sûr de vouloir supprimer le profil de ${firstName} ${lastName} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Logique de suppression
            router.push('/parent-dashboard/(tabs)/children');
          },
        },
      ],
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Changer le mot de passe',
      'Fonctionnalité en cours de développement',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/parent-dashboard/(tabs)/children')}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Détails de l'Élève</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditStudent}>
          <Edit size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>
              {isLoading
                ? '?'
                : `${(studentDetails?.firstName || firstNameStr)?.charAt(0) || '?'}${(studentDetails?.lastName || lastNameStr)?.charAt(0) || ''}`}
            </Text>
          </View>
          <Text style={styles.studentName}>
            {isLoading
              ? 'Chargement...'
              : `${studentDetails?.firstName || firstNameStr} ${studentDetails?.lastName || lastNameStr}`}
          </Text>
          <Text style={styles.studentLevel}>
            🎓{' '}
            {isLoading
              ? 'Chargement...'
              : studentDetails?.level || 'Niveau non défini'}
          </Text>
          <Text style={styles.studentId}>
            🆔{' '}
            {isLoading
              ? 'Chargement...'
              : studentDetails?.studentId || 'ID non disponible'}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isLoading
                ? 'Chargement...'
                : studentDetails?.active
                  ? 'Actif'
                  : 'Inactif'}
            </Text>
          </View>
        </View>

        {/* Subscription Info */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Package size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Abonnement</Text>
          </View>
          {isLoading ? (
            <Text style={styles.loadingText}>
              Chargement des informations d'abonnement...
            </Text>
          ) : studentDetails?.enrolledPacks &&
            studentDetails.enrolledPacks.length > 0 ? (
            studentDetails.enrolledPacks.map((pack: any, index: number) => (
              <View key={index}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Pack:</Text>
                  <Text style={styles.infoValue}>
                    {pack.name || 'Pack sans nom'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Prix:</Text>
                  <Text style={styles.infoValue}>
                    {pack.price || '0'} FCFA/mois
                  </Text>
                </View>
                {pack.description && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Description:</Text>
                    <Text style={styles.infoValue}>{pack.description}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noPackText}>
              Aucun pack d'abonnement souscrit
            </Text>
          )}
        </View>

        {/* Login Credentials */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Key size={24} color="#10B981" />
            <Text style={styles.cardTitle}>Identifiants de Connexion</Text>
          </View>
          <View style={styles.credentialsContainer}>
            <View style={styles.credentialItem}>
              <Text style={styles.credentialLabel}>Identifiant:</Text>
              <View style={styles.credentialValueContainer}>
                <Text style={styles.credentialValue}>
                  {isLoading
                    ? 'Chargement...'
                    : studentDetails?.studentId || 'Non disponible'}
                </Text>
              </View>
            </View>
            <View style={styles.credentialItem}>
              <Text style={styles.credentialLabel}>Mot de passe:</Text>
              <View style={styles.credentialValueContainer}>
                <Text style={styles.credentialValue}>
                  {isLoading
                    ? 'Chargement...'
                    : user?.phone || 'Non disponible'}
                </Text>
              </View>
            </View>
            <View style={styles.credentialNote}>
              <Text style={styles.credentialNoteText}>
                💡 L'identifiant est généré automatiquement et le mot de passe
                est votre numéro de téléphone
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.changePasswordText}>
                Changer le mot de passe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Summary */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Calendar size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>Activité Récente</Text>
          </View>
          <View style={styles.activityStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Cours terminés</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Quiz réussis</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0h</Text>
              <Text style={styles.statLabel}>Temps d'étude</Text>
            </View>
          </View>
          <Text style={styles.noActivityText}>
            Aucune activité enregistrée. L'élève peut commencer à utiliser la
            plateforme dès maintenant !
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>

          <TouchableOpacity style={styles.actionButton}>
            <Settings size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>Gérer l'Abonnement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.actionButtonText}>Voir les Progrès</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteStudent}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Supprimer l'Élève
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  studentAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 36,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoValuePrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  activeStatus: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeStatusText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  credentialsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
  },
  credentialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  credentialLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  credentialValueContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  changePasswordButton: {
    alignSelf: 'flex-end',
  },
  changePasswordText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  noActivityText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  dangerButtonText: {
    color: '#EF4444',
  },
  credentialNote: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  credentialNoteText: {
    fontSize: 12,
    color: '#3B82F6',
    textAlign: 'center',
    lineHeight: 16,
  },
  studentLevel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  noPackText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});
