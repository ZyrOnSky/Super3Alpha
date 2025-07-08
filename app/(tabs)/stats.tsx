import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../../contexts/GameContext';
import { GameStats } from '../../types';
import { databaseService } from '../../services/DatabaseService';
import { ChartBar as BarChart3, TrendingUp, Target, DollarSign, Hash, Trophy, Percent, Calculator, Trash2, Users, Award, Loader } from 'lucide-react-native';

export default function StatsScreen() {
  const { gameHistory, clearGameHistory, isLoading } = useGame();

  const stats: GameStats = useMemo(() => {
    if (gameHistory.length === 0) {
      return {
        totalGames: 0,
        totalRegisteredGames: 0,
        totalTablesPlayed: 0,
        totalSpent: 0,
        totalWon: 0,
        netProfit: 0,
        winRate: 0,
        averageNumbersDrawn: 0,
        mostFrequentNumbers: [],
        top25EarlyNumbers: [],
        top10WinningNumbers: [],
        winningSerialNumbers: { player: [], opponent: [] },
        serialNumberMargins: { min: 0, max: 0, average: 0 },
      };
    }

    const totalGames = gameHistory.filter(entry => !entry.game.isOpponentOnlyMode).length;
    const totalRegisteredGames = gameHistory.length;
    const totalTablesPlayed = gameHistory.reduce((sum, entry) => 
      entry.game.isOpponentOnlyMode ? sum : sum + entry.game.tables.length, 0
    );
    const totalSpent = gameHistory.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalWon = gameHistory.reduce((sum, entry) => sum + entry.totalWinnings, 0);
    const netProfit = totalWon - totalSpent;
    
    const gamesWithWinnings = gameHistory.filter(entry => 
      !entry.game.isOpponentOnlyMode && entry.totalWinnings > 0
    ).length;
    const winRate = totalGames > 0 ? (gamesWithWinnings / totalGames) * 100 : 0;

    const totalNumbersDrawn = gameHistory.reduce((sum, entry) => sum + entry.game.drawnNumbers.length, 0);
    const averageNumbersDrawn = totalRegisteredGames > 0 ? totalNumbersDrawn / totalRegisteredGames : 0;

    // Calculate most frequent numbers from all drawn numbers
    const numberFrequency: { [key: number]: number } = {};
    gameHistory.forEach(entry => {
      entry.game.drawnNumbers.forEach(num => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      });
    });

    const mostFrequentNumbers = Object.entries(numberFrequency)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    // Calculate top 25 early numbers (first 25 turns)
    const earlyNumberFrequency: { [key: number]: number } = {};
    gameHistory.forEach(entry => {
      const first25Numbers = entry.game.drawnNumbers.slice(0, 25);
      first25Numbers.forEach(num => {
        earlyNumberFrequency[num] = (earlyNumberFrequency[num] || 0) + 1;
      });
    });

    const top25EarlyNumbers = Object.entries(earlyNumberFrequency)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 25);

    // Calculate top 10 winning numbers from player and opponent winners
    const winningNumberFrequency: { [key: number]: number } = {};
    gameHistory.forEach(entry => {
      // Player winners
      entry.winners.forEach(winner => {
        winner.table.numbers.forEach(num => {
          winningNumberFrequency[num] = (winningNumberFrequency[num] || 0) + 1;
        });
      });
      // Opponent winners
      entry.opponentWinners.forEach(opponent => {
        opponent.numbers.forEach(num => {
          winningNumberFrequency[num] = (winningNumberFrequency[num] || 0) + 1;
        });
      });
    });

    const top10WinningNumbers = Object.entries(winningNumberFrequency)
      .map(([number, frequency]) => ({ number: parseInt(number), frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Calculate winning serial numbers
    const playerSerials: string[] = [];
    const opponentSerials: string[] = [];
    
    gameHistory.forEach(entry => {
      entry.winners.forEach(winner => {
        if (winner.table.serialNumber) {
          playerSerials.push(winner.table.serialNumber);
        }
      });
      entry.opponentWinners.forEach(opponent => {
        if (opponent.serialNumber) {
          opponentSerials.push(opponent.serialNumber);
        }
      });
    });

    // Calculate serial number margins
    const allSerials = [...playerSerials, ...opponentSerials]
      .map(s => parseInt(s))
      .filter(n => !isNaN(n));
    
    const serialNumberMargins = allSerials.length > 0 ? {
      min: Math.min(...allSerials),
      max: Math.max(...allSerials),
      average: Math.round(allSerials.reduce((sum, n) => sum + n, 0) / allSerials.length),
    } : { min: 0, max: 0, average: 0 };

    return {
      totalGames,
      totalRegisteredGames,
      totalTablesPlayed,
      totalSpent,
      totalWon,
      netProfit,
      winRate,
      averageNumbersDrawn,
      mostFrequentNumbers,
      top25EarlyNumbers,
      top10WinningNumbers,
      winningSerialNumbers: { player: playerSerials, opponent: opponentSerials },
      serialNumberMargins,
    };
  }, [gameHistory]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleClearStats = () => {
    Alert.alert(
      'Eliminar Estadísticas',
      '¿Estás seguro de que deseas eliminar todas las estadísticas? Esto eliminará todo el historial de partidas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: async () => {
            await clearGameHistory();
            Alert.alert('Éxito', 'Estadísticas eliminadas correctamente');
          }
        }
      ]
    );
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = '#3B82F6',
    valueColor 
  }: {
    icon: any;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    valueColor?: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, valueColor && { color: valueColor }]}>
          {value}
        </Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (gameHistory.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Estadísticas</Text>
          {isLoading && <Loader size={20} color="#F59E0B" />}
        </View>
        
        <View style={styles.emptyState}>
          <BarChart3 size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No hay datos estadísticos</Text>
          <Text style={styles.emptySubtext}>
            Completa algunas partidas para ver estadísticas
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <View style={styles.headerActions}>
          <Text style={styles.subtitle}>Análisis de {stats.totalRegisteredGames} partidas</Text>
          {isLoading && <Loader size={16} color="#F59E0B" />}
          <TouchableOpacity style={styles.deleteButton} onPress={handleClearStats}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Hash}
              title="Partidas Jugadas"
              value={stats.totalGames.toString()}
              subtitle="Con tablas propias"
              color="#3B82F6"
            />
            <StatCard
              icon={Users}
              title="Partidas Registradas"
              value={stats.totalRegisteredGames.toString()}
              subtitle="Total incluyendo solo oponentes"
              color="#8B5CF6"
            />
            <StatCard
              icon={Target}
              title="Tablas Jugadas"
              value={stats.totalTablesPlayed.toString()}
              color="#06B6D4"
            />
            <StatCard
              icon={Trophy}
              title="Tasa de Victoria"
              value={`${stats.winRate.toFixed(1)}%`}
              subtitle={`${gameHistory.filter(e => !e.game.isOpponentOnlyMode && e.totalWinnings > 0).length} partidas ganadas`}
              color="#10B981"
            />
            <StatCard
              icon={Calculator}
              title="Promedio Números"
              value={stats.averageNumbersDrawn.toFixed(1)}
              subtitle="Por partida registrada"
              color="#F59E0B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balance Financiero</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={DollarSign}
              title="Total Invertido"
              value={formatCurrency(stats.totalSpent)}
              color="#EF4444"
              valueColor="#EF4444"
            />
            <StatCard
              icon={TrendingUp}
              title="Total Ganado"
              value={formatCurrency(stats.totalWon)}
              color="#10B981"
              valueColor="#10B981"
            />
            <StatCard
              icon={Percent}
              title="Ganancia Neta"
              value={formatCurrency(stats.netProfit)}
              subtitle={stats.netProfit >= 0 ? 'Ganancia' : 'Pérdida'}
              color={stats.netProfit >= 0 ? '#10B981' : '#EF4444'}
              valueColor={stats.netProfit >= 0 ? '#10B981' : '#EF4444'}
            />
            <StatCard
              icon={Calculator}
              title="ROI"
              value={`${stats.totalSpent > 0 ? ((stats.netProfit / stats.totalSpent) * 100).toFixed(1) : '0.0'}%`}
              subtitle="Retorno de inversión"
              color="#6366F1"
              valueColor={stats.netProfit >= 0 ? '#10B981' : '#EF4444'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 10 Números Ganadores</Text>
          <Text style={styles.sectionSubtitle}>
            Números que aparecen en tablas ganadoras (propias y oponentes)
          </Text>
          <View style={styles.frequencyContainer}>
            {stats.top10WinningNumbers.map((item, index) => (
              <View key={item.number} style={styles.frequencyItem}>
                <View style={[styles.frequencyRank, { backgroundColor: '#10B981' }]}>
                  <Text style={[styles.frequencyRankText, { color: '#FFFFFF' }]}>{index + 1}</Text>
                </View>
                <View style={[styles.frequencyNumber, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.frequencyNumberText}>
                    {item.number.toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.frequencyBar}>
                  <View 
                    style={[
                      styles.frequencyBarFill,
                      { 
                        backgroundColor: '#10B981',
                        opacity: 0.3,
                        width: `${(item.frequency / stats.top10WinningNumbers[0]?.frequency || 1) * 100}%` 
                      }
                    ]} 
                  />
                  <Text style={styles.frequencyCount}>{item.frequency}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 20 Números Más Frecuentes por Partida</Text>
          <View style={styles.frequencyContainer}>
            {stats.mostFrequentNumbers.map((item, index) => (
              <View key={item.number} style={styles.frequencyItem}>
                <View style={styles.frequencyRank}>
                  <Text style={styles.frequencyRankText}>{index + 1}</Text>
                </View>
                <View style={styles.frequencyNumber}>
                  <Text style={styles.frequencyNumberText}>
                    {item.number.toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.frequencyBar}>
                  <View 
                    style={[
                      styles.frequencyBarFill,
                      { 
                        width: `${(item.frequency / stats.mostFrequentNumbers[0]?.frequency || 1) * 100}%` 
                      }
                    ]} 
                  />
                  <Text style={styles.frequencyCount}>{item.frequency}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 25 Primeros Números</Text>
          <Text style={styles.sectionSubtitle}>
            Números que aparecen en los primeros 25 turnos de cada partida
          </Text>
          <View style={styles.frequencyContainer}>
            {stats.top25EarlyNumbers.map((item, index) => (
              <View key={item.number} style={styles.frequencyItem}>
                <View style={styles.frequencyRank}>
                  <Text style={styles.frequencyRankText}>{index + 1}</Text>
                </View>
                <View style={[styles.frequencyNumber, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.frequencyNumberText}>
                    {item.number.toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.frequencyBar}>
                  <View 
                    style={[
                      styles.frequencyBarFill,
                      { 
                        backgroundColor: '#F59E0B',
                        opacity: 0.2,
                        width: `${(item.frequency / stats.top25EarlyNumbers[0]?.frequency || 1) * 100}%` 
                      }
                    ]} 
                  />
                  <Text style={styles.frequencyCount}>{item.frequency}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Números de Serie Ganadores</Text>
          <View style={styles.serialsContainer}>
            <View style={styles.serialsSection}>
              <Text style={styles.serialsSectionTitle}>Tus Series Ganadoras ({stats.winningSerialNumbers.player.length})</Text>
              <View style={styles.serialsList}>
                {stats.winningSerialNumbers.player.slice(0, 10).map((serial, index) => (
                  <View key={index} style={[styles.serialBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.serialText}>{serial}</Text>
                  </View>
                ))}
                {stats.winningSerialNumbers.player.length > 10 && (
                  <Text style={styles.moreSerials}>+{stats.winningSerialNumbers.player.length - 10} más</Text>
                )}
              </View>
            </View>
            
            <View style={styles.serialsSection}>
              <Text style={styles.serialsSectionTitle}>Series Oponentes ({stats.winningSerialNumbers.opponent.length})</Text>
              <View style={styles.serialsList}>
                {stats.winningSerialNumbers.opponent.slice(0, 10).map((serial, index) => (
                  <View key={index} style={[styles.serialBadge, { backgroundColor: '#8B5CF6' }]}>
                    <Text style={styles.serialText}>{serial}</Text>
                  </View>
                ))}
                {stats.winningSerialNumbers.opponent.length > 10 && (
                  <Text style={styles.moreSerials}>+{stats.winningSerialNumbers.opponent.length - 10} más</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Margen de Números de Serie Ganadores</Text>
          <View style={styles.marginsContainer}>
            <View style={styles.marginCard}>
              <Text style={styles.marginLabel}>Mínimo</Text>
              <Text style={styles.marginValue}>{stats.serialNumberMargins.min}</Text>
            </View>
            <View style={styles.marginCard}>
              <Text style={styles.marginLabel}>Promedio</Text>
              <Text style={styles.marginValue}>{stats.serialNumberMargins.average}</Text>
            </View>
            <View style={styles.marginCard}>
              <Text style={styles.marginLabel}>Máximo</Text>
              <Text style={styles.marginValue}>{stats.serialNumberMargins.max}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Rendimiento</Text>
          <View style={styles.performanceContainer}>
            {gameHistory.slice(0, 10).map((entry, index) => (
              <View key={entry.id} style={styles.performanceItem}>
                <View style={styles.performanceIndex}>
                  <Text style={styles.performanceIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.performanceDetails}>
                  <Text style={styles.performanceDate}>
                    {new Intl.DateTimeFormat('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(entry.createdAt)}
                  </Text>
                  <Text style={styles.performanceTables}>
                    {entry.game.isOpponentOnlyMode 
                      ? 'Solo oponentes' 
                      : `${entry.game.tables.length} tablas`
                    }
                  </Text>
                </View>
                <View style={styles.performanceResult}>
                  <Text style={[
                    styles.performanceProfit,
                    entry.game.isOpponentOnlyMode 
                      ? styles.neutralProfit
                      : entry.netProfit >= 0 ? styles.positiveProfit : styles.negativeProfit
                  ]}>
                    {entry.game.isOpponentOnlyMode 
                      ? 'N/A' 
                      : formatCurrency(entry.netProfit)
                    }
                  </Text>
                </View>
              </View>
            ))}
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
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  frequencyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frequencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  frequencyRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  frequencyRankText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  frequencyNumber: {
    width: 40,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  frequencyNumberText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  frequencyBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  frequencyBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    opacity: 0.2,
  },
  frequencyCount: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'right',
  },
  serialsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serialsSection: {
    marginBottom: 16,
  },
  serialsSectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  serialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serialBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serialText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  moreSerials: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    alignSelf: 'center',
  },
  marginsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  marginCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  marginLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  marginValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  performanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  performanceIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  performanceIndexText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
  },
  performanceDetails: {
    flex: 1,
  },
  performanceDate: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  performanceTables: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  performanceResult: {
    alignItems: 'flex-end',
  },
  performanceProfit: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  positiveProfit: {
    color: '#10B981',
  },
  negativeProfit: {
    color: '#EF4444',
  },
  neutralProfit: {
    color: '#6B7280',
  },
});