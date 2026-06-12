// kidsweb-themes.jsx
// 3가지 톤앤매너 팔레트 + 카테고리 데이터 + 시간대 배경
// 모든 톤이 같은 카테고리 컬러 키를 가지므로 톤만 교체하면 UI가 통째로 바뀜.

const KIDS_CATEGORIES = [
  { id: 'color',   name: '색칠놀이',  emoji: '🎨',  hasSub: true,  done: true },
  { id: 'hangul',  name: '한글',     emoji: '가',  iconKind: 'text', hasSub: true,  done: true },
  { id: 'english', name: '영어',     emoji: 'ABC', iconKind: 'text', hasSub: true,  done: true },
  { id: 'math',    name: '수학',     emoji: '123', iconKind: 'text', hasSub: true,  done: true },
  { id: 'shape',   name: '도형',     emoji: '◆●▲', iconKind: 'text', hasSub: false, done: false },
  { id: 'music',   name: '음악',     emoji: '🎵',  hasSub: true,  done: true },
  { id: 'code',    name: '코딩',     emoji: '🤖',  hasSub: false, done: true },
  { id: 'brain',   name: '두뇌',     emoji: '🧩',  hasSub: true,  done: true },
  { id: 'computer',name: '컴퓨터',   emoji: '💻',  hasSub: false, done: false },
  { id: 'social',  name: '놀이마을',  emoji: '💬',  hasSub: false, done: false },
];

// 톤 A — 밝은 원색 (Khan Academy Kids 풍, 고채도)
const TONE_A = {
  id: 'A',
  name: '밝은 원색',
  desc: 'Khan Academy Kids · 고채도',
  bg: '#FFF4CE',
  surface: '#FFFFFF',
  surfaceAlt: '#FFFDF2',
  text: '#2C2A4A',
  textMuted: '#5C5A7A',
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  cat: {
    color:    '#FF8A5C',
    hangul:   '#95E1D3',
    english:  '#AA96DA',
    math:     '#FCF876',
    shape:    '#F38181',
    music:    '#A8D8EA',
    code:     '#98D6A6',
    brain:    '#DDA0DD',
    computer: '#87CEEB',
    social:   '#FFDAC1',
  },
  // 카드 그림자 — 컬러풀 톤일수록 진하게 떨어뜨려서 입체감
  shadow: '0 6px 0 rgba(44,42,74,0.18), 0 10px 24px rgba(44,42,74,0.14)',
  shadowSm: '0 3px 0 rgba(44,42,74,0.15), 0 6px 14px rgba(44,42,74,0.10)',
  radius: 24,
  cardRadius: 28,
  // 카테고리 카드에 흰 배경 vs 컬러 배경
  cardFill: 'color',     // 카드 자체가 카테고리 컬러
  textOnColor: '#2C2A4A',
  outline: 'none',
  texture: 'none',
};

// 톤 B — 파스텔 (부드러운 톤, Lalaloopsy 풍)
const TONE_B = {
  id: 'B',
  name: '파스텔',
  desc: 'Lalaloopsy · 부드러운 톤',
  bg: '#FFF5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF6F8',
  text: '#5B4B5C',
  textMuted: '#9087A0',
  primary: '#FFB3BA',
  secondary: '#BAE1E0',
  accent: '#FFF5BA',
  cat: {
    color:    '#FFC8A8',
    hangul:   '#C8EFE3',
    english:  '#D4C9EE',
    math:     '#FDF7BD',
    shape:    '#F9C0C0',
    music:    '#D2E8F2',
    code:     '#C5E5CD',
    brain:    '#EBC8EB',
    computer: '#BDDFEF',
    social:   '#FFE5D1',
  },
  shadow: '0 8px 22px rgba(180,140,170,0.18)',
  shadowSm: '0 4px 12px rgba(180,140,170,0.14)',
  radius: 28,
  cardRadius: 32,
  cardFill: 'white',     // 흰 배경 + 컬러 액센트 점
  textOnColor: '#5B4B5C',
  outline: 'none',
  texture: 'dots',       // 살짝 도트
};

