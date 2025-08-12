import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Target, Calendar, TrendingUp, Award, Clock } from 'lucide-react-native';

interface Badge {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  points: number;
}

const badges: Badge[] = [
  { id: '1', name: 'Premier Cours', description: 'Complété votre premier cours', earned: true, icon: '🎓' },
  { id: '2', name: 'Studieux', description: 'Étudié 7 jours consécutifs', earned: true, icon: '📚' },
  { id: '3', name: 'Mathématicien', description: 'Maîtrisé 5 concepts mathématiques', earned: true, icon: '🧮' },
  { id: '4', name: 'Quiz Master', description: 'Réussi 10 quiz avec 90%+', earned: false, icon: '🏆' },
  { id: '5', name: 'Explorateur', description: 'Découvert 3 nouvelles matières', earned: false, icon: '🌟' },
  { id: '6', name: 'Perfectionniste', description: 'Obtenu 100% dans un cours', earned: false, icon: '💎' },
];

const recentAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Quiz Mathématiques Réussi',
    description: 'Score de 95% en équations du second degré',
    date: 'Aujourd\'hui',
    points: 50,
  },
  {
    id: '2',
    title: 'Cours Terminé',
    description: 'Physique: La Mécanique Quantique',
    date: 'Hier',
    points: 100,
  },
  {
    id: '3',
    title: 'Streak de 5 jours',
    description: 'Étudié 5 jours consécutifs',
    date: 'Il y a 2 jours',
    points: 75,
  },
];

export default function ProgressScreen() {
  const totalPoints = 1450;
  const weeklyGoal = 500;
  const weeklyProgress = 320;
  const currentStreak = 5;
  const coursesCompleted = 12;
  const averageScore = 87;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Progression</Text>
        <Text style={styles.subtitle}>Suivez vos performances et réussites</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats principales */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points Total</Text>
          </View>
          
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Jours d'affilée</Text>
          </View>
          
          <View style={styles.statCard}>
            <Award size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>{coursesCompleted}</Text>
            <Text style={styles.statLabel}>Cours Terminés</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#8B5CF6" />
            <Text style={styles.statNumber}>{averageScore}%</Text>
            <Text style={styles.statLabel}>Score Moyen</Text>
          </View>
        </View>

        {/* Objectif hebdomadaire */}
        <View style={styles.weeklyGoalCard}>
          <View style={styles.weeklyGoalHeader}>
            <Text style={styles.weeklyGoalTitle}>Objectif Hebdomadaire</Text>
            <Text style={styles.weeklyGoalProgress}>{weeklyProgress}/{weeklyGoal} points</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${(weeklyProgress / weeklyGoal) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round((weeklyProgress / weeklyGoal) * 100)}%
            </Text>
          </View>
          <Text style={styles.weeklyGoalMessage}>
            Plus que {weeklyGoal - weeklyProgress} points pour atteindre votre objectif !
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mes Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            {badges.map((badge) => (
              <TouchableOpacity 
                key={badge.id} 
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked
                ]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[
                  styles.badgeName,
                  !badge.earned && styles.badgeNameLocked
                ]}>
                  {badge.name}
                </Text>
                <Text style={[
                  styles.badgeDescription,
                  !badge.earned && styles.badgeDescriptionLocked
                ]}>
                  {badge.description}
                </Text>
                {!badge.earned && <View style={styles.lockOverlay} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Réussites récentes */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Réussites Récentes</Text>
          {recentAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Trophy size={20} color="#F59E0B" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
                <View style={styles.achievementFooter}>
                  <View style={styles.achievementDate}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.achievementDateText}>{achievement.date}</Text>
                  </View>
                  <View style={styles.achievementPoints}>
                    <Text style={styles.achievementPointsText}>+{achievement.points} pts</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Temps d'étude */}
        <View style={styles.studyTimeCard}>
          <View style={styles.studyTimeHeader}>
            <Clock size={24} color="#3B82F6" />
            <Text style={styles.studyTimeTitle}>Temps d'Étude Cette Semaine</Text>
          </View>
          <Text style={styles.studyTimeHours}>12h 35min</Text>
          <Text style={styles.studyTimeComparison}>+2h 15min par rapport à la semaine dernière</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  weeklyGoalCard: {
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
  weeklyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  weeklyGoalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  weeklyGoalProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    minWidth: 35,
  },
  weeklyGoalMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  badgesScroll: {
    marginBottom: 10,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    width: 120,
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#9CA3AF',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDescriptionLocked: {
    color: '#9CA3AF',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementDateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  achievementPoints: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  achievementPointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  studyTimeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  studyTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  studyTimeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  studyTimeHours: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  studyTimeComparison: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
});