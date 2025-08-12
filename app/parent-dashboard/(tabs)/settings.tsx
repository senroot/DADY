import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { Mail } from 'lucide-react-native';
import { Phone } from 'lucide-react-native';
import { Calendar } from 'lucide-react-native';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { Camera } from 'lucide-react-native';
import { Edit3 } from 'lucide-react-native';
import { Save } from 'lucide-react-native';
import { LogOut } from 'lucide-react-native';
import { Shield } from 'lucide-react-native';
import { Bell } from 'lucide-react-native';
import { Lock } from 'lucide-react-native';
import { HelpCircle } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { UserCircle } from 'lucide-react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { buildApiUrl } from '../../api';
import { getAuthToken } from '../../../utils/authUtils';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // États pour les informations du profil
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.image || null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  // Recharger les données quand l'utilisateur change dans le contexte
  useEffect(() => {
    if (user) {
      console.log('👤 Mise à jour des données depuis le contexte utilisateur...');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setProfileImage(user.image || null);
    }
  }, [user]);

  const fetchProfileDetails = async () => {
    try {
      setLoadingProfile(true);
      console.log('📋 Chargement des détails du profil utilisateur...');
      
      const token = await getAuthToken();
      const res = await fetch(buildApiUrl('/profile/getUserDetails'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      console.log('📄 Réponse getUserDetails:', data);
      
      if (res.ok && data.success && data.data) {
        const userData = data.data;
        
        // Mettre à jour les informations de base de l'utilisateur
        console.log('✅ Mise à jour des informations utilisateur:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          image: userData.image ? 'Présente' : 'Absente'
        });
        
        setFirstName(userData.firstName || '');
        setLastName(userData.lastName || '');
        setEmail(userData.email || '');
        setProfileImage(userData.image || null);
        
        // Mettre à jour les détails additionnels du profil
        const profile = userData.additionalDetails;
        if (profile) {
          console.log('📝 Détails additionnels:', {
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            contactNumber: profile.contactNumber
          });
          
          setDateOfBirth(profile.dateOfBirth || '');
          setGender(profile.gender || '');
          setPhone(profile.contactNumber || '');
        }
        
        console.log('✅ Profil mis à jour avec succès dans l\'interface');
      } else {
        console.error('❌ Erreur API getUserDetails:', data.message);
      }
    } catch (e: any) {
      console.error('❌ Erreur lors du chargement du profil:', e.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log("🖼️ Tentative de sélection d'image...");

      // Vérifier si on est sur le web
      if (Platform.OS === 'web') {
        Alert.alert(
          'Fonctionnalité non disponible',
          "La sélection d'image n'est pas encore disponible sur le web. Cette fonctionnalité sera ajoutée prochainement.",
        );
        return;
      }

      // Demander les permissions pour mobile
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission requise',
          "Nous avons besoin de l'accès à votre galerie pour changer votre photo de profil.",
        );
        return;
      }

      // Ouvrir le picker d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Image sélectionnée:', result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("❌ Erreur lors de la sélection d'image:", error);
      Alert.alert(
        'Erreur',
        "Une erreur s'est produite lors de la sélection de l'image.",
      );
    }
  };
  const takePhoto = async () => {
    try {
      console.log('📷 Tentative de prise de photo...');
      
      // Vérifier si on est sur le web
      if (Platform.OS === 'web') {
        Alert.alert(
          'Fonctionnalité non disponible',
          'La prise de photo n\'est pas disponible sur le web. Veuillez utiliser cette fonctionnalité sur mobile.'
        );
        return;
      }

      // Demander les permissions de caméra pour mobile
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de l\'accès à votre caméra pour prendre une photo.'
        );
        return;
      }

      // Ouvrir la caméra
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo prise:', result.assets[0].uri);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la prise de photo.');
    }
  };

  const showImagePicker = () => {
    console.log('📱 Affichage du sélecteur d\'image...');
    
    if (Platform.OS === 'web') {
      // Sur le web, créer un input file HTML
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            console.log('✅ Image sélectionnée sur web');
            setProfileImage(result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    Alert.alert(
      'Changer la photo',
      'Comment souhaitez-vous ajouter une photo ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Galerie',
          onPress: pickImage,
        },
        {
          text: 'Appareil photo',
          onPress: takePhoto,
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Erreur', 'Le prénom et le nom sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();
      console.log('🔄 Mise à jour du profil en cours...');

      // 1. Mettre à jour l'image d'abord si elle a changé
      if (profileImage && profileImage !== user?.image) {
        console.log('📷 Upload de l\'image en cours...');
        await uploadProfileImage(profileImage, token);
      }

      // 2. Mettre à jour les autres informations du profil
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        dateOfBirth: dateOfBirth,
        gender: gender,
      };

      const res = await fetch(buildApiUrl('/profile/updateProfile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      console.log('📝 Réponse du serveur:', data);
      
      if (res.ok && data.success) {
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setEditing(false);
        
        // Recharger le contexte pour mettre à jour l'utilisateur partout
        if (refreshUser) {
          console.log('🔄 Actualisation du contexte utilisateur...');
          await refreshUser();
        }
      } else {
        console.error('❌ Erreur API:', data);
        Alert.alert(
          'Erreur',
          data.message || 'Impossible de mettre à jour le profil',
        );
      }
    } catch (e: any) {
      console.error('❌ Erreur lors de la sauvegarde:', e);
      Alert.alert('Erreur', e.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // Fonction séparée pour upload d'image
  const uploadProfileImage = async (imageUri: string, token: string) => {
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Sur le web, convertir base64 en blob
        if (imageUri.startsWith('data:')) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          formData.append('displayPicture', blob, 'profile-image.jpg');
        }
      } else {
        // Sur mobile, créer un objet File pour React Native
        const imageFile = {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'profile-image.jpg',
        } as any;
        formData.append('displayPicture', imageFile);
      }

      const res = await fetch(buildApiUrl('/profile/updateDisplayPicture'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type avec FormData
        },
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        console.log('✅ Image uploadée avec succès');
        // Mettre à jour l'état local avec l'URL de l'image depuis Cloudinary
        if (data.data?.image) {
          setProfileImage(data.data.image);
        }
        return data;
      } else {
        console.error('❌ Erreur upload image:', data);
        throw new Error(data.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          disabled={loading}
        >
          {editing ? (
            <Save size={20} color="#10B981" />
          ) : (
            <Edit3 size={20} color="#10B981" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Indicateur de chargement pour les détails du profil */}
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement du profil...</Text>
          </View>
        ) : (
          <>
            {/* Section profil */}
            <View style={styles.profileCard}>
              <View style={styles.profileImageContainer}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <UserCircle size={50} color="#10B981" />
                  </View>
                )}
                {editing && (
                  <TouchableOpacity style={styles.cameraButton} onPress={showImagePicker}>
                    <Camera size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {firstName || 'Prénom'} {lastName || 'Nom'}
                </Text>
                <Text style={styles.profileRole}>👤 Parent</Text>
                <Text style={styles.profilePhone}>{phone || 'Téléphone non renseigné'}</Text>
              </View>
              {!editing && (
                <TouchableOpacity
                  style={styles.editProfileButton}
                  onPress={() => setEditing(true)}
                >
                  <Edit3 size={18} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>

            {/* Informations personnelles - seulement si en mode édition */}
            {editing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✏️ Modifier mes informations
            </Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <User size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Prénom"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <User size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Nom"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Mail size={18} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Email (optionnel)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Calendar size={18} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Date de naissance (JJ/MM/AAAA)"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
            </View>

            <View style={styles.inputContainer}>
              <SettingsIcon size={18} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Sexe (Homme/Femme/Autre)"
                value={gender}
                onChangeText={setGender}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading
                  ? 'Enregistrement...'
                  : 'Enregistrer les modifications'}
              </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Menu des paramètres */}
          <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Paramètres du compte</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}
              >
                <Bell size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Notifications</Text>
                <Text style={styles.menuItemSubtitle}>
                  Gérer vos alertes et notifications
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}
              >
                <Lock size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Sécurité</Text>
                <Text style={styles.menuItemSubtitle}>
                  Mot de passe et code secret
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/auth/admin')}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#E0E7FF' }]}
              >
                <Shield size={20} color="#6366F1" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Administration</Text>
                <Text style={styles.menuItemSubtitle}>
                  Accès aux fonctionnalités admin
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Support</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}
              >
                <HelpCircle size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.menuItemTitle}>Centre d'aide</Text>
                <Text style={styles.menuItemSubtitle}>
                  FAQ et guide d'utilisation
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <LogOut size={22} color="#EF4444" />
            </View>
            <Text style={styles.logoutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Espacement en bas */}
        <View style={styles.bottomSpacing} />
          </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Loading
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  defaultProfileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  editProfileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },

  // Section
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },

  // Edit Form
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Menu Items
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutIconContainer: {
    marginRight: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  bottomSpacing: {
    height: 40,
  },
});
