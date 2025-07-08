import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TableModel, GameModel, WinnerModel, HistoryModel, OpponentWinnerData, OpponentWinnerModel } from '../types';
import { databaseService } from '../services/DatabaseService';

interface GameState {
  tables: TableModel[];
  currentGame: GameModel | null;
  gameHistory: HistoryModel[];
  isLoading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TABLES'; payload: TableModel[] }
  | { type: 'ADD_TABLE'; payload: TableModel }
  | { type: 'UPDATE_TABLE'; payload: TableModel }
  | { type: 'DELETE_TABLE'; payload: string }
  | { type: 'CLEAR_TABLES' }
  | { type: 'SET_CURRENT_GAME'; payload: GameModel | null }
  | { type: 'SET_GAME_HISTORY'; payload: HistoryModel[] };

const initialState: GameState = {
  tables: [],
  currentGame: null,
  gameHistory: [],
  isLoading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TABLES':
      return { ...state, tables: action.payload };
    case 'ADD_TABLE':
      return { ...state, tables: [...state.tables, action.payload] };
    case 'UPDATE_TABLE':
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.payload.id ? action.payload : table
        ),
      };
    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.payload),
      };
    case 'CLEAR_TABLES':
      return { ...state, tables: [] };
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload };
    case 'SET_GAME_HISTORY':
      return { ...state, gameHistory: action.payload };
    default:
      return state;
  }
}

interface GameContextType extends GameState {
  // Table management
  createTable: () => Promise<void>;
  createMultipleTables: (count: number) => Promise<void>;
  updateTable: (table: TableModel) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  clearAllTables: () => Promise<void>;
  
  // Bulk operations
  fillAllTablesWithNumbers: () => Promise<void>;
  fill20TablesWithNumbers: () => Promise<void>;
  fillAllIdentifiers: () => Promise<void>;
  clearAllIdentifiers: () => Promise<void>;
  deleteIncompleteTablesOnly: () => Promise<void>;
  clearAllNumbers: () => Promise<void>;
  markAllCompleteTablesAsChecked: () => Promise<void>;
  uncheckAllTables: () => Promise<void>;
  
  // Game management
  startGame: (isOpponentOnlyMode?: boolean) => Promise<void>;
  addDrawnNumber: (number: number) => void;
  removeDrawnNumber: (number: number) => void;
  finishGame: (winners: WinnerModel[], opponentWinners: OpponentWinnerModel[]) => Promise<void>;
  
  // History management
  clearGameHistory: () => Promise<void>;
  deleteHistoryEntry: (historyId: string) => Promise<void>;
  
  // Opponent winners
  saveOpponentWinner: (data: OpponentWinnerData) => Promise<void>;
  
