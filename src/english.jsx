// 영어놀이 카테고리 — 데이터 + 순수 함수 + 6활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper } from './activities.jsx'
import { playSfx, speakEn } from './lib/audio.js'

const { useState: useS, useEffect: useE, useRef: useR } = React;

// 알파벳 26 — 대/소문자 + 예시단어 + 이모지
export const ALPHABET = [
  { u: 'A', l: 'a', word: 'Apple',     emoji: '🍎' },
  { u: 'B', l: 'b', word: 'Ball',      emoji: '⚽' },
  { u: 'C', l: 'c', word: 'Cat',       emoji: '🐱' },
  { u: 'D', l: 'd', word: 'Dog',       emoji: '🐶' },
  { u: 'E', l: 'e', word: 'Egg',       emoji: '🥚' },
  { u: 'F', l: 'f', word: 'Fish',      emoji: '🐟' },
  { u: 'G', l: 'g', word: 'Grape',     emoji: '🍇' },
  { u: 'H', l: 'h', word: 'Hat',       emoji: '🎩' },
  { u: 'I', l: 'i', word: 'Ice',       emoji: '🧊' },
  { u: 'J', l: 'j', word: 'Juice',     emoji: '🧃' },
  { u: 'K', l: 'k', word: 'Kite',      emoji: '🪁' },
  { u: 'L', l: 'l', word: 'Lion',      emoji: '🦁' },
  { u: 'M', l: 'm', word: 'Moon',      emoji: '🌙' },
  { u: 'N', l: 'n', word: 'Nest',      emoji: '🪺' },
  { u: 'O', l: 'o', word: 'Orange',    emoji: '🍊' },
  { u: 'P', l: 'p', word: 'Pig',       emoji: '🐷' },
  { u: 'Q', l: 'q', word: 'Queen',     emoji: '👑' },
  { u: 'R', l: 'r', word: 'Rain',      emoji: '🌧️' },
  { u: 'S', l: 's', word: 'Sun',       emoji: '☀️' },
  { u: 'T', l: 't', word: 'Tree',      emoji: '🌳' },
  { u: 'U', l: 'u', word: 'Umbrella',  emoji: '☂️' },
  { u: 'V', l: 'v', word: 'Van',       emoji: '🚐' },
  { u: 'W', l: 'w', word: 'Watch',     emoji: '⌚' },
  { u: 'X', l: 'x', word: 'Xylophone', emoji: '🎼' },
  { u: 'Y', l: 'y', word: 'Yoyo',      emoji: '🪀' },
  { u: 'Z', l: 'z', word: 'Zebra',     emoji: '🦓' },
];

// 단어 맞추기(일상 혼합)
export const WORD_SET = [
  { word: 'cat',   emoji: '🐱' }, { word: 'dog',  emoji: '🐶' }, { word: 'sun',   emoji: '☀️' },
  { word: 'bus',   emoji: '🚌' }, { word: 'cup',  emoji: '🥤' }, { word: 'hat',   emoji: '🎩' },
  { word: 'egg',   emoji: '🥚' }, { word: 'fish', emoji: '🐟' }, { word: 'star',  emoji: '⭐' },
  { word: 'moon',  emoji: '🌙' }, { word: 'tree', emoji: '🌳' }, { word: 'car',   emoji: '🚗' },
  { word: 'apple', emoji: '🍎' }, { word: 'ball', emoji: '⚽' },
];

const ENGLISH_LEVELS = [
  { options: 4, questions: 6 },
  { options: 4, questions: 8 },
  { options: 6, questions: 10 },
];
export function englishLevelConfig(level) {
  const i = Math.max(0, Math.min(ENGLISH_LEVELS.length - 1, level));
  return ENGLISH_LEVELS[i];
}

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 파닉스 보기 — 정답 인덱스 + 고유 distractor, 항상 count개(poolSize>=count 가정).
export function phonicsOptions(target, count, poolSize) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) if (i !== target) pool.push(i);
  const picked = shuffleArr(pool).slice(0, Math.max(0, count - 1));
  return shuffleArr([target, ...picked]);
}

// 단어 보기 — 정답 단어 + 고유 distractor 단어, 최대 count개.
export function wordOptions(targetWord, count, pool) {
  const others = pool.map((w) => w.word).filter((w) => w !== targetWord);
  const picked = shuffleArr(others).slice(0, Math.max(0, Math.min(count, pool.length) - 1));
  return shuffleArr([targetWord, ...picked]);
}

// ── 공용 스타일 헬퍼 ───────────────────────────────────────────
function TitleBar({ t, fontSize, icon, title, levelStepper }) {
  return (
    <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
      <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 36 }}>{icon}</span>{title}
      </div>
      {levelStepper}
    </div>
  );
}
const accent = (t) => (t.outline === 'none' ? `3px solid ${t.text}` : t.outline);
