import {
  TimeControlConfig,
  PlayerState,
  Player,
  GameState,
  ByoyomiConfig,
  CanadianConfig,
  FischerConfig,
} from '../types';

export function createInitialPlayerState(config: TimeControlConfig): PlayerState {
  return {
    mainTimeLeft: config.mainTime,
    inOvertime: false,
    hasLost: false,
    moveCount: 0,
    periodsLeft: config.type === 'byoyomi' ? config.periods : 0,
    byoyomiTimeLeft: config.type === 'byoyomi' ? config.periodTime : 0,
    movesLeftInPeriod: config.type === 'canadian' ? config.movesPerPeriod : 0,
    canadianTimeLeft: config.type === 'canadian' ? config.periodTime : 0,
  };
}

export function createGameState(config: TimeControlConfig, firstPlayer: Player = 'black'): GameState {
  return {
    config,
    black: createInitialPlayerState(config),
    white: createInitialPlayerState(config),
    activePlayer: firstPlayer,
    firstPlayer,
    status: 'idle',
    winner: null,
  };
}

function tickPlayer(state: PlayerState, config: TimeControlConfig, dt: number): PlayerState {
  if (state.hasLost) return state;

  let {
    mainTimeLeft,
    inOvertime,
    periodsLeft,
    byoyomiTimeLeft,
    movesLeftInPeriod,
    canadianTimeLeft,
  } = state;

  if (!inOvertime) {
    mainTimeLeft -= dt;

    if (mainTimeLeft <= 0) {
      if (config.type === 'absolute' || config.type === 'fischer') {
        return { ...state, mainTimeLeft: 0, hasLost: true };
      }

      if (config.type === 'byoyomi') {
        // L'overflow passe dans la première période de byoyomi
        byoyomiTimeLeft = (config as ByoyomiConfig).periodTime + mainTimeLeft;
        mainTimeLeft = 0;
        inOvertime = true;

        while (byoyomiTimeLeft <= 0) {
          periodsLeft--;
          if (periodsLeft <= 0) {
            return { ...state, mainTimeLeft: 0, inOvertime: true, hasLost: true, periodsLeft: 0, byoyomiTimeLeft: 0 };
          }
          byoyomiTimeLeft += (config as ByoyomiConfig).periodTime;
        }
      }

      if (config.type === 'canadian') {
        canadianTimeLeft = (config as CanadianConfig).periodTime + mainTimeLeft;
        mainTimeLeft = 0;
        inOvertime = true;

        if (canadianTimeLeft <= 0) {
          return { ...state, mainTimeLeft: 0, inOvertime: true, hasLost: true, canadianTimeLeft: 0 };
        }
      }
    }
  } else {
    // Décompte en surtemps
    if (config.type === 'byoyomi') {
      byoyomiTimeLeft -= dt;

      while (byoyomiTimeLeft <= 0) {
        periodsLeft--;
        if (periodsLeft <= 0) {
          return {
            ...state,
            inOvertime: true,
            hasLost: true,
            periodsLeft: 0,
            byoyomiTimeLeft: 0,
          };
        }
        byoyomiTimeLeft += (config as ByoyomiConfig).periodTime;
      }
    }

    if (config.type === 'canadian') {
      canadianTimeLeft -= dt;
      if (canadianTimeLeft <= 0) {
        return { ...state, inOvertime: true, hasLost: true, canadianTimeLeft: 0 };
      }
    }
  }

  return {
    ...state,
    mainTimeLeft,
    inOvertime,
    periodsLeft,
    byoyomiTimeLeft,
    movesLeftInPeriod,
    canadianTimeLeft,
  };
}

/** Avance le jeu d'un incrément dt (en secondes) */
export function tick(state: GameState, dt: number): GameState {
  if (state.status !== 'running') return state;

  const player = state.activePlayer;
  const newPlayerState = tickPlayer(state[player], state.config, dt);

  if (newPlayerState.hasLost) {
    return {
      ...state,
      [player]: newPlayerState,
      status: 'finished',
      winner: player === 'black' ? 'white' : 'black',
    };
  }

  return { ...state, [player]: newPlayerState };
}

/** Appelé quand un joueur appuie sur sa pendule (fin de son coup) */
export function pressClock(state: GameState): GameState {
  if (state.status === 'finished') return state;
  if (state.status === 'idle') {
    // Premier coup : démarrage de la partie (noir joue d'abord)
    return { ...state, status: 'running' };
  }

  const player = state.activePlayer;
  let playerState = { ...state[player] };
  const config = state.config;

  // Incrémenter le compteur de coups du joueur
  playerState.moveCount += 1;

  // Effets lors de la pression de la pendule
  if (config.type === 'fischer') {
    playerState.mainTimeLeft += (config as FischerConfig).increment;
  } else if (config.type === 'byoyomi' && playerState.inOvertime) {
    // Réinitialisation de la période courante
    playerState.byoyomiTimeLeft = (config as ByoyomiConfig).periodTime;
  } else if (config.type === 'canadian' && playerState.inOvertime) {
    playerState.movesLeftInPeriod--;
    if (playerState.movesLeftInPeriod <= 0) {
      // Nouvelle période canadienne
      playerState.movesLeftInPeriod = (config as CanadianConfig).movesPerPeriod;
      playerState.canadianTimeLeft = (config as CanadianConfig).periodTime;
    }
  }

  const nextPlayer: Player = player === 'black' ? 'white' : 'black';

  return {
    ...state,
    [player]: playerState,
    activePlayer: nextPlayer,
    status: 'running',
  };
}

export function pauseGame(state: GameState): GameState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused' };
}

export function resumeGame(state: GameState): GameState {
  if (state.status !== 'paused') return state;
  return { ...state, status: 'running' };
}

/** Formate un nombre de secondes en chaîne affichable */
export function formatTime(seconds: number, showTenths = false): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);

  if (showTenths && mins === 0) {
    const tenths = Math.floor((s % 1) * 10);
    return `${secs}.${tenths}`;
  }

  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h${remainingMins.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Renvoie vrai si le temps est critique (pour alerter le joueur) */
export function isTimeCritical(playerState: PlayerState, config: TimeControlConfig): boolean {
  if (playerState.inOvertime) {
    if (config.type === 'byoyomi') {
      return playerState.byoyomiTimeLeft <= 10;
    }
    if (config.type === 'canadian') {
      return playerState.canadianTimeLeft <= 30 && playerState.movesLeftInPeriod > 5;
    }
    return false;
  }
  return !playerState.inOvertime && playerState.mainTimeLeft <= 30;
}
