export type Language = 'fr' | 'en' | 'ko' | 'ja' | 'zh';

export interface Translations {
  // App
  appName: string;
  appSubtitle: string;

  // Setup
  presets: string;
  timeControlType: string;
  startGame: string;
  custom: string;

  // Modes
  byoyomi: string;
  canadian: string;
  fischer: string;
  absolute: string;
  byoyomiDesc: string;
  canadianDesc: string;
  fischerDesc: string;
  absoluteDesc: string;

  // Stepper labels
  mainTime: string;
  numberOfPeriods: string;
  periodDuration: string;
  movesPerPeriod: string;
  initialTime: string;
  incrementPerMove: string;
  totalTime: string;

  // Units
  unitMin: string;
  unitSec: string;
  unitPeriods: string;
  unitMoves: string;

  // Game screen
  tapToStart: string;
  paused: string;
  blackWins: string;
  whiteWins: string;
  blackTurn: string;
  whiteTurn: string;

  // Alerts
  resetTitle: string;
  resetMessage: string;
  cancel: string;
  restart: string;
  quitTitle: string;
  quitMessage: string;
  quit: string;

  // Setup — premier joueur
  firstPlayer: string;
  blackFirst: string;
  whiteFirst: string;

  // Player clock
  black: string;
  white: string;
  wins: string;
  timeout: string;
  canadianOvertime: string;
  movesLeft: (n: number) => string;
  canadianInfo: (moves: number, time: string) => string;
  perMove: (inc: number) => string;
  suddenDeath: string;
  moveCount: (n: number) => string;

  // Setup — disposition & affichage
  orientation: string;
  displayStyleLabel: string;
  displayLed: string;
  displayApp: string;

  // Preset names
  presetNames: {
    blitz: string;
    online: string;
    club: string;
    egf: string;
    long: string;
    rapid: string;
    standard: string;
  };
}

const fr: Translations = {
  appName: 'Pendule de Go',
  appSubtitle: 'Configurez le contrôle de temps',
  presets: 'Préréglages',
  timeControlType: 'Mode',
  startGame: 'Démarrer la partie',
  custom: 'Personnalisé',

  byoyomi: 'Byoyomi',
  canadian: 'Canadien',
  fischer: 'Fischer',
  absolute: 'Absolu',
  byoyomiDesc:
    'Système japonais : temps principal puis N périodes de X secondes. Chaque coup joué en période réinitialise la période.',
  canadianDesc:
    'Système occidental : temps principal puis X coups à jouer en Y minutes. La période repart quand les X coups sont joués.',
  fischerDesc:
    'Chaque coup joué ajoute un incrément au temps restant. Populaire aux échecs, utilisé dans certains tournois de go.',
  absoluteDesc:
    'Temps fixe total sans surtemps. Quand le temps est épuisé, la partie est perdue.',

  mainTime: 'Temps principal',
  numberOfPeriods: 'Nombre de périodes',
  periodDuration: 'Durée de période',
  movesPerPeriod: 'Coups par période',
  initialTime: 'Temps initial',
  incrementPerMove: 'Incrément par coup',
  totalTime: 'Temps total',

  unitMin: 'min',
  unitSec: 'sec',
  unitPeriods: 'périodes',
  unitMoves: 'coups',

  tapToStart: 'Appuyez sur la pendule noire pour commencer',
  paused: 'En pause',
  blackWins: 'Noir gagne par le temps !',
  whiteWins: 'Blanc gagne par le temps !',
  blackTurn: 'Tour de Noir',
  whiteTurn: 'Tour de Blanc',

  resetTitle: 'Réinitialiser',
  resetMessage: 'Recommencer la partie ?',
  cancel: 'Annuler',
  restart: 'Recommencer',
  quitTitle: 'Quitter',
  quitMessage: 'Retourner aux paramètres ?',
  quit: 'Quitter',

  firstPlayer: 'Commence',
  blackFirst: 'Noir',
  whiteFirst: 'Blanc',

  orientation: 'Disposition',
  displayStyleLabel: 'Affichage',
  displayLed: 'Classique',
  displayApp: 'Style app',

  black: 'Noir',
  white: 'Blanc',
  wins: 'Gagne !',
  timeout: 'Temps !',
  canadianOvertime: 'SURTEMPS CANADIEN',
  movesLeft: (n) => `${n} coups restants`,
  canadianInfo: (moves, time) => `Canadien : ${moves} coups / ${time}`,
  perMove: (inc) => `+${inc}s / coup`,
  suddenDeath: 'Mort subite',
  moveCount: (n) => `${n} coup${n > 1 ? 's' : ''}`,

  presetNames: {
    blitz: 'Blitz',
    online: 'En ligne',
    club: 'Club',
    egf: 'EGF',
    long: 'Long',
    rapid: 'Rapide',
    standard: 'Standard',
  },
};

