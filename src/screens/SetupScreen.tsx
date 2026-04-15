import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TimeControlConfig,
  TimeControlType,
  ByoyomiConfig,
  CanadianConfig,
  FischerConfig,
  AbsoluteConfig,
  Preset,
  UserPreset,
  Player,
  BlackSide,
  DisplayStyle,
  ResumeConfig,
  ResumePlayerState,
} from '../types';
import { Translations, Language, LANGUAGE_LABELS } from '../i18n/translations';
import { PRESETS } from '../logic/presets';
import { loadUserPresets, addUserPreset, removeUserPreset } from '../logic/userPresets';
import { useTranslation } from '../i18n/LanguageContext';

function formatPresetDesc(config: TimeControlConfig, t: Translations): string {
  const mins = Math.floor(config.mainTime / 60);
  switch (config.type) {
    case 'byoyomi':
      return `${mins} ${t.unitMin} + ${config.periods}×${config.periodTime} ${t.unitSec}`;
    case 'canadian':
      return `${mins} ${t.unitMin} + ${config.movesPerPeriod} / ${Math.floor(config.periodTime / 60)} ${t.unitMin}`;
    case 'fischer':
      return `${mins} ${t.unitMin} + ${config.increment} ${t.unitSec}`;
    case 'absolute':
      return `${mins} ${t.unitMin}`;
  }
}

const STORAGE_KEY = '@go_clock_last_config';

interface Props {
  onStart: (config: TimeControlConfig, firstPlayer: Player, blackSide: BlackSide, displayStyle: DisplayStyle, resume: ResumeConfig) => void;
}

// ── Sélecteur de langue ───────────────────────────────────────────────────────

const LANGUAGES: Language[] = ['fr', 'en', 'ko', 'ja', 'zh'];

function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  return (
    <View style={s.langRow}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang}
          style={[s.langBtn, language === lang && s.langBtnActive]}
          onPress={() => setLanguage(lang)}
        >
          <Text style={[s.langBtnText, language === lang && s.langBtnTextActive]}>
            {LANGUAGE_LABELS[lang]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Bouton répétitif (appui long) ─────────────────────────────────────────────

function RepeatButton({ onAction, onFastAction, disabled, children }: {
  onAction: () => void; onFastAction?: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(onAction);
  const fastActionRef = useRef(onFastAction);
  actionRef.current = onAction;
  fastActionRef.current = onFastAction;

  const stop = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (fastTimeoutRef.current) { clearTimeout(fastTimeoutRef.current); fastTimeoutRef.current = null; }
  };

  const startLong = () => {
    intervalRef.current = setInterval(() => actionRef.current(), 80);
    if (fastActionRef.current) {
      fastTimeoutRef.current = setTimeout(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        intervalRef.current = setInterval(() => fastActionRef.current?.(), 150);
      }, 2000);
    }
  };

  return (
    <TouchableOpacity
      style={[s.stepBtn, disabled && s.stepBtnDisabled]}
      onPress={disabled ? undefined : onAction}
      onLongPress={startLong}
      onPressOut={stop}
      delayLongPress={350}
      disabled={disabled}
    >
      <Text style={s.stepBtnText}>{children}</Text>
    </TouchableOpacity>
  );
}

// ── Contrôle +/- ─────────────────────────────────────────────────────────────

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  onIncrease: () => void;
  onDecrease: () => void;
  canDecrease: boolean;
  onFastIncrease?: () => void;
  onFastDecrease?: () => void;
}

function Stepper({ label, value, unit, onIncrease, onDecrease, canDecrease, onFastIncrease, onFastDecrease }: StepperProps) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <RepeatButton onAction={onDecrease} onFastAction={onFastDecrease} disabled={!canDecrease}>−</RepeatButton>
        <Text style={s.stepperValue}>{value} {unit}</Text>
        <RepeatButton onAction={onIncrease} onFastAction={onFastIncrease}>+</RepeatButton>
      </View>
    </View>
  );
}

// ── Bloc de reprise par joueur ────────────────────────────────────────────────

interface ResumeBlockProps {
  state: ResumePlayerState;
  setState: (s: ResumePlayerState) => void;
  activeTab: TimeControlType;
  defaultMainMins: number;
  maxPeriods: number;
  maxByoyomiSecs: number;
  maxMovesPerPeriod: number;
  t: import('../i18n/translations').Translations;
}

