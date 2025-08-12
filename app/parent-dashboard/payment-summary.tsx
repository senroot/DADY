import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CircleCheck as CheckCircle,
  CreditCard,
  Smartphone,
} from 'lucide-react-native';
import { buildApiUrl, API_CONFIG } from '../api';
import { getAuthToken } from '../../utils/authUtils';

export default function PaymentSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  let pollingInterval: ReturnType<typeof setInterval> | null = null;

  const {
    firstName,
    lastName,
    packName,
    packPrice,
    paymentMethod,
    studentId,
    packId,
    identifiant,
    password,
  } = params;

  // Nettoyer le prix pour enlever le symbole euro s'il est présent
  const cleanPrice =
    typeof packPrice === 'string'
      ? packPrice.replace(/€/g, '').trim()
      : packPrice;

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'stripe':
        return {
          name: 'Carte Bancaire',
          icon: CreditCard,
          color: '#6366F1',
          logo: '💳',
        };
      case 'orange':
        return {
          name: 'Orange Money',
          icon: Smartphone,
          color: '#FF6B00',
          logo: '🟠',
        };
      case 'wave':
        return {
          name: 'Wave Money',
          icon: Smartphone,
          color: '#00D4AA',
          logo: '🌊',
        };
      default:
        return {
          name: 'Méthode inconnue',
          icon: CreditCard,
          color: '#6B7280',
          logo: '💳',
        };
    }
  };

  const methodInfo = getPaymentMethodInfo(paymentMethod as string);

  const pollStripePayment = (sessionId: string, paramsToPass: any) => {
    setPolling(true);
    setPollingError(null);
    let attempts = 0;
    pollingInterval = setInterval(async () => {
      attempts++;
      try {
        const url = `${API_CONFIG.BASE_URL}/payment/success?session_id=${sessionId}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          if (pollingInterval) clearInterval(pollingInterval);
          setPolling(false);
          setIsProcessing(false);
          router.replace({
            pathname: '/parent-dashboard/payment-success',
            params: paramsToPass,
          });
        }
      } catch (e) {
        setPollingError('Erreur lors de la vérification du paiement.');
      }
      // Optionnel : arrêter après X tentatives
      if (attempts > 30 && pollingInterval) {
        clearInterval(pollingInterval);
        setPolling(false);
        setIsProcessing(false);
        setPollingError(
          "Le paiement n'a pas été confirmé après plusieurs tentatives.",
        );
      }
    }, 10000); // 10 secondes
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      if (paymentMethod === 'stripe') {
        const token = await getAuthToken();
        // Forcer string simple (jamais tableau)
        const studentIdStr = Array.isArray(studentId)
          ? studentId[0]
          : studentId;
        const packIdStr = Array.isArray(packId) ? packId[0] : packId;
        // DEBUG : log les valeurs envoyées
        console.log('Stripe params:', {
          studentId,
          packId,
          studentIdStr,
          packIdStr,
          types: {
            studentId: typeof studentId,
            packId: typeof packId,
            studentIdStr: typeof studentIdStr,
            packIdStr: typeof packIdStr,
          },
        });
        const res = await fetch(
          buildApiUrl('/payment/createChildPackPaymentIntent'),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              childId: studentIdStr, // <-- clé adaptée pour le backend
              packId: packIdStr,
            }),
          },
        );
        const data = await res.json();
        if (
          res.ok &&
          data.success &&
          data.data?.paymentUrl &&
          data.data?.sessionId
        ) {
          setIsProcessing(true);
          Linking.openURL(data.data.paymentUrl);
          // Lancer le polling Stripe
          pollStripePayment(data.data.sessionId, {
            firstName,
            lastName,
            packName,
            packPrice: cleanPrice,
            paymentMethod,
            identifiant: identifiant || studentId || '',
            password: password || '',
          });
          return;
        } else {
          throw new Error(
            data.message || "Impossible d'obtenir le lien de paiement Stripe",
          );
        }
      }
      // Simulation du processus de paiement pour d'autres méthodes
      await new Promise((resolve) => setTimeout(resolve, 3000));
      router.replace({
        pathname: '/parent-dashboard/payment-success',
        params: {
          firstName,
          lastName,
          packName,
          packPrice: cleanPrice,
          paymentMethod,
          identifiant: identifiant || studentId || '',
          password: password || '',
        },
      });
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || 'Le paiement a échoué. Veuillez réessayer.',
      );
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/parent-dashboard/payment-method')}
          disabled={isProcessing}
        >
          <ArrowLeft size={24} color={isProcessing ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
        <Text style={styles.title}>Récapitulatif du Paiement</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          {/* DEBUG: afficher les IDs transmis */}
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 5 }}>
            studentId: {studentId?.toString() || 'undefined'} | packId:{' '}
            {packId?.toString() || 'undefined'}
          </Text>
          <Text style={styles.cardTitle}>Détails de l'abonnement</Text>

          <View style={styles.studentInfo}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>
                {typeof firstName === 'string' ? firstName.charAt(0) : ''}
                {typeof lastName === 'string' ? lastName.charAt(0) : ''}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.studentPack}>{packName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionLabel}>Méthode de paiement</Text>
            <View style={styles.paymentMethodInfo}>
              <View
                style={[
                  styles.methodIconSmall,
                  { backgroundColor: `${methodInfo.color}15` },
                ]}
              >
                <Text style={styles.methodLogoSmall}>{methodInfo.logo}</Text>
              </View>
              <Text style={styles.methodNameSmall}>{methodInfo.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.pricingSection}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{packName}</Text>
              <Text style={styles.priceValue}>{cleanPrice} FCFA</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de traitement</Text>
              <Text style={styles.priceValue}>0 FCFA</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total mensuel</Text>
              <Text style={styles.totalValue}>{cleanPrice} FCFA</Text>
            </View>
          </View>

          <View style={styles.subscriptionNote}>
            <Text style={styles.noteText}>
              💡 Votre abonnement sera renouvelé automatiquement chaque mois.
              Vous pouvez l'annuler à tout moment depuis votre espace parent.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.payButton,
            (isProcessing || polling) && styles.payButtonProcessing,
          ]}
          onPress={handlePayment}
          disabled={isProcessing || polling}
        >
          {isProcessing || polling ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.processingText}>
                Traitement en cours... Paiement en attente
              </Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>Procéder au Paiement</Text>
          )}
        </TouchableOpacity>
        {pollingError && (
          <Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>
            {pollingError}
          </Text>
        )}
        <Text style={styles.securityNote}>
          🔒 Paiement sécurisé - Vos données sont protégées
        </Text>
      </View>
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  studentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  studentPack: {
    fontSize: 16,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  paymentMethodSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodLogoSmall: {
    fontSize: 20,
  },
  methodNameSmall: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  pricingSection: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  subscriptionNote: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 15,
  },
  noteText: {
    fontSize: 14,
    color: '#3B82F6',
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonProcessing: {
    backgroundColor: '#6B7280',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  securityNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