const en: Translations = {
  appName: 'Go Clock',
  appSubtitle: 'Configure time control',
  presets: 'Presets',
  timeControlType: 'Mode',
  startGame: 'Start game',
  custom: 'Custom',

  byoyomi: 'Byoyomi',
  canadian: 'Canadian',
  fischer: 'Fischer',
  absolute: 'Absolute',
  byoyomiDesc:
    'Japanese system: main time followed by N periods of X seconds. Playing within a period resets it.',
  canadianDesc:
    'Western system: main time followed by Y moves to play within X minutes. Period resets after all moves are played.',
  fischerDesc:
    'Each move adds an increment to remaining time. Common in chess, used in some go tournaments.',
  absoluteDesc:
    'Fixed total time with no overtime. When time runs out, the game is lost.',

  mainTime: 'Main time',
  numberOfPeriods: 'Number of periods',
  periodDuration: 'Period duration',
  movesPerPeriod: 'Moves per period',
  initialTime: 'Initial time',
  incrementPerMove: 'Increment per move',
  totalTime: 'Total time',

  unitMin: 'min',
  unitSec: 'sec',
  unitPeriods: 'periods',
  unitMoves: 'moves',

  tapToStart: 'Tap the black clock to start',
  paused: 'Paused',
  blackWins: 'Black wins on time!',
  whiteWins: 'White wins on time!',
  blackTurn: "Black's turn",
  whiteTurn: "White's turn",

  resetTitle: 'Reset',
  resetMessage: 'Restart the game?',
  cancel: 'Cancel',
  restart: 'Restart',
  quitTitle: 'Quit',
  quitMessage: 'Return to settings?',
  quit: 'Quit',

  firstPlayer: 'Starts',
  blackFirst: 'Black',
  whiteFirst: 'White',

  orientation: 'Layout',
  displayStyleLabel: 'Display',
  displayLed: 'Classic',
  displayApp: 'App Style',

  black: 'Black',
  white: 'White',
  wins: 'Wins!',
  timeout: 'Time!',
  canadianOvertime: 'CANADIAN OVERTIME',
  movesLeft: (n) => `${n} moves left`,
  canadianInfo: (moves, time) => `Canadian: ${moves} moves / ${time}`,
  perMove: (inc) => `+${inc}s / move`,
  suddenDeath: 'Sudden death',
  moveCount: (n) => `${n} move${n > 1 ? 's' : ''}`,

  presetNames: {
    blitz: 'Blitz',
    online: 'Online',
    club: 'Club',
    egf: 'EGF',
    long: 'Long',
    rapid: 'Rapid',
    standard: 'Standard',
  },
};

