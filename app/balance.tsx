import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGame } from '../contexts/GameContext';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Target, Trophy, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

export default function BalanceScreen() {
  const router = useRouter();
  const { gameHistory } = useGame();

  const balanceData = useMemo(() => {
    if (gameHistory.length === 0) {
      return {
        totalSpent: 0,
        totalWon: 0,
        netProfit: 0,
        totalGames: 0,
        winningGames: 0,
        averageSpentPerGame: 0,
        averageWonPerGame: 0,
        bestGame: null,
        worstGame: null,
      };
    }

    const totalSpent = gameHistory.reduce((sum, entry) => sum + entry.totalCost, 0);
    const totalWon = gameHistory.reduce((sum, entry) => sum + entry.totalWinnings, 0);
    const netProfit = totalWon - totalSpent;
    const totalGames = gameHistory.length;
    const winningGames = gameHistory.filter(entry => entry.totalWinnings > 0).length;
    const averageSpentPerGame = totalGames > 0 ? totalSpent / totalGames : 0;
    const averageWonPerGame = totalGames > 0 ? totalWon / totalGames : 0;

    const bestGame = gameHistory.reduce((best, current) => 
      !best || current.netProfit > best.netProfit ? current : best
    , null);

    const worstGame = gameHistory.reduce((worst, current) => 
      !worst || current.netProfit < worst.netProfit ? current : worst
    , null);

    return {
      totalSpent,
      totalWon,
      netProfit,
      totalGames,
      winningGames,
      averageSpentPerGame,
      averageWonPerGame,
      bestGame,
      worstGame,
    };
  }, [gameHistory]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const BalanceCard = ({ 
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
    <View style={styles.balanceCard}>
      <View style={[styles.balanceIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.balanceContent}>
        <Text style={styles.balanceTitle}>{title}</Text>
        <Text style={[styles.balanceValue, valueColor && { color: valueColor }]}>
          {value}
        </Text>
        {subtitle && <Text style={styles.balanceSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>Balance de Ingresos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen General</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ganancia Neta</Text>
              <Text style={[
                styles.summaryValue,
                balanceData.netProfit >= 0 ? styles.positiveValue : styles.negativeValue
              ]}>
                {formatCurrency(balanceData.netProfit)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>ROI</Text>
              <Text style={[
                styles.summaryValue,
                balanceData.netProfit >= 0 ? styles.positiveValue : styles.negativeValue
              ]}>
                {balanceData.totalSpent > 0 
                  ? `${((balanceData.netProfit / balanceData.totalSpent) * 100).toFixed(1)}%`
                  : '0.0%'
                }
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles Financieros</Text>
          <View style={styles.balanceGrid}>
            <BalanceCard
              icon={DollarSign}
              title="Total Invertido"
              value={formatCurrency(balanceData.totalSpent)}
              subtitle={`${balanceData.totalGames} partidas`}
              color="#EF4444"
              valueColor="#EF4444"
            />
            <BalanceCard
              icon={TrendingUp}
              title="Total Ganado"
              value={formatCurrency(balanceData.totalWon)}
              subtitle={`${balanceData.winningGames} partidas ganadoras`}
              color="#10B981"
              valueColor="#10B981"
            />
            <BalanceCard
              icon={Calculator}
              title="Promedio Invertido"
              value={formatCurrency(balanceData.averageSpentPerGame)}
              subtitle="Por partida"
              color="#3B82F6"
            />
            <BalanceCard
              icon={Trophy}
              title="Promedio Ganado"
              value={formatCurrency(balanceData.averageWonPerGame)}
              subtitle="Por partida"
              color="#F59E0B"
            />
          </View>
        </View>

        {balanceData.bestGame && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mejor Partida</Text>
            <View style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <View style={styles.gameDate}>
                  <Text style={styles.gameDateText}>
                    {formatDate(balanceData.bestGame.createdAt)}
                  </Text>
                </View>
                <View style={styles.gameProfitPositive}>
                  <TrendingUp size={16} color="#10B981" />
                  <Text style={styles.gameProfitTextPositive}>
                    {formatCurrency(balanceData.bestGame.netProfit)}
                  </Text>
                </View>
              </View>
              <View style={styles.gameDetails}>
                <View style={styles.gameDetailItem}>
                  <Target size={16} color="#6B7280" />
                  <Text style={styles.gameDetailText}>
                    {balanceData.bestGame.game.tables.length} tablas
                  </Text>
                </View>
                <View style={styles.gameDetailItem}>
                  <Trophy size={16} color="#6B7280" />
                  <Text style={styles.gameDetailText}>
                    {balanceData.bestGame.winners.length} ganadora(s)
                  </Text>
                </View>
              </View>
              <View style={styles.gameFinancials}>
                <Text style={styles.gameFinancialText}>
                  Invertido: {formatCurrency(balanceData.bestGame.totalCost)}
                </Text>
                <Text style={styles.gameFinancialText}>
                  Ganado: {formatCurrency(balanceData.bestGame.totalWinnings)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {balanceData.worstGame && balanceData.worstGame.id !== balanceData.bestGame?.id && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peor Partida</Text>
            <View style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <View style={styles.gameDate}>
                  <Text style={styles.gameDateText}>
                    {formatDate(balanceData.worstGame.createdAt)}
                  </Text>
                </View>
                <View style={styles.gameProfitNegative}>
                  <TrendingDown size={16} color="#EF4444" />
                  <Text style={styles.gameProfitTextNegative}>
                    {formatCurrency(balanceData.worstGame.netProfit)}
                  </Text>
                </View>
              </View>
              <View style={styles.gameDetails}>
                <View style={styles.gameDetailItem}>
                  <Target size={16} color="#6B7280" />
                  <Text style={styles.gameDetailText}>
                    {balanceData.worstGame.game.tables.length} tablas
                  </Text>
                </View>
                <View style={styles.gameDetailItem}>
                  <Trophy size={16} color="#6B7280" />
                  <Text style={styles.gameDetailText}>
                    {balanceData.worstGame.winners.length} ganadora(s)
                  </Text>
                </View>
              </View>
              <View style={styles.gameFinancials}>
                <Text style={styles.gameFinancialText}>
                  Invertido: {formatCurrency(balanceData.worstGame.totalCost)}
                </Text>
                <Text style={styles.gameFinancialText}>
                  Ganado: {formatCurrency(balanceData.worstGame.totalWinnings)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {gameHistory.length === 0 && (
          <View style={styles.emptyState}>
            <DollarSign size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No hay datos de balance</Text>
            <Text style={styles.emptySubtext}>
              Completa algunas partidas para ver tu balance financiero
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
    paddingTop: 70,
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  positiveValue: {
    color: '#10B981',
  },
  negativeValue: {
    color: '#EF4444',
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
  balanceGrid: {
    gap: 12,
  },
  balanceCard: {
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
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceContent: {
    flex: 1,
  },
  balanceTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  balanceValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 2,
  },
  balanceSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameDate: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gameDateText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  gameProfitPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gameProfitNegative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gameProfitTextPositive: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  gameProfitTextNegative: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
  },
  gameDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  gameDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gameDetailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  gameFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  gameFinancialText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
});