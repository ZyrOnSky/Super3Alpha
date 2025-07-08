import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../../contexts/GameContext';
import { TableModel } from '../../types';
import TableCard from '../../components/TableCard';
import TableEditor from '../../components/TableEditor';
import { Plus, Settings, DollarSign, CircleCheck as CheckCircle, Circle as XCircle, Circle, Hash, Loader } from 'lucide-react-native';

export default function TablesScreen() {
  const {
    tables,
    createTable,
    createMultipleTables,
    updateTable,
    deleteTable,
    getTableStats,
    fillAllTablesWithNumbers,
    fill20TablesWithNumbers,
    fillAllIdentifiers,
    clearAllIdentifiers,
    deleteIncompleteTablesOnly,
    clearAllNumbers,
    markAllCompleteTablesAsChecked,
    uncheckAllTables,
    clearAllTables,
    isLoading,
  } = useGame();

  const [selectedTable, setSelectedTable] = useState<TableModel | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkCreateCount, setBulkCreateCount] = useState('');

  const stats = getTableStats();

  const handleEditTable = (table: TableModel) => {
    setSelectedTable(table);
    setShowEditor(true);
  };

  const handleSaveTable = async (table: TableModel) => {
    await updateTable(table);
  };

  const handleToggleCheck = async (table: TableModel) => {
    if (!table.isComplete) {
      Alert.alert('Error', 'Solo puedes marcar tablas completas');
      return;
    }
    
    const updatedTable = { ...table, isChecked: !table.isChecked };
    await updateTable(updatedTable);
  };

  const handleBulkCreate = async () => {
    const count = parseInt(bulkCreateCount);
    if (isNaN(count) || count <= 0) {
      Alert.alert('Error', 'Ingresa un número válido');
      return;
    }
    
    await createMultipleTables(count);
    setBulkCreateCount('');
  };

  const renderTableItem = ({ item }: { item: TableModel }) => (
    <TableCard
      table={item}
      onEdit={handleEditTable}
      onDelete={deleteTable}
      onToggleCheck={handleToggleCheck}
    />
  );

  const bulkActions = [
    {
      title: 'Rellenar 7 - TODOS',
      subtitle: 'Números recomendados en todas las tablas vacías',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Rellenar todas las tablas vacías con números recomendados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: fillAllTablesWithNumbers }
          ]
        );
      },
    },
    {
      title: 'Rellenar 7 en 20 tablas',
      subtitle: 'Números recomendados en las primeras 20 tablas vacías',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Rellenar las primeras 20 tablas vacías con números recomendados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: fill20TablesWithNumbers }
          ]
        );
      },
    },
    {
      title: 'Rellenar Identificadores - TODOS',
      subtitle: 'Asignar IDs incrementales a tablas sin identificador',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Rellenar identificadores vacíos en orden incremental?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: fillAllIdentifiers }
          ]
        );
      },
    },
    {
      title: 'Borrar Identificadores - TODOS',
      subtitle: 'Eliminar todos los identificadores personalizados',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Borrar todos los identificadores personalizados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: clearAllIdentifiers }
          ]
        );
      },
    },
    {
      title: 'Borrar Tablas Incompletas - TODOS',
      subtitle: 'Eliminar solo las tablas con campos vacíos',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Eliminar todas las tablas incompletas?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: deleteIncompleteTablesOnly }
          ]
        );
      },
    },
    {
      title: 'Borrar 7 Números - TODAS',
      subtitle: 'Eliminar solo los números de todas las tablas',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Borrar los números de todas las tablas?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: clearAllNumbers }
          ]
        );
      },
    },
    {
      title: 'Marcar Completas - TODOS',
      subtitle: 'Marcar todas las tablas completas como verificadas',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Marcar todas las tablas completas como verificadas?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: markAllCompleteTablesAsChecked }
          ]
        );
      },
    },
    {
      title: 'Desmarcar - TODOS',
      subtitle: 'Quitar verificación de todas las tablas',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Desmarcar todas las tablas?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', onPress: uncheckAllTables }
          ]
        );
      },
    },
    {
      title: 'Borrar Tablas - TODOS',
      subtitle: 'Eliminar completamente todas las tablas',
      onPress: () => {
        Alert.alert(
          'Confirmar',
          '¿Eliminar TODAS las tablas? Esta acción no se puede deshacer.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Confirmar', style: 'destructive', onPress: clearAllTables }
          ]
        );
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Tablas</Text>
        <View style={styles.headerActions}>
          {isLoading && <Loader size={20} color="#3B82F6" />}
          <TouchableOpacity
            style={styles.bulkButton}
            onPress={() => setShowBulkMenu(true)}
          >
            <Settings size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Hash size={16} color="#6B7280" />
          <Text style={styles.statText}>{stats.total}/200</Text>
        </View>
        <View style={styles.statItem}>
          <CheckCircle size={16} color="#10B981" />
          <Text style={styles.statText}>{stats.complete}</Text>
        </View>
        <View style={styles.statItem}>
          <XCircle size={16} color="#EF4444" />
          <Text style={styles.statText}>{stats.incomplete}</Text>
        </View>
        <View style={styles.statItem}>
          <Circle size={16} color="#3B82F6" />
          <Text style={styles.statText}>{stats.checked}</Text>
        </View>
        <View style={styles.statItem}>
          <DollarSign size={16} color="#F59E0B" />
          <Text style={styles.statText}>${stats.totalCost.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.createSection}>
        <View style={styles.createRow}>
          <TouchableOpacity style={styles.createButton} onPress={createTable}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Crear Tabla</Text>
          </TouchableOpacity>
          
          <View style={styles.bulkCreateContainer}>
            <TextInput
              style={styles.bulkInput}
              value={bulkCreateCount}
              onChangeText={setBulkCreateCount}
              placeholder="Cantidad"
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.bulkCreateButton} onPress={handleBulkCreate}>
              <Text style={styles.bulkCreateText}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={tables}
        renderItem={renderTableItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.tablesList}
        contentContainerStyle={styles.tablesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay tablas creadas</Text>
            <Text style={styles.emptySubtext}>Crea tu primera tabla para comenzar</Text>
          </View>
        }
      />

      <TableEditor
        visible={showEditor}
        table={selectedTable}
        onClose={() => {
          setShowEditor(false);
          setSelectedTable(null);
        }}
        onSave={handleSaveTable}
      />

      <Modal
        visible={showBulkMenu}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Menú de Botones</Text>
            <TouchableOpacity onPress={() => setShowBulkMenu(false)}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {bulkActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.bulkAction}
                onPress={() => {
                  setShowBulkMenu(false);
                  action.onPress();
                }}
              >
                <Text style={styles.bulkActionTitle}>{action.title}</Text>
                <Text style={styles.bulkActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bulkButton: {
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  createSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  createRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  bulkCreateContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  bulkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
  },
  bulkCreateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  bulkCreateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  tablesList: {
    flex: 1,
  },
  tablesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    flex: 1,
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
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
  bulkAction: {
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
  bulkActionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  bulkActionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
});