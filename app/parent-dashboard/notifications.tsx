import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  Circle,
  Trash2,
  MoreVertical,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
}

// ✅ SUPPRIMÉ : notifications statiques - maintenant on utilise les vraies données de l'API

export default function NotificationsScreen() {
  const router = useRouter();
  const { cachedNotifications, loadNotificationsWithCache, unreadNotificationsCount } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Charger les notifications au montage du composant
  useEffect(() => {
    const loadNotifications = async () => {
      console.log('🔔 NotificationsScreen: Chargement des notifications...');
      const freshNotifications = await loadNotificationsWithCache();
      
      // Convertir les données API au format attendu par le composant
      const formattedNotifications: Notification[] = freshNotifications.map((notif: any) => ({
        id: notif._id || notif.id,
        title: notif.title || notif.subject || 'Notification',
        message: notif.message || notif.content || '',
        time: notif.createdAt ? new Date(notif.createdAt).toLocaleString('fr-FR') : 'Récemment',
        isRead: notif.isRead || false,
        type: notif.type || 'info',
        category: notif.category || 'Général',
      }));
      
      setNotifications(formattedNotifications);
    };

    loadNotifications();
  }, []);

  const filteredNotifications = notifications.filter(
    (notification) =>
      filter === 'all' || (filter === 'unread' && !notification.isRead),
  );

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
          },
        },
      ],
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      info: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10B981" />;
      case 'warning':
        return <Bell size={20} color="#F59E0B" />;
      case 'error':
        return <Bell size={20} color="#EF4444" />;
      default:
        return <Bell size={20} color="#3B82F6" />;
    }
  };

  const renderNotification = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadCard,
      ]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={styles.notificationIcon}>
        {getTypeIcon(notification.type)}
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text
            style={[
              styles.notificationTitle,
              !notification.isRead && styles.unreadTitle,
            ]}
          >
            {notification.title}
          </Text>
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationCategory}>
              {notification.category}
            </Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => deleteNotification(notification.id)}
            >
              <Trash2 size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.notificationMessage} numberOfLines={3}>
          {notification.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Text style={styles.notificationTime}>{notification.time}</Text>
          {!notification.isRead && (
            <View style={styles.unreadIndicator}>
              <Circle size={12} color="#10B981" fill="#10B981" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/parent-dashboard/(tabs)')}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllButton}>Tout marquer lu</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {notifications.filter((n) => !n.isRead).length} non lues sur{' '}
          {notifications.length}
        </Text>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.activeFilterText,
            ]}
          >
            Toutes ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'unread' && styles.activeFilter,
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'unread' && styles.activeFilterText,
            ]}
          >
            Non lues ({notifications.filter((n) => !n.isRead).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(renderNotification)
        ) : (
          <View style={styles.emptyState}>
            <Bell size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {filter === 'unread'
                ? 'Aucune notification non lue'
                : 'Aucune notification'}
            </Text>
            <Text style={styles.emptyMessage}>
              {filter === 'unread'
                ? 'Toutes vos notifications ont été lues !'
                : 'Vous recevrez ici les mises à jour importantes.'}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  markAllButton: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  stats: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilter: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: '#10B981',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCategory: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
