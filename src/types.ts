export type TimeControlType = 'byoyomi' | 'canadian' | 'fischer' | 'absolute';

export interface AbsoluteConfig {
  type: 'absolute';
  mainTime: number; // secondes
}

export interface ByoyomiConfig {
  type: 'byoyomi';
  mainTime: number; // secondes
  periods: number;
  periodTime: number; // secondes par période
}

export interface CanadianConfig {
  type: 'canadian';
  mainTime: number; // secondes
  movesPerPeriod: number;
  periodTime: number; // secondes pour la période
}

export interface FischerConfig {
  type: 'fischer';
  mainTime: number; // secondes
  increment: number; // secondes ajoutées par coup
}

export type TimeControlConfig =
  | AbsoluteConfig
  | ByoyomiConfig
  | CanadianConfig
  | FischerConfig;

export type Player = 'black' | 'white';
export type GameStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface PlayerState {
  mainTimeLeft: number; // secondes
  inOvertime: boolean;
  hasLost: boolean;
  moveCount: number; // nombre de coups joués
  // Byoyomi
  periodsLeft: number;
  byoyomiTimeLeft: number; // secondes restantes dans la période courante
  // Canadian
  movesLeftInPeriod: number;
  canadianTimeLeft: number; // secondes restantes dans la période canadienne
}

export interface GameState {
  config: TimeControlConfig;
  black: PlayerState;
  white: PlayerState;
  activePlayer: Player;
  firstPlayer: Player;
  status: GameStatus;
  winner: Player | null;
}

export type DisplayStyle = 'led' | 'app';
export type BlackSide = 'left' | 'right';

export interface ResumePlayerState {
  inOvertime: boolean;
  mainTimeMins: number;
  mainTimeSecs: number;
  // byoyomi overtime
  periodsLeft: number;
  byoyomiSecs: number;
  // canadian overtime
  canadianMins: number;
  canadianSecs: number;
  movesPlayed: number;
}

export interface ResumeConfig {
  enabled: boolean;
  black: ResumePlayerState;
  white: ResumePlayerState;
}

export type PresetNameKey = 'blitz' | 'club' | 'long' | 'rapid' | 'standard' | 'tournament' | 'championship';

export interface Preset {
  nameKey: PresetNameKey;
  config: TimeControlConfig;
}

export interface UserPreset {
  name: string;
  config: TimeControlConfig;
}
