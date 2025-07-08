import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TableModel } from '../types';
import { useGame } from '../contexts/GameContext';
import { X, Save, Shuffle, Trash2 } from 'lucide-react-native';

interface TableEditorProps {
  visible: boolean;
  table: TableModel | null;
  onClose: () => void;
  onSave: (table: TableModel) => void;
}

export default function TableEditor({ visible, table, onClose, onSave }: TableEditorProps) {
  const { checkSerialNumberExists, getRecommendedNumbers, hasStatisticalData } = useGame();
  const [customId, setCustomId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [numbers, setNumbers] = useState<string[]>(['', '', '', '', '', '', '']);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (table) {
      setCustomId(table.customId || '');
      setSerialNumber(table.serialNumber);
      const numberStrings = [...table.numbers.map(n => n.toString()), ...Array(7).fill('')].slice(0, 7);
      setNumbers(numberStrings);
      setHasChanges(false);
    }
  }, [table]);

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        '¿Deseas guardar los cambios antes de cerrar?',
        [
          { text: 'Descartar', style: 'destructive', onPress: onClose },
          { text: 'Guardar', onPress: handleSave },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!table) return;

    // Validate serial number
    if (serialNumber.trim() === '') {
      Alert.alert('Error', 'El número de serie es obligatorio');
      return;
    }

    if (checkSerialNumberExists(serialNumber, table.id)) {
      Alert.alert('Error', 'Este número de serie ya existe');
      return;
    }

    // Validate numbers
    const validNumbers = numbers
      .filter(n => n.trim() !== '')
      .map(n => parseInt(n))
      .filter(n => !isNaN(n) && n >= 1 && n <= 90);

    if (validNumbers.length > 0 && validNumbers.length !== 7) {
      Alert.alert('Error', 'Debes ingresar exactamente 7 números o dejar todos vacíos');
      return;
    }

    // Check for duplicates
    const uniqueNumbers = [...new Set(validNumbers)];
    if (uniqueNumbers.length !== validNumbers.length) {
      Alert.alert('Error', 'No puedes repetir números');
      return;
    }

    const updatedTable: TableModel = {
      ...table,
      customId: customId.trim() || undefined,
      serialNumber: serialNumber.trim(),
      numbers: validNumbers,
    };

    onSave(updatedTable);
    onClose();
  };

  const handleNumberChange = (index: number, value: string) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
    setHasChanges(true);
  };

  const handleFillWithRandomNumbers = async () => {
    const hasData = await hasStatisticalData();
    if (!hasData) {
      Alert.alert('Error', 'No hay estadísticas para recomendar números ganadores');
      return;
    }

    const recommendedNumbers = await getRecommendedNumbers(7);
    if (recommendedNumbers.length === 0) {
      Alert.alert('Error', 'No se pudieron obtener números recomendados');
      return;
    }

    setNumbers(recommendedNumbers.map(n => n.toString()));
    setHasChanges(true);
  };

  const handleClearNumbers = () => {
    setNumbers(['', '', '', '', '', '', '']);
    setHasChanges(true);
  };

  const getInputStyle = (value: string) => {
    if (value.trim() === '') {
      return [styles.input, styles.emptyInput];
    }
    return [styles.input, styles.filledInput];
  };

  if (!table) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Editar Tabla</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificador Personalizado</Text>
            <TextInput
              style={getInputStyle(customId)}
              value={customId}
              onChangeText={(text) => {
                setCustomId(text);
                setHasChanges(true);
              }}
              placeholder="Opcional"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Número de Serie *</Text>
            <TextInput
              style={getInputStyle(serialNumber)}
              value={serialNumber}
              onChangeText={(text) => {
                setSerialNumber(text);
                setHasChanges(true);
              }}
              placeholder="Requerido"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, styles.numbersSection]}>
            <View style={styles.numbersHeader}>
              <Text style={styles.sectionTitle}>Números (1-90)</Text>
              <View style={styles.numbersActions}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleFillWithRandomNumbers}
                >
                  <Shuffle size={16} color="#3B82F6" />
                  <Text style={styles.actionText}>Rellenar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.clearButton]} 
                  onPress={handleClearNumbers}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={[styles.actionText, styles.clearText]}>Vaciar</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.numbersGrid}>
              <View style={styles.numbersRow}>
                {numbers.slice(0, 3).map((num, index) => (
                  <TextInput
                    key={index}
                    style={[styles.numberInput, getInputStyle(num)]}
                    value={num}
                    onChangeText={(text) => handleNumberChange(index, text)}
                    placeholder="--"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ))}
              </View>
              <View style={styles.numbersRow}>
                <TextInput
                  style={[styles.numberInput, getInputStyle(numbers[3])]}
                  value={numbers[3]}
                  onChangeText={(text) => handleNumberChange(3, text)}
                  placeholder="--"
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
              <View style={styles.numbersRow}>
                {numbers.slice(4, 7).map((num, index) => (
                  <TextInput
                    key={index + 4}
                    style={[styles.numberInput, getInputStyle(num)]}
                    value={num}
                    onChangeText={(text) => handleNumberChange(index + 4, text)}
                    placeholder="--"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.saveButtonContainer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginVertical: 16,
  },
  numbersSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyInput: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    color: '#6B7280',
  },
  filledInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    color: '#1F2937',
  },
  numbersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numbersActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    gap: 4,
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  clearText: {
    color: '#EF4444',
  },
  numbersGrid: {
    alignItems: 'center',
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 4,
    gap: 8,
  },
  numberInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  saveButtonContainer: {
    marginTop: 16,
    paddingHorizontal: 0,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});