// 도형/색깔 카테고리 — 데이터 + 순수함수 + 활동 + 라우터.
import React from 'react'
import { VoiceGuide } from './shell.jsx'
import { LevelStepper, useMultiPick, multiTargetOptions, PickMark } from './activities.jsx'
import { playSfx, speakKo } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// 피셔-예이츠 셔플(순수 출력)
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 도형 9종 — d(SVG path, viewBox 0 0 400 400)를 배우기 표시 + 색칠 윤곽선과 공유
export const SHAPES = [
  { id: 'circle',    name: '동그라미', tier: 'basic', d: 'M 200 200 m -150 0 a 150 150 0 1 0 300 0 a 150 150 0 1 0 -300 0', examples: ['🕐', '⚽', '🍩'] },
  { id: 'triangle',  name: '세모',     tier: 'basic', d: 'M 200 60 L 350 330 L 50 330 Z', examples: ['🍕', '⛰️'] },
  { id: 'square',    name: '네모',     tier: 'basic', d: 'M 70 70 L 330 70 L 330 330 L 70 330 Z', examples: ['📺', '🎁', '🪟'] },
  { id: 'star',      name: '별',       tier: 'basic', d: 'M 200 50 L 238 160 L 354 160 L 260 228 L 296 338 L 200 270 L 104 338 L 140 228 L 46 160 L 162 160 Z', examples: ['⭐'] },
  { id: 'heart',     name: '하트',     tier: 'basic', d: 'M 200 340 C 120 270 50 210 50 140 C 50 95 90 70 130 70 C 165 70 190 95 200 120 C 210 95 235 70 270 70 C 310 70 350 95 350 140 C 350 210 280 270 200 340 Z', examples: ['❤️'] },
  { id: 'diamond',   name: '마름모',   tier: 'ext',   d: 'M 200 50 L 340 200 L 200 350 L 60 200 Z', examples: ['💎', '🪁'] },
  { id: 'oval',      name: '타원',     tier: 'ext',   d: 'M 200 200 m -160 0 a 160 110 0 1 0 320 0 a 160 110 0 1 0 -320 0', examples: ['🥚', '🏉'] },
  { id: 'trapezoid', name: '사다리꼴', tier: 'ext',   d: 'M 110 110 L 290 110 L 350 310 L 50 310 Z', examples: ['👜'] },
  { id: 'pentagon',  name: '오각형',   tier: 'ext',   d: 'M 200 60 L 343 164 L 288 332 L 112 332 L 57 164 Z', examples: ['🏠'] },
];

// 색깔 10종(흰색은 칩 테두리로 구분)
export const COLORS = [
  { id: 'red',    name: '빨강', hex: '#E53935', examples: ['🍎', '🍓', '🌹'] },
  { id: 'orange', name: '주황', hex: '#FB8C00', examples: ['🍊', '🥕', '🦊'] },
  { id: 'yellow', name: '노랑', hex: '#FDD835', examples: ['🍌', '🌟', '🐤'] },
  { id: 'green',  name: '초록', hex: '#43A047', examples: ['🥦', '🌳', '🐸'] },
  { id: 'blue',   name: '파랑', hex: '#1E88E5', examples: ['🌊', '💧', '🐳'] },
  { id: 'purple', name: '보라', hex: '#8E24AA', examples: ['🍇', '🟣', '🔮'] },
  { id: 'pink',   name: '분홍', hex: '#EC407A', examples: ['🌸', '🎀', '🐷'] },
  { id: 'brown',  name: '갈색', hex: '#6D4C41', examples: ['🐻', '🍫', '🪵'] },
  { id: 'black',  name: '검정', hex: '#212121', examples: ['🐜', '🎩', '🌑'] },
  { id: 'white',  name: '흰색', hex: '#FFFFFF', examples: ['☁️', '🥛', '🦢'] },
];

// 사물→도형 / 사물→색 풀(맞추기·분류용). examples를 평탄화.
export const SHAPE_OBJECTS = SHAPES.flatMap((s) => s.examples.map((emoji) => ({ emoji, shapeId: s.id })));
export const COLOR_OBJECTS = COLORS.flatMap((c) => c.examples.map((emoji) => ({ emoji, colorId: c.id })));

// 레벨 설정
const SHAPE_LEVELS = [
  { options: 3, questions: 5, tiers: ['basic'] },
  { options: 4, questions: 5, tiers: ['basic'] },
  { options: 6, questions: 5, tiers: ['basic', 'ext'] },
];
export function shapeFindLevelConfig(level) {
  const i = Math.max(0, Math.min(SHAPE_LEVELS.length - 1, level));
  return SHAPE_LEVELS[i];
}
const COLOR_SORT_LEVELS = [
  { grid: 6, colors: 3, questions: 5 },
  { grid: 9, colors: 4, questions: 5 },
  { grid: 12, colors: 5, questions: 5 },
];
export function colorSortLevelConfig(level) {
  const i = Math.max(0, Math.min(COLOR_SORT_LEVELS.length - 1, level));
  return COLOR_SORT_LEVELS[i];
}

