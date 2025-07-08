import * as SQLite from 'expo-sqlite';
import { TableModel, GameModel, WinnerModel, HistoryModel, OpponentWinnerData, OpponentWinnerModel } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabaseAsync('super3.db');
    await this.createTables();
    await this.runMigrations();
  }

  private async createTables() {
    if (!this.db) return;

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        customId TEXT,
        serialNumber TEXT UNIQUE NOT NULL,
        numbers TEXT NOT NULL,
        isChecked INTEGER DEFAULT 0,
        isComplete INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        drawnNumbers TEXT NOT NULL,
        gameType TEXT NOT NULL,
        isActive INTEGER DEFAULT 0,
        isOpponentOnlyMode INTEGER DEFAULT 0,
        startedAt TEXT NOT NULL,
        finishedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS game_tables (
        gameId TEXT,
        tableId TEXT,
        FOREIGN KEY (gameId) REFERENCES games (id),
        FOREIGN KEY (tableId) REFERENCES tables (id)
      );

      CREATE TABLE IF NOT EXISTS winners (
        id TEXT PRIMARY KEY,
        gameId TEXT,
        tableId TEXT,
        winningAmount REAL NOT NULL,
        gameType TEXT NOT NULL,
        isPlayerWinner INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        customId TEXT,
        serialNumber TEXT,
        numbers TEXT,
        FOREIGN KEY (gameId) REFERENCES games (id),
        FOREIGN KEY (tableId) REFERENCES tables (id)
      );

      CREATE TABLE IF NOT EXISTS opponent_winners (
        id TEXT PRIMARY KEY,
        gameId TEXT,
        gameType TEXT NOT NULL,
        numbers TEXT,
        serialNumber TEXT,
        winningAmount REAL NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (gameId) REFERENCES games (id)
      );

      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        gameId TEXT,
        totalCost REAL NOT NULL,
        totalWinnings REAL NOT NULL,
        totalOpponentWinnings REAL NOT NULL DEFAULT 0,
        netProfit REAL NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (gameId) REFERENCES games (id)
      );

      CREATE TABLE IF NOT EXISTS winning_numbers (
        id TEXT PRIMARY KEY,
        gameId TEXT,
        number INTEGER NOT NULL,
        isPlayerWinner INTEGER DEFAULT 1,
        gameType TEXT NOT NULL,
        position INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (gameId) REFERENCES games (id)
      );

      CREATE TABLE IF NOT EXISTS winning_serials (
        id TEXT PRIMARY KEY,
        gameId TEXT,
        serialNumber TEXT NOT NULL,
        isPlayerWinner INTEGER DEFAULT 1,
        gameType TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (gameId) REFERENCES games (id)
      );

      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );
    `);
  }

  private async runMigrations() {
    if (!this.db) return;

    // Get current schema version
    let currentVersion = 0;
    try {
      const result = await this.db.getFirstAsync(`SELECT version FROM schema_version ORDER BY version DESC LIMIT 1`) as any;
      currentVersion = result?.version || 0;
    } catch (error) {
      // schema_version table doesn't exist, this is version 0
      currentVersion = 0;
    }

    // Migration 1: Add isOpponentOnlyMode column to games table
    if (currentVersion < 1) {
      try {
        // Check if column already exists
        const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(games)`);
        const hasColumn = tableInfo.some((column: any) => column.name === 'isOpponentOnlyMode');
        
        if (!hasColumn) {
          await this.db.execAsync(`ALTER TABLE games ADD COLUMN isOpponentOnlyMode INTEGER DEFAULT 0`);
        }
        
        // Update schema version
        await this.db.execAsync(`INSERT OR REPLACE INTO schema_version (version) VALUES (1)`);
      } catch (error) {
        console.error('Migration 1 failed:', error);
      }
    }

    // Migration 2: Ensure all tables have proper foreign key constraints
    if (currentVersion < 2) {
      try {
        // Check if tables exist and have proper structure
        const tables = ['winning_numbers', 'winning_serials', 'opponent_winners', 'winners', 'game_tables', 'history'];
        
        for (const tableName of tables) {
          try {
            const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
            const hasGameId = tableInfo.some((column: any) => column.name === 'gameId');
            
            if (!hasGameId && tableName !== 'game_tables') {
              // Add gameId column if missing
              await this.db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN gameId TEXT`);
            }
          } catch (error) {
            console.log(`Table ${tableName} might not exist yet, skipping migration`);
          }
        }
        
        // Update schema version
        await this.db.execAsync(`INSERT OR REPLACE INTO schema_version (version) VALUES (2)`);
      } catch (error) {
        console.error('Migration 2 failed:', error);
      }
    }

    // Migration 3: Add totalOpponentWinnings column to history table
    if (currentVersion < 3) {
      try {
        // Check if totalOpponentWinnings column exists in history table
        const historyTableInfo = await this.db.getAllAsync(`PRAGMA table_info(history)`);
        const hasTotalOpponentWinnings = historyTableInfo.some((column: any) => column.name === 'totalOpponentWinnings');
        
        if (!hasTotalOpponentWinnings) {
          await this.db.execAsync(`ALTER TABLE history ADD COLUMN totalOpponentWinnings REAL NOT NULL DEFAULT 0`);
        }
        
        // Update schema version
        await this.db.execAsync(`INSERT OR REPLACE INTO schema_version (version) VALUES (3)`);
      } catch (error) {
        console.error('Migration 3 failed:', error);
      }
    }

    // Migration 4: Ensure winners table has customId, serialNumber, and numbers columns
    if (currentVersion < 4) {
      try {
        const winnersTableInfo = await this.db.getAllAsync(`PRAGMA table_info(winners)`);
        const hasCustomId = winnersTableInfo.some((column: any) => column.name === 'customId');
        const hasSerialNumber = winnersTableInfo.some((column: any) => column.name === 'serialNumber');
        const hasNumbers = winnersTableInfo.some((column: any) => column.name === 'numbers');
        
        if (!hasCustomId) {
          await this.db.execAsync(`ALTER TABLE winners ADD COLUMN customId TEXT`);
        }
        if (!hasSerialNumber) {
          await this.db.execAsync(`ALTER TABLE winners ADD COLUMN serialNumber TEXT`);
        }
        if (!hasNumbers) {
          await this.db.execAsync(`ALTER TABLE winners ADD COLUMN numbers TEXT`);
        }
        
        // Update schema version
        await this.db.execAsync(`INSERT OR REPLACE INTO schema_version (version) VALUES (4)`);
      } catch (error) {
        console.error('Migration 4 failed:', error);
      }
    }

    // Asegurar que la tabla games tenga el campo winnerTables
    const gamesTableInfo = await this.db.getAllAsync(`PRAGMA table_info(games)`);
    const hasWinnerTables = gamesTableInfo.some((column: any) => column.name === 'winnerTables');
    if (!hasWinnerTables) {
      await this.db.execAsync(`ALTER TABLE games ADD COLUMN winnerTables TEXT`);
    }

    // Asegurar que la tabla games tenga el campo tablesPlayed
    const gamesTableInfo2 = await this.db.getAllAsync(`PRAGMA table_info(games)`);
    const hasTablesPlayed = gamesTableInfo2.some((column: any) => column.name === 'tablesPlayed');
    if (!hasTablesPlayed) {
      await this.db.execAsync(`ALTER TABLE games ADD COLUMN tablesPlayed INTEGER DEFAULT 0`);
    }
  }

  async saveTable(table: TableModel): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT OR REPLACE INTO tables 
       (id, customId, serialNumber, numbers, isChecked, isComplete, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        table.id,
        table.customId || null,
        table.serialNumber,
        JSON.stringify(table.numbers),
        table.isChecked ? 1 : 0,
        table.isComplete ? 1 : 0,
        table.createdAt.toISOString()
      ]
    );
  }

  async getTables(): Promise<TableModel[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`SELECT * FROM tables ORDER BY createdAt ASC`);
    
    return result.map((row: any) => ({
      id: row.id,
      customId: row.customId,
      serialNumber: row.serialNumber,
      numbers: JSON.parse(row.numbers),
      isChecked: Boolean(row.isChecked),
      isComplete: Boolean(row.isComplete),
      createdAt: new Date(row.createdAt)
    }));
  }

  async deleteTable(id: string): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(`DELETE FROM tables WHERE id = ?`, [id]);
  }

  async clearAllTables(): Promise<void> {
    if (!this.db) return;
    await this.db.runAsync(`DELETE FROM tables`);
  }

  async saveGame(game: GameModel): Promise<void> {
    if (!this.db) return;

    // Save game data
    await this.db.runAsync(
      `INSERT OR REPLACE INTO games 
       (id, drawnNumbers, winnerTables, gameType, isActive, isOpponentOnlyMode, startedAt, finishedAt, tablesPlayed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        game.id,
        JSON.stringify(game.drawnNumbers),
        JSON.stringify(game.winnerTables),
        game.gameType,
        game.isActive ? 1 : 0,
        game.isOpponentOnlyMode ? 1 : 0,
        game.startedAt.toISOString(),
        game.finishedAt?.toISOString() || null,
        game.tablesPlayed || 0
      ]
    );

    // Clear existing game-table relationships for this game
    await this.db.runAsync(`DELETE FROM game_tables WHERE gameId = ?`, [game.id]);

    // Save game-table relationships
    for (const table of game.tables) {
      // If game is finished, create snapshot of table
      let tableId = table.id;
      if (!game.isActive && game.finishedAt) {
        const snapshotId = `snapshot_${game.id}_${table.id}`;
        
        // Save table snapshot
        await this.db.runAsync(
          `INSERT OR REPLACE INTO tables 
           (id, customId, serialNumber, numbers, isChecked, isComplete, createdAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            snapshotId,
            table.customId || null,
            table.serialNumber,
            JSON.stringify(table.numbers),
            table.isChecked ? 1 : 0,
            table.isComplete ? 1 : 0,
            table.createdAt.toISOString()
          ]
        );
        
        tableId = snapshotId;
      }
      
      await this.db.runAsync(
        `INSERT INTO game_tables (gameId, tableId) VALUES (?, ?)`,
        [game.id, tableId]
      );
    }
  }

  async saveGameSnapshot(game: GameModel): Promise<void> {
    if (!this.db) return;

    // Don't create snapshots here, just ensure game-table relationships are saved
    // The snapshots will be created when the game is finished
  }

  async saveWinner(winner: WinnerModel): Promise<void> {
    if (!this.db) return;

    // Use snapshot table ID for finished games
    const tableId = `snapshot_${winner.gameId}_${winner.table.id}`;
    const safeNumbers = Array.isArray(winner.table.numbers) ? winner.table.numbers : [];

    await this.db.runAsync(
      `INSERT INTO winners 
       (id, gameId, tableId, winningAmount, gameType, isPlayerWinner, createdAt, customId, serialNumber, numbers) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        winner.id,
        winner.gameId,
        tableId,
        winner.winningAmount,
        winner.gameType,
        winner.isPlayerWinner ? 1 : 0,
        winner.createdAt.toISOString(),
        winner.table.customId || '',
        winner.table.serialNumber,
        JSON.stringify(safeNumbers)
      ]
    );

    // Save winning numbers
    for (let i = 0; i < winner.table.numbers.length; i++) {
      await this.db.runAsync(
        `INSERT INTO winning_numbers 
         (id, gameId, number, isPlayerWinner, gameType, position, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${winner.id}_${i}`,
          winner.gameId,
          winner.table.numbers[i],
          winner.isPlayerWinner ? 1 : 0,
          winner.gameType,
          i,
          winner.createdAt.toISOString()
        ]
      );
    }

    // Save winning serial
    await this.db.runAsync(
      `INSERT INTO winning_serials 
       (id, gameId, serialNumber, isPlayerWinner, gameType, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `${winner.id}_serial`,
        winner.gameId,
        winner.table.serialNumber,
        winner.isPlayerWinner ? 1 : 0,
        winner.gameType,
        winner.createdAt.toISOString()
      ]
    );
  }

  async saveOpponentWinner(gameId: string, data: OpponentWinnerData): Promise<void> {
    if (!this.db) return;

    const id = Date.now().toString() + Math.random();
    
    await this.db.runAsync(
      `INSERT INTO opponent_winners 
       (id, gameId, gameType, numbers, serialNumber, winningAmount, notes, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        gameId,
        data.gameType,
        JSON.stringify(data.numbers),
        data.serialNumber,
        data.winningAmount,
        data.notes,
        new Date().toISOString()
      ]
    );

    // Save opponent winning numbers
    for (let i = 0; i < data.numbers.length; i++) {
      await this.db.runAsync(
        `INSERT INTO winning_numbers 
         (id, gameId, number, isPlayerWinner, gameType, position, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${id}_${i}`,
          gameId,
          data.numbers[i],
          0, // opponent winner
          data.gameType,
          i,
          new Date().toISOString()
        ]
      );
    }

    // Save opponent winning serial
    if (data.serialNumber) {
      await this.db.runAsync(
        `INSERT INTO winning_serials 
         (id, gameId, serialNumber, isPlayerWinner, gameType, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          `${id}_serial`,
          gameId,
          data.serialNumber,
          0, // opponent winner
          data.gameType,
          new Date().toISOString()
        ]
      );
    }
  }

  async saveHistory(history: HistoryModel): Promise<void> {
    if (!this.db) return;

    await this.db.runAsync(
      `INSERT INTO history 
       (id, gameId, totalCost, totalWinnings, totalOpponentWinnings, netProfit, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        history.id,
        history.game.id,
        history.totalCost,
        history.totalWinnings,
        history.totalOpponentWinnings,
        history.netProfit,
        history.createdAt.toISOString()
      ]
    );
  }

  async getGameHistory(): Promise<HistoryModel[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`
      SELECT h.*, g.drawnNumbers, g.gameType, g.isOpponentOnlyMode, g.startedAt, g.finishedAt, g.tablesPlayed
      FROM history h
      JOIN games g ON h.gameId = g.id
      ORDER BY h.createdAt DESC
    `);

    const history: HistoryModel[] = [];
    
    for (const row of result) {
      const r = row as any;
      const tables = await this.getTablesForGame(r.gameId);
      const winners = await this.getWinnersForGame(r.gameId);
      const opponentWinners = await this.getOpponentWinnersForGame(r.gameId);
      
      history.push({
        id: r.id,
        game: {
          id: r.gameId,
          tables,
          drawnNumbers: JSON.parse(r.drawnNumbers),
          winnerTables: winners.map(w => w.table),
          gameType: r.gameType,
          isActive: false,
          isOpponentOnlyMode: Boolean(r.isOpponentOnlyMode),
          startedAt: new Date(r.startedAt),
          finishedAt: r.finishedAt ? new Date(r.finishedAt) : undefined,
          tablesPlayed: r.tablesPlayed || 0,
        },
        winners,
        opponentWinners,
        totalCost: r.totalCost,
        totalWinnings: r.totalWinnings,
        totalOpponentWinnings: r.totalOpponentWinnings || 0,
        netProfit: r.netProfit,
        createdAt: new Date(r.createdAt),
        tablesPlayed: r.tablesPlayed || 0,
      });
    }

    return history;
  }

  private async getTablesForGame(gameId: string): Promise<TableModel[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`
      SELECT t.* FROM tables t
      JOIN game_tables gt ON t.id = gt.tableId
      WHERE gt.gameId = ?
    `, [gameId]);

    return result.map((row: any) => ({
      id: row.id,
      customId: row.customId,
      serialNumber: row.serialNumber,
      numbers: JSON.parse(row.numbers),
      isChecked: Boolean(row.isChecked),
      isComplete: Boolean(row.isComplete),
      createdAt: new Date(row.createdAt)
    }));
  }

  private async getWinnersForGame(gameId: string): Promise<WinnerModel[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`
      SELECT * FROM winners WHERE gameId = ?
    `, [gameId]);

    return result.map((row: any) => {
      let numbers: number[] = [];
      try {
        numbers = JSON.parse(row.numbers);
        if (!Array.isArray(numbers)) numbers = [];
      } catch {
        numbers = [];
      }
      return {
        id: row.id,
        gameId: row.gameId,
        table: {
          id: row.tableId,
          customId: row.customId,
          serialNumber: row.serialNumber,
          numbers,
          isChecked: true,
          isComplete: true,
          createdAt: new Date(row.createdAt)
        },
        winningAmount: row.winningAmount,
        gameType: row.gameType,
        isPlayerWinner: Boolean(row.isPlayerWinner),
        createdAt: new Date(row.createdAt)
      };
    });
  }

  private async getOpponentWinnersForGame(gameId: string): Promise<OpponentWinnerModel[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`
      SELECT * FROM opponent_winners WHERE gameId = ?
    `, [gameId]);

    return result.map((row: any) => ({
      id: row.id,
      gameId: row.gameId,
      gameType: row.gameType,
      numbers: JSON.parse(row.numbers || '[]'),
      serialNumber: row.serialNumber,
      winningAmount: row.winningAmount,
      notes: row.notes,
      createdAt: new Date(row.createdAt)
    }));
  }

  async deleteHistoryEntry(historyId: string): Promise<void> {
    if (!this.db) return;

    // Get the gameId first
    const historyEntry = await this.db.getFirstAsync(
      `SELECT gameId FROM history WHERE id = ?`,
      [historyId]
    ) as any;

    if (historyEntry) {
      const gameId = historyEntry.gameId;
      
      // Delete all related data
      await this.db.execAsync(`
        DELETE FROM winning_numbers WHERE gameId = '${gameId}';
        DELETE FROM winning_serials WHERE gameId = '${gameId}';
        DELETE FROM opponent_winners WHERE gameId = '${gameId}';
        DELETE FROM winners WHERE gameId = '${gameId}';
        DELETE FROM game_tables WHERE gameId = '${gameId}';
        DELETE FROM history WHERE id = '${historyId}';
        DELETE FROM games WHERE id = '${gameId}';
      `);
    }
  }

  async clearGameHistory(): Promise<void> {
    if (!this.db) return;
    
    await this.db.execAsync(`
      DELETE FROM winning_numbers;
      DELETE FROM winning_serials;
      DELETE FROM history;
      DELETE FROM winners;
      DELETE FROM opponent_winners;
      DELETE FROM game_tables;
      DELETE FROM games;
    `);
  }

  async getWinningNumbers(): Promise<{ number: number; frequency: number }[]> {
    if (!this.db) return [];

    const result = await this.db.getAllAsync(`
      SELECT number, COUNT(*) as frequency 
      FROM winning_numbers 
      GROUP BY number 
      ORDER BY frequency DESC, number ASC
      LIMIT 10
    `);

    return result.map((row: any) => ({
      number: row.number,
      frequency: row.frequency
    }));
  }

  async getWinningSerials(): Promise<{ player: string[]; opponent: string[] }> {
    if (!this.db) return { player: [], opponent: [] };

    const playerResult = await this.db.getAllAsync(`
      SELECT serialNumber FROM winning_serials 
      WHERE isPlayerWinner = 1 
      ORDER BY createdAt DESC
    `);

    const opponentResult = await this.db.getAllAsync(`
      SELECT serialNumber FROM winning_serials 
      WHERE isPlayerWinner = 0 
      ORDER BY createdAt DESC
    `);

    return {
      player: playerResult.map((row: any) => row.serialNumber),
      opponent: opponentResult.map((row: any) => row.serialNumber)
    };
  }

  async getSerialNumberMargins(): Promise<{ min: number; max: number; average: number }> {
    if (!this.db) return { min: 0, max: 0, average: 0 };

    const result = await this.db.getFirstAsync(`
      SELECT 
        MIN(CAST(serialNumber AS INTEGER)) as minSerial,
        MAX(CAST(serialNumber AS INTEGER)) as maxSerial,
        AVG(CAST(serialNumber AS INTEGER)) as avgSerial
      FROM winning_serials
      WHERE serialNumber GLOB '[0-9]*'
    `) as any;

    if (result) {
      return {
        min: result.minSerial || 0,
        max: result.maxSerial || 0,
        average: Math.round(result.avgSerial || 0)
      };
    }

    return { min: 0, max: 0, average: 0 };
  }

  async getRecommendedNumbers(count: number = 7): Promise<number[]> {
    if (!this.db) return [];

    try {
      // Get numbers from all three sources
      const winningNumbers = await this.db.getAllAsync(`
        SELECT number, COUNT(*) as frequency 
        FROM winning_numbers 
        GROUP BY number 
        ORDER BY frequency DESC
        LIMIT 20
      `);

      // Get early numbers (first 25 positions in games)
      const earlyNumbers = await this.db.getAllAsync(`
        SELECT 
          json_extract(value, '$') as number,
          COUNT(*) as frequency
        FROM games g,
             json_each(g.drawnNumbers) je
        WHERE je.key < 25
          AND json_extract(value, '$') BETWEEN 1 AND 90
        GROUP BY number
        ORDER BY frequency DESC
        LIMIT 25
      `);

      // Get all frequent numbers
      const allNumbers = await this.db.getAllAsync(`
        SELECT 
          json_extract(value, '$') as number,
          COUNT(*) as frequency
        FROM games g,
             json_each(g.drawnNumbers) je
        WHERE json_extract(value, '$') BETWEEN 1 AND 90
        GROUP BY number
        ORDER BY frequency DESC
        LIMIT 20
      `);

      // Calculate scores for each number
      const numberScores = new Map<number, number>();

      // Winning numbers get highest priority
      winningNumbers.forEach((row: any, index: number) => {
        const score = (20 - index) * 3; // Higher weight for winning numbers
        numberScores.set(row.number, (numberScores.get(row.number) || 0) + score);
      });

      // Early numbers get medium priority
      earlyNumbers.forEach((row: any, index: number) => {
        const score = (25 - index) * 2;
        numberScores.set(parseInt(row.number), (numberScores.get(parseInt(row.number)) || 0) + score);
      });

      // All frequent numbers get base priority
      allNumbers.forEach((row: any, index: number) => {
        const score = (20 - index) * 1;
        numberScores.set(parseInt(row.number), (numberScores.get(parseInt(row.number)) || 0) + score);
      });

      // Sort by score and return top numbers
      const sortedNumbers = Array.from(numberScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([number]) => number);

      return sortedNumbers;
    } catch (error) {
      console.error('Error getting recommended numbers:', error);
      return [];
    }
  }

  async hasStatisticalData(): Promise<boolean> {
    if (!this.db) return false;

    const result = await this.db.getFirstAsync(`
      SELECT COUNT(*) as count FROM games WHERE finishedAt IS NOT NULL
    `) as any;

    return (result?.count || 0) > 0;
  }
}

export const databaseService = new DatabaseService();