import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { TableModel } from '../types';
import { Check, X, CreditCard as Edit3 } from 'lucide-react-native';

interface TableCardProps {
  table: TableModel;
  onEdit: (table: TableModel) => void;
  onDelete: (id: string) => void;
  onToggleCheck: (table: TableModel) => void;
}

export default function TableCard({ table, onEdit, onDelete, onToggleCheck }: TableCardProps) {
  const getCardStyle = () => {
    if (!table.isComplete) {
      return [styles.card, styles.incompleteCard];
    }
    if (table.isChecked) {
      return [styles.card, styles.checkedCard];
    }
    return [styles.card, styles.completeCard];
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Tabla',
      '¿Estás seguro de que deseas eliminar esta tabla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(table.id) }
      ]
    );
  };

  const formatNumbers = (numbers: number[]) => {
    if (numbers.length === 0) return ['--', '--', '--', '--', '--', '--', '--'];
    const formatted = [...numbers];
    while (formatted.length < 7) {
      formatted.push(0);
    }
    return formatted;
  };

  const numbers = formatNumbers(table.numbers);

  return (
    <TouchableOpacity style={getCardStyle()} onPress={() => onEdit(table)} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.identifiers}>
          <Text style={styles.customId}>
            ID: {table.customId || '--'}
          </Text>
          <Text style={styles.serialNumber}>
            Serie: {table.serialNumber || '------'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.checkButton, table.isChecked && styles.checkedButton]}
            onPress={() => onToggleCheck(table)}
          >
            <Check size={14} color={table.isChecked ? '#FFFFFF' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(table)}>
            <Edit3 size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <X size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.numbersContainer}>
        <View style={styles.numbersRow}>
          {numbers.slice(0, 3).map((num, index) => (
            <View key={index} style={styles.numberCell}>
              <Text style={styles.numberText}>
                {num === 0 ? '--' : num.toString().padStart(2, '0')}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.numbersRow}>
          <View style={styles.numberCell}>
            <Text style={styles.numberText}>
              {numbers[3] === 0 ? '--' : numbers[3].toString().padStart(2, '0')}
            </Text>
          </View>
        </View>
        <View style={styles.numbersRow}>
          {numbers.slice(4, 7).map((num, index) => (
            <View key={index + 4} style={styles.numberCell}>
              <Text style={styles.numberText}>
                {num === 0 ? '--' : num.toString().padStart(2, '0')}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    maxWidth: '48%',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 120,
  },
  incompleteCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  completeCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  checkedCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  identifiers: {
    flex: 1,
  },
  customId: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  serialNumber: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  checkButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedButton: {
    backgroundColor: '#10B981',
  },
  editButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numbersContainer: {
    alignItems: 'center',
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 1,
  },
  numberCell: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  numberText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
});