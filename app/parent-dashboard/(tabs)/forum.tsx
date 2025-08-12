import React, { useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import { Heart } from 'lucide-react-native';
import { Reply } from 'lucide-react-native';
import { Search } from 'lucide-react-native';
import { CirclePlus as PlusCircle } from 'lucide-react-native';
import { Users } from 'lucide-react-native';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorType: 'parent' | 'admin';
  timestamp: string;
  likes: number;
  replies: number;
  isLiked: boolean;
  category: string;
}

const forumPosts: ForumPost[] = [
  {
    id: '1',
    title: 'Comment motiver mon enfant à faire ses devoirs ?',
    content:
      'Bonjour, ma fille de 8 ans a du mal à se concentrer sur ses devoirs. Avez-vous des conseils pour la motiver ?',
    author: 'Sophie_M',
    authorType: 'parent',
    timestamp: 'Il y a 2h',
    likes: 15,
    replies: 8,
    isLiked: false,
    category: 'Conseils',
  },
  {
    id: '2',
    title: "Temps d'écran recommandé pour les cours en ligne",
    content:
      "Quelle est la durée recommandée pour les sessions d'apprentissage en ligne pour un enfant de 10 ans ?",
    author: 'Marc_L',
    authorType: 'parent',
    timestamp: 'Il y a 4h',
    likes: 12,
    replies: 6,
    isLiked: true,
    category: 'Santé',
  },
  {
    id: '3',
    title: 'Nouveaux cours de mathématiques disponibles',
    content:
      "Nous avons ajouté de nouveaux modules de mathématiques pour le niveau CM1 et CM2. N'hésitez pas à les découvrir !",
    author: 'Équipe_EduPlatform',
    authorType: 'admin',
    timestamp: 'Il y a 1 jour',
    likes: 25,
    replies: 3,
    isLiked: false,
    category: 'Annonces',
  },
  {
    id: '4',
    title: "Partage d'expérience : progrès en anglais",
    content:
      "Mon fils a fait d'énormes progrès en anglais grâce à la plateforme. Je partage notre expérience...",
    author: 'Julie_K',
    authorType: 'parent',
    timestamp: 'Il y a 2 jours',
    likes: 18,
    replies: 12,
    isLiked: false,
    category: 'Témoignages',
  },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [posts, setPosts] = useState(forumPosts);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tous' || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleLike = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      }),
    );
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

  // Interface pour les props du composant PostCard
  interface PostCardProps {
    post: ForumPost;
    onLike: (postId: string) => void;
    styles: any;
    getCategoryColor: (category: string) => string;
  }

  // Composant mémoïsé pour l'affichage d'un post
  const PostCard = memo(({ post, onLike, styles, getCategoryColor }: PostCardProps) => (
    <TouchableOpacity key={post.id} style={styles.postCard}>
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
        <Text style={styles.timestamp}>{post.timestamp}</Text>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.authorInfo}>
          <View
            style={[
              styles.authorBadge,
              {
                backgroundColor:
                  post.authorType === 'admin' ? '#FEF3C7' : '#EEF2FF',
              },
            ]}
          >
            <Users
              size={12}
              color={post.authorType === 'admin' ? '#F59E0B' : '#3B82F6'}
            />
          </View>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.authorType}>
            • {post.authorType === 'admin' ? 'Équipe' : 'Parent'}
          </Text>
        </View>

        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
          >
            <Heart
              size={18}
              color={post.isLiked ? '#EF4444' : '#6B7280'}
              fill={post.isLiked ? '#EF4444' : 'none'}
            />
            <Text
              style={[
                styles.actionText,
                post.isLiked && styles.actionTextActive,
              ]}
            >
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
  ));

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
        <TouchableOpacity style={styles.newPostButton}>
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

      {/* FlatList principal pour les posts - prend tout l'espace restant */}
      <FlatList
        data={filteredPosts}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            styles={styles} 
            getCategoryColor={getCategoryColor}
          />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MessageCircle size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              Aucune discussion trouvée
            </Text>
            <Text style={styles.emptyStateMessage}>
              Essayez de modifier vos filtres ou créez une nouvelle discussion
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={styles.postsContainer}
      />
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
});
