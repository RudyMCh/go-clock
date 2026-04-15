import { Preset } from '../types';

export const PRESETS: Preset[] = [
  // ── Byoyomi ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',        config: { type: 'byoyomi', mainTime:  10 * 60, periods: 5, periodTime:  30 } },
  { nameKey: 'club',         config: { type: 'byoyomi', mainTime:  30 * 60, periods: 5, periodTime:  30 } },
  { nameKey: 'standard',     config: { type: 'byoyomi', mainTime:  60 * 60, periods: 3, periodTime:  30 } },
  { nameKey: 'tournament',   config: { type: 'byoyomi', mainTime:  90 * 60, periods: 3, periodTime:  45 } },
  { nameKey: 'championship', config: { type: 'byoyomi', mainTime: 150 * 60, periods: 5, periodTime:  60 } },

  // ── Canadian ─────────────────────────────────────────────────────────────
  { nameKey: 'blitz',        config: { type: 'canadian', mainTime:  10 * 60, movesPerPeriod: 20, periodTime:  5 * 60 } },
  { nameKey: 'club',         config: { type: 'canadian', mainTime:  45 * 60, movesPerPeriod: 15, periodTime:  5 * 60 } },
  { nameKey: 'standard',     config: { type: 'canadian', mainTime:  60 * 60, movesPerPeriod: 15, periodTime:  5 * 60 } },
  { nameKey: 'tournament',   config: { type: 'canadian', mainTime:  75 * 60, movesPerPeriod: 15, periodTime:  5 * 60 } },
  { nameKey: 'championship', config: { type: 'canadian', mainTime:  90 * 60, movesPerPeriod: 15, periodTime:  5 * 60 } },

  // ── Fischer ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',        config: { type: 'fischer', mainTime:  10 * 60, increment: 10 } },
  { nameKey: 'club',         config: { type: 'fischer', mainTime:  25 * 60, increment: 15 } },
  { nameKey: 'standard',     config: { type: 'fischer', mainTime:  40 * 60, increment: 20 } },
  { nameKey: 'tournament',   config: { type: 'fischer', mainTime:  50 * 60, increment: 20 } },
  { nameKey: 'championship', config: { type: 'fischer', mainTime:  60 * 60, increment: 20 } },

  // ── Absolute ─────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    config: { type: 'absolute', mainTime: 10 * 60 } },
  { nameKey: 'rapid',    config: { type: 'absolute', mainTime: 20 * 60 } },
  { nameKey: 'standard', config: { type: 'absolute', mainTime: 30 * 60 } },
  { nameKey: 'long',     config: { type: 'absolute', mainTime: 60 * 60 } },
];
