// 놀이마을(소셜) 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, useMultiPick, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

export const MESSENGER_QUESTIONS = 5;

// 피셔-예이츠 셔플(순수 출력)
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 메신저 — 상황 질문 + 보기 이모티콘 + 정답. 레벨별 풀.
export const MESSENGER_LEVELS = [
  [
    { ask: '안녕! 만나서 반가워', options: ['👋', '😴', '🍎'], answer: '👋' },
    { ask: '나는 기분이 좋아. 너는?', options: ['😄', '😢', '😡'], answer: '😄' },
    { ask: '고마워!', options: ['😊', '😠', '😱'], answer: '😊' },
    { ask: '잘 가, 또 만나!', options: ['👋', '🍌', '⚽'], answer: '👋' },
  ],
  [
    { ask: '배고프지 않아? 뭐 먹을까?', options: ['🍎', '😴', '👟', '🎵'], answer: '🍎' },
    { ask: '나 오늘 슬퍼…', options: ['🤗', '😡', '🎉', '🍕'], answer: '🤗' },
    { ask: '우리 같이 놀자!', options: ['⚽', '😴', '🚽', '📕'], answer: '⚽' },
    { ask: '생일 축하해!', options: ['🎂', '🧦', '🔧', '🥦'], answer: '🎂' },
  ],
  [
    { ask: '비가 와! 뭘 가져갈까?', options: ['☂️', '🕶️', '🍦', '🪀'], answer: '☂️' },
    { ask: '졸려… 이제 뭐 할까?', options: ['😴', '🏃', '🎺', '🍭'], answer: '😴' },
    { ask: '손이 더러워. 어떻게 하지?', options: ['🧼', '🍫', '📺', '🎈'], answer: '🧼' },
    { ask: '추워! 뭘 입을까?', options: ['🧥', '🩳', '🕶️', '🩴'], answer: '🧥' },
  ],
];

// 역할놀이 — 6직업, 각 3~4 step(정답 도구 + 방해 도구).
export const ROLES = [
  { id: 'doctor', name: '의사', emoji: '👩‍⚕️', steps: [
    { prompt: '열을 재요', tool: '🌡️', distractors: ['🍴', '🎨'] },
    { prompt: '약을 줘요', tool: '💊', distractors: ['🧯', '🚓'] },
    { prompt: '밴드를 붙여요', tool: '🩹', distractors: ['🖌️', '🐶'] },
  ] },
  { id: 'cook', name: '요리사', emoji: '👨‍🍳', steps: [
    { prompt: '재료를 잘라요', tool: '🔪', distractors: ['💊', '🚒'] },
    { prompt: '냄비에 끓여요', tool: '🍲', distractors: ['🎨', '🩹'] },
    { prompt: '접시에 담아요', tool: '🍽️', distractors: ['🌡️', '🚓'] },
  ] },
  { id: 'firefighter', name: '소방관', emoji: '👨‍🚒', steps: [
    { prompt: '소방차를 타요', tool: '🚒', distractors: ['🍽️', '🎨'] },
    { prompt: '물을 뿌려요', tool: '💧', distractors: ['💊', '🔪'] },
    { prompt: '불을 꺼요', tool: '🧯', distractors: ['🩹', '🐶'] },
  ] },
  { id: 'police', name: '경찰', emoji: '👮', steps: [
    { prompt: '호루라기를 불어요', tool: '🪈', distractors: ['🍲', '🌡️'] },
    { prompt: '경찰차를 타요', tool: '🚓', distractors: ['🧯', '🎨'] },
    { prompt: '길을 안내해요', tool: '🚦', distractors: ['💊', '🍽️'] },
  ] },
  { id: 'vet', name: '수의사', emoji: '🧑‍⚕️', steps: [
    { prompt: '강아지를 살펴봐요', tool: '🐶', distractors: ['🚒', '🔪'] },
    { prompt: '청진기로 들어요', tool: '🩺', distractors: ['🎨', '🚦'] },
    { prompt: '주사를 놔요', tool: '💉', distractors: ['🍲', '🪈'] },
  ] },
  { id: 'painter', name: '화가', emoji: '🧑‍🎨', steps: [
    { prompt: '도화지를 펴요', tool: '📄', distractors: ['🚒', '🩺'] },
    { prompt: '붓을 들어요', tool: '🖌️', distractors: ['💉', '🚓'] },
    { prompt: '색을 칠해요', tool: '🎨', distractors: ['🧯', '🌡️'] },
  ] },
];

// 꾸미기 — 장면 배경(2색 그라데이션), 스티커, 프레임.
export const SCENES = [
  { id: 'birthday', name: '생일파티', c1: '#FFE3F1', c2: '#FFC2DE' },
  { id: 'sea',      name: '바다',     c1: '#BFEAFF', c2: '#5EC8F0' },
  { id: 'space',    name: '우주',     c1: '#3A2E6E', c2: '#1A1340' },
  { id: 'park',     name: '공원',     c1: '#DDF6C8', c2: '#A7E08A' },
];
export const DECORATE_STICKERS = ['⭐', '❤️', '🌈', '🌸', '🦋', '🎈', '🎀', '🐶', '🐱', '🍰', '🚀', '🌙'];
export const FRAMES = [
  { id: 'none',  name: '없음',   color: '#000000', width: 0 },
  { id: 'pink',  name: '분홍',   color: '#EC407A', width: 16 },
  { id: 'gold',  name: '금색',   color: '#F0B429', width: 16 },
  { id: 'blue',  name: '파랑',   color: '#1E88E5', width: 16 },
];

// 메신저 라운드: 레벨 풀에서 랜덤 질문 → 보기 셔플(정답 포함).
export function buildMessengerRound(level, levels) {
  const i = Math.max(0, Math.min(levels.length - 1, level));
  const pool = levels[i];
  const q = pool[Math.floor(Math.random() * pool.length)];
  return { ask: q.ask, options: shuffle(q.options), answer: q.answer };
}

// 역할 스텝 보기: 정답 도구 + 방해 도구 셔플(고유).
export function buildRoleStepOptions(step) {
  return { tool: step.tool, options: shuffle([step.tool, ...step.distractors]) };
}
