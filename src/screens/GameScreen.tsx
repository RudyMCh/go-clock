import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GameState, TimeControlConfig, Player, PlayerState, BlackSide, DisplayStyle, ResumeConfig } from '../types';
import { useSoundAlerts } from '../hooks/useSoundAlerts';
import { useTranslation } from '../i18n/LanguageContext';
import {
  createGameState, tick, pressClock, pauseGame, resumeGame, splitTime, isTimeCritical,
} from '../logic/gameLogic';

// ── Affichage 7 segments ───────────────────────────────────────────────────────

function SevenSegmentDisplay({
  main, sub, colonVisible, isActive, isCritical, displayStyle, isBlackZone,
}: {
  main: string; sub: string; colonVisible: boolean; isActive: boolean;
  isCritical: boolean; displayStyle: DisplayStyle; isBlackZone: boolean;
}) {
  // Le ':' ne clignote que pour le joueur actif
  const displayMain = main.replace(':', (isActive && !colonVisible) ? ' ' : ':');

  const color = displayStyle === 'led'
    ? (isCritical ? '#CC0000' : isActive ? '#0A0A0A' : 'rgba(10,10,10,0.25)')
    : (isCritical ? '#E53935' : isBlackZone ? '#FFFFFF' : '#1A1A1E');
  const opacity = displayStyle === 'led' ? 1 : (isActive ? 1 : 0.45);

  return (
    <View style={seg.row}>
      <Text style={[seg.time, { color, opacity }]}>{displayMain}</Text>
      {sub ? <Text style={[seg.sub, { color, opacity }]}>{sub}</Text> : null}
    </View>
  );
}

// ── Infos surtemps ────────────────────────────────────────────────────────────

function OvertimeInfo({
  playerState, config, isActive, isBlackZone, displayStyle,
}: {
  playerState: PlayerState; config: TimeControlConfig;
  isActive: boolean; isBlackZone: boolean; displayStyle: DisplayStyle;
}) {
  const { t } = useTranslation();
  const isLed = displayStyle === 'led';
  const subtleColor = isLed
    ? (isActive ? 'rgba(10,10,10,0.50)' : 'rgba(10,10,10,0.22)')
    : (isBlackZone ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)');
  const accentColor = isLed ? '#3A4030' : (isBlackZone ? '#F5A623' : '#E07000');

  if (config.type === 'byoyomi') {
    return (
      <View style={ot.col}>
        <View style={ot.periodsRow}>
          {Array.from({ length: config.periods }).map((_, i) => {
            const filled = i < playerState.periodsLeft;
            return (
              <View key={i} style={[
                ot.dot,
                filled
                  ? { backgroundColor: isActive && playerState.inOvertime ? accentColor : subtleColor }
                  : { backgroundColor: 'transparent', borderColor: subtleColor, borderWidth: 1 },
              ]} />
            );
          })}
        </View>
        {playerState.inOvertime && (
          <Text style={[ot.label, { color: accentColor }]}>BYOYOMI</Text>
        )}
      </View>
    );
  }
  if (config.type === 'canadian' && playerState.inOvertime) {
    return <Text style={[ot.label, { color: subtleColor }]}>{t.movesLeft(playerState.movesLeftInPeriod)}</Text>;
  }
  if (config.type === 'fischer') {
    return <Text style={[ot.label, { color: subtleColor }]}>{t.perMove(config.increment)}</Text>;
  }
  if (config.type === 'absolute') {
    return <Text style={[ot.label, { color: subtleColor }]}>{t.suddenDeath}</Text>;
  }
  return null;
}

const ot = StyleSheet.create({
  col: { alignItems: 'center', gap: 4 },
  periodsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
});

// ── Zone d'un joueur ──────────────────────────────────────────────────────────

