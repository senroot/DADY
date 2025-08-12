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
import { safeRedirect } from '../../utils/navigation';
import {
  Users,
  Phone,
  Mail,
  Lock,
  ArrowLeft,
  UserPlus,
} from 'lucide-react-native';
import { buildApiUrl } from '../api';
import { storeAuthToken, storeUserData } from '../../utils/authUtils';
import NumericKeypad from '../../components/NumericKeypad';
import CodeDisplay from '../../components/CodeDisplay';

export default function ParentAuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [tempPhone, setTempPhone] = useState('');

  // Register form (étapes)
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [secretCodeRegister, setSecretCodeRegister] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [secretCodeAttempts, setSecretCodeAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      const phone = loginEmail.startsWith('+') ? loginEmail : loginEmail;
      const response = await fetch(buildApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Identifiants invalides');
      }
      if (data.requireSecretCode) {
        setShowSecretCode(true);
        setTempPhone(data.phone || phone);
        return;
      }
      // Stocker le token et le user complet
      if (data.token) await storeAuthToken(data.token);
      if (data.user) await storeUserData(data.user);
      router.replace('/parent-dashboard');
    } catch (error: any) {
      Alert.alert(
        'Erreur de connexion',
        error.message || 'Une erreur est survenue',
      );
    }
  };

  const handleSecretCode = async () => {
    if (!secretCode) {
      Alert.alert('Erreur', 'Veuillez entrer le code secret');
      return;
    }
    setIsValidatingCode(true);
    setErrorMessage('');

    try {
      const response = await fetch(buildApiUrl('/auth/verify-secret-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: tempPhone, secretCode }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.message === 'Code secret incorrect') {
          const newAttempts = secretCodeAttempts + 1;
          setSecretCodeAttempts(newAttempts);

          if (newAttempts >= 3) {
            setErrorMessage('Compte verrouillé après 3 tentatives incorrectes');
            Alert.alert(
              'Compte verrouillé',
              'Votre compte a été verrouillé après 3 tentatives incorrectes. Veuillez contacter le support.',
              [{ text: 'OK', onPress: () => safeRedirect.toAuth() }],
            );
            return;
          } else {
            const remainingAttempts = 3 - newAttempts;
            setErrorMessage(
              `Code incorrect. ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''} restante${remainingAttempts > 1 ? 's' : ''}`,
            );
            setSecretCode(''); // Reset le code pour permettre une nouvelle saisie
          }
        } else {
          throw new Error(data.message || 'Code secret invalide');
        }
        return;
      }

      // Succès - Reset les tentatives
      setSecretCodeAttempts(0);
      setErrorMessage('');

      // Stocker le token et le user complet
      if (data.token) await storeAuthToken(data.token);
      if (data.user) await storeUserData(data.user);
      setShowSecretCode(false);
      setSecretCode('');
      setTempPhone('');
      router.replace('/parent-dashboard');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Etape 1 : infos de base
  const handleRegisterStep1 = async () => {
    const { firstName, lastName, phone, password, confirmPassword } =
      registerData;
    if (!firstName || !lastName || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    try {
      // Envoi OTP
      const response = await fetch(buildApiUrl('/auth/send-registration-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de l���envoi du code');
      }
      setRegisterStep(2);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    }
  };

  // Etape 2 : vérification OTP
  const handleRegisterStep2 = async () => {
    if (!otp) {
      Alert.alert('Erreur', 'Veuillez entrer le code reçu par SMS');
      return;
    }
    setIsValidatingCode(true);
    try {
      const response = await fetch(buildApiUrl('/auth/signup-with-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          phone: registerData.phone,
          password: registerData.password,
          confirmPassword: registerData.confirmPassword,
          otp,
          accountType: 'Parent',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Code OTP invalide');
      }
      setRegisterStep(3);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Etape 3 : création du code secret
  const handleRegisterStep3 = async () => {
    if (!secretCodeRegister) {
      Alert.alert('Erreur', 'Veuillez définir un code secret');
      return;
    }
    setIsValidatingCode(true);
    try {
      const response = await fetch(buildApiUrl('/auth/create-secret-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: registerData.phone,
          secretCode: secretCodeRegister,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Erreur lors de la création du code secret',
        );
      }
      // Redirection automatique vers la page de connexion parent sans alerte
      setActiveTab('login');
      setRegisterStep(1);
      setOtp('');
      setSecretCodeRegister('');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const updateRegisterData = (field: string, value: string) => {
    setRegisterData((prev) => ({ ...prev, [field]: value }));
  };

  // Fonctions pour gérer le clavier numérique
  const handleKeypadPress = (value: string, isRegister = false) => {
    if (isRegister) {
      if (secretCodeRegister.length < 4) {
        setSecretCodeRegister((prev) => prev + value);
      }
    } else {
      if (secretCode.length < 4) {
        setSecretCode((prev) => prev + value);
      }
    }
  };

  const handleKeypadDelete = (isRegister = false) => {
    if (isRegister) {
      setSecretCodeRegister((prev) => prev.slice(0, -1));
    } else {
      setSecretCode((prev) => prev.slice(0, -1));
    }
  };

  const handleOtpKeypadPress = (value: string) => {
    if (otp.length < 6) {
      setOtp((prev) => prev + value);
    }
  };

  const handleOtpKeypadDelete = () => {
    setOtp((prev) => prev.slice(0, -1));
  };

  // Auto-validation quand le code atteint 4 chiffres
  useEffect(() => {
    if (secretCode.length === 4 && showSecretCode && secretCodeAttempts < 3) {
      // Délai court pour l'effet visuel
      setTimeout(() => {
        handleSecretCode();
      }, 500);
    }
  }, [secretCode]);

  useEffect(() => {
    if (otp.length === 6 && registerStep === 2) {
      setTimeout(() => {
        handleRegisterStep2();
      }, 500);
    }
  }, [otp]);

  useEffect(() => {
    if (secretCodeRegister.length === 4 && registerStep === 3) {
      setTimeout(() => {
        handleRegisterStep3();
      }, 500);
    }
  }, [secretCodeRegister]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/')}
      >
        <ArrowLeft size={24} color="#6B7280" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Users size={40} color="#10B981" />
        </View>
        <Text style={styles.title}>Espace Parent</Text>
        <Text style={styles.subtitle}>
          Gérez le parcours éducatif de vos enfants
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'login' && styles.activeTab]}
          onPress={() => {
            setActiveTab('login');
            setSecretCodeAttempts(0);
            setErrorMessage('');
            setSecretCode('');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'login' && styles.activeTabText,
            ]}
          >
            Connexion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'register' && styles.activeTab]}
          onPress={() => {
            setActiveTab('register');
            setSecretCodeAttempts(0);
            setErrorMessage('');
            setSecretCode('');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'register' && styles.activeTabText,
            ]}
          >
            Inscription
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'login' ? (
          !showSecretCode ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Phone size={20} color="#6B7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Numéro de téléphone"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#6B7280" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
              >
                <Text style={styles.primaryButtonText}>Se connecter</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.codeTitle}>Entrez votre code secret</Text>
              <Text style={styles.codeSubtitle}>
                Saisissez votre code à 4 chiffres
              </Text>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <CodeDisplay
                code={secretCode}
                maxLength={4}
                isValidating={isValidatingCode}
              />

              {secretCodeAttempts < 3 ? (
                <NumericKeypad
                  onPress={(value) => handleKeypadPress(value, false)}
                  onDelete={() => handleKeypadDelete(false)}
                  currentValue={secretCode}
                  maxLength={4}
                />
              ) : (
                <View style={styles.lockedContainer}>
                  <Text style={styles.lockedText}>🔒 Compte verrouillé</Text>
                  <Text style={styles.lockedSubtext}>
                    Contactez le support pour débloquer votre compte
                  </Text>
                </View>
              )}
            </View>
          )
        ) : (
          <View style={styles.form}>
            {registerStep === 1 && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Prénom"
                      value={registerData.firstName}
                      onChangeText={(value) =>
                        updateRegisterData('firstName', value)
                      }
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nom"
                      value={registerData.lastName}
                      onChangeText={(value) =>
                        updateRegisterData('lastName', value)
                      }
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Phone size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Numéro de téléphone"
                    value={registerData.phone}
                    onChangeText={(value) => updateRegisterData('phone', value)}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Lock size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    value={registerData.password}
                    onChangeText={(value) =>
                      updateRegisterData('password', value)
                    }
                    secureTextEntry
                  />
                </View>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Lock size={20} color="#6B7280" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    value={registerData.confirmPassword}
                    onChangeText={(value) =>
                      updateRegisterData('confirmPassword', value)
                    }
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegisterStep1}
                >
                  <UserPlus size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Continuer</Text>
                </TouchableOpacity>
              </>
            )}
            {registerStep === 2 && (
              <>
                <Text style={styles.codeTitle}>
                  Entrez le code reçu par SMS
                </Text>
                <Text style={styles.codeSubtitle}>
                  Saisissez le code à 6 chiffres envoyé sur votre téléphone
                </Text>

                <CodeDisplay
                  code={otp}
                  maxLength={6}
                  isValidating={isValidatingCode}
                />

                <NumericKeypad
                  onPress={handleOtpKeypadPress}
                  onDelete={handleOtpKeypadDelete}
                  currentValue={otp}
                  maxLength={6}
                />
              </>
            )}
            {registerStep === 3 && (
              <>
                <Text style={styles.codeTitle}>
                  Définissez votre code secret
                </Text>
                <Text style={styles.codeSubtitle}>
                  Créez un code à 4 chiffres pour sécuriser votre compte
                </Text>

                <CodeDisplay
                  code={secretCodeRegister}
                  maxLength={4}
                  isValidating={isValidatingCode}
                />

                <NumericKeypad
                  onPress={(value) => handleKeypadPress(value, true)}
                  onDelete={() => handleKeypadDelete(true)}
                  currentValue={secretCodeRegister}
                  maxLength={4}
                />
              </>
            )}
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#10B981',
  },
  formContainer: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  halfInput: {
    width: '48%',
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
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 15,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkButtonText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  codeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  codeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  lockedContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  lockedSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
