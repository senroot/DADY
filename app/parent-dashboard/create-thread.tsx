import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

const categories = [
  'Conseils',
  'Santé',
  'Témoignages',
  'Questions',
];

export default function CreateThreadScreen() {
  const router = useRouter();
  const { createForumThread, checkCanCreateThread } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  useEffect(() => {
    checkLimit();
  }, []);

  const checkLimit = async () => {
    try {
      const result = await checkCanCreateThread();
      setLimitInfo(result);
      
      if (!result.canCreate) {
        Alert.alert(
          'Limitation de création',
          result.message,
          [
            {
              text: 'Retour',
              onPress: () => router.back(),
            },
            {
              text: 'Compris',
              style: 'default',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !description.trim() || !selectedCategory) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier à nouveau la limite avant de créer
    const limitCheck = await checkCanCreateThread();
    if (!limitCheck.canCreate) {
      Alert.alert('Limitation', limitCheck.message);
      return;
    }

    try {
      setIsCreating(true);
      
      const threadData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
      };

      const result = await createForumThread(threadData);
      
      if (result) {
        Alert.alert(
          'Succès',
          'Votre discussion a été créée avec succès !',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/parent-dashboard/(tabs)/forum');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      
      // Gérer les différents types d'erreurs
      let errorMessage = 'Impossible de créer la discussion. Veuillez réessayer.';
      
      if (error.message && error.message.includes('une discussion par semaine')) {
        errorMessage = 'Vous ne pouvez créer qu\'une discussion par semaine. Veuillez attendre avant de créer une nouvelle discussion.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle discussion</Text>
        <TouchableOpacity
          style={[
            styles.createButton, 
            { 
              opacity: (isCreating || (limitInfo && !limitInfo.canCreate)) ? 0.5 : 1,
              backgroundColor: (limitInfo && !limitInfo.canCreate) ? '#9CA3AF' : '#10B981'
            }
          ]}
          onPress={handleCreate}
          disabled={isCreating || (limitInfo && !limitInfo.canCreate)}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>
              {(limitInfo && !limitInfo.canCreate) ? 'Indisponible' : 'Créer'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Information sur la limite */}
      {limitInfo && (
        <View style={[styles.limitInfo, { backgroundColor: limitInfo.canCreate ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.limitInfoText}>
            {limitInfo.message}
          </Text>
          {!limitInfo.canCreate && limitInfo.remainingTime && (
            <Text style={styles.limitInfoSubText}>
              Temps restant : {limitInfo.remainingTime} jour{limitInfo.remainingTime > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Titre */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Titre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.titleInput,
              (limitInfo && !limitInfo.canCreate) && styles.disabledInput
            ]}
            placeholder="Donnez un titre à votre discussion..."
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            editable={!limitInfo || limitInfo.canCreate}
          />
          <Text style={styles.charCount}>{title.length}/200</Text>
        </View>

        {/* Catégorie */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Catégorie <Text style={styles.required}>*</Text>
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                disabled={limitInfo && !limitInfo.canCreate}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.descriptionInput,
              (limitInfo && !limitInfo.canCreate) && styles.disabledInput
            ]}
            placeholder="Décrivez votre question ou sujet de discussion..."
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
            editable={!limitInfo || limitInfo.canCreate}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Conseils */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Conseils pour une bonne discussion</Text>
          <Text style={styles.tipText}>• Choisissez un titre clair et descriptif</Text>
          <Text style={styles.tipText}>• Sélectionnez la catégorie appropriée</Text>
          <Text style={styles.tipText}>• Détaillez votre question ou sujet</Text>
          <Text style={styles.tipText}>• Soyez respectueux envers les autres participants</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  titleInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  categoryScroll: {
    marginVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    height: 120,
  },
  tipsSection: {
    marginTop: 32,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
  limitInfo: {
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  limitInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  limitInfoSubText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
    opacity: 0.6,
  },
});
