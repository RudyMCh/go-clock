import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import { GameState, TimeControlConfig, Player, PlayerState } from '../types';
import { useSoundAlerts } from '../hooks/useSoundAlerts';
import { useTranslation } from '../i18n/LanguageContext';
import {
  createGameState,
  tick,
  pressClock,
  pauseGame,
  resumeGame,
  formatTime,
} from '../logic/gameLogic';
import PlayerClock from '../components/PlayerClock';

// ── Mini-horloge placée dans la zone du joueur, lisible par l'adversaire ───────

function MiniTimeStrip({
  player,
  playerState,
  config,
  flipped = false,
}: {
  player: Player;
  playerState: PlayerState;
  config: TimeControlConfig;
  flipped?: boolean;
}) {
  const isBlack = player === 'black';
  const bgColor = isBlack ? '#1A1A1E' : '#F0F0EB';
  const textColor = isBlack ? '#FFF' : '#1A1A1E';
  const subtleColor = isBlack ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)';

  const time = playerState.inOvertime
    ? config.type === 'byoyomi'
      ? formatTime(playerState.byoyomiTimeLeft, true)
      : config.type === 'canadian'
      ? formatTime(playerState.canadianTimeLeft, false)
      : formatTime(playerState.mainTimeLeft, playerState.mainTimeLeft < 60)
    : formatTime(playerState.mainTimeLeft, playerState.mainTimeLeft < 60);

  return (
    <View style={[miniStyles.strip, { backgroundColor: bgColor }, flipped && miniStyles.flipped]}>
      <Text style={[miniStyles.stone, { color: textColor }]}>
        {isBlack ? '⬤' : '○'}
      </Text>
      <Text style={[miniStyles.time, { color: textColor }]}>{time}</Text>

      {config.type === 'byoyomi' && (
        <View style={miniStyles.dots}>
          {Array.from({ length: config.periods }).map((_, i) => (
            <View
              key={i}
              style={[
                miniStyles.dot,
                i < playerState.periodsLeft
                  ? { backgroundColor: playerState.inOvertime ? '#F5A623' : textColor }
                  : { backgroundColor: 'transparent', borderColor: subtleColor, borderWidth: 1 },
              ]}
            />
          ))}
        </View>
      )}

      {config.type === 'canadian' && playerState.inOvertime && (
        <Text style={[miniStyles.extra, { color: subtleColor }]}>
          {playerState.movesLeftInPeriod}▸
        </Text>
      )}
    </View>
  );
}

const miniStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
  stone: { fontSize: 11 },
  time: {
    fontSize: 18,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  extra: { fontSize: 12 },
});

interface Props {
  config: TimeControlConfig;
  firstPlayer: Player;
  onBack: () => void;
}

