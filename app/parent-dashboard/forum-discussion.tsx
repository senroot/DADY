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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Heart } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function ForumDiscussionScreen() {
  const router = useRouter();
  const { threadId, title } = useLocalSearchParams();
  const { getForumThread, postForumMessage, toggleMessageLike, user } = useAuth();

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (threadId) {
      loadThread();
    }
  }, [threadId]);

  const loadThread = async () => {
    try {
      setIsLoading(true);
      const threadIdStr = Array.isArray(threadId) ? threadId[0] : threadId;
      if (!threadIdStr) return;
      
      const result = await getForumThread(threadIdStr);
      if (result) {
        setThread(result.thread);
        
        // Traiter les messages pour calculer likesCount et isLiked
        const processedMessages = (result.messages || []).map(message => ({
          ...message,
          likesCount: message.likes ? message.likes.length : 0,
          isLiked: message.likes ? message.likes.some(like => like.user === user?.id) : false
        }));
        
        setMessages(processedMessages);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la discussion:', error);
      Alert.alert('Erreur', 'Impossible de charger la discussion');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      const threadIdStr = Array.isArray(threadId) ? threadId[0] : threadId;
      if (!threadIdStr) return;
      
      const result = await postForumMessage(threadIdStr, { content: newMessage.trim() });
      if (result) {
        // Traiter le nouveau message pour ajouter likesCount et isLiked
        const processedMessage = {
          ...result,
          likesCount: result.likes ? result.likes.length : 0,
          isLiked: result.likes ? result.likes.some(like => like.user === user?.id) : false
        };
        
        setMessages([...messages, processedMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setIsSending(false);
    }
  };

  const handleLike = async (messageId) => {
    try {
      const result = await toggleMessageLike(messageId);
      // Mettre à jour les messages avec le nouveau statut de like
      setMessages(messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, isLiked: result.isLiked, likesCount: result.likesCount }
          : msg
      ));
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || thread?.title || 'Discussion'}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer}>
        {/* Thread principal */}
        {thread && (
          <View style={styles.threadContainer}>
            <Text style={styles.threadTitle}>{thread.title}</Text>
            <Text style={styles.threadDescription}>{thread.description}</Text>
            <View style={styles.threadMeta}>
              <Text style={styles.authorName}>
                {thread.author?.firstName} {thread.author?.lastName}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(thread.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <View key={message._id} style={styles.messageContainer}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageAuthor}>
                {message.author?.firstName} {message.author?.lastName}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(message.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            <Text style={styles.messageContent}>{message.content}</Text>
            <TouchableOpacity 
              style={styles.likeButton}
              onPress={() => handleLike(message._id)}
            >
              <Heart 
                size={16} 
                color={message.isLiked ? '#EF4444' : '#6B7280'}
                fill={message.isLiked ? '#EF4444' : 'none'}
              />
              <Text style={styles.likeCount}>{message.likesCount || 0}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Input pour nouveau message */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Écrivez votre message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { opacity: newMessage.trim() ? 1 : 0.5 }]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  threadContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  threadDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  likeCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
