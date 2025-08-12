import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CircleCheck as CheckCircle, Chrome as Home, User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const { firstName, lastName, packName, packPrice, studentId, identifiant, password } = params;

  // Utiliser les vrais identifiants fournis par le backend ou les paramètres
  const realStudentId = identifiant || studentId || 'N/A';
  const realPassword = password || user?.phone || 'N/A';
  
  // Nettoyer le prix pour enlever le symbole euro s'il est présent
  const cleanPrice = typeof packPrice === 'string' ? packPrice.replace(/€/g, '').trim() : packPrice;

  const handleGoHome = () => {
    router.replace('/parent-dashboard');
  };

  const handleViewStudent = () => {
    router.push({
      pathname: '/parent-dashboard/student-details',
      params: {
        studentId: realStudentId,
        firstName,
        lastName,
        packName,
        packPrice: cleanPrice,
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircle size={80} color="#10B981" />
          </View>

          <Text style={styles.title}>Paiement Réussi !</Text>
          <Text style={styles.subtitle}>
            L'abonnement de {firstName} {lastName} a été activé avec succès
          </Text>

          <View style={styles.detailsCard}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentAvatarText}>
                  {typeof firstName === 'string' ? firstName.charAt(0) : ''}{typeof lastName === 'string' ? lastName.charAt(0) : ''}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>{firstName} {lastName}</Text>
                <Text style={styles.studentPack}>{packName}</Text>
                <Text style={styles.studentPrice}>{cleanPrice} FCFA/mois</Text>
              </View>
            </View>

            <View style={styles.credentialsSection}>
              <Text style={styles.credentialsTitle}>Identifiants de connexion</Text>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Identifiant:</Text>
                <Text style={styles.credentialValue}>
                  {realStudentId}
                </Text>
              </View>
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Mot de passe:</Text>
                <Text style={styles.credentialValue}>{realPassword}</Text>
              </View>
              <Text style={styles.credentialNote}>
                💡 Notez ces identifiants pour que votre enfant puisse se connecter
              </Text>
            </View>
          </View>

          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Prochaines étapes:</Text>
            <Text style={styles.nextStepItem}>✅ Abonnement activé</Text>
            <Text style={styles.nextStepItem}>📚 Accès aux cours disponible</Text>
            <Text style={styles.nextStepItem}>👨‍👩‍👧‍👦 Suivi depuis votre espace parent</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleViewStudent}>
              <User size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Voir le Profil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
              <Home size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Retour à l'Accueil</Text>
            </TouchableOpacity>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentPack: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  credentialsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
  },
  credentialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  credentialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  credentialLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  credentialNote: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginTop: 10,
  },
  nextSteps: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  nextStepItem: {
    fontSize: 14,
    color: '#10B981',
    marginBottom: 8,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});