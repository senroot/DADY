import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Heart, Reply, Search, Filter, CirclePlus as PlusCircle } from 'lucide-react-native';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subject: string;
  timestamp: string;
  likes: number;
  replies: number;
  isLiked: boolean;
  authorLevel: string;
}

const forumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Comment résoudre les équations du second degré ?',
    content: 'Bonjour, je suis en Terminale et j\'ai des difficultés avec les équations du second degré. Quelqu\'un peut-il m\'expliquer la méthode avec le discriminant ?',
    author: 'Marie_L',
    subject: 'Mathématiques',
    timestamp: 'Il y a 2h',
    likes: 12,
    replies: 5,
    isLiked: false,
    authorLevel: 'Terminale',
  },
  {
    id: '2',
    title: 'Aide pour l\'analyse de texte en français',
    content: 'J\'ai un commentaire de texte à faire sur un extrait de Baudelaire. Comment structurer mon analyse ? Merci d\'avance !',
    author: 'Alex_M',
    subject: 'Français',
    timestamp: 'Il y a 4h',
    likes: 8,
    replies: 3,
    isLiked: true,
    authorLevel: '1ère',
  },
  {
    id: '3',
    title: 'Question sur la photosynthèse',
    content: 'Pourriez-vous m\'expliquer les étapes de la photosynthèse ? Je n\'arrive pas à comprendre la phase lumineuse et la phase sombre.',
    author: 'Thomas_B',
    subject: 'SVT',
    timestamp: 'Il y a 6h',
    likes: 15,
    replies: 7,
    isLiked: false,
    authorLevel: '2nde',
  },
  {
    id: '4',
    title: 'Révisions Bac Histoire - Guerre Froide',
    content: 'Salut ! Je cherche quelqu\'un pour réviser ensemble les dates importantes de la Guerre Froide. On peut se faire des quiz ?',
    author: 'Sarah_K',
    subject: 'Histoire',
    timestamp: 'Il y a 8h',
    likes: 6,
    replies: 2,
    isLiked: false,
    authorLevel: 'Terminale',
  },
];

const subjects = ['Tous', 'Mathématiques', 'Français', 'Histoire', 'SVT', 'Physique', 'Anglais'];

export default function ForumScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tous');
  const [posts, setPosts] = useState(forumPosts);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'Tous' || post.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathématiques': '#3B82F6',
      'Français': '#8B5CF6',
      'Histoire': '#F59E0B',
      'SVT': '#10B981',
      'Physique': '#EF4444',
      'Anglais': '#06B6D4',
    };
    return colors[subject] || '#6B7280';
  };

  const renderPost = (post: ForumPost) => (
    <TouchableOpacity key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={[styles.subjectBadge, { backgroundColor: `${getSubjectColor(post.subject)}15` }]}>
          <Text style={[styles.subjectBadgeText, { color: getSubjectColor(post.subject) }]}>
            {post.subject}
          </Text>
        </View>
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>

      <View style={styles.postFooter}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.authorLevel}>• {post.authorLevel}</Text>
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(post.id)}
          >
            <Heart 
              size={18} 
              color={post.isLiked ? '#EF4444' : '#6B7280'} 
              fill={post.isLiked ? '#EF4444' : 'none'}
            />
            <Text style={[
              styles.actionText,
              post.isLiked && styles.actionTextActive
            ]}>
              {post.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Reply size={18} color="#6B7280" />
            <Text style={styles.actionText}>{post.replies}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Forum d'Entraide</Text>
        <Text style={styles.subtitle}>Posez vos questions et aidez vos camarades</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une discussion..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.newPostButton}>
          <PlusCircle size={24} color="#3B82F6" />
        </TouchableOpacity>
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

      <ScrollView style={styles.postsContainer} showsVerticalScrollIndicator={false}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map(renderPost)
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>Aucune discussion trouvée</Text>
            <Text style={styles.emptyStateMessage}>
              Essayez de modifier vos filtres ou créez une nouvelle discussion
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
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
  newPostButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  postsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  postContent: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 15,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  authorLevel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});