const ko: Translations = {
  appName: '바둑 시계',
  appSubtitle: '시간 설정',
  presets: '사전 설정',
  timeControlType: '방식',
  startGame: '게임 시작',
  custom: '직접 설정',

  byoyomi: '초읽기',
  canadian: '캐나다 방식',
  fischer: '피셔',
  absolute: '절대 시간',
  byoyomiDesc:
    '일본식 시스템: 주 시간 이후 N회의 X초 초읽기. 초읽기 안에 착수하면 초읽기가 초기화됩니다.',
  canadianDesc:
    '서양식 시스템: 주 시간 이후 X분 안에 Y수를 두어야 합니다. Y수를 다 두면 초기화됩니다.',
  fischerDesc:
    '매 수마다 일정 시간이 추가됩니다. 체스에서 유행하며 일부 바둑 대회에서도 사용합니다.',
  absoluteDesc:
    '추가 시간 없이 고정된 시간만 사용합니다. 시간이 다 되면 패합니다.',

  mainTime: '주 시간',
  numberOfPeriods: '초읽기 횟수',
  periodDuration: '초읽기 시간',
  movesPerPeriod: '기간당 수',
  initialTime: '초기 시간',
  incrementPerMove: '수당 추가 시간',
  totalTime: '총 시간',

  unitMin: '분',
  unitSec: '초',
  unitPeriods: '회',
  unitMoves: '수',

  tapToStart: '흑 시계를 눌러 시작하세요',
  paused: '일시 정지',
  blackWins: '흑 시간승!',
  whiteWins: '백 시간승!',
  blackTurn: '흑 차례',
  whiteTurn: '백 차례',

  resetTitle: '초기화',
  resetMessage: '게임을 다시 시작하시겠습니까?',
  cancel: '취소',
  restart: '다시 시작',
  quitTitle: '나가기',
  quitMessage: '설정 화면으로 돌아가시겠습니까?',
  quit: '나가기',

  firstPlayer: '선수',
  blackFirst: '흑',
  whiteFirst: '백',

  orientation: '배치',
  displayStyleLabel: '화면 스타일',
  displayLed: '클래식',
  displayApp: '앱 스타일',

  black: '흑',
  white: '백',
  wins: '승!',
  timeout: '시간 초과!',
  canadianOvertime: '캐나다 초읽기',
  movesLeft: (n) => `${n}수 남음`,
  canadianInfo: (moves, time) => `캐나다: ${moves}수 / ${time}`,
  perMove: (inc) => `+${inc}초 / 수`,
  suddenDeath: '절대 시간',
  moveCount: (n) => `${n}수`,

  presetNames: {
    blitz: '블리츠',
    online: '온라인',
    club: '클럽',
    egf: 'EGF',
    long: '장기',
    rapid: '빠른',
    standard: '기본',
  },
};

const ja: Translations = {
  appName: '囲碁時計',
  appSubtitle: '持ち時間を設定',
  presets: 'プリセット',
  timeControlType: 'モード',
  startGame: '対局開始',
  custom: 'カスタム',

  byoyomi: '秒読み',
  canadian: 'カナダ式',
  fischer: 'フィッシャー',
  absolute: '絶対時間',
  byoyomiDesc:
    '日本式：持ち時間終了後、N回のX秒の秒読み。秒読み内に着手すると秒読みがリセットされます。',
  canadianDesc:
    '欧米式：持ち時間終了後、X分以内にY手打たなければなりません。Y手打つとリセットされます。',
  fischerDesc:
    '毎着手ごとに一定時間が追加されます。チェスで一般的で、一部の囲碁大会でも使用されます。',
  absoluteDesc:
    '猶予なしの固定時間制。時間切れで負けとなります。',

  mainTime: '持ち時間',
  numberOfPeriods: '秒読み回数',
  periodDuration: '秒読み時間',
  movesPerPeriod: '期間あたりの手数',
  initialTime: '初期時間',
  incrementPerMove: '一手追加時間',
  totalTime: '合計時間',

  unitMin: '分',
  unitSec: '秒',
  unitPeriods: '回',
  unitMoves: '手',

  tapToStart: '黒の時計を押して開始',
  paused: '一時停止',
  blackWins: '黒の時間勝ち！',
  whiteWins: '白の時間勝ち！',
  blackTurn: '黒番',
  whiteTurn: '白番',

  resetTitle: 'リセット',
  resetMessage: '対局をやり直しますか？',
  cancel: 'キャンセル',
  restart: 'やり直す',
  quitTitle: '終了',
  quitMessage: '設定画面に戻りますか？',
  quit: '終了',

  firstPlayer: '先手',
  blackFirst: '黒',
  whiteFirst: '白',

  orientation: '配置',
  displayStyleLabel: '表示スタイル',
  displayLed: 'クラシック',
  displayApp: 'アプリスタイル',

  black: '黒',
  white: '白',
  wins: '勝ち！',
  timeout: '時間切れ！',
  canadianOvertime: 'カナダ式延長',
  movesLeft: (n) => `残り${n}手`,
  canadianInfo: (moves, time) => `カナダ: ${moves}手 / ${time}`,
  perMove: (inc) => `+${inc}秒 / 手`,
  suddenDeath: '切れ負け',
  moveCount: (n) => `${n}手`,

  presetNames: {
    blitz: 'ブリッツ',
    online: 'オンライン',
    club: 'クラブ',
    egf: 'EGF',
    long: '長時間',
    rapid: '早碁',
    standard: '標準',
  },
};

