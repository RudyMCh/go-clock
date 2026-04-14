# Analyses & améliorations UX

Ce fichier documente les analyses de problèmes UX et les décisions de conception prises au fil du projet.

---

## [2026-04-13] Vitesse de réglage du temps — SetupScreen

### Problème

L'incrément unitaire des steppers (+/- 1 unité) rend le réglage de grandes valeurs très lent.
Exemple : passer de 0 à 3 heures demande ~13 secondes même avec l'appui long.

### Options évaluées

| Option | Pour | Contre |
|---|---|---|
| Curseur (slider) | Rapide pour grandes valeurs | Imprécis sur mobile pour la plage 0–180 min |
| Long-press pour accélérer (exposé à l'UI) | Simple | Pas discoverable |
| Presets prédéfinis | Un clic, zéro friction | Couverture partielle (valeurs custom hors preset) |
| **Accélération automatique silencieuse** | Transparent, discoverable, précis | Aucun |

### Solution retenue

Combiner **presets existants** (déjà en place) + **accélération automatique** sur appui long du `RepeatButton` :

- 0–2s maintenu : incrément de 1 à 80ms (comportement actuel)
- Après 2s : bascule sur un `onFastAction` (incrément de 5) à 150ms

L'accélération se déclenche silencieusement — aucune modification visuelle, aucune découverte requise.

### Périmètre d'implémentation

1. **`RepeatButton`** ([src/screens/SetupScreen.tsx:76](../src/screens/SetupScreen.tsx)) — ajouter prop `onFastAction?` + `setTimeout` interne de bascule à 2000ms
2. **`StepperProps` / `Stepper`** ([src/screens/SetupScreen.tsx:103](../src/screens/SetupScreen.tsx)) — ajouter `onFastIncrease?` et `onFastDecrease?`
3. **Steppers de temps principal uniquement** (byoyomi `byoMainMins`, canadien `canMainMins`, fischer `fisMainMins`, absolu `absMainMins`) — passer `onFastIncrease={() => setX(x + 5)}` et `onFastDecrease={() => setX(Math.max(0, x - 5))}`. Les secondes et périodes n'en ont pas besoin (plages courtes).

### TODO

- [ ] Modifier `RepeatButton` pour ajouter `onFastAction?` et la bascule automatique à 2s
- [ ] Mettre à jour `StepperProps` et `Stepper` pour passer `onFastIncrease?` / `onFastDecrease?`
- [ ] Brancher les fast actions sur les 4 steppers de temps principal (byoyomi, canadien, fischer, absolu)
- [ ] Tester sur device : vérifier que la bascule est fluide et que le cleanup fonctionne sur `onPressOut`

---

## [2026-04-14] Durées des presets — alignement sur la réalité des parties

### Problème général

Les presets actuels sont trop resserrés sur les petites valeurs et plafonnent à 60 min, alors que les tournois officiels français (FFG) et européens (EGF) commencent à 60–90 min. Aucun mode n'est correctement couvert.

### Références officielles utilisées

- **FFG** : [Règlement des compétitions 2022](https://ffg.jeudego.org/informations/officiel/reglements/ReglementCompetition_2022.pdf)
- **EGF** : [EGF General Tournament Rules](https://www.eurogofed.org/egf/tourrules.htm) + [EGF Championship Rules](https://home.snafu.de/~jasiek/EuropeanChampionshipRules.html)
- **EGF Congress 2022** : [64th EGF Congress – Open](https://egc2022.ro/open-tournament/)
- **Pandanet European Team Championship** : [Rule Set](https://pandanet-igs.com/communities/euroteamchamps/4)

---

### Mode Byoyomi — cadences réelles et presets proposés

Le byoyomi japonais est dominant en Asie et dans les tournois EGF utilisant des pendules DGT1005 ("byoyomi clocks").

| Contexte | Cadence réelle | Source |
|---|---|---|
| Blitz / partie rapide | 10 min + 5×30s | Convention go en ligne (OGS, KGS) |
| Club / partie amicale | 30–45 min + 5×30s | Clubs amateurs |
| EGF Congress (Open/Weekend) | **60 min + 3×30s** | EGF 64th Congress 2022 |
| EGF Championship (≤ 3 dan) | **90–120 min + 3×45s** | EGF Championship Rules |
| EGF Championship (≥ 4 dan) | **150 min + 5×60s** | EGF Championship Rules |

| Clé | Temps principal | Byoyomi | Justification |
|---|---|---|---|
| `blitz` | **10 min** | 5×30s | Rapide — plancher de 10 min, en dessous ça n'a pas de sens |
| `club` | 30 min | 5×30s | Partie amicale de club — inchangé |
| `standard` | 60 min | 3×30s | EGF Congress ouvert — renommer l'ancien `long` |
| `tournament` | 90 min | 3×45s | EGF Championship niveau kyu/dan moyen |
| `championship` | 150 min | 5×60s | EGF Championship ≥ 4 dan (2h30) |

**Suppressions :** `online` (inutile si `blitz` = 10 min), `egf` (45 min ne correspond à aucune cadence EGF réelle).

---

### Mode Canadien — cadences réelles et presets proposés

Le canadien est le mode dominant en France (FFG) et dans de nombreux clubs européens qui utilisent des pendules d'échecs classiques. La FFG l'impose comme cadence minimale pour les tournois agréés.

| Contexte | Cadence réelle | Source |
|---|---|---|
| Minimum tournoi agréé FFG | **45 min + 15 coups / 5 min** | FFG Règlement 2022 |
| Coupe Maître Lim / Champ. féminin | **60 min + 15 coups / 5 min** | FFG Règlement 2022 |
| Pandanet European Team Champ. | **60 min + 25 coups / 10 min** | Pandanet Rules |
| Championnat de France Amateur | **75 min + 15 coups / 5 min** | FFG Règlement 2022 |
| Championnat de France Open | **90 min + 15 coups / 5 min** | FFG Règlement 2022 |

Presets actuels : `rapid` (20 min), `standard` (30 min), `long` (45 min) — tous **en dessous** du minimum FFG, déconnectés de la réalité des tournois.

| Clé | Temps principal | Canadien | Justification |
|---|---|---|---|
| `blitz` | **10 min** | 20 coups / 5 min | Partie rapide de club |
| `club` | 45 min | 15 coups / 5 min | Minimum tournoi agréé FFG |
| `standard` | 60 min | 15 coups / 5 min | Coupe Maître Lim, Champ. féminin FFG |
| `tournament` | 75 min | 15 coups / 5 min | Championnat de France Amateur FFG |
| `championship` | 90 min | 15 coups / 5 min | Championnat de France Open FFG |

**Suppressions :** `rapid` (20 min) et `long` (45 min) → remplacés par une échelle cohérente avec la FFG.

---

### Mode Fischer — cadences réelles et presets proposés

Le Fischer gagne rapidement du terrain en Europe, y compris en France où la FFG l'accepte comme alternative à la cadence canadienne.

| Contexte | Cadence réelle | Source |
|---|---|---|
| Blitz go en ligne | ~10 min + 10–15s | OGS, conventions en ligne |
| Clubs / tournois courts | 20–30 min + 15s | Tournois club européens |
| FFG alternative (Coupe Maître Lim / Champ. féminin) | **40 min + 20s** | FFG Règlement 2022 |
| FFG alternative (Champ. France Amateur) | **50 min + 20s** | FFG Règlement 2022 |
| FFG alternative (Champ. France Open) | **60 min + 20s** | FFG Règlement 2022 |

La FFG utilise systématiquement **20s / coup**, pas 30s. Les presets actuels (`standard` 30 min + 15s, `long` 60 min + 30s) ne reflètent pas la réalité.

| Clé | Temps principal | Incrément | Justification |
|---|---|---|---|
| `blitz` | **10 min** | 10s | Partie rapide — cohérent avec les autres modes |
| `club` | 25 min | 15s | Tournoi club court |
| `standard` | 40 min | 20s | FFG alternative cadence clubs / Champ. féminin |
| `tournament` | 50 min | 20s | FFG alternative Championnat Amateur |
| `championship` | 60 min | 20s | FFG alternative Championnat Open |

**Suppressions :** `rapid` (15 min + 10s) absorbé par `blitz` ; `long` (60 min + 30s) remplacé par `championship` avec 20s.

---

### Mode Absolu — cadences réelles et presets proposés

Le mode absolu (sans surtemps) est rarement utilisé en compétition officielle de go. Il sert principalement aux parties amicales, à l'enseignement, et à quelques contextes en ligne.

| Contexte | Cadence type |
|---|---|
| Partie rapide amicale | 10–15 min |
| Partie standard amicale | 30 min |
| Partie longue amicale | 60 min |

Les presets actuels (`blitz` 10 min, `rapid` 20 min, `standard` 30 min, `long` 60 min) sont cohérents avec cet usage informel. La seule correction : `blitz` à 5 min est trop court — 10 min est un minimum raisonnable.

| Clé | Temps principal | Justification |
|---|---|---|
| `blitz` | **10 min** | Cohérent avec les autres modes |
| `rapid` | 20 min | Inchangé |
| `standard` | 30 min | Inchangé |
| `long` | 60 min | Inchangé |

---

### Impact sur l'accélération des steppers

Atteindre 150 min depuis 0 avec l'incrément actuel (+1 min à 80ms) prend ~20 secondes. Avec l'accélération (+5 min après 2s), c'est ~6 secondes. Les presets restent le chemin principal ; l'accélération couvre les valeurs custom. La révision des presets renforce l'urgence d'implémenter l'accélération (cf. section dédiée).

---

### TODO

**Byoyomi**
- [ ] Changer `blitz` : 5 min → 10 min
- [ ] Supprimer `online`
- [ ] Supprimer `egf` (45 min — cadence inexacte)
- [ ] Renommer `long` (60 min) → `standard` + ajuster i18n
- [ ] Ajouter `tournament` : 90 min + 3×45s
- [ ] Ajouter `championship` : 150 min + 5×60s

**Canadien**
- [ ] Changer `blitz` : remplacer `rapid` (20 min) par un vrai blitz 10 min + 20 coups/5 min
- [ ] Renommer `long` (45 min) → `club` + ajuster à 15 coups/5 min
- [ ] Renommer `standard` (30 min) → supprimer ou absorber dans `club`
- [ ] Ajouter `standard` : 60 min + 15 coups/5 min (FFG Coupe Maître Lim)
- [ ] Ajouter `tournament` : 75 min + 15 coups/5 min (FFG Champ. Amateur)
- [ ] Ajouter `championship` : 90 min + 15 coups/5 min (FFG Champ. Open)

**Fischer**
- [ ] Changer `blitz` : 5 min + 5s → 10 min + 10s
- [ ] Supprimer `rapid` (15 min + 10s)
- [ ] Renommer `standard` (30 min + 15s) → `club` : 25 min + 15s
- [ ] Renommer `long` (60 min + 30s) → `championship` : 60 min + **20s** (FFG Open)
- [ ] Ajouter `standard` : 40 min + 20s (FFG alternative clubs)
- [ ] Ajouter `tournament` : 50 min + 20s (FFG Champ. Amateur)

**Absolu**
- [ ] Changer `blitz` : 5 min → 10 min

**Transversal**
- [ ] Vérifier/mettre à jour toutes les clés `PresetNameKey` dans `src/types.ts`
- [ ] Vérifier les libellés i18n dans `src/i18n/` pour les noms modifiés
- [ ] Vérifier que l'accélération stepper (+5 min) est en place avant de retirer les presets intermédiaires

---

## [2026-04-13] Préréglages utilisateur sauvegardables — SetupScreen

### Problème

Les presets sont hardcodés dans `src/logic/presets.ts` avec des noms fixes (`PresetNameKey`).
En contexte tournoi, l'utilisateur veut enregistrer une cadence personnalisée et la réutiliser rapidement.

### Contraintes techniques

- `Preset` actuel : `{ nameKey: PresetNameKey; config: TimeControlConfig }` — le nom passe par i18n (`t.presetNames[nameKey]`), incompatible avec un nom libre.
- Ajouter un champ optionnel à `Preset` créerait de l'ambiguïté. Mieux vaut un type séparé `UserPreset`.
- Stockage : AsyncStorage (déjà utilisé pour la config courante), clé `@go_clock_user_presets`.

### Solution retenue

Nouveau type `UserPreset` indépendant de `Preset`, avec un nom libre. Stockage et rendu séparés des presets natifs, dans le même scroll horizontal (après les presets natifs).

**Flux UX :**
- Carte "＋" en fin du scroll de presets → tap → TextInput inline dans la carte pour saisir le nom → valider → sauvegardé
- Les presets utilisateur s'affichent avec un style distinct (ex : bordure accent `#F5A623`)
- Long-press sur un preset utilisateur → suppression directe (pas de modal de confirmation, l'action est réversible en recréant)

**Nom vide :** fallback automatique sur la description générée (`formatPresetDesc`).

### Périmètre d'implémentation

1. **`src/types.ts`** — ajouter `UserPreset { name: string; config: TimeControlConfig }`
2. **`src/logic/userPresets.ts`** (nouveau fichier) — fonctions `loadUserPresets()`, `saveUserPresets()`, `addUserPreset()`, `removeUserPreset(index)` sur AsyncStorage `@go_clock_user_presets`
3. **`SetupScreen`** — charger les user presets au montage (parallèle au chargement de la config)
4. **Scroll des presets** — afficher les user presets après les natifs, avec style distinct ; ajouter la carte "＋" en dernière position
5. **Carte "＋"** — state local `addingPreset: boolean` ; quand actif, afficher un `TextInput` + bouton confirmer dans la carte
6. **Suppression** — `onLongPress` sur une carte user preset → `removeUserPreset(index)` + mise à jour du state

### TODO

- [ ] Ajouter `UserPreset` dans `src/types.ts`
- [ ] Créer `src/logic/userPresets.ts` avec les 4 fonctions CRUD
- [ ] Charger les user presets dans `SetupScreen` au montage (avec `useState` + `useEffect`)
- [ ] Ajouter le rendu des user presets dans le scroll (après les natifs, style bordure accent)
- [ ] Ajouter la carte "＋" avec TextInput inline et confirmation
- [ ] Brancher la suppression sur long-press
- [ ] Vérifier que `applyPreset` fonctionne avec un `UserPreset` (même structure `config`)

---

## [2026-04-13] Signaux sonores — alignement sur les pendules traditionnelles

### Comportement actuel (`src/hooks/useSoundAlerts.ts`)

- Secondes 10→6 : `beep.ogg` (grave) une fois par seconde
- Secondes 5→1 : `beep_urgent.ogg` (aigu) une fois par seconde
- Fin de partie : `alarm.ogg`

### Références — pendules physiques

**Pendules de go (ING, Gokigen, YD)** : convention de facto = un bip par seconde sur les **10 dernières secondes** de chaque période. C'est le son emblématique du byoyomi, très reconnu par les joueurs.

**Pendules d'échecs (DGT, Chronos)** : un seul bip d'avertissement à un seuil configurable (typiquement 10 s), puis bips rapides ou continu à zéro. Pas de standard universel.

**Décompte vocal** : présent uniquement dans des apps mobiles, rare sur hardware.

### Proposition retenue

| Moment | Signal |
|---|---|
| 10 secondes exactement | 1 bip d'avertissement distinct |
| 5 → 1 secondes | Voix : « 5 », « 4 », « 3 », « 2 », « 1 » |
| Temps écoulé | Bip continu (alarme) |

Ce schéma conserve le repère ING (signal à 10s), y ajoute le décompte vocal demandé, et s'aligne sur la convention des apps mobiles modernes.

### Implémentation — voix : deux options

**Option A — `expo-speech`** (TTS système)
- `Speech.speak("5")` sur chaque seconde 5→1
- Pros : aucun asset à créer, multilingue automatique
- Cons : latence TTS variable selon device, risque de désynchro avec le timer

**Option B — fichiers audio pré-enregistrés** *(recommandée)*
- 5 fichiers : `count_5.ogg`, `count_4.ogg`, `count_3.ogg`, `count_2.ogg`, `count_1.ogg`
- Pros : timing parfaitement contrôlé, pas de dépendance TTS, même comportement sur tous les devices
- Cons : assets à sourcer (voix synthétique libre, ex. ElevenLabs ou `espeak`)
- **Langue : anglais uniquement.** Les chiffres 5→1 en anglais sont universellement compris dans un contexte de jeu compétitif. Multiplier par 5 langues (25 fichiers) ne justifie pas l'effort — l'i18n concerne l'interface, pas les signaux d'urgence.

### Périmètre d'implémentation

1. **Assets** — créer/récupérer les 5 fichiers `count_N.ogg` + remplacer `alarm.ogg` par une version bip continu si nécessaire ; placer dans `assets/sounds/`
2. **`useSoundAlerts.ts`** — modifier la logique :
   - Supprimer `beepUrgent` (remplacé par les fichiers count)
   - À `currentSecond === 10` : jouer `beep` (avertissement unique)
   - À `currentSecond` ∈ {5,4,3,2,1} : jouer `count_N` correspondant
   - Charger les 5 sons count dans `LoadedSounds`
3. **Règle byoyomi** : le comportement actuel s'applique déjà en surtemps (`byoyomiTimeLeft`) — aucun changement de logique de déclenchement nécessaire
4. **Reset** : le `lastBeepSecond.current` existant gère déjà le "une fois par seconde" — compatible

### TODO

- [ ] Sourcer/générer les 5 fichiers `count_5.ogg` → `count_1.ogg` (voix neutre)
- [ ] Vérifier/remplacer `alarm.ogg` par un bip continu si le fichier actuel n'est pas adapté
- [ ] Étendre `LoadedSounds` avec les 5 sons count dans `useSoundAlerts.ts`
- [ ] Modifier la logique de déclenchement : bip unique à 10s, count 5→1
- [ ] Tester la synchro voix/timer sur device Android et iOS
