import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface NumberGridProps {
  drawnNumbers: number[];
  onNumberPress: (number: number) => void;
}

export default function NumberGrid({ drawnNumbers, onNumberPress }: NumberGridProps) {
  const numbers = Array.from({ length: 90 }, (_, i) => i + 1);

  const renderNumber = (number: number) => {
    const isDrawn = drawnNumbers.includes(number);
    
    return (
      <TouchableOpacity
        key={number}
        style={[styles.numberCell, isDrawn && styles.drawnNumberCell]}
        onPress={() => onNumberPress(number)}
        activeOpacity={0.7}
      >
        <Text style={[styles.numberText, isDrawn && styles.drawnNumberText]}>
          {number.toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {numbers.map(renderNumber)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  numberCell: {
    width: '10%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  drawnNumberCell: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  numberText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  drawnNumberText: {
    color: '#FFFFFF',
  },
});