export default function GameScreen({ config, firstPlayer, onBack }: Props) {
  useKeepAwake();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    return () => { NavigationBar.setVisibilityAsync('visible'); };
  }, []);
  const [gameState, setGameState] = useState<GameState>(() => createGameState(config, firstPlayer));

  // Refs pour le timer (évite les captures de closures obsolètes)
  const { t } = useTranslation();
  const gameStateRef = useRef<GameState>(gameState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  // Haptics byoyomi : on ne vibre qu'une fois par seconde franchie
  const lastHapticSecond = useRef<number>(-1);
  const hapticPlayer = useRef<Player>(firstPlayer);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const current = gameStateRef.current;
      if (current.status !== 'running') {
        stopInterval();
        return;
      }

      const next = tick(current, dt);
      gameStateRef.current = next;
      setGameState(next);

      if (next.status === 'finished') {
        stopInterval();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Haptics byoyomi : vibration sur les 5 dernières secondes de période
      if (next.config.type === 'byoyomi' && next.status === 'running') {
        const activeState = next[next.activePlayer];
        if (activeState.inOvertime) {
          if (hapticPlayer.current !== next.activePlayer) {
            hapticPlayer.current = next.activePlayer;
            lastHapticSecond.current = -1;
          }
          const secs = Math.ceil(activeState.byoyomiTimeLeft);
          if (secs !== lastHapticSecond.current && secs > 0 && secs <= 5) {
            lastHapticSecond.current = secs;
            Haptics.impactAsync(
              secs <= 3
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Medium,
            );
          }
        }
      }
    }, 100);
  }, []);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (gameState.status === 'running') {
      startInterval();
    } else {
      stopInterval();
    }
    return () => stopInterval();
  }, [gameState.status]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => stopInterval();
  }, []);

  const handlePlayerPress = useCallback((player: 'black' | 'white') => {
    const current = gameStateRef.current;

    if (current.status === 'finished') return;

    // Tap sur une zone pendant la pause → reprise
    if (current.status === 'paused') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = resumeGame(current);
      gameStateRef.current = next;
      setGameState(next);
      return;
    }

    // Tap sur la zone adverse → pause
    if (current.status === 'running' && current.activePlayer !== player) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = pauseGame(current);
      gameStateRef.current = next;
      setGameState(next);
      return;
    }

    // Tap sur sa propre zone (idle ou running) → avancer le coup
    if (current.status === 'idle' && player !== current.firstPlayer) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = pressClock(current);
    gameStateRef.current = next;
    setGameState(next);

    if (next.status === 'running') {
      startInterval();
    }
  }, [startInterval]);

  const handlePauseResume = useCallback(() => {
    const current = gameStateRef.current;
    if (current.status === 'finished' || current.status === 'idle') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = current.status === 'running' ? pauseGame(current) : resumeGame(current);
    gameStateRef.current = next;
    setGameState(next);
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(t.resetTitle, t.resetMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.restart,
        style: 'destructive',
        onPress: () => {
          stopInterval();
          lastHapticSecond.current = -1;
          const fresh = createGameState(config, firstPlayer);
          gameStateRef.current = fresh;
          setGameState(fresh);
        },
      },
    ]);
  }, [config, stopInterval, t]);

  const handleBack = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.quit,
        onPress: () => {
          stopInterval();
          onBack();
        },
      },
    ]);
  }, [onBack, stopInterval, t]);

  // Bouton retour Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  useSoundAlerts(gameState);

  const { black, white, activePlayer, status } = gameState;

  const statusLabel = () => {
    if (status === 'paused') return t.paused;
    if (status === 'finished') {
      return gameState.winner === 'black' ? t.blackWins : t.whiteWins;
    }
    return '';
  };

  const isPauseEnabled = status === 'running' || status === 'paused';

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Pendule du joueur Noir (retournée, en haut) */}
      <PlayerClock
        player="black"
        playerState={black}
        config={config}
        isActive={activePlayer === 'black' && status !== 'finished'}
        gameStatus={status}
        onPress={() => handlePlayerPress('black')}
        flipped
      />

      {/* Temps de Noir dans sa zone, lisible par Blanc (orientation normale) */}
      <MiniTimeStrip player="black" playerState={black} config={config} />

      {/* Barre centrale */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleBack}>
          <Text style={styles.controlBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.centerInfo}>
          <Text style={styles.statusText} numberOfLines={2}>
            {statusLabel()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.controlBtn, !isPauseEnabled && styles.controlBtnDisabled]}
          onPress={handlePauseResume}
          disabled={!isPauseEnabled}
        >
          <Text style={styles.controlBtnText}>
            {status === 'paused' ? '▶' : '⏸'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
          <Text style={styles.controlBtnText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Temps de Blanc dans sa zone, retourné pour être lisible par Noir */}
      <MiniTimeStrip player="white" playerState={white} config={config} flipped />

      {/* Pendule du joueur Blanc (normale, en bas) */}
      <PlayerClock
        player="white"
        playerState={white}
        config={config}
        isActive={status !== 'idle' && activePlayer === 'white'}
        gameStatus={status}
        onPress={() => handlePlayerPress('white')}
      />

      {/* Overlay de démarrage — couvre tout l'écran tant que idle */}
      {status === 'idle' && (
        <TouchableOpacity
          style={styles.startOverlay}
          onPress={() => handlePlayerPress(firstPlayer)}
          activeOpacity={0.85}
        >
          <Text style={styles.startOverlayText}>{t.startGame}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
  },
  controlBar: {
    height: 64,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  centerInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.3,
  },
  controlBtnText: {
    color: '#FFF',
    fontSize: 18,
  },
  startOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  startOverlayText: {
    color: '#F5A623',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