// 톤 C — 스튜디오 지브리 (수채화, 자연 텍스처)
const TONE_C = {
  id: 'C',
  name: '지브리 수채화',
  desc: '자연 톤 · 수채 텍스처',
  bg: '#F4EBD6',
  surface: '#FBF6E8',
  surfaceAlt: '#F0E5C9',
  text: '#3D2E1F',
  textMuted: '#7A6648',
  primary: '#C2614F',
  secondary: '#5C947B',
  accent: '#E8C547',
  cat: {
    color:    '#D9876A',
    hangul:   '#8FBFA8',
    english:  '#A294BF',
    math:     '#E6CD78',
    shape:    '#CD7E80',
    music:    '#94B7C7',
    code:     '#95B98A',
    brain:    '#B58EBC',
    computer: '#88A8C2',
    social:   '#E5B289',
  },
  shadow: '0 4px 0 rgba(61,46,31,0.10), 0 6px 16px rgba(61,46,31,0.12)',
  shadowSm: '0 2px 0 rgba(61,46,31,0.08), 0 4px 10px rgba(61,46,31,0.08)',
  radius: 20,
  cardRadius: 22,
  cardFill: 'paper',     // 종이 질감 + 가는 갈색 선
  textOnColor: '#3D2E1F',
  outline: '1.5px solid rgba(61,46,31,0.22)',
  texture: 'paper',
};

const KIDS_TONES = { A: TONE_A, B: TONE_B, C: TONE_C };

// 시간대 배경 — 톤마다 약간씩 다르게 매핑
function timeOfDayBg(tone, when) {
  if (when === 'morning') {
    // 아침 — 따뜻한 햇살
    if (tone.id === 'A') return 'linear-gradient(180deg, #FFE8B0 0%, #FFD8A8 60%, #FFCFCF 100%)';
    if (tone.id === 'B') return 'linear-gradient(180deg, #FFF1E0 0%, #FFE5E8 100%)';
    return 'linear-gradient(180deg, #F8E8C4 0%, #EDD3A8 100%)';
  }
  if (when === 'evening') {
    // 저녁 — 노을
    if (tone.id === 'A') return 'linear-gradient(180deg, #FFB199 0%, #C892D8 60%, #6E7DC6 100%)';
    if (tone.id === 'B') return 'linear-gradient(180deg, #FFD0C8 0%, #E8C4E0 50%, #C8C4E8 100%)';
    return 'linear-gradient(180deg, #E8A878 0%, #C28098 50%, #7A6884 100%)';
  }
  // 낮 (기본)
  if (tone.id === 'A') return 'linear-gradient(180deg, #BDE0FE 0%, #CDEFFF 50%, #FFF4CE 100%)';
  if (tone.id === 'B') return 'linear-gradient(180deg, #E8F4FF 0%, #FFF5F7 100%)';
  return 'linear-gradient(180deg, #D8E5D5 0%, #F4EBD6 100%)';
}

// 톤 C 종이 질감 — SVG 노이즈
const PAPER_TEX_URL = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0.08 0'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")";

// 폰 톤 B 도트 텍스처
const DOTS_TEX_URL = "radial-gradient(rgba(180,140,170,0.10) 1.2px, transparent 1.6px)";

function toneTexture(tone) {
  if (tone.texture === 'paper') return { backgroundImage: PAPER_TEX_URL, backgroundSize: '180px 180px', backgroundRepeat: 'repeat', mixBlendMode: 'multiply' };
  if (tone.texture === 'dots') return { backgroundImage: DOTS_TEX_URL, backgroundSize: '14px 14px' };
  return null;
}

export { KIDS_CATEGORIES, KIDS_TONES, timeOfDayBg, toneTexture }