const zh: Translations = {
  appName: '围棋计时',
  appSubtitle: '配置用时规则',
  presets: '预设',
  timeControlType: '模式',
  startGame: '开始对局',
  custom: '自定义',

  byoyomi: '读秒',
  canadian: '加拿大制',
  fischer: '费舍尔',
  absolute: '包棋',
  byoyomiDesc:
    '日本式：主时间结束后进入N次X秒读秒。在读秒时间内落子则重置读秒。',
  canadianDesc:
    '西方式：主时间结束后须在X分钟内走Y手棋。走完Y手后重置。',
  fischerDesc:
    '每次落子后增加一定时间。常用于国际象棋，部分围棋赛事也采用。',
  absoluteDesc:
    '固定总用时，无追加时间。时间用完即负。',

  mainTime: '主时间',
  numberOfPeriods: '读秒次数',
  periodDuration: '读秒时长',
  movesPerPeriod: '每段手数',
  initialTime: '初始时间',
  incrementPerMove: '每手追加',
  totalTime: '总时间',

  unitMin: '分',
  unitSec: '秒',
  unitPeriods: '次',
  unitMoves: '手',

  tapToStart: '点击黑方时钟开始',
  paused: '暂停',
  blackWins: '黑方胜！',
  whiteWins: '白方胜！',
  blackTurn: '黑方行棋',
  whiteTurn: '白方行棋',

  resetTitle: '重置',
  resetMessage: '重新开始本局？',
  cancel: '取消',
  restart: '重新开始',
  quitTitle: '退出',
  quitMessage: '返回设置界面？',
  quit: '退出',

  firstPlayer: '先手',
  blackFirst: '黑',
  whiteFirst: '白',

  orientation: '位置',
  displayStyleLabel: '显示风格',
  displayLed: '经典',
  displayApp: '应用风格',

  black: '黑',
  white: '白',
  wins: '胜！',
  timeout: '超时！',
  canadianOvertime: '加拿大延长',
  movesLeft: (n) => `剩余${n}手`,
  canadianInfo: (moves, time) => `加拿大: ${moves}手 / ${time}`,
  perMove: (inc) => `+${inc}秒/手`,
  suddenDeath: '包棋',
  moveCount: (n) => `${n}手`,

  presetNames: {
    blitz: '快棋',
    online: '在线',
    club: '俱乐部',
    egf: 'EGF',
    long: '慢棋',
    rapid: '快速',
    standard: '标准',
  },
};

export const TRANSLATIONS: Record<Language, Translations> = { fr, en, ko, ja, zh };

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ko: '🇰🇷',
  ja: '🇯🇵',
  zh: '🇨🇳',
};