function ResumePlayerBlock({ state, setState, activeTab, defaultMainMins, maxPeriods, maxByoyomiSecs, maxMovesPerPeriod, t }: ResumeBlockProps) {
  const hasOvertime = activeTab === 'byoyomi' || activeTab === 'canadian';
  const isExhausted = state.mainTimeMins === 0 && state.mainTimeSecs === 0;
  const set = (patch: Partial<ResumePlayerState>) => setState({ ...state, ...patch });

  return (
    <View>
      {hasOvertime && (
        <View style={s.stepperRow}>
          <Text style={s.stepperLabel}>{t.mainTimePhase} / {t.overtimePhase}</Text>
          <View style={s.firstPlayerToggle}>
            <TouchableOpacity
              style={[s.firstPlayerBtn, !state.inOvertime && s.firstPlayerBtnActive]}
              onPress={() => set({ inOvertime: false })}
            >
              <Text style={[s.firstPlayerBtnText, !state.inOvertime && s.firstPlayerBtnTextActive]}>
                {t.mainTimePhase}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.firstPlayerBtn, state.inOvertime && s.firstPlayerBtnActive]}
              onPress={() => set({ inOvertime: true, mainTimeMins: 0, mainTimeSecs: 0 })}
            >
              <Text style={[s.firstPlayerBtnText, state.inOvertime && s.firstPlayerBtnTextActive]}>
                {t.overtimePhase}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!state.inOvertime && (
        <>
          <View style={s.stepperRow}>
            <Text style={s.stepperLabel}>{t.timeRemaining}</Text>
            <TouchableOpacity
              style={[s.exhaustedBtn, isExhausted && s.exhaustedBtnActive]}
              onPress={() => isExhausted
                ? set({ mainTimeMins: defaultMainMins, mainTimeSecs: 0 })
                : set({ mainTimeMins: 0, mainTimeSecs: 0 })
              }
            >
              <Text style={[s.exhaustedBtnText, isExhausted && s.exhaustedBtnTextActive]}>
                {t.mainTimeExhausted}
              </Text>
            </TouchableOpacity>
          </View>
          {!isExhausted && (
            <>
              <Stepper
                label=""
                value={state.mainTimeMins}
                unit={t.unitMin}
                onIncrease={() => set({ mainTimeMins: state.mainTimeMins + 1 })}
                onDecrease={() => set({ mainTimeMins: Math.max(0, state.mainTimeMins - 1) })}
                canDecrease={state.mainTimeMins > 0}
              />
              <Stepper
                label=""
                value={state.mainTimeSecs}
                unit={t.unitSec}
                onIncrease={() => set({ mainTimeSecs: Math.min(59, state.mainTimeSecs + 1) })}
                onDecrease={() => set({ mainTimeSecs: Math.max(0, state.mainTimeSecs - 1) })}
                canDecrease={state.mainTimeSecs > 0}
              />
            </>
          )}
        </>
      )}

      {state.inOvertime && activeTab === 'byoyomi' && (
        <>
          <Stepper
            label={t.periodsRemaining}
            value={state.periodsLeft}
            unit={t.unitPeriods}
            onIncrease={() => set({ periodsLeft: Math.min(maxPeriods, state.periodsLeft + 1) })}
            onDecrease={() => set({ periodsLeft: Math.max(1, state.periodsLeft - 1) })}
            canDecrease={state.periodsLeft > 1}
          />
          <Stepper
            label={t.byoyomiTimeLeft}
            value={state.byoyomiSecs}
            unit={t.unitSec}
            onIncrease={() => set({ byoyomiSecs: Math.min(maxByoyomiSecs, state.byoyomiSecs + 1) })}
            onDecrease={() => set({ byoyomiSecs: Math.max(1, state.byoyomiSecs - 1) })}
            canDecrease={state.byoyomiSecs > 1}
          />
        </>
      )}

      {state.inOvertime && activeTab === 'canadian' && (
        <>
          <Stepper
            label={t.periodTimeLeft}
            value={state.canadianMins}
            unit={t.unitMin}
            onIncrease={() => set({ canadianMins: state.canadianMins + 1 })}
            onDecrease={() => set({ canadianMins: Math.max(0, state.canadianMins - 1) })}
            canDecrease={state.canadianMins > 0}
          />
          <Stepper
            label=""
            value={state.canadianSecs}
            unit={t.unitSec}
            onIncrease={() => set({ canadianSecs: Math.min(59, state.canadianSecs + 1) })}
            onDecrease={() => set({ canadianSecs: Math.max(0, state.canadianSecs - 1) })}
            canDecrease={state.canadianSecs > 0}
          />
          <Stepper
            label={t.movesPlayed}
            value={state.movesPlayed}
            unit={t.unitMoves}
            onIncrease={() => set({ movesPlayed: Math.min(maxMovesPerPeriod - 1, state.movesPlayed + 1) })}
            onDecrease={() => set({ movesPlayed: Math.max(0, state.movesPlayed - 1) })}
            canDecrease={state.movesPlayed > 0}
          />
        </>
      )}
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function SetupScreen({ onStart }: Props) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TimeControlType>('byoyomi');
  const [showChevron, setShowChevron] = useState(true);
  const presetContainerWidth = useRef(0);
  const [firstPlayer, setFirstPlayer] = useState<Player>('black');
  const [blackSide, setBlackSide] = useState<BlackSide>('left');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('led');

  // Byoyomi
  const [byoMainMins, setByoMainMins] = useState(10);
  const [byoPeriods, setByoPeriods] = useState(5);
  const [byoPeriodSecs, setByoPeriodSecs] = useState(30);

  // Canadian
  const [canMainMins, setCanMainMins] = useState(30);
  const [canMoves, setCanMoves] = useState(25);
  const [canPeriodMins, setCanPeriodMins] = useState(10);

  // Fischer
  const [fisMainMins, setFisMainMins] = useState(5);
  const [fisIncSecs, setFisIncSecs] = useState(10);

  // Absolute
  const [absMainMins, setAbsMainMins] = useState(30);

  // User presets
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [addingPreset, setAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Resume mode
  const [resumeEnabled, setResumeEnabled] = useState(false);

  const buildResumeInit = (
    tab: TimeControlType = activeTab,
    mainMins = tab === 'byoyomi' ? byoMainMins : tab === 'canadian' ? canMainMins : tab === 'fischer' ? fisMainMins : absMainMins,
    periods = byoPeriods,
    periodSecs = byoPeriodSecs,
    canMins = canPeriodMins,
  ): ResumePlayerState => ({
    inOvertime: false,
    mainTimeMins: mainMins,
    mainTimeSecs: 0,
    periodsLeft: periods,
    byoyomiSecs: periodSecs,
    canadianMins: canMins,
    canadianSecs: 0,
    movesPlayed: 0,
  });

  const [resumeBlack, setResumeBlack] = useState<ResumePlayerState>(() => buildResumeInit());
  const [resumeWhite, setResumeWhite] = useState<ResumePlayerState>(() => buildResumeInit());

  const syncResume = (init: ResumePlayerState) => {
    setResumeBlack(init);
    setResumeWhite(init);
  };

  const enableResume = () => {
    syncResume(buildResumeInit());
    setResumeEnabled(true);
  };

  // Sync mode reprise quand on change d'onglet (si activé)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (resumeEnabled) syncResume(buildResumeInit(activeTab)); }, [activeTab]);

  // Restauration du dernier réglage + user presets
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.activeTab) setActiveTab(saved.activeTab);
        if (saved.firstPlayer) setFirstPlayer(saved.firstPlayer);
        if (saved.byoMainMins != null) setByoMainMins(saved.byoMainMins);
        if (saved.byoPeriods != null) setByoPeriods(saved.byoPeriods);
        if (saved.byoPeriodSecs != null) setByoPeriodSecs(saved.byoPeriodSecs);
        if (saved.canMainMins != null) setCanMainMins(saved.canMainMins);
        if (saved.canMoves != null) setCanMoves(saved.canMoves);
        if (saved.canPeriodMins != null) setCanPeriodMins(saved.canPeriodMins);
        if (saved.fisMainMins != null) setFisMainMins(saved.fisMainMins);
        if (saved.fisIncSecs != null) setFisIncSecs(saved.fisIncSecs);
        if (saved.absMainMins != null) setAbsMainMins(saved.absMainMins);
        if (saved.blackSide) setBlackSide(saved.blackSide);
        if (saved.displayStyle) setDisplayStyle(saved.displayStyle);
      } catch {}
    });
    loadUserPresets().then(setUserPresets);
  }, []);

  const saveConfig = (overrides: Record<string, unknown> = {}) => {
    const snapshot = {
      activeTab, firstPlayer, blackSide, displayStyle,
      byoMainMins, byoPeriods, byoPeriodSecs,
      canMainMins, canMoves, canPeriodMins,
      fisMainMins, fisIncSecs,
      absMainMins,
      ...overrides,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  const buildConfig = (): TimeControlConfig => {
    switch (activeTab) {
      case 'byoyomi':
        return {
          type: 'byoyomi',
          mainTime: byoMainMins * 60,
          periods: byoPeriods,
          periodTime: byoPeriodSecs,
        } as ByoyomiConfig;
      case 'canadian':
        return {
          type: 'canadian',
          mainTime: canMainMins * 60,
          movesPerPeriod: canMoves,
          periodTime: canPeriodMins * 60,
        } as CanadianConfig;
      case 'fischer':
        return {
          type: 'fischer',
          mainTime: fisMainMins * 60,
          increment: fisIncSecs,
        } as FischerConfig;
      case 'absolute':
        return {
          type: 'absolute',
          mainTime: absMainMins * 60,
        } as AbsoluteConfig;
    }
  };

  const applyConfig = (c: TimeControlConfig) => {
    setActiveTab(c.type);
    let mainMins = 0, periods = byoPeriods, periodSecs = byoPeriodSecs, canMins = canPeriodMins;
    if (c.type === 'byoyomi') {
      mainMins = Math.floor(c.mainTime / 60); periods = c.periods; periodSecs = c.periodTime;
      setByoMainMins(mainMins); setByoPeriods(periods); setByoPeriodSecs(periodSecs);
    } else if (c.type === 'canadian') {
      mainMins = Math.floor(c.mainTime / 60); canMins = Math.floor(c.periodTime / 60);
      setCanMainMins(mainMins); setCanMoves(c.movesPerPeriod); setCanPeriodMins(canMins);
    } else if (c.type === 'fischer') {
      mainMins = Math.floor(c.mainTime / 60);
      setFisMainMins(mainMins); setFisIncSecs(c.increment);
    } else if (c.type === 'absolute') {
      mainMins = Math.floor(c.mainTime / 60);
      setAbsMainMins(mainMins);
    }
    if (resumeEnabled) syncResume(buildResumeInit(c.type, mainMins, periods, periodSecs, canMins));
  };

  const applyPreset = (preset: Preset) => applyConfig(preset.config);

  const isConfigMatch = (a: TimeControlConfig, b: TimeControlConfig): boolean => {
    if (a.type !== b.type) return false;
    switch (a.type) {
      case 'byoyomi': {
        const bb = b as ByoyomiConfig;
        return a.mainTime === bb.mainTime && a.periods === bb.periods && a.periodTime === bb.periodTime;
      }
      case 'canadian': {
        const bc = b as CanadianConfig;
        return a.mainTime === bc.mainTime && a.movesPerPeriod === bc.movesPerPeriod && a.periodTime === bc.periodTime;
      }
      case 'fischer': {
        const bf = b as FischerConfig;
        return a.mainTime === bf.mainTime && a.increment === bf.increment;
      }
      case 'absolute':
        return a.mainTime === (b as AbsoluteConfig).mainTime;
    }
  };

  const confirmAddPreset = () => {
    const config = buildConfig();
    const name = newPresetName.trim() || formatPresetDesc(config, t);
    addUserPreset(userPresets, { name, config }).then(setUserPresets);
    setAddingPreset(false);
    setNewPresetName('');
  };

  const deleteUserPreset = (index: number) => {
    removeUserPreset(userPresets, index).then(setUserPresets);
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setVisibilityAsync('hidden');
    NavigationBar.setBehaviorAsync('overlay-swipe');
    return () => { NavigationBar.setVisibilityAsync('visible'); };
  }, []);

  // Réinitialise le chevron à chaque changement d'onglet
  useEffect(() => { setShowChevron(true); }, [activeTab]);

  const TABS: { key: TimeControlType; label: string }[] = [
    { key: 'byoyomi', label: t.byoyomi },
    { key: 'canadian', label: t.canadian },
    { key: 'fischer', label: t.fischer },
    { key: 'absolute', label: t.absolute },
  ];

  const MODE_DESCS: Record<TimeControlType, string> = {
    byoyomi: t.byoyomiDesc, canadian: t.canadianDesc, fischer: t.fischerDesc, absolute: t.absoluteDesc,
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sélecteur de langue */}
        <LanguageSelector />

        {/* Onglets mode */}
        <Text style={s.sectionTitle}>{t.timeControlType}</Text>
        <View style={s.tabs}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[s.tab, activeTab === tab.key && s.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={s.modeDesc}>{MODE_DESCS[activeTab]}</Text>

        {/* Préréglages */}
        <Text style={s.sectionTitle}>{t.presets}</Text>
        <View style={s.presetsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.presetsScroll}
            contentContainerStyle={s.presetsContent}
            scrollEventThrottle={16}
            onLayout={(e) => { presetContainerWidth.current = e.nativeEvent.layout.width; }}
            onContentSizeChange={(w) => {
              setShowChevron(w > presetContainerWidth.current + 10);
            }}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              setShowChevron(contentOffset.x < contentSize.width - layoutMeasurement.width - 10);
            }}
          >
            {PRESETS.filter((p) => p.config.type === activeTab).map((preset) => (
              <TouchableOpacity
                key={preset.nameKey}
                style={[s.presetCard, isConfigMatch(preset.config, buildConfig()) && s.presetCardActive]}
                onPress={() => applyPreset(preset)}
              >
                <Text style={s.presetName}>{t.presetNames[preset.nameKey]}</Text>
                <Text style={s.presetDesc}>{formatPresetDesc(preset.config, t)}</Text>
              </TouchableOpacity>
            ))}
            {userPresets
              .map((preset, globalIndex) => ({ preset, globalIndex }))
              .filter(({ preset }) => preset.config.type === activeTab)
              .map(({ preset, globalIndex }) => (
                <TouchableOpacity
                  key={`user-${globalIndex}`}
                  style={[s.presetCard, s.presetCardUser, isConfigMatch(preset.config, buildConfig()) && s.presetCardActive]}
                  onPress={() => applyConfig(preset.config)}
                >
                  <Text style={s.presetName}>{preset.name}</Text>
                  <Text style={s.presetDesc}>{formatPresetDesc(preset.config, t)}</Text>
                  <TouchableOpacity
                    style={s.userPresetDelete}
                    onPress={() => deleteUserPreset(globalIndex)}
                    hitSlop={{ top: 4, right: 4, bottom: 8, left: 8 }}
                  >
                    <Text style={s.userPresetDeleteIcon}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            }
            {addingPreset ? (
              <View style={[s.presetCard, s.presetCardAdding]}>
                <TextInput
                  style={s.presetNameInput}
                  value={newPresetName}
                  onChangeText={setNewPresetName}
                  placeholder={t.presetNamePlaceholder}
                  placeholderTextColor="#555"
                  autoFocus
                  onSubmitEditing={confirmAddPreset}
                />
                <TouchableOpacity onPress={confirmAddPreset}>
                  <Text style={s.presetAddConfirm}>✓</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.presetCard, s.presetCardAdd]}
                onPress={() => setAddingPreset(true)}
              >
                <Text style={s.presetAddIcon}>＋</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          {showChevron && (
            <View style={s.presetChevron} pointerEvents="none">
              <Text style={s.presetChevronText}>›</Text>
            </View>
          )}
        </View>

        {/* Paramètres */}
        <View style={s.configBlock}>
          {activeTab === 'byoyomi' && (
            <>
              <Stepper
                label={t.mainTime}
                value={byoMainMins}
                unit={t.unitMin}
                onIncrease={() => setByoMainMins((v) => v + 1)}
                onDecrease={() => setByoMainMins((v) => Math.max(0, v - 1))}
                canDecrease={byoMainMins > 0}
                onFastIncrease={() => setByoMainMins((v) => v + 5)}
                onFastDecrease={() => setByoMainMins((v) => Math.max(0, v - 5))}
              />
              <Stepper
                label={t.numberOfPeriods}
                value={byoPeriods}
                unit={t.unitPeriods}
                onIncrease={() => setByoPeriods((v) => v + 1)}
                onDecrease={() => setByoPeriods((v) => Math.max(1, v - 1))}
                canDecrease={byoPeriods > 1}
              />
              <Stepper
                label={t.periodDuration}
                value={byoPeriodSecs}
                unit={t.unitSec}
                onIncrease={() => setByoPeriodSecs((v) => v + 1)}
                onDecrease={() => setByoPeriodSecs((v) => Math.max(1, v - 1))}
                canDecrease={byoPeriodSecs > 1}
              />
            </>
          )}

          {activeTab === 'canadian' && (
            <>
              <Stepper
                label={t.mainTime}
                value={canMainMins}
                unit={t.unitMin}
                onIncrease={() => setCanMainMins((v) => v + 1)}
                onDecrease={() => setCanMainMins((v) => Math.max(0, v - 1))}
                canDecrease={canMainMins > 0}
                onFastIncrease={() => setCanMainMins((v) => v + 5)}
                onFastDecrease={() => setCanMainMins((v) => Math.max(0, v - 5))}
              />
              <Stepper
                label={t.movesPerPeriod}
                value={canMoves}
                unit={t.unitMoves}
                onIncrease={() => setCanMoves((v) => v + 1)}
                onDecrease={() => setCanMoves((v) => Math.max(1, v - 1))}
                canDecrease={canMoves > 1}
              />
              <Stepper
                label={t.periodDuration}
                value={canPeriodMins}
                unit={t.unitMin}
                onIncrease={() => setCanPeriodMins((v) => v + 1)}
                onDecrease={() => setCanPeriodMins((v) => Math.max(1, v - 1))}
                canDecrease={canPeriodMins > 1}
              />
            </>
          )}

          {activeTab === 'fischer' && (
            <>
              <Stepper
                label={t.initialTime}
                value={fisMainMins}
                unit={t.unitMin}
                onIncrease={() => setFisMainMins((v) => v + 1)}
                onDecrease={() => setFisMainMins((v) => Math.max(1, v - 1))}
                canDecrease={fisMainMins > 1}
                onFastIncrease={() => setFisMainMins((v) => v + 5)}
                onFastDecrease={() => setFisMainMins((v) => Math.max(1, v - 5))}
              />
              <Stepper
                label={t.incrementPerMove}
                value={fisIncSecs}
                unit={t.unitSec}
                onIncrease={() => setFisIncSecs((v) => v + 1)}
                onDecrease={() => setFisIncSecs((v) => Math.max(1, v - 1))}
                canDecrease={fisIncSecs > 1}
              />
            </>
          )}

          {activeTab === 'absolute' && (
            <Stepper
              label={t.totalTime}
              value={absMainMins}
              unit={t.unitMin}
              onIncrease={() => setAbsMainMins((v) => v + 1)}
              onDecrease={() => setAbsMainMins((v) => Math.max(1, v - 1))}
              canDecrease={absMainMins > 1}
              onFastIncrease={() => setAbsMainMins((v) => v + 5)}
              onFastDecrease={() => setAbsMainMins((v) => Math.max(1, v - 5))}
            />
          )}
        </View>

        {/* Premier joueur */}
        <View style={s.firstPlayerRow}>
          <Text style={s.firstPlayerLabel}>{t.firstPlayer}</Text>
          <View style={s.firstPlayerToggle}>
            <TouchableOpacity
              style={[s.firstPlayerBtn, firstPlayer === 'black' && s.firstPlayerBtnActive]}
              onPress={() => setFirstPlayer('black')}
            >
              <Text style={[s.firstPlayerBtnText, firstPlayer === 'black' && s.firstPlayerBtnTextActive]}>
                ⬤ {t.blackFirst}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.firstPlayerBtn, firstPlayer === 'white' && s.firstPlayerBtnActive]}
              onPress={() => setFirstPlayer('white')}
            >
              <Text style={[s.firstPlayerBtnText, firstPlayer === 'white' && s.firstPlayerBtnTextActive]}>
                ○ {t.whiteFirst}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disposition — bouton compact aligné sur la ligne "Commence" */}
        <View style={s.firstPlayerRow}>
          <Text style={s.firstPlayerLabel}>{t.orientation}</Text>
          <TouchableOpacity
            style={s.sideToggle}
            onPress={() => setBlackSide((bs) => (bs === 'left' ? 'right' : 'left'))}
            activeOpacity={0.85}
          >
            <View style={[s.sideHalf, blackSide === 'left' ? s.sideHalfBlack : s.sideHalfWhite]}>
              <Text style={blackSide === 'left' ? s.sideHalfLabelLight : s.sideHalfLabelDark}>
                {blackSide === 'left' ? '⬤' : '○'}
              </Text>
            </View>
            <View style={[s.sideHalf, blackSide === 'left' ? s.sideHalfWhite : s.sideHalfBlack]}>
              <Text style={blackSide === 'left' ? s.sideHalfLabelDark : s.sideHalfLabelLight}>
                {blackSide === 'left' ? '○' : '⬤'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Style d'affichage */}
        <Text style={s.sectionTitle}>{t.displayStyleLabel}</Text>
        <View style={s.displayStyleRow}>
          <TouchableOpacity
            style={[s.displayCard, displayStyle === 'led' && s.displayCardActive]}
            onPress={() => setDisplayStyle('led')}
            activeOpacity={0.8}
          >
            <Text style={s.displayCardLabel}>{t.displayLed}</Text>
            <View style={s.displayCardLedPreview}>
              <Text style={s.displayCardLedTime}>10:00</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.displayCard, displayStyle === 'app' && s.displayCardActive]}
            onPress={() => setDisplayStyle('app')}
            activeOpacity={0.8}
          >
            <Text style={s.displayCardLabel}>{t.displayApp}</Text>
            <View style={s.displayCardAppPreview}>
              <Text style={s.displayCardAppTime}>10:00</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mode reprise */}
        <Text style={s.sectionTitle}>{t.resumeMode}</Text>
        <View style={s.resumeToggleRow}>
          <TouchableOpacity
            style={[s.resumeToggleBtn, !resumeEnabled && s.resumeToggleBtnActive]}
            onPress={() => setResumeEnabled(false)}
          >
            <Text style={[s.resumeToggleBtnText, !resumeEnabled && s.resumeToggleBtnTextActive]}>
              {t.resumeInactive}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.resumeToggleBtn, resumeEnabled && s.resumeToggleBtnActive]}
            onPress={enableResume}
          >
            <Text style={[s.resumeToggleBtnText, resumeEnabled && s.resumeToggleBtnTextActive]}>
              {t.resumeActive}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ opacity: resumeEnabled ? 1 : 0.35 }} pointerEvents={resumeEnabled ? 'auto' : 'none'}>
          <View style={s.resumePlayerSection}>
            <Text style={s.resumePlayerHeader}>⬤ {t.black}</Text>
            <View style={s.configBlock}>
              <ResumePlayerBlock
                state={resumeBlack}
                setState={setResumeBlack}
                activeTab={activeTab}
                defaultMainMins={activeTab === 'byoyomi' ? byoMainMins : activeTab === 'canadian' ? canMainMins : activeTab === 'fischer' ? fisMainMins : absMainMins}
                maxPeriods={byoPeriods}
                maxByoyomiSecs={byoPeriodSecs}
                maxMovesPerPeriod={canMoves}
                t={t}
              />
            </View>
          </View>

          <View style={s.resumePlayerSection}>
            <Text style={s.resumePlayerHeader}>○ {t.white}</Text>
            <View style={s.configBlock}>
              <ResumePlayerBlock
                state={resumeWhite}
                setState={setResumeWhite}
                activeTab={activeTab}
                defaultMainMins={activeTab === 'byoyomi' ? byoMainMins : activeTab === 'canadian' ? canMainMins : activeTab === 'fischer' ? fisMainMins : absMainMins}
                maxPeriods={byoPeriods}
                maxByoyomiSecs={byoPeriodSecs}
                maxMovesPerPeriod={canMoves}
                t={t}
              />
            </View>
          </View>
        </View>

        <View style={s.bottomPadding} />
      </ScrollView>

      {/* Bouton sticky */}
      <View style={s.stickyFooter}>
        <TouchableOpacity style={s.startBtn} onPress={() => { saveConfig(); onStart(buildConfig(), firstPlayer, blackSide, displayStyle, { enabled: resumeEnabled, black: resumeBlack, white: resumeWhite }); }}>
          <Text style={s.startBtnText}>{t.startGame}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langBtnActive: {
    borderColor: '#F5A623',
    backgroundColor: '#2A2000',
  },
  langBtnText: { color: '#888', fontSize: 22 },
  langBtnTextActive: { color: '#F5A623' },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  presetsWrapper: { marginHorizontal: -20, marginBottom: 24 },
  presetsScroll: {},
  presetsContent: { paddingHorizontal: 20, gap: 10 },
  presetChevron: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 13, 15, 0.85)',
  },
  presetChevronText: { color: '#F5A623', fontSize: 28, fontWeight: '200' },
  presetCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 110,
  },
  presetName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  presetDesc: { color: '#888', fontSize: 12, marginTop: 2 },

  presetCardActive: {
    borderWidth: 1.5,
    borderColor: '#F5A623',
  },
  presetCardUser: {},
  userPresetDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  userPresetDeleteIcon: {
    color: '#F5A623',
    fontSize: 10,
    fontWeight: '700' as const,
    opacity: 0.7,
  },
  presetCardAdding: {
    borderWidth: 1,
    borderColor: '#F5A623',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    minWidth: 160,
  },
  presetNameInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    padding: 0,
  },
  presetAddConfirm: {
    color: '#F5A623',
    fontSize: 20,
    fontWeight: '600',
  },
  presetCardAdd: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetAddIcon: {
    color: '#F5A623',
    fontSize: 24,
    fontWeight: '300',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#F5A623' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#000', fontWeight: '700' },

  modeDesc: { color: '#555', fontSize: 13, lineHeight: 18, marginBottom: 20 },

  configBlock: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  stepperLabel: { color: '#FFF', fontSize: 15, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center', alignItems: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText: { color: '#FFF', fontSize: 20, fontWeight: '300', lineHeight: 24 },
  stepperValue: {
    color: '#F5A623', fontSize: 16, fontWeight: '600',
    minWidth: 70, textAlign: 'center',
  },

  firstPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  firstPlayerLabel: { color: '#888', fontSize: 14 },
  firstPlayerToggle: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  firstPlayerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  firstPlayerBtnActive: { backgroundColor: '#F5A623' },
  firstPlayerBtnText: { color: '#888', fontSize: 14, fontWeight: '500' },
  firstPlayerBtnTextActive: { color: '#000', fontWeight: '700' },

  stickyFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 12,
    backgroundColor: '#0D0D0F',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2C2C2E',
  },
  startBtn: {
    backgroundColor: '#F5A623', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
  // ── Disposition ─────────────────────────────────────────────────────────────
  sideToggle: {
    borderRadius: 10,
    overflow: 'hidden',
    width: 52,
    height: 64,
    borderWidth: 1.5,
    borderColor: '#3C3C3E',
  },
  sideHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideHalfBlack: { backgroundColor: '#1A1A1A' },
  sideHalfWhite: { backgroundColor: '#E8E8E0' },
  sideHalfLabelLight: { fontSize: 16, color: '#CCC' },
  sideHalfLabelDark: { fontSize: 16, color: '#444' },

  // ── Style d'affichage ────────────────────────────────────────────────────────
  displayStyleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  displayCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  displayCardActive: {
    borderColor: '#F5A623',
    backgroundColor: '#1E1800',
  },
  displayCardLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  displayCardLedPreview: {
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#CCD0B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayCardLedTime: {
    fontFamily: 'DSEG7Classic-Bold',
    fontSize: 22,
    color: '#1A1A0A',
  },
  displayCardAppPreview: {
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F0F0EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayCardAppTime: {
    fontFamily: 'DSEG7Classic-Bold',
    fontSize: 22,
    color: '#1A1A0A',
  },

  bottomPadding: { height: 16 },

  // ── Mode reprise ─────────────────────────────────────────────────────────────
  resumeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    gap: 3,
  },
  resumeToggleBtn: {
    flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10,
  },
  resumeToggleBtnActive: { backgroundColor: '#F5A623' },
  resumeToggleBtnText: { color: '#888', fontSize: 13, fontWeight: '500' },
  resumeToggleBtnTextActive: { color: '#000', fontWeight: '700' },
  resumePlayerSection: { marginBottom: 12 },
  resumePlayerHeader: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  exhaustedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3C3C3E',
    backgroundColor: 'transparent',
  },
  exhaustedBtnActive: {
    borderColor: '#F5A623',
    backgroundColor: '#2A1E00',
  },
  exhaustedBtnText: { color: '#666', fontSize: 13, fontWeight: '600' },
  exhaustedBtnTextActive: { color: '#F5A623' },
});