// 도형 찾기 라운드: 정답 1개 + 보기(정답 포함, 고유)
export function buildShapeFindRound(cfg, shapes) {
  const pool = shapes.filter((s) => cfg.tiers.includes(s.tier));
  const ids = pool.map((s) => s.id);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const options = multiTargetOptions([answer.id], cfg.options, ids);
  return { answerId: answer.id, options };
}

// 도형 맞추기 라운드: 사물 제시 → 그 사물의 도형이 정답
export function buildShapeMatchRound(cfg, shapeObjects, shapes) {
  const pool = shapes.filter((s) => cfg.tiers.includes(s.tier));
  const ids = pool.map((s) => s.id);
  const objs = shapeObjects.filter((o) => ids.includes(o.shapeId));
  const q = objs[Math.floor(Math.random() * objs.length)];
  const options = multiTargetOptions([q.shapeId], cfg.options, ids);
  return { emoji: q.emoji, answerId: q.shapeId, options };
}

// 색깔 분류 라운드: 타깃색 + 그리드. 그리드 내 타깃색 사물 전체가 정답셋(멀티선택).
export function buildColorSortRound(cfg, colorObjects, colors) {
  const colorIds = shuffle(colors.map((c) => c.id)).slice(0, cfg.colors);
  const targetColorId = colorIds[Math.floor(Math.random() * colorIds.length)];
  const inColors = colorObjects.filter((o) => colorIds.includes(o.colorId));
  const targetObjs = shuffle(inColors.filter((o) => o.colorId === targetColorId));
  const otherObjs = shuffle(inColors.filter((o) => o.colorId !== targetColorId));
  const chosenTargets = targetObjs.slice(0, Math.max(1, Math.min(targetObjs.length, cfg.grid - 1)));
  const need = cfg.grid - chosenTargets.length;
  const items = shuffle([...chosenTargets, ...otherObjs.slice(0, Math.max(0, need))]);
  const targetKeys = items.filter((o) => o.colorId === targetColorId).map((o) => o.emoji);
  return { targetColorId, items, targetKeys };
}

// 도형 SVG 렌더(배우기 대형 + 보기 공용)
export function ShapeGlyph({ shape, size = 200, fill = 'none', stroke = '#333', strokeWidth = 10 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} style={{ display: 'block' }}>
      <path d={shape.d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// 좌우 이동 버튼
function NavBtn({ dir, tone, onClick }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? '이전' : '다음'}
      style={{ flex: '0 0 auto', width: 72, height: 72, borderRadius: 36, background: '#fff',
        border: accentBorder, cursor: 'pointer', fontSize: 30, fontFamily: 'inherit', color: t.text, boxShadow: t.shadowSm }}>
      {dir === 'left' ? '◀' : '▶'}
    </button>
  );
}

// 공용 배우기 — 대형 시각 + 이름 말풍선 + 🔊 + ◀▶ + ⭐ + 예시
function BrowseActivity({ tone, fontSize, onComplete, color, icon, title, items, renderBig, speak }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [idx, setIdx] = useStateA(0);
  const [collected, setCollected] = useStateA(() => new Set());
  const cur = items[idx];

  const learn = () => {
    speak(cur.name);
    playSfx('select');
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
  const next = () => setIdx((i) => (i + 1) % items.length);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{icon}</span>{title}
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.1</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        <NavBtn dir="left" tone={t} onClick={prev} />
        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, minWidth: 0 }}>
          <button onClick={learn}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }], { duration: 150 })}
            style={{ position: 'relative', width: 300, height: 300, background: '#fff', border: accentBorder,
              borderRadius: t.cardRadius + 12, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, overflow: 'hidden' }}>
            {renderBig(cur, t, color)}
            {collected.has(idx) && <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 44 }}>⭐</span>}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ background: '#fff', border: accentBorder, borderRadius: 28, padding: '20px 28px',
              fontSize: 56, fontWeight: 900, lineHeight: 1, color: t.text, boxShadow: t.shadow, whiteSpace: 'nowrap' }}>{cur.name}!</div>
            <button onClick={learn}
              style={{ background: t.accent, color: t.text, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 36, padding: '14px 24px', fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 10, height: 64 }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>🔊</span>들어보기
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {cur.examples.map((e, i) => (<span key={i} style={{ fontSize: 48, lineHeight: 1 }}>{e}</span>))}
            </div>
          </div>
        </div>
        <NavBtn dir="right" tone={t} onClick={next} />
      </div>
    </div>
  );
}

function ShapeLearnActivity(p) {
  return (
    <BrowseActivity {...p} color={p.tone.cat.shape} icon="▲" title="도형 배우기" items={SHAPES} speak={speakKo}
      renderBig={(s, t, color) => <ShapeGlyph shape={s} size={240} fill={color} stroke={t.text} strokeWidth={8} />} />
  );
}
function ColorLearnActivity(p) {
  return (
    <BrowseActivity {...p} color={p.tone.cat.shape} icon="🌈" title="색깔 배우기" items={COLORS} speak={speakKo}
      renderBig={(c, t) => <div style={{ width: 240, height: 240, borderRadius: 32, background: c.hex, border: `4px solid ${t.text}` }} />} />
  );
}
