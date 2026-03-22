import { Preset } from '../types';

export const PRESETS: Preset[] = [
  // ── Byoyomi ──────────────────────────────────────────────────────────────
  // Blitz en ligne / bullet club
  {
    name: 'Blitz',
    description: '5 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 5 * 60, periods: 5, periodTime: 30 },
  },
  // Cadence rapide online (OGS standard)
  {
    name: 'Online',
    description: '10 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 10 * 60, periods: 5, periodTime: 30 },
  },
  // Partie de club typique
  {
    name: 'Club',
    description: '30 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 30 * 60, periods: 5, periodTime: 30 },
  },
  // Standard EGF (tournoi européen)
  {
    name: 'EGF',
    description: '45 min + 3×30s',
    config: { type: 'byoyomi', mainTime: 45 * 60, periods: 3, periodTime: 30 },
  },
  // Longue partie / tournoi sérieux
  {
    name: 'Long',
    description: '60 min + 5×60s',
    config: { type: 'byoyomi', mainTime: 60 * 60, periods: 5, periodTime: 60 },
  },

  // ── Canadian ─────────────────────────────────────────────────────────────
  // Cadence rapide (style AGA minimum)
  {
    name: 'Rapide',
    description: '20 min + 20 / 5 min',
    config: {
      type: 'canadian',
      mainTime: 20 * 60,
      movesPerPeriod: 20,
      periodTime: 5 * 60,
    },
  },
  // Cadence standard club
  {
    name: 'Standard',
    description: '30 min + 25 / 10 min',
    config: {
      type: 'canadian',
      mainTime: 30 * 60,
      movesPerPeriod: 25,
      periodTime: 10 * 60,
    },
  },
  // Longue partie
  {
    name: 'Long',
    description: '45 min + 30 / 10 min',
    config: {
      type: 'canadian',
      mainTime: 45 * 60,
      movesPerPeriod: 30,
      periodTime: 10 * 60,
    },
  },

  // ── Fischer ──────────────────────────────────────────────────────────────
  // Blitz en ligne (5+5 style)
  {
    name: 'Blitz',
    description: '5 min + 5s',
    config: { type: 'fischer', mainTime: 5 * 60, increment: 5 },
  },
  // Rapide (cadence confortable)
  {
    name: 'Rapide',
    description: '15 min + 10s',
    config: { type: 'fischer', mainTime: 15 * 60, increment: 10 },
  },
  // Standard
  {
    name: 'Standard',
    description: '30 min + 15s',
    config: { type: 'fischer', mainTime: 30 * 60, increment: 15 },
  },
  // Longue partie
  {
    name: 'Long',
    description: '60 min + 30s',
    config: { type: 'fischer', mainTime: 60 * 60, increment: 30 },
  },

  // ── Absolute ─────────────────────────────────────────────────────────────
  // Partie express
  {
    name: 'Blitz',
    description: '10 min',
    config: { type: 'absolute', mainTime: 10 * 60 },
  },
  // Rapide
  {
    name: 'Rapide',
    description: '20 min',
    config: { type: 'absolute', mainTime: 20 * 60 },
  },
  // Standard (AGA minimum pour partie officielle)
  {
    name: 'Standard',
    description: '30 min',
    config: { type: 'absolute', mainTime: 30 * 60 },
  },
  // Longue partie
  {
    name: 'Long',
    description: '60 min',
    config: { type: 'absolute', mainTime: 60 * 60 },
  },
];
