import React, { useState } from 'react';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { TimeControlConfig, Player, BlackSide, DisplayStyle, ResumeConfig } from './src/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/i18n/LanguageContext';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';

type Screen = 'setup' | 'game';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<TimeControlConfig | null>(null);
  const [firstPlayer, setFirstPlayer] = useState<Player>('black');
  const [blackSide, setBlackSide] = useState<BlackSide>('left');
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('led');
  const [resume, setResume] = useState<ResumeConfig | undefined>(undefined);

  if (screen === 'game' && config) {
    return (
      <GameScreen
        config={config}
        firstPlayer={firstPlayer}
        blackSide={blackSide}
        displayStyle={displayStyle}
        resume={resume}
        onBack={() => setScreen('setup')}
      />
    );
  }

  return (
    <SetupScreen
      onStart={(cfg, fp, bs, ds, res) => {
        setConfig(cfg);
        setFirstPlayer(fp);
        setBlackSide(bs);
        setDisplayStyle(ds);
        setResume(res.enabled ? res : undefined);
        setScreen('game');
      }}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'DSEG7Classic-Bold': require('./assets/fonts/DSEG7Classic-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#F5A623" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
