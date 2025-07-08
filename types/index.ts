export interface TableModel {
  id: string;
  customId?: string;
  serialNumber: string;
  numbers: number[];
  isChecked: boolean;
  isComplete: boolean;
  createdAt: Date;
}

export interface GameModel {
  id: string;
  tables: TableModel[];
  drawnNumbers: number[];
  winnerTables: TableModel[];
  gameType: 'main' | 'secondary';
  isActive: boolean;
  isOpponentOnlyMode: boolean;
  startedAt: Date;
  finishedAt?: Date;
}

export interface WinnerModel {
  id: string;
  gameId: string;
  table: TableModel;
  winningAmount: number;
  gameType: 'main' | 'secondary';
  isPlayerWinner: boolean;
  createdAt: Date;
}

export interface OpponentWinnerModel {
  id: string;
  gameId: string;
  gameType: 'main' | 'secondary';
  numbers: number[];
  serialNumber: string;
  winningAmount: number;
  notes?: string;
  createdAt: Date;
}

export interface HistoryModel {
  id: string;
  game: GameModel;
  winners: WinnerModel[];
  opponentWinners: OpponentWinnerModel[];
  totalCost: number;
  totalWinnings: number;
  totalOpponentWinnings: number;
  netProfit: number;
  createdAt: Date;
  tablesPlayed: number;
}

export interface GameStats {
  totalGames: number;
  totalRegisteredGames: number;
  totalTablesPlayed: number;
  totalSpent: number;
  totalWon: number;
  netProfit: number;
  winRate: number;
  averageNumbersDrawn: number;
  mostFrequentNumbers: { number: number; frequency: number }[];
  top25EarlyNumbers: { number: number; frequency: number }[];
  top10WinningNumbers: { number: number; frequency: number }[];
  winningSerialNumbers: { player: string[]; opponent: string[] };
  serialNumberMargins: { min: number; max: number; average: number };
}

export interface OpponentWinnerData {
  gameType: 'main' | 'secondary';
  numbers: number[];
  serialNumber: string;
  winningAmount: number;
  notes: string;
}

export interface NumberRecommendation {
  number: number;
  score: number;
  sources: string[];
}