// 컴퓨터 익히기 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// 실제 키보드 배열(낱자, 시프트 제외)
export const KEYBOARD_EN = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];
export const KEYBOARD_KO = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
];

// 터치 제스처 3종(순차 진행)
export const TOUCH_GESTURES = [
  { id: 'tap',   name: '탭',      prompt: '풍선을 콕 눌러 터뜨려봐',     emoji: '🎈', count: 4 },
  { id: 'drag',  name: '드래그',  prompt: '사과를 바구니에 끌어다 넣어봐', emoji: '🍎', target: '🧺', count: 3 },
  { id: 'swipe', name: '스와이프', prompt: '카드를 옆으로 쓱 밀어봐',      emoji: '🃏', count: 3 },
];

// 마우스 과제 3종(커서로 클릭/더블클릭/드래그)
export const MOUSE_TASKS = [
  { id: 'click',  name: '클릭',     prompt: '별을 클릭해봐',              emoji: '⭐', count: 4 },
  { id: 'double', name: '더블클릭', prompt: '상자를 빠르게 두 번 눌러 열어봐', emoji: '📦', open: '🎁', count: 3 },
  { id: 'drag',   name: '드래그',   prompt: '선물을 상자에 넣어봐',        emoji: '🎁', target: '📦', count: 3 },
];

// 타자 출제: keys 중 prev와 다른 랜덤 키(키 1개면 그 키)
export function pickTypingTarget(keys, prev) {
  if (!keys.length) return null;
  if (keys.length === 1) return keys[0];
  const candidates = keys.filter((k) => k !== prev);
  const pool = candidates.length ? candidates : keys;
  return pool[Math.floor(Math.random() * pool.length)];
}
