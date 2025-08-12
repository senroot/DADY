import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Package, ChevronDown } from 'lucide-react-native';
import { buildApiUrl } from '../../api';
import { getAuthToken } from '../../../utils/authUtils';

// Les packs sont chargés dynamiquement depuis le backend

export default function AddStudentScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [showPackSelector, setShowPackSelector] = useState(false);
  const [level, setLevel] = useState('');
  const [loadingPacks, setLoadingPacks] = useState(false);

  // Charger dynamiquement les packs depuis le backend
  useEffect(() => {
    const fetchPacks = async () => {
      setLoadingPacks(true);
      try {
        const token = await getAuthToken();
        const res = await fetch(buildApiUrl('/course/getAllPacks'), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data)) {
          setPacks(data.data);
        } else {
          Alert.alert(
            'Erreur',
            data.message || 'Impossible de charger les packs',
          );
        }
      } catch (e: any) {
        Alert.alert(
          'Erreur',
          e.message || 'Erreur réseau lors du chargement des packs',
        );
      } finally {
        setLoadingPacks(false);
      }
    };
    fetchPacks();
  }, []);

  const handleAddStudent = async () => {
    if (!firstName || !lastName || !selectedPack || !level) {
      Alert.alert(
        'Erreur',
        'Veuillez remplir tous les champs et sélectionner un pack et un niveau',
      );
      return;
    }
    try {
      const token = await getAuthToken();
      const res = await fetch(buildApiUrl('/parent/create-student'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          level,
          packId: selectedPack._id || selectedPack.id, // _id pour Mongo, id fallback
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Erreur lors de l'ajout de l'enfant");

      // Si la réponse contient bien un élève créé, rediriger automatiquement vers la page de paiement méthode
      if (data && data.data && data.data.student && data.data.student._id) {
        router.push({
          pathname: '/parent-dashboard/payment-method',
          params: {
            firstName: data.data.student.firstName,
            lastName: data.data.student.lastName,
            packId: selectedPack._id || selectedPack.id,
            packName: selectedPack.displayName || selectedPack.name,
            packPrice: selectedPack.price?.toString() || '',
            studentId: data.data.student._id,
            // Ajouter les identifiants de connexion
            identifiant: data.data.loginInfo?.username || data.data.studentId,
            password: data.data.loginInfo?.password || '',
          },
        });
        return;
      }
      // Sinon, fallback UX classique
      Alert.alert(
        'Succès',
        "L'enfant a bien été ajouté. Vous allez être redirigé vers le paiement.",
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/parent-dashboard/payment-method',
                params: {
                  firstName,
                  lastName,
                  packId: selectedPack._id || selectedPack.id,
                  packName: selectedPack.displayName || selectedPack.name,
                  packPrice: selectedPack.price?.toString() || '',
                  studentId: data.student?._id || '',
                  // Ajouter les identifiants de connexion s'ils sont disponibles
                  identifiant: data.loginInfo?.username || data.studentId || '',
                  password: data.loginInfo?.password || '',
                },
              });
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'ajouter l'enfant");
    }
  };

  const renderPackOption = (pack: any) => (
    <TouchableOpacity
      key={pack._id || pack.id}
      style={[
        styles.packOption,
        (selectedPack?._id || selectedPack?.id) === (pack._id || pack.id) &&
          styles.packOptionSelected,
      ]}
      onPress={() => {
        setSelectedPack(pack);
        setLevel(''); // reset le niveau si on change de pack
        setShowPackSelector(false);
      }}
    >
      <View
        style={[
          styles.packColorIndicator,
          { backgroundColor: pack.color || '#3B82F6' },
        ]}
      />
      <View style={styles.packInfo}>
        <Text style={styles.packName}>{pack.displayName || pack.name}</Text>
        <Text style={styles.packDescription}>{pack.description}</Text>
        <Text style={styles.packLevels}>
          Classes: {Array.isArray(pack.levels) ? pack.levels.join(', ') : ''}
        </Text>
        <Text style={styles.packPrice}>
          {pack.price} FCFA/{pack.duration}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter un Enfant</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Informations de l'enfant</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <User size={20} color="#6B7280" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Prénom de l'enfant"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <User size={20} color="#6B7280" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nom de l'enfant"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <Text style={styles.sectionTitle}>Sélection du Pack</Text>
          <TouchableOpacity
            style={styles.packSelector}
            onPress={() => setShowPackSelector(!showPackSelector)}
            disabled={loadingPacks}
          >
            <View style={styles.packSelectorContent}>
              <Package size={20} color="#6B7280" />
              <Text
                style={[
                  styles.packSelectorText,
                  !selectedPack && styles.packSelectorPlaceholder,
                ]}
              >
                {selectedPack
                  ? selectedPack.displayName || selectedPack.name
                  : loadingPacks
                    ? 'Chargement...'
                    : "Choisir un pack d'abonnement"}
              </Text>
              <ChevronDown size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>

          {showPackSelector && (
            <View style={styles.packOptions}>
              {packs.map(renderPackOption)}
            </View>
          )}

          {/* Sélection du niveau (level) dépendant du pack choisi */}
          {selectedPack && Array.isArray(selectedPack.levels) && (
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: '#1F2937',
                  marginBottom: 8,
                }}
              >
                Niveau de l'enfant
              </Text>
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  elevation: 2,
                }}
              >
                {selectedPack.levels.map((lvl: string) => (
                  <TouchableOpacity
                    key={lvl}
                    style={{
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                    onPress={() => setLevel(lvl)}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 2,
                        borderColor: '#3B82F6',
                        marginRight: 10,
                        backgroundColor: level === lvl ? '#3B82F6' : '#fff',
                      }}
                    />
                    <Text style={{ color: '#1F2937', fontSize: 16 }}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {selectedPack && (
            <View style={styles.selectedPackPreview}>
              <Text style={styles.previewTitle}>Pack sélectionné:</Text>
              <View
                style={[
                  styles.packPreview,
                  { borderColor: selectedPack.color || '#3B82F6' },
                ]}
              >
                <View
                  style={[
                    styles.packColorIndicator,
                    { backgroundColor: selectedPack.color || '#3B82F6' },
                  ]}
                />
                <View style={styles.packPreviewInfo}>
                  <Text style={styles.packPreviewName}>
                    {selectedPack.displayName || selectedPack.name}
                  </Text>
                  <Text style={styles.packPreviewPrice}>
                    {selectedPack.price} FCFA/{selectedPack.duration}
                  </Text>
                  <Text style={styles.packPreviewLevels}>
                    Classes:{' '}
                    {Array.isArray(selectedPack.levels)
                      ? selectedPack.levels.join(', ')
                      : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              (!firstName || !lastName || !selectedPack || !level) &&
                styles.continueButtonDisabled,
            ]}
            onPress={handleAddStudent}
            disabled={!firstName || !lastName || !selectedPack || !level}
          >
            <Text style={styles.continueButtonText}>
              Continuer vers le Paiement
            </Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  form: {
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1F2937',
  },
  packSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  packSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  packSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 10,
  },
  packSelectorPlaceholder: {
    color: '#9CA3AF',
  },
  packOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  packOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  packOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  packColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  packDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  packLevels: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  packPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  selectedPackPreview: {
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  packPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  packPreviewInfo: {
    flex: 1,
  },
  packPreviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  packPreviewPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  packPreviewLevels: {
    fontSize: 12,
    color: '#6B7280',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
