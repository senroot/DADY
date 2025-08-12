import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star, Clock, Users, ChevronRight } from 'lucide-react-native';

interface Course {
  id: string;
  title: string;
  subject: string;
  level: string;
  duration: string;
  rating: number;
  students: number;
  progress?: number;
  isNew?: boolean;
}

const courses: Course[] = [
  {
    id: '1',
    title: 'Les Nombres et Calculs',
    subject: 'Mathématiques',
    level: 'CE1',
    duration: '2h 30min',
    rating: 4.8,
    students: 1250,
    progress: 65,
  },
  {
    id: '2',
    title: 'Les Temps en Anglais',
    subject: 'Anglais',
    level: 'CE2',
    duration: '1h 45min',
    rating: 4.6,
    students: 890,
    isNew: true,
  },
  {
    id: '3',
    title: 'Grammaire et Conjugaison',
    subject: 'Français',
    level: 'CM1',
    duration: '3h 15min',
    rating: 4.9,
    students: 2100,
    progress: 30,
  },
  {
    id: '4',
    title: 'Vocabulaire et Expression',
    subject: 'Anglais',
    level: 'CM2',
    duration: '1h 20min',
    rating: 4.7,
    students: 1650,
  },
  {
    id: '5',
    title: 'Géométrie et Mesures',
    subject: 'Mathématiques',
    level: '6ème',
    duration: '2h 10min',
    rating: 4.5,
    students: 980,
    progress: 45,
  },
  {
    id: '6',
    title: 'Lecture et Compréhension',
    subject: 'Français',
    level: 'CP',
    duration: '1h 30min',
    rating: 4.9,
    students: 1420,
    isNew: true,
  },
];

const subjects = ['Tous', 'Mathématiques', 'Français', 'Anglais'];
const levels = ['Tous', 'Maternelle', 'CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème'];

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tous');
  const [selectedLevel, setSelectedLevel] = useState('Tous');

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'Tous' || course.subject === selectedSubject;
    const matchesLevel = selectedLevel === 'Tous' || course.level === selectedLevel;
    
    return matchesSearch && matchesSubject && matchesLevel;
  });

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity key={course.id} style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.courseBadge}>
          <Text style={styles.courseBadgeText}>{course.subject}</Text>
        </View>
        {course.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU</Text>
          </View>
        )}
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{course.level}</Text>
        </View>
      </View>
      
      <Text style={styles.courseTitle}>{course.title}</Text>
      
      <View style={styles.courseStats}>
        <View style={styles.statItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.statText}>{course.duration}</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={16} color="#F59E0B" />
          <Text style={styles.statText}>{course.rating}</Text>
        </View>
        <View style={styles.statItem}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.statText}>{course.students}</Text>
        </View>
      </View>

      {course.progress !== undefined && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Progression: {course.progress}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.courseFooter}>
        <Text style={styles.continueText}>
          {course.progress ? 'Continuer le cours' : 'Commencer le cours'}
        </Text>
        <ChevronRight size={20} color="#3B82F6" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Cours</Text>
        <Text style={styles.subtitle}>Découvrez et apprenez à votre rythme</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={[
              styles.filterChip,
              selectedSubject === subject && styles.filterChipActive
            ]}
            onPress={() => setSelectedSubject(subject)}
          >
            <Text style={[
              styles.filterChipText,
              selectedSubject === subject && styles.filterChipTextActive
            ]}>
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterChip,
              selectedLevel === level && styles.filterChipActive
            ]}
            onPress={() => setSelectedLevel(level)}
          >
            <Text style={[
              styles.filterChipText,
              selectedLevel === level && styles.filterChipTextActive
            ]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.coursesContainer} showsVerticalScrollIndicator={false}>
        {filteredCourses.map(renderCourseCard)}
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  coursesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseCard: {
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
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  newBadge: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  courseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 5,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  courseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});