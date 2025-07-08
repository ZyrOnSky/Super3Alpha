import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useGame } from '../../contexts/GameContext';
import { Play, Table, Trophy, History, ChartBar as BarChart3, DollarSign, Users, Target } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { getTableStats, clearAllTables } = useGame();
  const stats = getTableStats();

  const handleNewGame = () => {
    if (stats.total > 0) {
      Alert.alert(
        'Nueva Partida',
        'Esto eliminará todas las tablas actuales. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Continuar', 
            style: 'destructive',
            onPress: async () => {
              await clearAllTables();
              router.push('/tables');
            }
          }
        ]
      );
    } else {
      router.push('/tables');
    }
  };

  const menuItems = [
    {
      title: 'Nueva Partida',
      subtitle: 'Crear y gestionar tablas',
      icon: Play,
      color: '#10B981',
      onPress: handleNewGame,
    },
    {
      title: 'Gestionar Tablas',
      subtitle: `${stats.total} tablas creadas`,
      icon: Table,
      color: '#3B82F6',
      onPress: () => router.push('/tables'),
    },
    {
      title: 'Iniciar Juego',
      subtitle: `${stats.checked} tablas listas`,
      icon: Target,
      color: '#F59E0B',
      onPress: () => router.push('/game'),
    },
    {
      title: 'Historial',
      subtitle: 'Ver partidas anteriores',
      icon: History,
      color: '#06B6D4',
      onPress: () => router.push('/history'),
    },
    {
      title: 'Balance',
      subtitle: `$${stats.totalCost.toFixed(2)} invertido`,
      icon: DollarSign,
      color: '#84CC16',
      onPress: () => router.push('/balance'),
    },
    {
      title: 'Estadísticas',
      subtitle: 'Análisis de datos',
      icon: BarChart3,
      color: '#F59E0B',
      onPress: () => router.push('/stats'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <Text style={styles.title}>Super3</Text>
        <Text style={styles.subtitle}>Sistema de Gestión de Sorteos</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tablas Totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.complete}</Text>
            <Text style={styles.statLabel}>Completas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.checked}</Text>
            <Text style={styles.statLabel}>Verificadas</Text>
          </View>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <item.icon size={24} color="#FFFFFF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingVertical: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#DBEAFE',
    textAlign: 'center',
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  menuGrid: {
    gap: 15,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
});