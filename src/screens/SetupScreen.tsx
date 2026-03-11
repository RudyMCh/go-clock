import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TimeControlConfig,
  TimeControlType,
  ByoyomiConfig,
  CanadianConfig,
  FischerConfig,
  AbsoluteConfig,
  Preset,
  Player,
} from '../types';
import { PRESETS } from '../logic/presets';
import { useTranslation } from '../i18n/LanguageContext';
import { Language, LANGUAGE_LABELS } from '../i18n/translations';

const STORAGE_KEY = '@go_clock_last_config';

interface Props {
  onStart: (config: TimeControlConfig, firstPlayer: Player) => void;
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

// ── Contrôle +/- ─────────────────────────────────────────────────────────────

interface StepperProps {
  label: string;
  value: number;
  unit: string;
  onIncrease: () => void;
  onDecrease: () => void;
  canDecrease: boolean;
}

function Stepper({ label, value, unit, onIncrease, onDecrease, canDecrease }: StepperProps) {
  return (
    <View style={s.stepperRow}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperControls}>
        <TouchableOpacity
          style={[s.stepBtn, !canDecrease && s.stepBtnDisabled]}
          onPress={onDecrease}
          disabled={!canDecrease}
        >
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.stepperValue}>
          {value} {unit}
        </Text>
        <TouchableOpacity style={s.stepBtn} onPress={onIncrease}>
          <Text style={s.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Écran principal ───────────────────────────────────────────────────────────

export default function SetupScreen({ onStart }: Props) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TimeControlType>('byoyomi');
  const [firstPlayer, setFirstPlayer] = useState<Player>('black');

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

  // Restauration du dernier réglage
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
      } catch {}
    });
  }, []);

  const saveConfig = (overrides: Record<string, unknown> = {}) => {
    const snapshot = {
      activeTab, firstPlayer,
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

  const applyPreset = (preset: Preset) => {
    const c = preset.config;
    setActiveTab(c.type);
    if (c.type === 'byoyomi') {
      setByoMainMins(Math.floor(c.mainTime / 60));
      setByoPeriods(c.periods);
      setByoPeriodSecs(c.periodTime);
    } else if (c.type === 'canadian') {
      setCanMainMins(Math.floor(c.mainTime / 60));
      setCanMoves(c.movesPerPeriod);
      setCanPeriodMins(Math.floor(c.periodTime / 60));
    } else if (c.type === 'fischer') {
      setFisMainMins(Math.floor(c.mainTime / 60));
      setFisIncSecs(c.increment);
    } else if (c.type === 'absolute') {
      setAbsMainMins(Math.floor(c.mainTime / 60));
    }
  };

  const TABS: { key: TimeControlType; label: string }[] = [
    { key: 'byoyomi', label: t.byoyomi },
    { key: 'canadian', label: t.canadian },
    { key: 'fischer', label: t.fischer },
    { key: 'absolute', label: t.absolute },
  ];

  const getModeDesc = (): string => {
    switch (activeTab) {
      case 'byoyomi':  return t.byoyomiDesc;
      case 'canadian': return t.canadianDesc;
      case 'fischer':  return t.fischerDesc;
      case 'absolute': return t.absoluteDesc;
    }
  };

  const getSummary = (): string => {
    const config = buildConfig();
    if (config.type === 'byoyomi') {
      const main = config.mainTime > 0 ? `${config.mainTime / 60} ${t.unitMin} + ` : '';
      return `${main}${config.periods} × ${config.periodTime}${t.unitSec} ${t.byoyomi}`;
    }
    if (config.type === 'canadian') {
      return `${config.mainTime / 60} ${t.unitMin} + ${config.movesPerPeriod} ${t.unitMoves} / ${config.periodTime / 60} ${t.unitMin}`;
    }
    if (config.type === 'fischer') {
      return `${config.mainTime / 60} ${t.unitMin} + ${config.increment}${t.unitSec} / ${t.unitMoves}`;
    }
    return `${config.mainTime / 60} ${t.unitMin}`;
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

        {/* Titre */}
        <View style={s.titleBlock}>
          <Text style={s.titleMain}>{t.appName}</Text>
          <Text style={s.titleSub}>{t.appSubtitle}</Text>
        </View>

        {/* Préréglages */}
        <Text style={s.sectionTitle}>{t.presets}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.presetsScroll}
          contentContainerStyle={s.presetsContent}
        >
          {PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.name}
              style={s.presetCard}
              onPress={() => applyPreset(preset)}
            >
              <Text style={s.presetName}>{preset.name}</Text>
              <Text style={s.presetDesc}>{preset.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Onglets */}
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
        <Text style={s.modeDesc}>{getModeDesc()}</Text>

        {/* Paramètres */}
        <View style={s.configBlock}>
          {activeTab === 'byoyomi' && (
            <>
              <Stepper
                label={t.mainTime}
                value={byoMainMins}
                unit={t.unitMin}
                onIncrease={() => setByoMainMins((v) => v + 5)}
                onDecrease={() => setByoMainMins((v) => Math.max(0, v - 5))}
                canDecrease={byoMainMins > 0}
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
                onIncrease={() => setByoPeriodSecs((v) => v + 5)}
                onDecrease={() => setByoPeriodSecs((v) => Math.max(5, v - 5))}
                canDecrease={byoPeriodSecs > 5}
              />
            </>
          )}

          {activeTab === 'canadian' && (
            <>
              <Stepper
                label={t.mainTime}
                value={canMainMins}
                unit={t.unitMin}
                onIncrease={() => setCanMainMins((v) => v + 5)}
                onDecrease={() => setCanMainMins((v) => Math.max(0, v - 5))}
                canDecrease={canMainMins > 0}
              />
              <Stepper
                label={t.movesPerPeriod}
                value={canMoves}
                unit={t.unitMoves}
                onIncrease={() => setCanMoves((v) => v + 5)}
                onDecrease={() => setCanMoves((v) => Math.max(5, v - 5))}
                canDecrease={canMoves > 5}
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
              />
              <Stepper
                label={t.incrementPerMove}
                value={fisIncSecs}
                unit={t.unitSec}
                onIncrease={() => setFisIncSecs((v) => v + 5)}
                onDecrease={() => setFisIncSecs((v) => Math.max(5, v - 5))}
                canDecrease={fisIncSecs > 5}
              />
            </>
          )}

          {activeTab === 'absolute' && (
            <Stepper
              label={t.totalTime}
              value={absMainMins}
              unit={t.unitMin}
              onIncrease={() => setAbsMainMins((v) => v + 5)}
              onDecrease={() => setAbsMainMins((v) => Math.max(5, v - 5))}
              canDecrease={absMainMins > 5}
            />
          )}
        </View>

        {/* Résumé */}
        <View style={s.summaryBlock}>
          <Text style={s.summaryText}>{getSummary()}</Text>
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

        {/* Bouton démarrer */}
        <TouchableOpacity style={s.startBtn} onPress={() => { saveConfig(); onStart(buildConfig(), firstPlayer); }}>
          <Text style={s.startBtnText}>{t.startGame}</Text>
        </TouchableOpacity>

        <View style={s.bottomPadding} />
      </ScrollView>
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
    flexWrap: 'wrap',
    gap: 6,
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
  langBtnText: { color: '#888', fontSize: 13 },
  langBtnTextActive: { color: '#F5A623', fontWeight: '700' },

  titleBlock: { alignItems: 'center', marginBottom: 28 },
  titleMain: { fontSize: 30, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  titleSub: { fontSize: 14, color: '#666', marginTop: 4 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  presetsScroll: { marginBottom: 28, marginHorizontal: -20 },
  presetsContent: { paddingHorizontal: 20, gap: 10 },
  presetCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 110,
  },
  presetName: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  presetDesc: { color: '#888', fontSize: 12, marginTop: 2 },

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

  summaryBlock: {
    backgroundColor: '#1C1C1E', borderRadius: 12,
    padding: 16, marginBottom: 24, alignItems: 'center',
  },
  summaryText: { color: '#F5A623', fontSize: 16, fontWeight: '600', textAlign: 'center' },

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

  startBtn: {
    backgroundColor: '#F5A623', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
  bottomPadding: { height: 32 },
});
