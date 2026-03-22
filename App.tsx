import React, { useState } from 'react';
import { TimeControlConfig, Player } from './src/types';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './src/i18n/LanguageContext';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';

type Screen = 'setup' | 'game';

function AppContent() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<TimeControlConfig | null>(null);
  const [firstPlayer, setFirstPlayer] = useState<Player>('black');

  if (screen === 'game' && config) {
    return <GameScreen config={config} firstPlayer={firstPlayer} onBack={() => setScreen('setup')} />;
  }

  return (
    <SetupScreen
      onStart={(cfg, fp) => {
        setConfig(cfg);
        setFirstPlayer(fp);
        setScreen('game');
      }}
    />
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
