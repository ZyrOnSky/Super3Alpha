import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from '../contexts/GameContext';
import { X, Calendar, Trophy, Target, DollarSign, Hash } from 'lucide-react-native';
import NumberGrid from '../components/NumberGrid';

export default function GameDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { gameHistory } = useGame();

  const gameEntry = useMemo(() => {
    return gameHistory.find(entry => entry.game.id === id);
  }, [gameHistory, id]);

  if (!gameEntry) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle de Partida</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Partida no encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Partida</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Game Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Calendar size={20} color="#3B82F6" />
            <Text style={styles.summaryDate}>
              {formatDate(gameEntry.createdAt)}
            </Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Hash size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {gameEntry.game.drawnNumbers.length} números
              </Text>
            </View>
            <View style={styles.statItem}>
              <Target size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {gameEntry.game.tables.length} tablas
              </Text>
            </View>
            <View style={styles.statItem}>
              <Trophy size={16} color="#6B7280" />
              <Text style={styles.statText}>
                {gameEntry.winners.length} ganadora(s)
              </Text>
            </View>
          </View>

          <View style={styles.profitContainer}>
            <Text style={styles.profitLabel}>Ganancia Neta:</Text>
            <Text style={[
              styles.profitValue,
              gameEntry.netProfit >= 0 ? styles.positiveProfit : styles.negativeProfit
            ]}>
              {formatCurrency(gameEntry.netProfit)}
            </Text>
          </View>
        </View>

        {/* Number Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pizarra de Números</Text>
          <NumberGrid
            drawnNumbers={gameEntry.game.drawnNumbers}
            onNumberPress={() => {}} // Read-only
          />
        </View>

        {/* Drawn Numbers Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Secuencia de Números ({gameEntry.game.drawnNumbers.length} números)
          </Text>
          <View style={styles.timelineContainer}>
            {gameEntry.game.drawnNumbers.map((number, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineNumber}>
                  <Text style={styles.timelineNumberText}>
                    {number.toString().padStart(2, '0')}
                  </Text>
                </View>
                <Text style={styles.timelineIndex}>#{index + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tables Played */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tablas Jugadas</Text>
          {gameEntry.game.tables.map((table, index) => (
            <View key={table.id} style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableTitle}>
                  Tabla {index + 1} - ID: {table.customId || 'Sin ID'}
                </Text>
                <Text style={styles.tableSerial}>
                  Serie: {table.serialNumber}
                </Text>
              </View>
              <View style={styles.tableNumbers}>
                {table.numbers.map((num, numIndex) => (
                  <View key={numIndex} style={styles.tableNumber}>
                    <Text style={styles.tableNumberText}>
                      {num.toString().padStart(2, '0')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Winners */}
        {gameEntry.winners.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tablas Ganadoras</Text>
            {gameEntry.winners.map((winner, index) => (
              <View key={winner.id} style={styles.winnerCard}>
                <View style={styles.winnerHeader}>
                  <View style={styles.winnerBadge}>
                    <Text style={styles.winnerBadgeText}>
                      {winner.gameType === 'main' ? 'Principal' : 'Secundario'}
                    </Text>
                  </View>
                  <Text style={styles.winnerAmount}>
                    {formatCurrency(winner.winningAmount)}
                  </Text>
                </View>
                <Text style={styles.winnerDetails}>
                  ID: {winner.table.customId || 'Sin ID'} - 
                  Serie: {winner.table.serialNumber}
                </Text>
                {winner.gameType === 'main' && (
                  <View style={styles.winnerNumbers}>
                    {winner.table.numbers.map((num, numIndex) => (
                      <View key={numIndex} style={styles.winnerNumber}>
                        <Text style={styles.winnerNumberText}>
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

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Financiero</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <DollarSign size={20} color="#EF4444" />
                <Text style={styles.financialLabel}>Invertido</Text>
                <Text style={[styles.financialValue, { color: '#EF4444' }]}>
                  {formatCurrency(gameEntry.totalCost)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <DollarSign size={20} color="#10B981" />
                <Text style={styles.financialLabel}>Ganado</Text>
                <Text style={[styles.financialValue, { color: '#10B981' }]}>
                  {formatCurrency(gameEntry.totalWinnings)}
                </Text>
              </View>
              <View style={styles.financialItem}>
                <DollarSign size={20} color={gameEntry.netProfit >= 0 ? '#10B981' : '#EF4444'} />
                <Text style={styles.financialLabel}>Neto</Text>
                <Text style={[
                  styles.financialValue,
                  { color: gameEntry.netProfit >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {formatCurrency(gameEntry.netProfit)}
                </Text>
              </View>
            </View>
          </View>
        </View>
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryDate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  profitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  profitLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  profitValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  positiveProfit: {
    color: '#10B981',
  },
  negativeProfit: {
    color: '#EF4444',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timelineNumber: {
    width: 40,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  timelineIndex: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  tableSerial: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  tableNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableNumber: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tableNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  winnerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  winnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerBadge: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  winnerBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  winnerAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  winnerDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#166534',
    marginBottom: 8,
  },
  winnerNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  winnerNumber: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  winnerNumberText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  financialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  financialItem: {
    alignItems: 'center',
    gap: 8,
  },
  financialLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  financialValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});