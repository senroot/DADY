import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone } from 'lucide-react-native';

const paymentMethods = [
  {
    id: 'stripe',
    name: 'Carte Bancaire',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCard,
    color: '#6366F1',
    logo: '💳',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    description: 'Paiement mobile Orange',
    icon: Smartphone,
    color: '#FF6B00',
    logo: '🟠',
  },
  {
    id: 'wave',
    name: 'Wave Money',
    description: 'Portefeuille mobile Wave',
    icon: Smartphone,
    color: '#00D4AA',
    logo: '🌊',
  },
];

export default function PaymentMethodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const {
    firstName,
    lastName,
    packName,
    packPrice,
    studentId,
    packId,
    identifiant,
    password,
  } = params;

  const handleContinue = () => {
    if (!selectedMethod) return;

    router.push({
      pathname: '/parent-dashboard/payment-summary',
      params: {
        firstName,
        lastName,
        packName,
        packPrice,
        paymentMethod: selectedMethod,
        studentId, // Ajouté pour Stripe
        packId, // Ajouté pour Stripe
        identifiant, // Identifiant de connexion de l'élève
        password, // Mot de passe de connexion de l'élève
      },
    });
  };

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.methodCard,
        selectedMethod === method.id && styles.methodCardSelected,
        {
          borderColor: selectedMethod === method.id ? method.color : '#E5E7EB',
        },
      ]}
      onPress={() => setSelectedMethod(method.id)}
    >
      <View
        style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}
      >
        <Text style={styles.methodLogo}>{method.logo}</Text>
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{method.name}</Text>
        <Text style={styles.methodDescription}>{method.description}</Text>
      </View>
      <View
        style={[
          styles.radioButton,
          selectedMethod === method.id && {
            backgroundColor: method.color,
            borderColor: method.color,
          },
        ]}
      >
        {selectedMethod === method.id && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/parent-dashboard/(tabs)/add-student')}
        >
          <ArrowLeft size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Méthode de Paiement</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Récapitulatif</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Enfant:</Text>
            <Text style={styles.summaryValue}>
              {firstName} {lastName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pack:</Text>
            <Text style={styles.summaryValue}>{packName}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>
              {typeof packPrice === 'string'
                ? packPrice.replace(/€/g, '').trim()
                : packPrice}{' '}
              FCFA/mois
            </Text>
          </View>
        </View>

        <View style={styles.methodsContainer}>
          <Text style={styles.sectionTitle}>
            Choisissez votre méthode de paiement
          </Text>
          {paymentMethods.map(renderPaymentMethod)}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedMethod}
        >
          <Text style={styles.continueButtonText}>Continuer</Text>
        </TouchableOpacity>
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
  orderSummary: {
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
    marginTop: 10,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  methodsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  methodCardSelected: {
    backgroundColor: '#F8FAFC',
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  methodLogo: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 30,
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
