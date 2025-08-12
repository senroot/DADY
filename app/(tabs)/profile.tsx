import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, BookOpen, Award, Bell, Shield, CreditCard, CircleHelp as HelpCircle, LogOut, ChevronRight, Star, Target, Calendar } from 'lucide-react-native';

interface ProfileStats {
  coursesCompleted: number;
  totalPoints: number;
  currentStreak: number;
  badgesEarned: number;
}

const profileStats: ProfileStats = {
  coursesCompleted: 12,
  totalPoints: 1450,
  currentStreak: 5,
  badgesEarned: 3,
};

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const menuItems = [
    {
      id: 'account',
      title: 'Informations du compte',
      icon: User,
      color: '#3B82F6',
    },
    {
      id: 'subscription',
      title: 'Mon abonnement',
      icon: CreditCard,
      color: '#10B981',
    },
    {
      id: 'achievements',
      title: 'Mes récompenses',
      icon: Award,
      color: '#F59E0B',
    },
    {
      id: 'help',
      title: 'Aide et support',
      icon: HelpCircle,
      color: '#8B5CF6',
    },
    {
      id: 'privacy',
      title: 'Confidentialité',
      icon: Shield,
      color: '#6B7280',
    },
  ];

  const renderMenuItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem}>
      <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
        <item.icon size={20} color={item.color} />
      </View>
      <Text style={styles.menuTitle}>{item.title}</Text>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MJ</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Premium</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Marie Dupont</Text>
          <Text style={styles.profileLevel}>Terminale S • Lycée Victor Hugo</Text>
          <Text style={styles.joinDate}>Membre depuis septembre 2024</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <BookOpen size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{profileStats.coursesCompleted}</Text>
            <Text style={styles.statLabel}>Cours terminés</Text>
          </View>
          
          <View style={styles.statItem}>
            <Star size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{profileStats.totalPoints}</Text>
            <Text style={styles.statLabel}>Points obtenus</Text>
          </View>
          
          <View style={styles.statItem}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statNumber}>{profileStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Jours d'affilée</Text>
          </View>
          
          <View style={styles.statItem}>
            <Award size={24} color="#8B5CF6" />
            <Text style={styles.statNumber}>{profileStats.badgesEarned}</Text>
            <Text style={styles.statLabel}>Badges gagnés</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Calendar size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Planning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <BookOpen size={24} color="#10B981" />
              <Text style={styles.quickActionText}>Mes cours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Award size={24} color="#F59E0B" />
              <Text style={styles.quickActionText}>Badges</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#EF444415' }]}>
                <Bell size={20} color="#EF4444" />
              </View>
              <Text style={styles.settingTitle}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#6B728015' }]}>
                <Settings size={20} color="#6B7280" />
              </View>
              <Text style={styles.settingTitle}>Mode sombre</Text>
            </View>
            <Switch
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
            />
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  profileLevel: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 5,
  },
  joinDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statItem: {
    alignItems: 'center',
    flex: 1,
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
  quickActionsContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
  },
  settingsContainer: {
    marginBottom: 25,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  menuContainer: {
    marginBottom: 25,
  },
  menuItem: {
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
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
});