function PlayerZone({
  player, playerState, config, isActive, gameStatus,
  colonVisible, displayStyle, side, onPress,
}: {
  player: Player; playerState: PlayerState; config: TimeControlConfig;
  isActive: boolean; gameStatus: GameState['status'];
  colonVisible: boolean; displayStyle: DisplayStyle;
  side: 'left' | 'right'; onPress: () => void;
}) {
  const isBlack = player === 'black';
  const isLed = displayStyle === 'led';
  const isFinished = gameStatus === 'finished';
  const hasWon = isFinished && !playerState.hasLost;
  const hasLost = playerState.hasLost;
  const isCritical = isTimeCritical(playerState, config) && isActive;

  const bgColor = isLed ? '#CCD0B8' : (isBlack ? '#1A1A1E' : '#F0F0EB');

  let borderColor = 'transparent';
  if (isActive && !isFinished) borderColor = isLed ? '#7A8060' : '#F5A623';
  if (hasWon) borderColor = '#4CAF50';
  if (hasLost) borderColor = '#E53935';

  const subtleText = isLed
    ? 'rgba(10,10,10,0.38)'
    : (isBlack ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.28)');

  const displayTime = () => {
    if (playerState.inOvertime) {
      if (config.type === 'byoyomi') return splitTime(playerState.byoyomiTimeLeft, true);
      if (config.type === 'canadian') return splitTime(playerState.canadianTimeLeft, false);
    }
    return splitTime(playerState.mainTimeLeft, false);
  };

  return (
    <TouchableOpacity
      style={[pz.container, { backgroundColor: bgColor, borderColor, borderWidth: isActive ? 3 : 1 }]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isFinished || (!isActive && gameStatus !== 'idle')}
    >
      {/* Compteur de coups — coin supérieur extérieur */}
      {playerState.moveCount > 0 && (
        <Text style={[pz.moveCount, { color: subtleText }, side === 'left' ? pz.moveCountLeft : pz.moveCountRight]}>
          {playerState.moveCount}
        </Text>
      )}

      {/* Point actif — centré en haut */}
      {isActive && !isFinished && (
        <View style={pz.activeDotContainer}>
          <View style={[pz.activeDot, { backgroundColor: isLed ? '#5A6040' : '#F5A623' }]} />
        </View>
      )}

      {/* Résultat — centré en haut à côté du point actif */}
      {hasWon && (
        <View style={pz.activeDotContainer}>
          <Text style={{ color: '#4CAF50', fontSize: 18, fontWeight: '700' }}>✓</Text>
        </View>
      )}
      {hasLost && (
        <View style={pz.activeDotContainer}>
          <Text style={{ color: '#E53935', fontSize: 18, fontWeight: '700' }}>✗</Text>
        </View>
      )}

      {/* Zone centrale : temps + infos surtemps */}
      <View style={pz.inner}>
        {(() => { const { main, sub } = displayTime(); return (
          <SevenSegmentDisplay
            main={main} sub={sub}
            colonVisible={colonVisible}
            isActive={isActive}
            isCritical={isCritical}
            displayStyle={displayStyle}
            isBlackZone={isBlack}
          />
        ); })()}
        <OvertimeInfo
          playerState={playerState}
          config={config}
          isActive={isActive}
          isBlackZone={isBlack}
          displayStyle={displayStyle}
        />
      </View>

      {/* Pastille couleur — centrée en bas */}
      <View style={pz.badgeContainer}>
        <View style={[
          pz.badge,
          { backgroundColor: isBlack ? '#1A1A1A' : '#FFFFFF', borderColor: isBlack ? '#555' : '#AAA' },
        ]} />
      </View>
    </TouchableOpacity>
  );
}

const seg = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  time: {
    fontFamily: 'DSEG7Classic-Bold',
    fontSize: 76,
    letterSpacing: 3,
  },
  sub: {
    fontFamily: 'DSEG7Classic-Bold',
    fontSize: 42,
    letterSpacing: 2,
    marginBottom: 4,
    marginLeft: 6,
  },
});

const pz = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  moveCount: {
    position: 'absolute',
    top: 12,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  moveCountLeft: { left: 12 },
  moveCountRight: { right: 12 },
  activeDotContainer: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
});

// ── Écran principal ───────────────────────────────────────────────────────────

interface Props {
  config: TimeControlConfig;
  firstPlayer: Player;
  blackSide: BlackSide;
  displayStyle: DisplayStyle;
  resume?: ResumeConfig;
  onBack: () => void;
}

