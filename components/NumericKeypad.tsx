import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete } from 'lucide-react-native';

interface NumericKeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  maxLength?: number;
  currentValue: string;
}

export default function NumericKeypad({
  onPress,
  onDelete,
  maxLength = 6,
  currentValue,
}: NumericKeypadProps) {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  const handlePress = (value: string) => {
    if (value === 'delete') {
      onDelete();
    } else if (value && currentValue.length < maxLength) {
      onPress(value);
    }
  };

  return (
    <View style={styles.container}>
      {numbers.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((number, index) => (
            <TouchableOpacity
              key={`${rowIndex}-${index}`}
              style={[
                styles.key,
                number === '' && styles.emptyKey,
                number === 'delete' && styles.deleteKey,
              ]}
              onPress={() => handlePress(number)}
              disabled={number === ''}
              activeOpacity={number === '' ? 1 : 0.7}
              accessible={number !== ''}
              accessibilityRole={number === '' ? undefined : 'button'}
            >
              {number === 'delete' ? (
                <Delete size={24} color="#6B7280" />
              ) : (
                <Text
                  style={[styles.keyText, number === '' && styles.emptyKeyText]}
                >
                  {number || ' '}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyKey: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  deleteKey: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyKeyText: {
    opacity: 0,
  },
});
