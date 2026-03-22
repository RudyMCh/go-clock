import { Preset } from '../types';

export const PRESETS: Preset[] = [
  // ── Byoyomi ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    config: { type: 'byoyomi', mainTime: 5 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'online',   config: { type: 'byoyomi', mainTime: 10 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'club',     config: { type: 'byoyomi', mainTime: 30 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'egf',      config: { type: 'byoyomi', mainTime: 45 * 60, periods: 3, periodTime: 30 } },
  { nameKey: 'long',     config: { type: 'byoyomi', mainTime: 60 * 60, periods: 5, periodTime: 60 } },

  // ── Canadian ─────────────────────────────────────────────────────────────
  { nameKey: 'rapid',    config: { type: 'canadian', mainTime: 20 * 60, movesPerPeriod: 20, periodTime: 5 * 60 } },
  { nameKey: 'standard', config: { type: 'canadian', mainTime: 30 * 60, movesPerPeriod: 25, periodTime: 10 * 60 } },
  { nameKey: 'long',     config: { type: 'canadian', mainTime: 45 * 60, movesPerPeriod: 30, periodTime: 10 * 60 } },

  // ── Fischer ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    config: { type: 'fischer', mainTime: 5 * 60, increment: 5 } },
  { nameKey: 'rapid',    config: { type: 'fischer', mainTime: 15 * 60, increment: 10 } },
  { nameKey: 'standard', config: { type: 'fischer', mainTime: 30 * 60, increment: 15 } },
  { nameKey: 'long',     config: { type: 'fischer', mainTime: 60 * 60, increment: 30 } },

  // ── Absolute ─────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    config: { type: 'absolute', mainTime: 10 * 60 } },
  { nameKey: 'rapid',    config: { type: 'absolute', mainTime: 20 * 60 } },
  { nameKey: 'standard', config: { type: 'absolute', mainTime: 30 * 60 } },
  { nameKey: 'long',     config: { type: 'absolute', mainTime: 60 * 60 } },
];
