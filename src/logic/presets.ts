import { Preset } from '../types';

export const PRESETS: Preset[] = [
  // ── Byoyomi ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    description: '5 min + 5×30s',      config: { type: 'byoyomi', mainTime: 5 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'online',   description: '10 min + 5×30s',     config: { type: 'byoyomi', mainTime: 10 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'club',     description: '30 min + 5×30s',     config: { type: 'byoyomi', mainTime: 30 * 60, periods: 5, periodTime: 30 } },
  { nameKey: 'egf',      description: '45 min + 3×30s',     config: { type: 'byoyomi', mainTime: 45 * 60, periods: 3, periodTime: 30 } },
  { nameKey: 'long',     description: '60 min + 5×60s',     config: { type: 'byoyomi', mainTime: 60 * 60, periods: 5, periodTime: 60 } },

  // ── Canadian ─────────────────────────────────────────────────────────────
  { nameKey: 'rapid',    description: '20 min + 20 / 5 min', config: { type: 'canadian', mainTime: 20 * 60, movesPerPeriod: 20, periodTime: 5 * 60 } },
  { nameKey: 'standard', description: '30 min + 25 / 10 min', config: { type: 'canadian', mainTime: 30 * 60, movesPerPeriod: 25, periodTime: 10 * 60 } },
  { nameKey: 'long',     description: '45 min + 30 / 10 min', config: { type: 'canadian', mainTime: 45 * 60, movesPerPeriod: 30, periodTime: 10 * 60 } },

  // ── Fischer ──────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    description: '5 min + 5s',         config: { type: 'fischer', mainTime: 5 * 60, increment: 5 } },
  { nameKey: 'rapid',    description: '15 min + 10s',       config: { type: 'fischer', mainTime: 15 * 60, increment: 10 } },
  { nameKey: 'standard', description: '30 min + 15s',       config: { type: 'fischer', mainTime: 30 * 60, increment: 15 } },
  { nameKey: 'long',     description: '60 min + 30s',       config: { type: 'fischer', mainTime: 60 * 60, increment: 30 } },

  // ── Absolute ─────────────────────────────────────────────────────────────
  { nameKey: 'blitz',    description: '10 min',             config: { type: 'absolute', mainTime: 10 * 60 } },
  { nameKey: 'rapid',    description: '20 min',             config: { type: 'absolute', mainTime: 20 * 60 } },
  { nameKey: 'standard', description: '30 min',             config: { type: 'absolute', mainTime: 30 * 60 } },
  { nameKey: 'long',     description: '60 min',             config: { type: 'absolute', mainTime: 60 * 60 } },
];
