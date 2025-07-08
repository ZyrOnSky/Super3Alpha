import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '../../contexts/GameContext';
import { Calendar, Trophy, DollarSign, Target, TrendingUp, TrendingDown, Trash2, Eye, Users, Loader } from 'lucide-react-native';

export default function HistoryScreen() {
  const router = useRouter();
  const { gameHistory, clearGameHistory, deleteHistoryEntry, isLoading } = useGame();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Eliminar Historial',
      '¿Estás seguro de que deseas eliminar todo el historial? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            await clearGameHistory();
            Alert.alert('Éxito', 'Historial eliminado correctamente');
          }
        }
      ]
    );
  };

  const handleDeleteEntry = (entryId: string, date: string) => {
    Alert.alert(
      'Eliminar Partida',
      `¿Estás seguro de que deseas eliminar la partida del ${date}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            await deleteHistoryEntry(entryId);
          }
        }
      ]
    );
  };

  const handleViewGameDetail = (gameId: string) => {
    router.push(`/game-detail?id=${gameId}`);
  };

  if (gameHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Historial de Partidas</Text>
          {isLoading && <Loader size={20} color="#06B6D4" />}
        </View>
        
        <View style={styles.emptyState}>
          <Calendar size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No hay partidas registradas</Text>
          <Text style={styles.emptySubtext}>
            Las partidas completadas aparecerán aquí
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Partidas</Text>
        <View style={styles.headerActions}>
          <Text style={styles.subtitle}>{gameHistory.length} partidas</Text>
          {isLoading && <Loader size={16} color="#06B6D4" />}
          <TouchableOpacity style={styles.deleteButton} onPress={handleClearHistory}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {gameHistory.map((entry) => (
          <View key={entry.id} style={styles.historyCard}>
            <View style={styles.cardHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dateText}>
                  {formatDate(entry.createdAt)}
                </Text>
                {entry.game.isOpponentOnlyMode && (
                  <View style={styles.opponentBadge}>
                    <Users size={12} color="#8B5CF6" />
                    <Text style={styles.opponentBadgeText}>Solo Oponentes</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerRight}>
                <View style={[
                  styles.profitBadge,
                  entry.netProfit >= 0 ? styles.profitPositive : styles.profitNegative
                ]}>
                  {entry.netProfit >= 0 ? (
                    <TrendingUp size={14} color="#10B981" />
                  ) : (
                    <TrendingDown size={14} color="#EF4444" />
                  )}
                  <Text style={[
                    styles.profitText,
                    entry.netProfit >= 0 ? styles.profitPositiveText : styles.profitNegativeText
                  ]}>
                    {entry.game.isOpponentOnlyMode ? 'N/A' : formatCurrency(entry.netProfit)}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => handleViewGameDetail(entry.game.id)}
                >
                  <Eye size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteEntryButton}
                  onPress={() => handleDeleteEntry(entry.id, formatDate(entry.createdAt))}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.gameInfo}>
              <View style={styles.infoRow}>
                {!entry.game.isOpponentOnlyMode && (
                  <View style={styles.infoItem}>
                    <Target size={16} color="#3B82F6" />
                    <Text style={styles.infoText}>
                      {(entry.tablesPlayed ?? 0)} tablas jugadas
                    </Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={styles.infoText}>
                    {entry.winners.length} ganadora(s) propias
                  </Text>
                </View>
                {entry.opponentWinners.length > 0 && (
                  <View style={styles.infoItem}>
                    <Users size={16} color="#8B5CF6" />
                    <Text style={styles.infoText}>
                      {entry.opponentWinners.length} oponente(s)
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.numbersContainer}>
                <Text style={styles.numbersLabel}>
                  Números sorteados ({entry.game.drawnNumbers.length}):
                </Text>
                <View style={styles.numbersGrid}>
                  {entry.game.drawnNumbers.slice(0, 15).map((num, index) => (
                    <View key={index} style={styles.numberBadge}>
                      <Text style={styles.numberText}>
                        {num.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                  {entry.game.drawnNumbers.length > 15 && (
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>
                        +{entry.game.drawnNumbers.length - 15}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {entry.winners.length > 0 && (
                <View style={styles.winnersContainer}>
                  <Text style={styles.winnersLabel}>Tablas ganadoras propias:</Text>
                  {entry.winners.map((winner, index) => (
                    <View key={winner.id} style={styles.winnerItem}>
                      <Text style={styles.winnerText}>
                        {winner.gameType === 'main' ? 'Principal' : 'Secundario'} -
                        ID: {winner.table.customId || 'Sin ID'} -
                        Serie: {winner.table.serialNumber}
                      </Text>
                      <View style={styles.winnerNumbers}>
                        {winner.table.numbers.map((num, i) => (
                          <View key={i} style={styles.winnerNumberBadge}>
                            <Text style={styles.winnerNumberText}>
                              {num.toString().padStart(2, '0')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {entry.opponentWinners.length > 0 && (
                <View style={styles.winnersContainer}>
                  <Text style={styles.opponentWinnersLabel}>Ganadores oponentes:</Text>
                  {entry.opponentWinners.map((opponent, index) => (
                    <View key={opponent.id} style={styles.opponentWinnerItem}>
                      <Text style={styles.opponentWinnerText}>
                        {opponent.gameType === 'main' ? 'Principal' : 'Secundario'} -
                        Serie: {opponent.serialNumber || 'N/A'}
                      </Text>
                      {opponent.numbers.length > 0 && (
                        <View style={styles.opponentNumbers}>
                          {opponent.numbers.map((num, i) => (
                            <View key={i} style={styles.opponentNumberBadge}>
                              <Text style={styles.opponentNumberText}>
                                {num.toString().padStart(2, '0')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.financialSummary}>
              <View style={styles.summaryRow}>
                {!entry.game.isOpponentOnlyMode ? (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Invertido</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(entry.totalCost)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Ganado</Text>
                      <Text style={styles.summaryValue}>
                        {formatCurrency(entry.totalWinnings)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Neto</Text>
                      <Text style={[
                        styles.summaryValue,
                        entry.netProfit >= 0 ? styles.positiveValue : styles.negativeValue
                      ]}>
                        {formatCurrency(entry.netProfit)}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Ganancias Oponentes</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(entry.totalOpponentWinnings)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  opponentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  opponentBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profitPositive: {
    backgroundColor: '#ECFDF5',
  },
  profitNegative: {
    backgroundColor: '#FEF2F2',
  },
  profitText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  profitPositiveText: {
    color: '#10B981',
  },
  profitNegativeText: {
    color: '#EF4444',
  },
  viewButton: {
    padding: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  deleteEntryButton: {
    padding: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  gameInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  numbersContainer: {
    marginBottom: 12,
  },
  numbersLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  numberBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  numberText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  winnersContainer: {
    marginTop: 8,
  },
  winnersLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  opponentWinnersLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  winnerItem: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  winnerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#166534',
  },
  opponentWinnerItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  opponentWinnerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  opponentNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  opponentNumberBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  opponentNumberText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  financialSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
  },
  winnerNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  winnerNumberBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  winnerNumberText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});