  // Utility
  getTableStats: () => {
    total: number;
    complete: number;
    incomplete: number;
    checked: number;
    totalCost: number;
  };
  checkSerialNumberExists: (serialNumber: string, excludeId?: string) => boolean;
  findWinningTables: (drawnNumbers: number[]) => TableModel[];
  loadData: () => Promise<void>;
  getRecommendedNumbers: (count?: number) => Promise<number[]>;
  hasStatisticalData: () => Promise<boolean>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.init();
      await loadData();
    } catch (error) {
      console.error('Database initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error initializing database' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadData = async () => {
    try {
      const tables = await databaseService.getTables();
      const history = await databaseService.getGameHistory();
      dispatch({ type: 'SET_TABLES', payload: tables });
      dispatch({ type: 'SET_GAME_HISTORY', payload: history });
    } catch (error) {
      console.error('Load data error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error loading data' });
    }
  };

  const createTable = async () => {
    if (state.tables.length >= 200) {
      dispatch({ type: 'SET_ERROR', payload: 'Maximum 200 tables allowed' });
      return;
    }

    const newTable: TableModel = {
      id: Date.now().toString(),
      customId: getNextCustomId(),
      serialNumber: '',
      numbers: [],
      isChecked: false,
      isComplete: false,
      createdAt: new Date(),
    };

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.saveTable(newTable);
      dispatch({ type: 'ADD_TABLE', payload: newTable });
    } catch (error) {
      console.error('Create table error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error creating table' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createMultipleTables = async (count: number) => {
    const remainingSlots = 200 - state.tables.length;
    const tablesToCreate = Math.min(count, remainingSlots);

    if (tablesToCreate <= 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Maximum 200 tables allowed' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newTables: TableModel[] = [];
      for (let i = 0; i < tablesToCreate; i++) {
        const table: TableModel = {
          id: (Date.now() + i).toString(),
          customId: getNextCustomId(i),
          serialNumber: '',
          numbers: [],
          isChecked: false,
          isComplete: false,
          createdAt: new Date(),
        };
        newTables.push(table);
        await databaseService.saveTable(table);
      }

      dispatch({ type: 'SET_TABLES', payload: [...state.tables, ...newTables] });
    } catch (error) {
      console.error('Create multiple tables error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error creating tables' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getNextCustomId = (offset: number = 0): string => {
    const existingIds = state.tables
      .map(t => parseInt(t.customId || '0'))
      .filter(id => !isNaN(id))
      .sort((a, b) => a - b);

    let nextId = 1 + offset;
    for (const id of existingIds) {
      if (nextId === id) {
        nextId++;
      } else if (nextId < id) {
        break;
      }
    }

    return nextId.toString();
  };

  const updateTable = async (updatedTable: TableModel) => {
    const isComplete = 
      updatedTable.numbers.length === 7 &&
      updatedTable.serialNumber.trim() !== '' &&
      updatedTable.numbers.every(n => n >= 1 && n <= 90);

    const finalTable = {
      ...updatedTable,
      isComplete,
      isChecked: isComplete ? updatedTable.isChecked : false,
    };

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.saveTable(finalTable);
      dispatch({ type: 'UPDATE_TABLE', payload: finalTable });
    } catch (error) {
      console.error('Update table error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating table' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteTable = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.deleteTable(id);
      dispatch({ type: 'DELETE_TABLE', payload: id });
    } catch (error) {
      console.error('Delete table error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting table' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearAllTables = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.clearAllTables();
      dispatch({ type: 'CLEAR_TABLES' });
    } catch (error) {
      console.error('Clear tables error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error clearing tables' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getRecommendedNumbers = async (count: number = 7): Promise<number[]> => {
    try {
      return await databaseService.getRecommendedNumbers(count);
    } catch (error) {
      console.error('Get recommended numbers error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error getting recommended numbers' });
      return [];
    }
  };

  const hasStatisticalData = async (): Promise<boolean> => {
    try {
      return await databaseService.hasStatisticalData();
    } catch (error) {
      console.error('Check statistical data error:', error);
      return false;
    }
  };

  const fillAllTablesWithNumbers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hasData = await hasStatisticalData();
      if (!hasData) {
        dispatch({ type: 'SET_ERROR', payload: 'No hay estadísticas para recomendar números ganadores' });
        return;
      }

      const recommendedNumbers = await getRecommendedNumbers(7);
      if (recommendedNumbers.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No se pudieron obtener números recomendados' });
        return;
      }

      const updatedTables = state.tables.map(table => {
        if (table.numbers.length === 0) {
          return {
            ...table,
            numbers: [...recommendedNumbers].sort((a, b) => a - b),
          };
        }
        return table;
      });

      for (const table of updatedTables) {
        if (table.numbers.length > 0) {
          await updateTable(table);
        }
      }
    } catch (error) {
      console.error('Fill tables with numbers error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error filling tables with numbers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fill20TablesWithNumbers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const hasData = await hasStatisticalData();
      if (!hasData) {
        dispatch({ type: 'SET_ERROR', payload: 'No hay estadísticas para recomendar números ganadores' });
        return;
      }

      const recommendedNumbers = await getRecommendedNumbers(7);
      if (recommendedNumbers.length === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No se pudieron obtener números recomendados' });
        return;
      }

      const emptyTables = state.tables.filter(t => t.numbers.length === 0).slice(0, 20);
      
      for (const table of emptyTables) {
        const updatedTable = {
          ...table,
          numbers: [...recommendedNumbers].sort((a, b) => a - b),
        };
        await updateTable(updatedTable);
      }
    } catch (error) {
      console.error('Fill 20 tables error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error filling 20 tables with numbers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fillAllIdentifiers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedTables = [...state.tables];
      let currentId = 1;

      for (let i = 0; i < updatedTables.length; i++) {
        if (!updatedTables[i].customId) {
          updatedTables[i] = {
            ...updatedTables[i],
            customId: currentId.toString(),
          };
        }
        currentId++;
      }

      for (const table of updatedTables) {
        await updateTable(table);
      }
    } catch (error) {
      console.error('Fill identifiers error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error filling identifiers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearAllIdentifiers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      for (const table of state.tables) {
        if (table.customId) {
          const updatedTable = { ...table, customId: undefined };
          await updateTable(updatedTable);
        }
      }
    } catch (error) {
      console.error('Clear identifiers error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error clearing identifiers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteIncompleteTablesOnly = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const incompleteTableIds = state.tables
        .filter(table => !table.isComplete)
        .map(table => table.id);

      for (const id of incompleteTableIds) {
        await databaseService.deleteTable(id);
      }
      const remainingTables = state.tables.filter(table => table.isComplete);
      dispatch({ type: 'SET_TABLES', payload: remainingTables });
    } catch (error) {
      console.error('Delete incomplete tables error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting incomplete tables' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearAllNumbers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      for (const table of state.tables) {
        const updatedTable = { ...table, numbers: [] };
        await updateTable(updatedTable);
      }
    } catch (error) {
      console.error('Clear numbers error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error clearing numbers' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markAllCompleteTablesAsChecked = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      for (const table of state.tables) {
        if (table.isComplete && !table.isChecked) {
          const updatedTable = { ...table, isChecked: true };
          await updateTable(updatedTable);
        }
      }
    } catch (error) {
      console.error('Mark tables as checked error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error marking tables as checked' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const uncheckAllTables = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      for (const table of state.tables) {
        if (table.isChecked) {
          const updatedTable = { ...table, isChecked: false };
          await updateTable(updatedTable);
        }
      }
    } catch (error) {
      console.error('Uncheck tables error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error unchecking tables' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const startGame = async (isOpponentOnlyMode: boolean = false) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const tables = state.tables.filter(t => t.isChecked && t.isComplete);
      const tablesPlayed = tables.length;
      const newGame: GameModel = {
        id: Date.now().toString(),
        tables,
        drawnNumbers: [],
        winnerTables: [],
        gameType: 'main',
        isActive: true,
        isOpponentOnlyMode,
        startedAt: new Date(),
        tablesPlayed,
      };
      await databaseService.saveGame(newGame);
      dispatch({ type: 'SET_CURRENT_GAME', payload: newGame });
    } catch (error) {
      console.error('Start game error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error starting game' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addDrawnNumber = (number: number) => {
    if (!state.currentGame) return;

    const updatedGame = {
      ...state.currentGame,
      drawnNumbers: [...state.currentGame.drawnNumbers, number].sort((a, b) => a - b),
    };

    dispatch({ type: 'SET_CURRENT_GAME', payload: updatedGame });
  };

  const removeDrawnNumber = (number: number) => {
    if (!state.currentGame) return;

    const updatedGame = {
      ...state.currentGame,
      drawnNumbers: state.currentGame.drawnNumbers.filter(n => n !== number),
    };

    dispatch({ type: 'SET_CURRENT_GAME', payload: updatedGame });
  };

  const finishGame = async (winners: WinnerModel[], opponentWinners: OpponentWinnerModel[]) => {
    if (!state.currentGame) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const finishedGame = {
        ...state.currentGame,
        isActive: false,
        finishedAt: new Date(),
        winnerTables: winners.map(w => w.table),
      };

      const totalCost = state.currentGame.isOpponentOnlyMode ? 0 : state.currentGame.tables.length * 0.25;
      const totalWinnings = winners.reduce((sum, w) => sum + w.winningAmount, 0);
      const totalOpponentWinnings = opponentWinners.reduce((sum, w) => sum + w.winningAmount, 0);
      const netProfit = totalWinnings - totalCost;

      const historyEntry: HistoryModel = {
        id: Date.now().toString(),
        game: finishedGame,
        winners,
        opponentWinners,
        totalCost,
        totalWinnings,
        totalOpponentWinnings,
        netProfit,
        createdAt: new Date(),
        tablesPlayed: state.currentGame.tablesPlayed || state.currentGame.tables.length,
      };

      // Save finished game (this will create table snapshots)
      await databaseService.saveGame(finishedGame);
      
      // Save winners with snapshot table references
      for (const winner of winners) {
        await databaseService.saveWinner(winner);
      }
      
      // Save opponent winners
      for (const opponentWinner of opponentWinners) {
        await databaseService.saveOpponentWinner(finishedGame.id, {
          gameType: opponentWinner.gameType,
          numbers: opponentWinner.numbers,
          serialNumber: opponentWinner.serialNumber,
          winningAmount: opponentWinner.winningAmount,
          notes: opponentWinner.notes || '',
        });
      }
      
      // Save history entry
      await databaseService.saveHistory(historyEntry);
      
      dispatch({ type: 'SET_CURRENT_GAME', payload: null });
      await loadData();
    } catch (error) {
      console.error('Finish game error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error finishing game' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearGameHistory = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.clearGameHistory();
      dispatch({ type: 'SET_GAME_HISTORY', payload: [] });
    } catch (error) {
      console.error('Clear game history error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error clearing game history' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteHistoryEntry = async (historyId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.deleteHistoryEntry(historyId);
      await loadData();
    } catch (error) {
      console.error('Delete history entry error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting history entry' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveOpponentWinner = async (data: OpponentWinnerData) => {
    if (!state.currentGame) {
      dispatch({ type: 'SET_ERROR', payload: 'No active game' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await databaseService.saveOpponentWinner(state.currentGame.id, data);
    } catch (error) {
      console.error('Save opponent winner error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error saving opponent winner' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getTableStats = () => {
    const total = state.tables.length;
    const complete = state.tables.filter(t => t.isComplete).length;
    const incomplete = total - complete;
    const checked = state.tables.filter(t => t.isChecked).length;
    const totalCost = total * 0.25;

    return { total, complete, incomplete, checked, totalCost };
  };

  const checkSerialNumberExists = (serialNumber: string, excludeId?: string): boolean => {
    return state.tables.some(table => 
      table.serialNumber === serialNumber && table.id !== excludeId
    );
  };

  const findWinningTables = (drawnNumbers: number[]): TableModel[] => {
    if (!state.currentGame) return [];

    return state.currentGame.tables.filter(table => {
      return table.numbers.every(num => drawnNumbers.includes(num));
    });
  };

  const contextValue: GameContextType = {
    ...state,
    createTable,
    createMultipleTables,
    updateTable,
    deleteTable,
    clearAllTables,
    fillAllTablesWithNumbers,
    fill20TablesWithNumbers,
    fillAllIdentifiers,
    clearAllIdentifiers,
    deleteIncompleteTablesOnly,
    clearAllNumbers,
    markAllCompleteTablesAsChecked,
    uncheckAllTables,
    startGame,
    addDrawnNumber,
    removeDrawnNumber,
    finishGame,
    clearGameHistory,
    deleteHistoryEntry,
    saveOpponentWinner,
    getTableStats,
    checkSerialNumberExists,
    findWinningTables,
    loadData,
    getRecommendedNumbers,
    hasStatisticalData,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}