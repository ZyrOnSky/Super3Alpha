import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '../../contexts/GameContext';
import { WinnerModel, OpponentWinnerModel } from '../../types';
import NumberGrid from '../../components/NumberGrid';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Trophy,
  ThumbsDown,
  Hash,
  Target,
  ArrowRight,
  Loader,
} from 'lucide-react-native';

export default function GameScreen() {
  const router = useRouter();
  const {
    tables,
    currentGame,
    startGame,
    addDrawnNumber,
    removeDrawnNumber,
    finishGame,
    findWinningTables,
    getTableStats,
    isLoading,
  } = useGame();

  const [numberInput, setNumberInput] = useState('');
  const [drawnHistory, setDrawnHistory] = useState<number[]>([]);
  const [undoHistory, setUndoHistory] = useState<number[]>([]);
  const [winningTables, setWinningTables] = useState<any[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winningAmount, setWinningAmount] = useState('');
  const [gamePhase, setGamePhase] = useState<'main' | 'secondary'>('main');
  const [mainWinAmount, setMainWinAmount] = useState(0);
  const [opponentOnlyMode, setOpponentOnlyMode] = useState(false);
  const [opponentWinners, setOpponentWinners] = useState<OpponentWinnerModel[]>([]);
  const [winnerModalTriggeredForGameId, setWinnerModalTriggeredForGameId] = useState<string | null>(null);

  const stats = getTableStats();

  useEffect(() => {
    if (
      currentGame &&
      !currentGame.isOpponentOnlyMode &&
      currentGame.id !== winnerModalTriggeredForGameId
    ) {
      const winners = findWinningTables(currentGame.drawnNumbers);
      setWinningTables(winners);
      if (winners.length > 0 && !showWinnerModal && gamePhase === 'main') {
        setShowWinnerModal(true);
        setWinnerModalTriggeredForGameId(currentGame.id);
      }
    }
  }, [currentGame?.drawnNumbers, gamePhase, currentGame?.id]);

  const handleStartGame = async () => {
    try {
      if (!opponentOnlyMode && stats.checked === 0) {
        Alert.alert(
          'Error',
          'No hay tablas verificadas para iniciar el juego',
          [
            { text: 'OK' },
            { text: 'Ir a Tablas', onPress: () => router.push('/tables') }
          ]
        );
        return;
      }

      if (!opponentOnlyMode && stats.incomplete > 0) {
        Alert.alert(
          'Tablas Incompletas',
          `Hay ${stats.incomplete} tablas incompletas. ¿Qué deseas hacer?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Continuar solo con verificadas', 
              onPress: async () => {
                await startGame(opponentOnlyMode);
              }
            },
            { 
              text: 'Ir a gestionar tablas', 
              onPress: () => router.push('/tables') 
            }
          ]
        );
        return;
      }

      const message = opponentOnlyMode 
        ? '¿Estás listo para comenzar el modo "Solo registrar oponentes"?'
        : '¿Estás listo para comenzar el sorteo?';

      Alert.alert(
        'Iniciar Juego',
        message,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Iniciar', 
            onPress: async () => {
              await startGame(opponentOnlyMode);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'No se pudo iniciar el juego');
    }
  };

  const handleAddNumber = () => {
    const number = parseInt(numberInput);
    if (isNaN(number) || number < 1 || number > 90) {
      Alert.alert('Error', 'Ingresa un número válido entre 1 y 90');
      return;
    }

    if (currentGame?.drawnNumbers.includes(number)) {
      Alert.alert('Error', 'Este número ya fue sorteado');
      return;
    }

    addDrawnNumber(number);
    setDrawnHistory([...drawnHistory, number]);
    setUndoHistory([]);
    setNumberInput('');
  };

  const handleNumberPress = (number: number) => {
    if (!currentGame) return;

    if (currentGame.drawnNumbers.includes(number)) {
      removeDrawnNumber(number);
      setDrawnHistory(drawnHistory.filter(n => n !== number));
    } else {
      addDrawnNumber(number);
      setDrawnHistory([...drawnHistory, number]);
      setUndoHistory([]);
    }
  };

  const handleUndo = () => {
    if (!currentGame || drawnHistory.length === 0) return;

    const lastNumber = drawnHistory[drawnHistory.length - 1];
    removeDrawnNumber(lastNumber);
    setDrawnHistory(drawnHistory.slice(0, -1));
    setUndoHistory([...undoHistory, lastNumber]);
  };

  const handleRedo = () => {
    if (undoHistory.length === 0) return;

    const numberToRedo = undoHistory[undoHistory.length - 1];
    addDrawnNumber(numberToRedo);
    setDrawnHistory([...drawnHistory, numberToRedo]);
    setUndoHistory(undoHistory.slice(0, -1));
  };

  const handleWin = () => {
    if (showWinnerModal) return;
    handleConfirmWin();
  };

  const handleConfirmWin = () => {
    if (!currentGame?.isOpponentOnlyMode && winningTables.length === 0) {
      Alert.alert('Error', 'No se han detectado tablas ganadoras');
      return;
    }

    if (!currentGame?.isOpponentOnlyMode) {
      const amount = parseFloat(winningAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Ingresa un monto de ganancia válido');
        return;
      }

      if (gamePhase === 'main') {
        setMainWinAmount(amount);
        proceedToSecondaryLottery(amount);
      } else {
        finishSecondaryGame(amount);
      }
    } else {
      // Opponent only mode - go to opponent registration
      router.push('/opponent-registration');
    }
  };

  const handleLose = () => {
    if (currentGame?.isOpponentOnlyMode) {
      // Go to opponent registration
      router.push('/opponent-registration');
    } else {
      if (gamePhase === 'main') {
        proceedToSecondaryLottery(0);
      } else {
        finishSecondaryGame(0);
      }
    }
  };

  const proceedToSecondaryLottery = (mainAmount: number) => {
    Alert.alert(
      'Sorteo Secundario',
      '¿Deseas continuar con el sorteo secundario (sorteo de serie)?',
      [
        { 
          text: 'Finalizar Aquí', 
          onPress: async () => {
            const winners: WinnerModel[] = mainAmount > 0 ? winningTables.map(table => ({
              id: Date.now().toString() + Math.random(),
              gameId: currentGame!.id,
              table,
              winningAmount: mainAmount / winningTables.length,
              gameType: 'main',
              isPlayerWinner: true,
              createdAt: new Date(),
            })) : [];

            await finishGame(winners, opponentWinners);
            resetGameState();
            router.push('/');
          }
        },
        { 
          text: 'Continuar a Sorteo Secundario', 
          onPress: () => {
            setGamePhase('secondary');
            setShowWinnerModal(false);
            setWinningAmount('');
            setWinningTables([]);
          }
        }
      ]
    );
  };

  const finishSecondaryGame = async (secondaryWinAmount: number) => {
    const winners: WinnerModel[] = [];
    
    // Add main game winners if any
    if (mainWinAmount > 0 && winningTables.length > 0) {
      winners.push(...winningTables.map(table => ({
        id: Date.now().toString() + Math.random(),
        gameId: currentGame!.id,
        table,
        winningAmount: mainWinAmount / winningTables.length,
        gameType: 'main' as const,
        isPlayerWinner: true,
        createdAt: new Date(),
      })));
    }

    // Add secondary game winner if any
    if (secondaryWinAmount > 0 && winningTables.length > 0) {
      winners.push({
        id: Date.now().toString() + Math.random(),
        gameId: currentGame!.id,
        table: winningTables[0],
        winningAmount: secondaryWinAmount,
        gameType: 'secondary',
        isPlayerWinner: true,
        createdAt: new Date(),
      });
    }

    await finishGame(winners, opponentWinners);
    resetGameState();
    router.push('/');
  };

  const resetGameState = () => {
    setShowWinnerModal(false);
    setWinnerModalTriggeredForGameId(null);
    setWinningAmount('');
    setGamePhase('main');
    setMainWinAmount(0);
    setWinningTables([]);
    setDrawnHistory([]);
    setUndoHistory([]);
    setOpponentWinners([]);
    setOpponentOnlyMode(false);
  };

  if (!currentGame) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Modo Juego</Text>
          {isLoading && <Loader size={20} color="#3B82F6" />}
        </View>

        <View style={styles.preGameContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Estado de las Tablas</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Hash size={20} color="#6B7280" />
                <Text style={styles.statText}>{stats.total} Total</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={20} color="#10B981" />
                <Text style={styles.statText}>{stats.checked} Verificadas</Text>
              </View>
            </View>
          </View>

          <View style={styles.modeSelector}>
            <Text style={styles.modeSelectorTitle}>Modo de Juego</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Solo registrar oponentes</Text>
              <Switch
                value={opponentOnlyMode}
                onValueChange={setOpponentOnlyMode}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={opponentOnlyMode ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
            <Text style={styles.modeDescription}>
              {opponentOnlyMode 
                ? 'Registra solo ganadores oponentes para alimentar estadísticas'
                : 'Juega con tus tablas verificadas'
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
            <Play size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Iniciar Juego</Text>
          </TouchableOpacity>

          <Text style={styles.instructionText}>
            {opponentOnlyMode 
              ? 'Modo para registrar solo ganadores oponentes'
              : 'Asegúrate de tener tablas verificadas antes de iniciar el juego'
            }
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentGame.isOpponentOnlyMode 
            ? 'Modo Solo Oponentes'
            : gamePhase === 'main' ? 'Sorteo Principal' : 'Sorteo Secundario (Serie)'
          }
        </Text>
        <View style={styles.gameStats}>
          <Text style={styles.gameStatText}>
            Números: {currentGame.drawnNumbers.length}
          </Text>
          {!currentGame.isOpponentOnlyMode && (
            <Text style={styles.gameStatText}>
              Tablas: {currentGame.tables.length}
            </Text>
          )}
          {isLoading && <Loader size={16} color="#3B82F6" />}
        </View>
      </View>

      {gamePhase === 'main' ? (
        <>
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.numberInput}
                value={numberInput}
                onChangeText={setNumberInput}
                placeholder="Número (1-90)"
                keyboardType="numeric"
                maxLength={2}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddNumber}>
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity 
                style={[styles.controlButton, drawnHistory.length === 0 && styles.disabledButton]} 
                onPress={handleUndo}
                disabled={drawnHistory.length === 0}
              >
                <RotateCcw size={20} color={drawnHistory.length === 0 ? '#9CA3AF' : '#3B82F6'} />
                <Text style={[styles.controlText, drawnHistory.length === 0 && styles.disabledText]}>
                  Deshacer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, undoHistory.length === 0 && styles.disabledButton]} 
                onPress={handleRedo}
                disabled={undoHistory.length === 0}
              >
                <RotateCw size={20} color={undoHistory.length === 0 ? '#9CA3AF' : '#3B82F6'} />
                <Text style={[styles.controlText, undoHistory.length === 0 && styles.disabledText]}>
                  Rehacer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.gridContainer}>
            <NumberGrid
              drawnNumbers={currentGame.drawnNumbers}
              onNumberPress={handleNumberPress}
            />
          </ScrollView>
        </>
      ) : (
        <View style={styles.secondaryLotteryContainer}>
          <View style={styles.secondaryInfo}>
            <Text style={styles.secondaryTitle}>Sorteo de Serie</Text>
            <Text style={styles.secondarySubtitle}>
              Ingresa el número de serie anunciado para el sorteo secundario
            </Text>
          </View>

          <View style={styles.serialInputSection}>
            <Text style={styles.serialInputLabel}>Número de Serie Ganador:</Text>
            <TextInput
              style={styles.serialInput}
              value={numberInput}
              onChangeText={setNumberInput}
              placeholder="Ingresa el número de serie"
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.checkSerialButton} 
              onPress={() => {
                if (numberInput.trim()) {
                  const winningTable = currentGame.tables.find(
                    table => table.serialNumber === numberInput.trim()
                  );
                  if (winningTable) {
                    setWinningTables([winningTable]);
                    setShowWinnerModal(true);
                  } else {
                    Alert.alert('Sin Ganador', 'No tienes ninguna tabla con ese número de serie');
                  }
                }
              }}
            >
              <Text style={styles.checkSerialButtonText}>Verificar Serie</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tablesPreview}>
            <Text style={styles.tablesPreviewTitle}>Tus Números de Serie:</Text>
            <ScrollView style={styles.serialList}>
              {currentGame.tables.map((table, index) => (
                <View key={table.id} style={styles.serialItem}>
                  <Text style={styles.serialNumber}>
                    {table.serialNumber}
                  </Text>
                  <Text style={styles.serialId}>
                    ID: {table.customId || 'Sin ID'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.gameActions}>
        <TouchableOpacity style={styles.winButton} onPress={handleWin}>
          <Trophy size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {currentGame.isOpponentOnlyMode ? 'Registrar Ganador' : 'He Ganado'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loseButton} onPress={handleLose}>
          <ThumbsDown size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {currentGame.isOpponentOnlyMode ? 'Sin Ganador' : 'He Perdido'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showWinnerModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {gamePhase === 'main' ? '¡Tablas Ganadoras Principales!' : '¡Ganador del Sorteo de Serie!'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowWinnerModal(false);
              setWinnerModalTriggeredForGameId(currentGame?.id || null);
            }}>
              <Text style={styles.modalClose}>Minimizar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.winnerCount}>
              {winningTables.length} tabla(s) ganadora(s) detectada(s)
            </Text>

            {winningTables.map((table, index) => (
              <View key={table.id} style={styles.winnerCard}>
                <Text style={styles.winnerTitle}>
                  Tabla {index + 1} - ID: {table.customId || 'Sin ID'}
                </Text>
                <Text style={styles.winnerSerial}>
                  Serie: {table.serialNumber}
                </Text>
                {gamePhase === 'main' && (
                  <View style={styles.winnerNumbers}>
                    {table.numbers.map((num: number, i: number) => (
                      <View key={i} style={styles.winnerNumber}>
                        <Text style={styles.winnerNumberText}>
                          {num.toString().padStart(2, '0')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>
                Monto ganado en {gamePhase === 'main' ? 'sorteo principal' : 'sorteo secundario'} ($):
              </Text>
              <TextInput
                style={styles.amountInput}
                value={winningAmount}
                onChangeText={setWinningAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.confirmWinButton} onPress={handleConfirmWin}>
              <Text style={styles.confirmButtonText}>Confirmar Victoria</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
  },
  gameStats: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  gameStatText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  preGameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modeSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  modeDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  gridContainer: {
    flex: 1,
  },
  secondaryLotteryContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  secondaryInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  secondarySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  serialInputSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serialInputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  serialInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  checkSerialButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkSerialButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  tablesPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tablesPreviewTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  serialList: {
    flex: 1,
  },
  serialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serialNumber: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  serialId: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  gameActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  winButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loseButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    flex: 1,
  },
  modalClose: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  winnerCount: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: 20,
  },
  winnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  winnerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  winnerSerial: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  winnerNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  winnerNumber: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  winnerNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  amountSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  amountLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmWinButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});