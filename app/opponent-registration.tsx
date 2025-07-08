import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '../contexts/GameContext';
import { OpponentWinnerModel } from '../types';
import { Users, Save, Plus, X, ArrowRight, Loader } from 'lucide-react-native';

interface OpponentEntry {
  id: string;
  gameType: 'main' | 'secondary';
  numbers: string[];
  serialNumber: string;
  winningAmount: string;
  notes: string;
}

export default function OpponentRegistrationScreen() {
  const router = useRouter();
  const { currentGame, finishGame, isLoading } = useGame();
  const [opponents, setOpponents] = useState<OpponentEntry[]>([]);
  const [gamePhase, setGamePhase] = useState<'main' | 'secondary'>('main');

  useEffect(() => {
    if (!currentGame) {
      router.back();
      return;
    }
    
    // Add initial opponent entry
    addOpponent();
  }, []);

  const addOpponent = () => {
    const newOpponent: OpponentEntry = {
      id: Date.now().toString(),
      gameType: gamePhase,
      numbers: ['', '', '', '', '', '', ''],
      serialNumber: '',
      winningAmount: '',
      notes: '',
    };
    setOpponents([...opponents, newOpponent]);
  };

  const removeOpponent = (id: string) => {
    setOpponents(opponents.filter(o => o.id !== id));
  };

  const updateOpponent = (id: string, field: keyof OpponentEntry, value: string | string[]) => {
    setOpponents(opponents.map(o => 
      o.id === id ? { ...o, [field]: value } : o
    ));
  };

  const updateOpponentNumber = (id: string, index: number, value: string) => {
    setOpponents(opponents.map(o => {
      if (o.id === id) {
        const newNumbers = [...o.numbers];
        newNumbers[index] = value;
        return { ...o, numbers: newNumbers };
      }
      return o;
    }));
  };

  const proceedToSecondary = async () => {
    const validOpponents = await saveCurrentOpponents();
    if (validOpponents.length > 0) {
      setGamePhase('secondary');
      setOpponents([]);
      addOpponent(); // Add new opponent for secondary phase
    } else {
      setGamePhase('secondary');
      setOpponents([]);
      addOpponent();
    }
  };

  const saveCurrentOpponents = async (): Promise<OpponentWinnerModel[]> => {
    const validOpponents = opponents.filter(o => 
      o.winningAmount.trim() !== '' &&
      !isNaN(parseFloat(o.winningAmount))
    );

    const opponentWinners: OpponentWinnerModel[] = validOpponents.map(opponent => {
      const validNumbers = opponent.numbers
        .filter(n => n.trim() !== '')
        .map(n => parseInt(n))
        .filter(n => !isNaN(n) && n >= 1 && n <= 90);

      return {
        id: Date.now().toString() + Math.random(),
        gameId: currentGame!.id,
        gameType: opponent.gameType,
        numbers: validNumbers,
        serialNumber: opponent.serialNumber.trim(),
        winningAmount: parseFloat(opponent.winningAmount),
        notes: opponent.notes.trim(),
        createdAt: new Date(),
      };
    });

    return opponentWinners;
  };

  const finishGameWithOpponents = async () => {
    if (!currentGame) return;

    try {
      const currentOpponents = await saveCurrentOpponents();
      
      // Combine all opponents from both phases
      const allOpponents: OpponentWinnerModel[] = [...currentOpponents];

      await finishGame([], allOpponents);
      
      Alert.alert('Éxito', 'Partida finalizada correctamente', [
        { text: 'OK', onPress: () => router.push('/') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Error al finalizar la partida');
    }
  };

  const skipOpponents = () => {
    if (gamePhase === 'main') {
      Alert.alert(
        'Continuar',
        '¿Deseas continuar al sorteo secundario sin registrar oponentes?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: proceedToSecondary }
        ]
      );
    } else {
      Alert.alert(
        'Finalizar',
        '¿Deseas finalizar la partida sin registrar oponentes del sorteo secundario?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Finalizar', onPress: finishGameWithOpponents }
        ]
      );
    }
  };

  if (!currentGame) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay partida activa</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>
          Registrar Oponentes - {gamePhase === 'main' ? 'Principal' : 'Secundario'}
        </Text>
        {isLoading && <Loader size={20} color="#8B5CF6" />}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Users size={24} color="#8B5CF6" />
          <Text style={styles.infoText}>
            Registra los ganadores oponentes del sorteo {gamePhase === 'main' ? 'principal' : 'secundario'}
          </Text>
        </View>

        {opponents.map((opponent, index) => (
          <View key={opponent.id} style={styles.opponentCard}>
            <View style={styles.opponentHeader}>
              <Text style={styles.opponentTitle}>
                Oponente {index + 1} - {gamePhase === 'main' ? 'Principal' : 'Secundario'}
              </Text>
              <TouchableOpacity 
                onPress={() => removeOpponent(opponent.id)}
                style={styles.removeButton}
              >
                <X size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {gamePhase === 'main' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Números Ganadores (Opcional)</Text>
                <View style={styles.numbersGrid}>
                  <View style={styles.numbersRow}>
                    {opponent.numbers.slice(0, 3).map((num, numIndex) => (
                      <TextInput
                        key={numIndex}
                        style={styles.numberInput}
                        value={num}
                        onChangeText={(text) => updateOpponentNumber(opponent.id, numIndex, text)}
                        placeholder="--"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    ))}
                  </View>
                  <View style={styles.numbersRow}>
                    <TextInput
                      style={styles.numberInput}
                      value={opponent.numbers[3]}
                      onChangeText={(text) => updateOpponentNumber(opponent.id, 3, text)}
                      placeholder="--"
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.numbersRow}>
                    {opponent.numbers.slice(4, 7).map((num, numIndex) => (
                      <TextInput
                        key={numIndex + 4}
                        style={styles.numberInput}
                        value={num}
                        onChangeText={(text) => updateOpponentNumber(opponent.id, numIndex + 4, text)}
                        placeholder="--"
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Número de Serie Ganador (Opcional)</Text>
              <TextInput
                style={styles.input}
                value={opponent.serialNumber}
                onChangeText={(text) => updateOpponent(opponent.id, 'serialNumber', text)}
                placeholder="Ej: 123456"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monto Ganado ($) *</Text>
              <TextInput
                style={styles.input}
                value={opponent.winningAmount}
                onChangeText={(text) => updateOpponent(opponent.id, 'winningAmount', text)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notas (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={opponent.notes}
                onChangeText={(text) => updateOpponent(opponent.id, 'notes', text)}
                placeholder="Información adicional sobre este ganador..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addOpponent}>
          <Plus size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Agregar Oponente</Text>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {gamePhase === 'main' ? (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={proceedToSecondary}>
                <ArrowRight size={20} color="#FFFFFF" />
                <Text style={styles.secondaryButtonText}>Continuar a Secundario</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={skipOpponents}>
                <Text style={styles.skipButtonText}>Omitir y Continuar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.finishButton} onPress={finishGameWithOpponents}>
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.finishButtonText}>Finalizar Partida</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={skipOpponents}>
                <Text style={styles.skipButtonText}>Omitir y Finalizar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {opponents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay oponentes agregados</Text>
            <Text style={styles.emptySubtext}>
              Toca "Agregar Oponente" para comenzar
            </Text>
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
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  opponentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  opponentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  opponentTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  actionButtons: {
    gap: 12,
    marginVertical: 16,
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  finishButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  skipButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});