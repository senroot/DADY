import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CodeDisplayProps {
  code: string;
  maxLength: number;
  isValidating?: boolean;
}

export default function CodeDisplay({ code, maxLength, isValidating = false }: CodeDisplayProps) {
  const dots = Array.from({ length: maxLength }, (_, index) => (
    <View
      key={index}
      style={[
        styles.dot,
        index < code.length ? styles.filledDot : styles.emptyDot,
        isValidating && code.length === maxLength && styles.validatingDot,
      ]}
    />
  ));

  return <View style={styles.container}>{dots}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 15,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  emptyDot: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  filledDot: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  validatingDot: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
});
