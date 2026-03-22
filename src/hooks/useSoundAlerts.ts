import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { GameState, TimeControlConfig, PlayerState } from '../types';

const SOUNDS = {
  beep: require('../../assets/sounds/beep.ogg'),
  beepUrgent: require('../../assets/sounds/beep_urgent.ogg'),
  alarm: require('../../assets/sounds/alarm.ogg'),
};

type LoadedSounds = {
  beep: Audio.Sound | null;
  beepUrgent: Audio.Sound | null;
  alarm: Audio.Sound | null;
};

/**
 * Renvoie le nombre de secondes restantes sur le compteur
 * qui, s'il atteint 0, entraîne une perte de période ou de partie.
 * Retourne null si aucune alerte n'est pertinente pour ce mode/état.
 */
function getCriticalSeconds(
  playerState: PlayerState,
  config: TimeControlConfig,
): number | null {
  if (playerState.hasLost) return null;

  if (config.type === 'byoyomi') {
    // En surtemps : chaque seconde perdue = risque de perdre la période
    if (playerState.inOvertime) return playerState.byoyomiTimeLeft;
    // En temps principal : alerte à l'approche de l'entrée en byoyomi
    if (playerState.mainTimeLeft <= 30) return playerState.mainTimeLeft;
    return null;
  }

  if (config.type === 'canadian') {
    if (playerState.inOvertime) return playerState.canadianTimeLeft;
    if (playerState.mainTimeLeft <= 30) return playerState.mainTimeLeft;
    return null;
  }

  // Absolu et Fischer : la pendule principale mène directement à la défaite
  if (playerState.mainTimeLeft <= 30) return playerState.mainTimeLeft;
  return null;
}

export function useSoundAlerts(gameState: GameState) {
  const sounds = useRef<LoadedSounds>({ beep: null, beepUrgent: null, alarm: null });
  const lastBeepSecond = useRef<number>(-1);
  const alarmPlayed = useRef<boolean>(false);
  const prevActivePlayer = useRef(gameState.activePlayer);

  // Chargement des sons
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    async function load() {
      try {
        const [b, bu, al] = await Promise.all([
          Audio.Sound.createAsync(SOUNDS.beep),
          Audio.Sound.createAsync(SOUNDS.beepUrgent),
          Audio.Sound.createAsync(SOUNDS.alarm),
        ]);
        sounds.current = { beep: b.sound, beepUrgent: bu.sound, alarm: al.sound };
      } catch (e) {
        console.warn('Impossible de charger les sons', e);
      }
    }
    load();

    return () => {
      sounds.current.beep?.unloadAsync();
      sounds.current.beepUrgent?.unloadAsync();
      sounds.current.alarm?.unloadAsync();
    };
  }, []);

  // Reset quand la partie recommence
  useEffect(() => {
    if (gameState.status === 'idle') {
      lastBeepSecond.current = -1;
      alarmPlayed.current = false;
    }
  }, [gameState.status]);

  // Reset du compteur de bip quand le joueur actif change
  useEffect(() => {
    if (prevActivePlayer.current !== gameState.activePlayer) {
      prevActivePlayer.current = gameState.activePlayer;
      lastBeepSecond.current = -1;
    }
  }, [gameState.activePlayer]);

  // Lecture des alertes sonores
  useEffect(() => {
    // Alarme de fin de partie
    if (gameState.status === 'finished' && !alarmPlayed.current) {
      alarmPlayed.current = true;
      sounds.current.alarm?.replayAsync().catch(() => {});
      return;
    }

    if (gameState.status !== 'running') return;

    const player = gameState.activePlayer;
    const playerState = gameState[player];
    const critSecs = getCriticalSeconds(playerState, gameState.config);

    if (critSecs === null || critSecs > 10) return;

    // Détecter le changement de seconde (vers le bas)
    const currentSecond = Math.ceil(critSecs);
    if (currentSecond === lastBeepSecond.current || currentSecond <= 0) return;

    lastBeepSecond.current = currentSecond;

    if (critSecs <= 5) {
      sounds.current.beepUrgent?.replayAsync().catch(() => {});
    } else {
      sounds.current.beep?.replayAsync().catch(() => {});
    }
  }, [gameState]);
}
