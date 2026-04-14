# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Lance le serveur Expo (scan QR pour mobile)
npm run android    # Lance sur émulateur Android
npm run ios        # Lance sur simulateur iOS
npm run web        # Lance dans le navigateur
```

No test runner or linter is configured.

## Architecture

**Navigation** : state machine simple dans `App.tsx` — deux écrans (`setup` | `game`), pas de react-navigation.

**Logique de jeu** (`src/logic/gameLogic.ts`) : fonctions pures sur `GameState`. Le moteur tourne via `setInterval` dans `GameScreen` qui appelle `tick(state, dt)` toutes les 100ms. Les transitions d'état se font via `pressClock`, `pauseGame`, `resumeGame`.

**Systèmes de temps** : byoyomi, canadien, Fischer, absolu — tous modélisés dans `src/types.ts` avec des unions discriminées. Le `PlayerState` contient les champs pour tous les systèmes simultanément.

**Règles importantes** :
- Noir joue toujours en premier ; le premier appui passe l'état `idle → running`
- En byoyomi : appuyer en surtemps réinitialise la période courante (pas de perte de période)
- En canadien : le compteur de coups décrémente sur chaque appui en surtemps ; nouvelle période à 0
- En Fischer : l'incrément est ajouté au moment de l'appui (pas au début du tour)
- L'écran du joueur noir est affiché retourné à 180° (`transform: rotate(180deg)`)

**SetupScreen** (`src/screens/SetupScreen.tsx`) : écran de configuration. Composants internes clés :
- `RepeatButton` : bouton avec appui long répétitif (interval 80ms, délai 350ms)
- `Stepper` : contrôle +/- utilisant `RepeatButton`
- `ResumePlayerBlock` : bloc de reprise de partie par joueur
- Les presets sont définis dans `src/logic/presets.ts` et filtrés par type d'onglet actif

**i18n** : contexte React dans `src/i18n/LanguageContext.tsx` avec `useTranslation()`. Langue persistée via AsyncStorage. Défaut : français.

**Thème** : fond `#0D0D0F` / surfaces `#1C1C1E`, accent orange/or `#F5A623`, police horloge 64pt poids 200.

## Documentation

Les analyses de problèmes UX et décisions de conception sont dans [`doc/analyse.md`](doc/analyse.md).
Consulter ce fichier en début de session pour connaître les améliorations en cours ou planifiées.
