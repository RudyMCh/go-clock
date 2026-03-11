import { Preset } from '../types';

export const PRESETS: Preset[] = [
  {
    name: 'Blitz',
    description: '5 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 5 * 60, periods: 5, periodTime: 30 },
  },
  {
    name: 'Standard',
    description: '30 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 30 * 60, periods: 5, periodTime: 30 },
  },
  {
    name: 'Standard EGF',
    description: '45 min + 3×30s',
    config: { type: 'byoyomi', mainTime: 45 * 60, periods: 3, periodTime: 30 },
  },
  {
    name: 'Online (OGS)',
    description: '10 min + 5×30s',
    config: { type: 'byoyomi', mainTime: 10 * 60, periods: 5, periodTime: 30 },
  },
  {
    name: 'Canadien',
    description: '30 min + 25 coups/10 min',
    config: {
      type: 'canadian',
      mainTime: 30 * 60,
      movesPerPeriod: 25,
      periodTime: 10 * 60,
    },
  },
  {
    name: 'Fischer Blitz',
    description: '5 min + 10s/coup',
    config: { type: 'fischer', mainTime: 5 * 60, increment: 10 },
  },
  {
    name: 'Mort subite',
    description: '30 min total',
    config: { type: 'absolute', mainTime: 30 * 60 },
  },
];
