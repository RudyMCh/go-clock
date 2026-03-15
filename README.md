# Go Clock

A mobile chess clock designed for Go, built with React Native and Expo.

![icon](assets/icon.png)

## Features

- **Four time control systems** — Byoyomi, Canadian, Fischer, and Absolute
- **Tournament presets** — Blitz, Standard, Standard EGF, Online (OGS), Canadian, Fischer Blitz, Sudden Death
- **Two-player layout** — each player has their own half of the screen; the Black player's side is rotated 180° so both players can read the clock face-to-face
- **Opponent time at a glance** — a compact time strip is displayed at the edge of each player's zone, oriented toward the opponent, so you can immediately read the adversary's remaining time in their own territory
- **Haptic feedback** — medium impact on each clock press, escalating vibrations during the last 5 seconds of a Byoyomi period, error notification on timeout
- **Sound alerts** — beeps on the last 10 seconds of a critical period, urgent beeps on the last 5
- **Move counter** — tracks each player's move count throughout the game
- **Configurable first player** — toggle between Black and White for handicap games
- **Persistent settings** — last configuration is restored when you return to setup
- **Screen stays on** — display never sleeps during a game
- **Five languages** — French, English, Korean, Japanese, Chinese

## Time control systems

| System | Description |
|--------|-------------|
| **Byoyomi** | Main time + N periods of X seconds. Playing within a period resets it. Standard in Japanese tournaments. |
| **Canadian** | Main time + Y moves to complete within X minutes. Period resets after all moves are played. |
| **Fischer** | Each move adds an increment to remaining time. |
| **Absolute** | Fixed total time, no overtime — sudden death. |

## Getting started

```bash
npm install
npm start        # Expo dev server (scan QR code)
npm run android  # Android emulator
npm run ios      # iOS simulator
```

Requires the [Expo Go](https://expo.dev/go) app on your device, or a configured Android/iOS emulator.

## How to play

1. Select a time control or pick a preset on the setup screen
2. Choose which player goes first (Black by default)
3. Tap **Start game**
4. The first player taps their half of the screen to begin — each subsequent tap ends your move and starts the opponent's clock
5. Tap the **opponent's half** to pause; tap anywhere to resume
6. Use the center bar to pause ⏸, reset ↺, or go back ←


  ---                                                                                                                                                                           
  Workflow de publication                                                                                                                                                       
                                                                                                                                                                                
  Première fois                                                                                                                                                                 
                                                            
  npm install -g eas-cli
  eas login          # crée un compte Expo si nécessaire
  eas init           # lie le projet à ton compte Expo (génère un projectId dans app.json)

  Build de test (APK direct sur téléphone, sans store)

  eas build --platform android --profile preview
  # → télécharge l'APK et installe-le directement sur ton Android

  Build de production

  eas build --platform android --profile production   # → .aab pour le Play Store
  eas build --platform ios --profile production       # → .ipa pour l'App Store
  Les builds tournent sur les serveurs Expo (~10–15 min). Pas besoin de Mac pour iOS.

  Soumission

  Avant eas submit, il faut remplir les 3 champs dans eas.json > submit.production.ios :
  - appleId : ton adresse Apple Developer
  - ascAppId : l'ID de l'app créée dans App Store Connect
  - appleTeamId : visible dans ton profil Apple Developer

  Pour Android, télécharge le fichier JSON de compte de service depuis la Google Play Console (Accès API) et place-le à la racine sous le nom google-service-account.json (déjà
  dans le .gitignore).

  eas submit --platform android --profile production
  eas submit --platform ios --profile production

  ---
  Les profiles eas.json :

  ┌─────────────┬──────────────────────────────────────────────────────────┐
  │   Profile   │                          Usage                           │
  ├─────────────┼──────────────────────────────────────────────────────────┤
  │ development │ Dev client (hot reload natif)                            │
  ├─────────────┼──────────────────────────────────────────────────────────┤
  │ preview     │ APK à installer directement pour les tests               │
  ├─────────────┼──────────────────────────────────────────────────────────┤
  │ production  │ AAB/IPA signé pour les stores, auto-incrément de version │
  └─────────────┴──────────────────────────────────────────────────────────┘