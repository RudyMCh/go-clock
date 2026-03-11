import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Player, PlayerState, TimeControlConfig, GameStatus } from '../types';
import { formatTime, isTimeCritical } from '../logic/gameLogic';
import { useTranslation } from '../i18n/LanguageContext';

interface Props {
  player: Player;
  playerState: PlayerState;
  config: TimeControlConfig;
  isActive: boolean;
  gameStatus: GameStatus;
  onPress: () => void;
  flipped?: boolean;
}

// ── Indicateur byoyomi principal ───────────────────────────────────────────────

function ByoyomiIndicator({
  total, remaining, isActive, textColor, subtleColor, inOvertime,
}: {
  total: number; remaining: number; isActive: boolean;
  textColor: string; subtleColor: string; inOvertime: boolean;
}) {
  return (
    <View style={styles.periodsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < remaining;
        return (
          <View
            key={i}
            style={[
              styles.periodDot,
              filled
                ? { backgroundColor: isActive && inOvertime ? '#F5A623' : textColor }
                : { backgroundColor: 'transparent', borderColor: subtleColor, borderWidth: 1 },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function PlayerClock({
  player, playerState,
  config, isActive, gameStatus, onPress, flipped = false,
}: Props) {
  const { t } = useTranslation();
  const isBlack = player === 'black';
  const critical = isTimeCritical(playerState, config) && isActive;
  const isFinished = gameStatus === 'finished';
  const hasWon = isFinished && !playerState.hasLost;
  const hasLost = playerState.hasLost;

  const bgColor = isBlack ? '#1A1A1E' : '#F0F0EB';
  const textColor = isBlack ? '#FFFFFF' : '#1A1A1E';
  const subtleColor = isBlack ? '#888' : '#666';

  let borderColor = 'transparent';
  if (isActive && !isFinished) borderColor = '#F5A623';
  if (hasWon) borderColor = '#4CAF50';
  if (hasLost) borderColor = '#E53935';

  const displayTime = () => {
    if (playerState.inOvertime) {
      if (config.type === 'byoyomi') return formatTime(playerState.byoyomiTimeLeft, true);
      if (config.type === 'canadian') return formatTime(playerState.canadianTimeLeft, false);
    }
    return formatTime(playerState.mainTimeLeft, playerState.mainTimeLeft < 60);
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    { backgroundColor: bgColor, borderColor, borderWidth: isActive ? 3 : 1 },
    flipped && styles.flipped,
    !isActive && !isFinished && styles.inactive,
  ];

  return (
    <Pressable
      style={containerStyle}
      onPress={onPress}
      disabled={isFinished || (!isActive && gameStatus !== 'idle')}
    >
      {/* Contenu principal — centré */}
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={[styles.stone, { color: textColor }]}>
            {isBlack ? '⬤' : '○'}
          </Text>
          <Text style={[styles.playerName, { color: textColor }]}>
            {isBlack ? t.black : t.white}
          </Text>
          {isActive && !isFinished && (
            <View style={[styles.activeDot, { backgroundColor: '#F5A623' }]} />
          )}
          {hasWon && (
            <Text style={[styles.resultLabel, { color: '#4CAF50' }]}>{t.wins}</Text>
          )}
          {hasLost && (
            <Text style={[styles.resultLabel, { color: '#E53935' }]}>{t.timeout}</Text>
          )}
        </View>

        <Text style={[styles.mainTime, { color: critical ? '#E53935' : textColor }]}>
          {displayTime()}
        </Text>

        <View style={styles.overtimeRow}>
          {config.type === 'byoyomi' && (
            <ByoyomiIndicator
              total={config.periods}
              remaining={playerState.periodsLeft}
              isActive={isActive}
              textColor={textColor}
              subtleColor={subtleColor}
              inOvertime={playerState.inOvertime}
            />
          )}
          {config.type === 'canadian' && playerState.inOvertime && (
            <Text style={[styles.canadianInfo, { color: subtleColor }]}>
              {t.movesLeft(playerState.movesLeftInPeriod)}
            </Text>
          )}
          {config.type === 'canadian' && !playerState.inOvertime && (
            <Text style={[styles.canadianInfo, { color: subtleColor }]}>
              {t.canadianInfo(config.movesPerPeriod, formatTime(config.periodTime))}
            </Text>
          )}
          {config.type === 'fischer' && (
            <Text style={[styles.canadianInfo, { color: subtleColor }]}>
              {t.perMove(config.increment)}
            </Text>
          )}
          {config.type === 'absolute' && (
            <Text style={[styles.canadianInfo, { color: subtleColor }]}>
              {t.suddenDeath}
            </Text>
          )}
        </View>

        {playerState.moveCount > 0 && (
          <Text style={[styles.moveCount, { color: subtleColor }]}>
            {t.moveCount(playerState.moveCount)}
          </Text>
        )}

        {playerState.inOvertime && config.type === 'byoyomi' && (
          <Text style={[styles.overtimeLabel, { color: '#F5A623' }]}>BYOYOMI</Text>
        )}
        {playerState.inOvertime && config.type === 'canadian' && (
          <Text style={[styles.overtimeLabel, { color: '#F5A623' }]}>
            {t.canadianOvertime}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
  inactive: {
    opacity: 0.55,
  },

  // ── Contenu principal ──────────────────────────────────────────────────────
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stone: { fontSize: 22 },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  mainTime: {
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  overtimeRow: {
    alignItems: 'center',
    minHeight: 28,
  },
  periodsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  periodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  canadianInfo: {
    fontSize: 13,
    fontWeight: '400',
  },
  overtimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  moveCount: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
});
