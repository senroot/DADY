import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Users, Settings } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated && user) {
    if (user.accountType === 'Parent') return <Redirect href="/parent-dashboard" />;
    if (user.accountType === 'Student') return <Redirect href="/" />;
    if (user.accountType === 'Admin') return <Redirect href="/auth/admin" />;
  }

  const userTypes = [
    {
      id: 'student',
      title: 'Élève',
      description: 'Accédez à vos cours et exercices',
      icon: BookOpen,
      color: '#3B82F6',
      route: '/auth/student',
    },
    {
      id: 'parent',
      title: 'Parent',
      description: 'Gérez le parcours de votre enfant',
      icon: Users,
      color: '#10B981',
      route: '/auth/parent',
    },
    {
      id: 'admin',
      title: 'Administrateur',
      description: 'Administration de la plateforme',
      icon: Settings,
      color: '#F59E0B',
      route: '/auth/admin',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <BookOpen size={48} color="#3B82F6" />
          </View>
          <Text style={styles.title}>EduPlatform</Text>
          <Text style={styles.subtitle}>
            Plateforme d'assistance à la formation pour élèves
          </Text>
          <Text style={styles.description}>
            Découvrez nos cours interactifs en Français, Anglais et Mathématiques
            du Maternelle au Collège
          </Text>
        </View>

        <View style={styles.userTypesContainer}>
          <Text style={styles.sectionTitle}>Choisissez votre profil</Text>
          {userTypes.map((userType) => (
            <TouchableOpacity
              key={userType.id}
              style={[styles.userTypeCard, { borderColor: userType.color }]}
              onPress={() => router.push(userType.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${userType.color}15` }]}>
                <userType.icon size={32} color={userType.color} />
              </View>
              <View style={styles.userTypeContent}>
                <Text style={styles.userTypeTitle}>{userType.title}</Text>
                <Text style={styles.userTypeDescription}>{userType.description}</Text>
              </View>
              <View style={styles.arrow}>
                <Text style={[styles.arrowText, { color: userType.color }]}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Rejoignez des milliers d'élèves dans leur parcours d'apprentissage
          </Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  userTypesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 25,
    textAlign: 'center',
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  arrow: {
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});