export default function GameScreen({ config, firstPlayer, blackSide, displayStyle, resume, onBack }: Props) {
  useKeepAwake();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    return () => { NavigationBar.setVisibilityAsync('visible'); };
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => createGameState(config, firstPlayer, resume));
  const { t } = useTranslation();
  const gameStateRef = useRef<GameState>(gameState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  const lastHapticSecond = useRef<number>(-1);
  const hapticPlayer = useRef<Player>(firstPlayer);

  const [colonVisible, setColonVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => {
      if (gameStateRef.current?.status === 'running') setColonVisible(v => !v);
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    lastTickRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      const current = gameStateRef.current;
      if (current.status !== 'running') { stopInterval(); return; }
      const next = tick(current, dt);
      gameStateRef.current = next;
      setGameState(next);
      if (next.status === 'finished') {
        stopInterval();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
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
            Haptics.impactAsync(secs <= 3 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      }
    }, 100);
  }, [stopInterval]);

  useEffect(() => {
    if (gameState.status === 'running') startInterval(); else stopInterval();
    return () => stopInterval();
  }, [gameState.status]);

  useEffect(() => { return () => stopInterval(); }, []);

  const setGame = useCallback((next: GameState) => {
    gameStateRef.current = next;
    setGameState(next);
  }, []);

  const handlePlayerPress = useCallback((player: Player) => {
    const current = gameStateRef.current;
    if (current.status === 'finished') return;
    if (current.status === 'paused') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGame(resumeGame(current)); return;
    }
    if (current.status === 'running' && current.activePlayer !== player) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setGame(pauseGame(current)); return;
    }
    if (current.status === 'idle' && player !== current.firstPlayer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = pressClock(current);
    setGame(next);
    if (next.status === 'running') startInterval();
  }, [setGame, startInterval]);

  const handlePauseResume = useCallback(() => {
    const current = gameStateRef.current;
    if (current.status === 'finished' || current.status === 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGame(current.status === 'running' ? pauseGame(current) : resumeGame(current));
  }, [setGame]);

  const handleBack = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancel, style: 'cancel' },
      { text: t.quit, onPress: () => { stopInterval(); onBack(); } },
    ]);
  }, [onBack, stopInterval, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { handleBack(); return true; });
    return () => sub.remove();
  }, [handleBack]);

  useSoundAlerts(gameState);

  const { black, white, activePlayer, status } = gameState;

  const leftPlayer: Player = blackSide === 'left' ? 'black' : 'white';
  const rightPlayer: Player = blackSide === 'left' ? 'white' : 'black';
  const leftState = blackSide === 'left' ? black : white;
  const rightState = blackSide === 'left' ? white : black;

  const isPauseEnabled = status === 'running' || status === 'paused';
  const ctrlBg = displayStyle === 'led' ? '#9A9E8A' : '#1C1C1E';

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      <PlayerZone
        player={leftPlayer} playerState={leftState} config={config}
        isActive={activePlayer === leftPlayer && status !== 'finished'}
        gameStatus={status} colonVisible={colonVisible}
        displayStyle={displayStyle} side="left"
        onPress={() => handlePlayerPress(leftPlayer)}
      />

      <View style={[styles.controlBar, { backgroundColor: ctrlBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pauseBtn, !isPauseEnabled && styles.controlBtnDisabled]}
          onPress={handlePauseResume} disabled={!isPauseEnabled}
        >
          <Text style={styles.pauseBtnText}>{status === 'paused' ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      <PlayerZone
        player={rightPlayer} playerState={rightState} config={config}
        isActive={activePlayer === rightPlayer && status !== 'finished'}
        gameStatus={status} colonVisible={colonVisible}
        displayStyle={displayStyle} side="right"
        onPress={() => handlePlayerPress(rightPlayer)}
      />

      {status === 'idle' && (
        <TouchableOpacity style={styles.startOverlay} onPress={() => handlePlayerPress(firstPlayer)} activeOpacity={0.85}>
          <Text style={styles.startOverlayText}>{t.startGame}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  controlBar: {
    width: 72,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: '#444',
  },
  backBtn: {
    width: 72, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 20 },
  pauseBtn: {
    flex: 1, width: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  pauseBtnText: { color: '#FFF', fontSize: 38 },
  controlBtnDisabled: { opacity: 0.25 },
  startOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  startOverlayText: { color: '#F5A623', fontSize: 32, fontWeight: '700', letterSpacing: 1 },
});
