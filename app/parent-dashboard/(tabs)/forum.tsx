import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MessageCircle,
  Heart,
  Reply,
  Search,
  CirclePlus as PlusCircle,
  Users,
} from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';

interface ForumThread {
  _id: string;
  title: string;
  description: string;
  author: {
    firstName: string;
    lastName: string;
    accountType: string;
  };
  category: string;
  createdAt: string;
  lastActivity: string;
  messagesCount: number;
  participantsCount: number;
  views: number;
  isPinned: boolean;
}

const categories = [
  'Tous',
  'Conseils',
  'Santé',
  'Annonces',
  'Témoignages',
  'Questions',
];

export default function ForumTabScreen() {
  const router = useRouter();
  const { getForumThreads } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [posts, setPosts] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chargement des données forum
  const loadForumThreads = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'Tous' ? { category: selectedCategory } : {};
      const threads = await getForumThreads(filters);
      
      // S'assurer que threads est un array
      const threadsArray = Array.isArray(threads) ? threads : [];
      console.log('📋 Threads chargés:', threadsArray.length);
      setPosts(threadsArray);
    } catch (error) {
      console.error('Erreur lors du chargement des threads:', error);
      Alert.alert('Erreur', 'Impossible de charger les discussions');
      setPosts([]); // Définir un array vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadForumThreads();
    setRefreshing(false);
  };

  useEffect(() => {
    loadForumThreads();
  }, [selectedCategory]);

  // Protection supplémentaire - S'assurer que posts est un array
  const postsArray = Array.isArray(posts) ? posts : [];
  
  const filteredPosts = postsArray.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tous' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleLike = (postId: string) => {
    // TODO: Implémenter l'API like plus tard
    console.log('Like post:', postId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Conseils: '#10B981',
      Santé: '#059669',
      Annonces: '#10B981',
      Témoignages: '#10B981',
      Questions: '#10B981',
    };
    return colors[category] || '#10B981';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}m`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderPost = (post: ForumThread) => (
    <TouchableOpacity 
      key={post._id} 
      style={styles.postCard}
      onPress={() => router.push({
        pathname: '/parent-dashboard/forum-discussion',
        params: { threadId: post._id }
      })}
    >
      <View style={styles.postHeader}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${getCategoryColor(post.category)}15` },
          ]}
        >
          <Text
            style={[
              styles.categoryBadgeText,
              { color: getCategoryColor(post.category) },
            ]}
          >
            {post.category}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatDate(post.lastActivity)}</Text>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.description}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.authorInfo}>
          <View
            style={[
              styles.authorBadge,
              {
                backgroundColor:
                  post.author.accountType === 'admin' ? '#FEF3C7' : '#EEF2FF',
              },
            ]}
          >
            <Users
              size={12}
              color={post.author.accountType === 'admin' ? '#F59E0B' : '#3B82F6'}
            />
          </View>
          <Text style={styles.authorName}>
            {post.author.firstName} {post.author.lastName}
          </Text>
          <Text style={styles.authorType}>
            • {post.author.accountType === 'admin' ? 'Équipe' : 'Parent'}
          </Text>
        </View>

        <View style={styles.postActions}>
          <View style={styles.statsGroup}>
            <View style={styles.statItem}>
              <Heart size={16} color="#6B7280" fill="none" />
              <Text style={styles.statText}>{post.views || 0}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.statText}>{post.participantsCount || 0}</Text>
            </View>
            
            <View style={styles.statItem}>
              <MessageCircle size={16} color="#6B7280" />
              <Text style={styles.statText}>{post.messagesCount || 0}</Text>
            </View>
          </View>

          {post.isPinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedText}>📌 Épinglé</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixe */}
      <View style={styles.header}>
        <Text style={styles.title}>Forum Parents</Text>
        <Text style={styles.subtitle}>Échangez avec d'autres parents</Text>
      </View>

      {/* Barre de recherche fixe */}
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
        <TouchableOpacity 
          style={styles.newPostButton}
          onPress={() => router.push('/parent-dashboard/create-thread')}
        >
          <PlusCircle size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Filtres horizontaux fixes */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersInner}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ScrollView principal pour les posts - prend tout l'espace restant */}
      <ScrollView
        style={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Chargement des discussions...</Text>
          </View>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(renderPost)
        ) : (
          <View style={styles.emptyState}>
            <MessageCircle size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              Aucune discussion trouvée
            </Text>
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
    marginBottom: 15,
    maxHeight: 50, // Hauteur fixe pour éviter que ça prenne trop de place
  },
  filtersInner: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 24,
    maxHeight: 28,
  },
  filterChipActive: {
    backgroundColor: '#10B981',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  postsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20, // Espace en bas pour éviter que le dernier post soit collé
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
  categoryBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
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
  authorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  authorType: {
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
    paddingBottom: 60,
    minHeight: 300, // Hauteur minimale pour centrer correctement
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 60,
    minHeight: 300,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 15,
  },
  statsGroup: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  pinnedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
