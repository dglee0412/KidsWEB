// kidsweb-activities.jsx
// 5가지 학습 인터랙션: 색칠놀이 / 한글 / 수학 / 음악 / 두뇌게임
// 모두 풀-플로우로 동작; 완료 시 별 획득.

import React from 'react'
import { VoiceGuide, PlaceholderScreen } from './shell.jsx'
import { playSfx, playTone, playToolVoice, startDraw, drawTick, stopDraw } from './lib/audio.js'

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo: useMemoA, useCallback: useCallbackA } = React;

// ─────────────────────────────────────────────────────────────
// 1) 영역 색칠놀이 — 가로스크롤 도안 + SVG 캔버스 + 12색 팔레트 + 진행바
// ─────────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  '#FF6B6B','#FF8A5C','#FFCB57','#FFE66D',
  '#98D6A6','#4ECDC4','#87CEEB','#5C8AE6',
  '#AA96DA','#DDA0DD','#F38181','#FFFFFF',
];

// 색칠 도안 — 각 영역(path)을 따로 채색
const COLORING_TEMPLATES = {
  cat: {
    name: '고양이', emoji: '🐱', viewBox: '0 0 400 420',
    parts: [
      { id: 'body',     d: 'M 200 340 m -140 0 a 140 70 0 1 0 280 0 a 140 70 0 1 0 -280 0' },
      { id: 'tail',     d: 'M 340 330 Q 380 280 360 220 Q 350 195 365 188 L 358 175 Q 338 180 340 220 Q 342 280 322 318 Z' },
      { id: 'ear-l',    d: 'M 110 130 L 90 40 L 180 100 Z' },
      { id: 'ear-r',    d: 'M 290 130 L 310 40 L 220 100 Z' },
      { id: 'head',     d: 'M 200 200 m -110 0 a 110 110 0 1 0 220 0 a 110 110 0 1 0 -220 0' },
      { id: 'ear-in-l', d: 'M 130 130 L 120 70 L 170 105 Z' },
      { id: 'ear-in-r', d: 'M 270 130 L 280 70 L 230 105 Z' },
      { id: 'eye-l',    d: 'M 160 200 m -12 0 a 12 18 0 1 0 24 0 a 12 18 0 1 0 -24 0' },
      { id: 'eye-r',    d: 'M 240 200 m -12 0 a 12 18 0 1 0 24 0 a 12 18 0 1 0 -24 0' },
      { id: 'nose',     d: 'M 188 232 L 212 232 L 200 248 Z' },
      { id: 'mouth',    d: 'M 200 248 L 200 264 M 200 264 Q 188 272 178 262 M 200 264 Q 212 272 222 262' },
    ],
  },
  dog: {
    name: '강아지', emoji: '🐶', viewBox: '0 0 400 440',
    parts: [
      { id: 'body',  d: 'M 200 340 m -150 0 a 150 75 0 1 0 300 0 a 150 75 0 1 0 -300 0' },
      { id: 'tail',  d: 'M 55 320 Q 18 280 28 230 L 50 235 Q 46 275 72 312 Z' },
      { id: 'leg-l', d: 'M 130 400 L 130 430 L 165 430 L 165 400 Z' },
      { id: 'leg-r', d: 'M 235 400 L 235 430 L 270 430 L 270 400 Z' },
      { id: 'ear-l', d: 'M 105 130 Q 70 100 95 50 Q 130 70 140 140 Z' },
      { id: 'ear-r', d: 'M 295 130 Q 330 100 305 50 Q 270 70 260 140 Z' },
      { id: 'head',  d: 'M 200 200 m -100 0 a 100 100 0 1 0 200 0 a 100 100 0 1 0 -200 0' },
      { id: 'snout', d: 'M 200 240 m -60 0 a 60 40 0 1 0 120 0 a 60 40 0 1 0 -120 0' },
      { id: 'eye-l', d: 'M 170 175 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0' },
      { id: 'eye-r', d: 'M 230 175 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0' },
      { id: 'nose',  d: 'M 200 225 m -16 0 a 16 11 0 1 0 32 0 a 16 11 0 1 0 -32 0' },
      { id: 'mouth', d: 'M 200 250 L 200 270 M 200 270 Q 188 278 180 268' },
    ],
  },
  car: {
    name: '자동차', emoji: '🚗', viewBox: '0 0 480 320',
    parts: [
      { id: 'body',     d: 'M 50 230 L 50 195 Q 60 175 90 175 L 380 175 Q 420 175 440 195 L 440 240 L 50 240 Z' },
      { id: 'cabin',    d: 'M 130 175 L 170 100 Q 185 90 210 90 L 320 90 Q 345 90 360 100 L 395 175 Z' },
      { id: 'window-l', d: 'M 168 170 L 195 115 Q 205 105 220 105 L 240 105 L 240 170 Z' },
      { id: 'window-r', d: 'M 357 170 L 330 115 Q 320 105 305 105 L 270 105 L 270 170 Z' },
      { id: 'door',     d: 'M 255 175 L 255 235 L 260 235 L 260 175 Z' },
      { id: 'headlight',d: 'M 415 195 L 438 195 L 438 215 L 415 220 Z' },
      { id: 'wheel-l',  d: 'M 140 250 m -38 0 a 38 38 0 1 0 76 0 a 38 38 0 1 0 -76 0' },
      { id: 'wheel-r',  d: 'M 350 250 m -38 0 a 38 38 0 1 0 76 0 a 38 38 0 1 0 -76 0' },
      { id: 'hub-l',    d: 'M 140 250 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0' },
      { id: 'hub-r',    d: 'M 350 250 m -14 0 a 14 14 0 1 0 28 0 a 14 14 0 1 0 -28 0' },
    ],
  },
  sunflower: {
    name: '해바라기', emoji: '🌻', viewBox: '0 0 400 480',
    parts: [
      { id: 'stem',    d: 'M 192 250 L 192 460 L 208 460 L 208 250 Z' },
      { id: 'leaf-l',  d: 'M 200 380 Q 130 360 100 320 Q 130 340 200 360 Z' },
      { id: 'leaf-r',  d: 'M 200 420 Q 270 400 300 360 Q 270 380 200 400 Z' },
      { id: 'petal-0', d: 'M 230 200 a 50 30 0 0 1 100 0 a 50 30 0 0 1 -100 0 Z' },
      { id: 'petal-1', d: 'M 221 221 a 50 30 45 0 1 71 71 a 50 30 45 0 1 -71 -71 Z' },
      { id: 'petal-2', d: 'M 200 230 a 50 30 90 0 1 0 100 a 50 30 90 0 1 0 -100 Z' },
      { id: 'petal-3', d: 'M 179 221 a 50 30 135 0 1 -71 71 a 50 30 135 0 1 71 -71 Z' },
      { id: 'petal-4', d: 'M 170 200 a 50 30 180 0 1 -100 0 a 50 30 180 0 1 100 0 Z' },
      { id: 'petal-5', d: 'M 179 179 a 50 30 225 0 1 -71 -71 a 50 30 225 0 1 71 71 Z' },
      { id: 'petal-6', d: 'M 200 170 a 50 30 270 0 1 0 -100 a 50 30 270 0 1 0 100 Z' },
      { id: 'petal-7', d: 'M 221 179 a 50 30 315 0 1 71 -71 a 50 30 315 0 1 -71 71 Z' },
      { id: 'center',  d: 'M 200 200 m -55 0 a 55 55 0 1 0 110 0 a 55 55 0 1 0 -110 0' },
    ],
  },
  apple: {
    name: '사과', emoji: '🍎', viewBox: '0 0 400 420',
    parts: [
      { id: 'body',      d: 'M 200 80 C 110 80 60 160 70 240 C 80 320 140 350 200 350 C 260 350 320 320 330 240 C 340 160 290 80 200 80 Z' },
      { id: 'leaf-l',    d: 'M 200 80 C 180 50 150 30 130 35 C 150 60 170 80 200 80 Z' },
      { id: 'leaf-r',    d: 'M 200 80 C 220 50 250 30 270 35 C 250 60 230 80 200 80 Z' },
      { id: 'stem',      d: 'M 196 80 L 196 45 L 208 45 L 208 80 Z' },
      { id: 'shine-1',   d: 'M 140 140 C 130 170 130 200 150 200 C 170 200 175 170 165 140 Z' },
      { id: 'shine-2',   d: 'M 232 162 C 226 178 226 192 236 192 C 246 192 248 178 242 162 Z' },
      { id: 'highlight', d: 'M 196 102 C 176 108 168 130 178 144 C 192 130 200 112 196 102 Z' },
    ],
  },
};

const COLORING_ORDER = ['cat', 'dog', 'car', 'sunflower', 'apple'];

function ColoringActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const [currentId, setCurrentId] = useStateA(COLORING_ORDER.includes(subId) ? subId : 'cat');
  const tpl = COLORING_TEMPLATES[currentId];
  const [color, setColor] = useStateA(COLOR_PALETTE[0]);
  const [fills, setFills] = useStateA({});
  const [hint, setHint] = useStateA(null);
  const [saved, setSaved] = useStateA(false);
  const [doneOnce, setDoneOnce] = useStateA(false);

  const filledCount = Object.keys(fills).length;
  const totalParts = tpl.parts.length;

  // 도안 변경 시 리셋
  useEffectA(() => { setFills({}); setDoneOnce(false); setHint(null); }, [currentId]);

  useEffectA(() => {
    if (!doneOnce && filledCount >= totalParts) {
      setDoneOnce(true);
      onComplete && onComplete(3);
      onFinish && onFinish();
    }
  }, [filledCount, totalParts]);

  const showHint = () => {
    const unfilled = tpl.parts.filter((p) => !fills[p.id]);
    if (!unfilled.length) return;
    setHint(unfilled[Math.floor(Math.random() * unfilled.length)].id);
    setTimeout(() => setHint(null), 1800);
  };
  const onFill = (pid) => setFills((f) => ({ ...f, [pid]: color }));
  const onSave = () => {
    // 채색된 영역이 없으면 무시
    if (!Object.keys(fills).length) { setSaved(true); setTimeout(() => setSaved(false), 1400); return; }
    try {
      const list = JSON.parse(localStorage.getItem('kw-gallery') || '[]');
      list.unshift({
        id: Date.now(),
        tplId: currentId,
        fills,
        savedAt: new Date().toISOString(),
      });
      if (list.length > 24) list.length = 24;
      localStorage.setItem('kw-gallery', JSON.stringify(list));
    } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1400);
  };

  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const colorCat = t.cat.color;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ─ 타이틀 + 💾 저장 (◀뒤로/⭐별은 셸이 그려줌) ─ */}
      <div style={{ height: 88, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: fontSize + 12, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🪣</span>영역 색칠놀이
        </div>
        <button onClick={onSave} aria-label="저장"
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
          style={{
            position: 'absolute', top: 16, right: 130,
            width: 64, height: 64, borderRadius: 32,
            background: '#fff', border: accentBorder,
            cursor: 'pointer', fontSize: 30, fontFamily: 'inherit',
            boxShadow: t.shadowSm, color: t.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>💾</button>
      </div>

      {/* ─ 도안 가로 스크롤 ─ */}
      <div style={{
        flex: '0 0 auto',
        padding: '0 24px 8px',
        display: 'flex', gap: 10,
        overflowX: 'auto', overflowY: 'hidden',
        alignItems: 'center',
      }}>
        {COLORING_ORDER.map((id) => {
          const x = COLORING_TEMPLATES[id];
          const active = id === currentId;
          return (
            <button key={id} onClick={() => setCurrentId(id)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
              style={{
                flex: '0 0 auto',
                width: 130, height: 64,
                background: active ? colorCat : '#fff',
                color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: t.cardRadius,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: active ? t.shadow : t.shadowSm,
                padding: '0 10px',
              }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{x.emoji}</span>
              <span style={{ fontSize: fontSize - 4, fontWeight: 900, whiteSpace: 'nowrap' }}>{x.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─ 캔버스 ─ */}
      <div style={{ flex: 1, padding: '8px 36px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{
          width: '100%', maxWidth: 760, height: '100%',
          background: '#fff', borderRadius: t.cardRadius,
          padding: 14, boxShadow: t.shadowSm,
          border: t.outline === 'none' ? 'none' : t.outline,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxSizing: 'border-box',
        }}>
          <svg viewBox={tpl.viewBox} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            {tpl.parts.map((p) => {
              const fill = fills[p.id] || '#FFFFFF';
              const hinted = hint === p.id;
              return (
                <path key={p.id} d={p.d}
                  fill={fill}
                  stroke={t.text} strokeWidth="3.5"
                  strokeLinejoin="round" strokeLinecap="round"
                  onClick={() => onFill(p.id)}
                  style={{
                    cursor: 'pointer',
                    transition: 'fill 0.45s ease',
                    transformOrigin: 'center',
                    animation: hinted ? 'kw-pulse 0.7s ease-in-out infinite' : 'none',
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* ─ 진행바 + 💡 힌트 ─ */}
      <div style={{ flex: '0 0 auto', padding: '6px 36px 8px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          flex: 1, height: 20,
          background: '#fff', borderRadius: 10,
          border: accentBorder,
          overflow: 'hidden', boxShadow: t.shadowSm,
          position: 'relative',
        }}>
          <div style={{
            width: `${(filledCount / totalParts) * 100}%`, height: '100%',
            background: `linear-gradient(90deg, ${colorCat} 0%, ${t.accent} 100%)`,
            transition: 'width 0.35s ease',
          }} />
        </div>
        <div style={{
          fontSize: fontSize - 2, fontWeight: 900, color: t.text,
          minWidth: 88, textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {filledCount}/{totalParts} 영역
        </div>
        <button onClick={showHint}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
          style={{
            height: 52, padding: '0 18px', borderRadius: 26,
            background: t.accent, color: t.text,
            border: t.outline === 'none' ? 'none' : t.outline,
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: fontSize - 2, fontWeight: 900,
            boxShadow: t.shadow,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>💡 힌트</button>
      </div>

      {/* ─ 12색 팔레트 ─ */}
      <div style={{
        flex: '0 0 auto', padding: '4px 24px 16px',
        display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center',
      }}>
        {COLOR_PALETTE.map((c) => {
          const active = color === c;
          const isWhite = c === '#FFFFFF';
          return (
            <button key={c} onClick={() => setColor(c)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.88)' }], { duration: 140 })}
              aria-label={isWhite ? '지우개' : `색상 ${c}`}
              style={{
                width: 56, height: 56, borderRadius: 28,
                background: c,
                border: active ? `4px solid ${t.text}` : isWhite ? `2px dashed rgba(0,0,0,0.35)` : `2px solid rgba(0,0,0,0.10)`,
                boxShadow: active ? `0 0 0 4px ${t.accent}, ${t.shadow}` : t.shadowSm,
                cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                transform: active ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {isWhite && <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>✕</span>}
            </button>
          );
        })}
      </div>

      {/* 저장 토스트 */}
      {saved && (
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.82)', color: '#fff',
          padding: '18px 32px', borderRadius: 32,
          fontSize: fontSize + 4, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'kw-toast 1.4s ease both',
          pointerEvents: 'none', zIndex: 50,
        }}>
          <span style={{ fontSize: 38 }}>💾</span>저장됐어!
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text="색을 골라 빈 곳을 콕 채워봐" fontSize={fontSize - 4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1-bis) 자유 색칠놀이 — 배경 + 캔버스 자유 드로잉 (풀스펙)
// 도구 4종(크레용/붓/마커/연필) + 지우개 + 12색 + 🌈 무지개 + 크기 3 + 투명도 3 + Undo/Redo + 스티커 + PNG 합성 저장
// ─────────────────────────────────────────────────────────────
const FREE_TOOLS = [
  { id: 'crayon', name: '크레용', emoji: '🖍️' },
  { id: 'brush',  name: '붓',    emoji: '🖌️' },
  { id: 'marker', name: '마커',   emoji: '🖊️' },
  { id: 'pencil', name: '연필',   emoji: '✏️' },
  { id: 'eraser', name: '지우개', emoji: '🧽' },
];
const FREE_SIZES = [
  { id: 's', label: '소', px: 10 },
  { id: 'm', label: '중', px: 22 },
  { id: 'l', label: '대', px: 38 },
];
const FREE_OPACITIES = [
  { id: 'light', label: '연하게', value: 0.35 },
  { id: 'mid',   label: '보통',   value: 0.7 },
  { id: 'full',  label: '진하게', value: 1.0 },
];
const FREE_STICKERS = ['⭐','❤️','🌟','🌈','🌸','🦋','🐶','🐱','😊','🎈','🍎','🎀'];
const FREE_COLOR_PALETTE = [
  '#FF4136', // 빨
  '#FF851B', // 주
  '#FFDC00', // 노
  '#2ECC40', // 초
  '#0074D9', // 파
  '#001F66', // 남
  '#7B2FBE', // 보
  '#FF69B4', // 분
  '#8B4513', // 갈
  '#FFFFFF', // 흰
  '#222222', // 검
];

// hex(#RRGGBB) → HSL hue (0~360). 무채색은 0 반환.
function hexToHue(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!m) return 0;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) h = ((b - r) / d + 2);
  else                h = ((r - g) / d + 4);
  return Math.round(h * 60);
}

function applyToolStyle(ctx, s) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 0;
  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = s.size * 1.6;
    return;
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = s.color;
  if (s.tool === 'crayon') {
    ctx.lineWidth = s.size;
    ctx.globalAlpha = Math.min(1, s.opacity * 0.75);
  } else if (s.tool === 'brush') {
    ctx.lineWidth = s.size * 1.45;
    ctx.globalAlpha = Math.min(1, s.opacity * 0.95);
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.size * 0.45;
  } else if (s.tool === 'marker') {
    ctx.lineWidth = s.size * 1.05;
    ctx.globalAlpha = Math.min(1, s.opacity);
  } else if (s.tool === 'pencil') {
    ctx.lineWidth = Math.max(2.5, s.size * 0.42);
    ctx.globalAlpha = Math.min(1, s.opacity * 0.9);
  } else {
    ctx.lineWidth = s.size;
    ctx.globalAlpha = s.opacity;
  }
}

function renderStroke(ctx, stroke) {
  applyToolStyle(ctx, stroke);
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;
  if (pts.length === 1) {
    const p = pts[0];
    if (stroke.tool === 'eraser') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
    } else {
      const prevFill = ctx.fillStyle;
      ctx.fillStyle = stroke.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = prevFill;
    }
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function FreeColoringActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const accent = t.cat.color;
  const colorCat = t.cat.color;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  const canvasRef = useRefA(null);
  const containerRef = useRefA(null);
  const drawingRef = useRefA(null);
  const actionsRef = useRefA([]);

  const [size, setSize] = useStateA({ w: 0, h: 0 });
  const [currentId, setCurrentId] = useStateA(COLORING_ORDER.includes(subId) ? subId : 'cat');
  const tpl = COLORING_TEMPLATES[currentId];
  const [tool, setTool] = useStateA('crayon');
  const [color, setColor] = useStateA(FREE_COLOR_PALETTE[0]);
  const [brushSize, setBrushSize] = useStateA('m');
  const [opacity, setOpacity] = useStateA('full');
  const [actions, setActions] = useStateA([]);
  const [redoStack, setRedoStack] = useStateA([]);
  const [armedSticker, setArmedSticker] = useStateA(null);
  const [showStickerPalette, setShowStickerPalette] = useStateA(false);
  const [hue, setHue] = useStateA(0);
  const [saved, setSaved] = useStateA(false);
  const [doneOnce, setDoneOnce] = useStateA(false);

  // actions ref 동기화 (resize 콜백에서 사용)
  actionsRef.current = actions;

  const sizePx = FREE_SIZES.find((s) => s.id === brushSize).px;
  const opacityVal = FREE_OPACITIES.find((o) => o.id === opacity).value;

  // 도안 변경 시 캔버스/액션 리셋
  useEffectA(() => {
    drawingRef.current = null;
    setActions([]);
    setRedoStack([]);
    setArmedSticker(null);
    setDoneOnce(false);
  }, [currentId]);

  // 컨테이너 크기 관찰 — padding-box(clientWidth/Height)를 기준으로 잡아야
  // border 두께만큼 캔버스 CSS 크기와 백킹 스토어가 어긋나지 않는다.
  useEffectA(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize((prev) => (prev.w === w && prev.h === h) ? prev : { w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 캔버스 백킹스토어 크기 조정
  useEffectA(() => {
    const cvs = canvasRef.current;
    if (!cvs || size.w === 0) return;
    const dpr = window.devicePixelRatio || 1;
    cvs.width = Math.floor(size.w * dpr);
    cvs.height = Math.floor(size.h * dpr);
    cvs.style.width = size.w + 'px';
    cvs.style.height = size.h + 'px';
  }, [size.w, size.h]);

  // actions/size 변경 시 전체 재렌더
  useEffectA(() => {
    const cvs = canvasRef.current;
    if (!cvs || size.w === 0) return;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    actions.forEach((a) => { if (a.type === 'stroke') renderStroke(ctx, a.stroke); });
  }, [actions, size.w, size.h]);

  const getPt = (e) => {
    const cvs = canvasRef.current;
    const r = cvs.getBoundingClientRect();
    // CSS 크기와 백킹 스토어 크기 사이의 스케일 보정 (브라우저 줌/리사이즈 직후 안전)
    const sx = r.width  > 0 ? size.w / r.width  : 1;
    const sy = r.height > 0 ? size.h / r.height : 1;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const p = getPt(e);
    if (armedSticker) {
      const sticker = { id: Date.now() + Math.random(), emoji: armedSticker, x: p.x, y: p.y, size: 64 };
      setActions((a) => [...a, { type: 'sticker', sticker }]);
      setRedoStack([]);
      setArmedSticker(null);
      playSfx('sticker');
      if (!doneOnce) { onComplete && onComplete(1); setDoneOnce(true); }
      return;
    }
    drawingRef.current = {
      tool, color, size: sizePx, opacity: opacityVal,
      points: [p],
    };
    // 즉시 점 찍기
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderStroke(ctx, drawingRef.current);
    startDraw(tool === 'eraser' ? 'erase' : 'draw');
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const p = getPt(e);
    const pts = drawingRef.current.points;
    pts.push(p);
    if (pts.length < 2) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    applyToolStyle(ctx, drawingRef.current);
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    drawTick(Math.hypot(b.x - a.x, b.y - a.y));
  };

  const onPointerUp = (e) => {
    if (!drawingRef.current) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    stopDraw();
    const stroke = drawingRef.current;
    drawingRef.current = null;
    setActions((a) => [...a, { type: 'stroke', stroke }]);
    setRedoStack([]);
    if (!doneOnce) { onComplete && onComplete(1); setDoneOnce(true); }
  };

  const undo = () => {
    if (!actions.length) return;
    const last = actions[actions.length - 1];
    setActions(actions.slice(0, -1));
    setRedoStack([last, ...redoStack]);
  };
  const redo = () => {
    if (!redoStack.length) return;
    const [first, ...rest] = redoStack;
    setActions([...actions, first]);
    setRedoStack(rest);
  };
  const reset = () => { setActions([]); setRedoStack([]); setArmedSticker(null); };

  const onSave = async () => {
    if (!actions.length) { setSaved(true); setTimeout(() => setSaved(false), 1400); return; }
    try {
      const W = 480;
      const aspect = size.h && size.w ? (size.h / size.w) : 0.6;
      const H = Math.round(W * aspect);
      const sx = W / Math.max(1, size.w);
      const sy = H / Math.max(1, size.h);

      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const oc = out.getContext('2d');
      // 흰 배경
      oc.fillStyle = '#FFFFFF';
      oc.fillRect(0, 0, W, H);
      // 스트로크는 별도 캔버스에 합성 (지우개의 destination-out이 배경을 침범하지 않도록)
      const sc = document.createElement('canvas');
      sc.width = W; sc.height = H;
      const scx = sc.getContext('2d');
      scx.scale(sx, sy);
      actions.forEach((a) => { if (a.type === 'stroke') renderStroke(scx, a.stroke); });
      oc.drawImage(sc, 0, 0);
      // 도안 윤곽선 (Path2D, viewBox 정렬은 SVG preserveAspectRatio="xMidYMid meet"와 동일하게)
      try {
        const parts = tpl.viewBox.trim().split(/\s+/).map(Number);
        const vx = parts[0] || 0, vy = parts[1] || 0;
        const vbW = parts[2] || W, vbH = parts[3] || H;
        const scale = Math.min(W / vbW, H / vbH);
        const dx = (W - vbW * scale) / 2 - vx * scale;
        const dy = (H - vbH * scale) / 2 - vy * scale;
        oc.save();
        oc.translate(dx, dy);
        oc.scale(scale, scale);
        oc.strokeStyle = '#222222';
        oc.lineJoin = 'round'; oc.lineCap = 'round';
        oc.lineWidth = 3.5 / scale; // 화면과 시각적으로 동일한 굵기
        tpl.parts.forEach((p) => { oc.stroke(new Path2D(p.d)); });
        oc.restore();
      } catch {}
      // 스티커 (윤곽선 위)
      actions.forEach((a) => {
        if (a.type === 'sticker') {
          const s = a.sticker;
          const px = Math.floor(s.size * sx);
          oc.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
          oc.textAlign = 'center';
          oc.textBaseline = 'middle';
          oc.fillText(s.emoji, s.x * sx, s.y * sy);
        }
      });
      const dataURL = out.toDataURL('image/png');
      const list = JSON.parse(localStorage.getItem('kw-gallery') || '[]');
      list.unshift({
        id: Date.now(),
        type: 'free',
        png: dataURL,
        savedAt: new Date().toISOString(),
      });
      if (list.length > 24) list.length = 24;
      localStorage.setItem('kw-gallery', JSON.stringify(list));
      onComplete && onComplete(3);
      onFinish && onFinish();
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const stickerActions = actions.filter((a) => a.type === 'sticker');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* 타이틀 + 우측 액션 (◀뒤로/⭐별은 셸이 그려줌) */}
      <div style={{ height: 88, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: fontSize + 12, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🖌️</span>자유 색칠놀이
        </div>
        <div style={{ position: 'absolute', top: 16, right: 130, display: 'flex', gap: 8 }}>
          <FreeTopBtn t={t} accentBorder={accentBorder} onClick={undo}  disabled={!actions.length}    icon="↩" label="되돌리기" />
          <FreeTopBtn t={t} accentBorder={accentBorder} onClick={redo}  disabled={!redoStack.length}  icon="↪" label="다시" />
          <FreeTopBtn t={t} accentBorder={accentBorder} onClick={reset} disabled={!actions.length}    icon="🔄" label="초기화" />
          <FreeTopBtn t={t} accentBorder={accentBorder} onClick={onSave} disabled={!actions.length}   icon="💾" label="저장" />
        </div>
      </div>

      {/* 도안 가로 스크롤 (영역 색칠과 동일한 패턴) */}
      <div style={{
        flex: '0 0 auto',
        padding: '0 24px 8px',
        display: 'flex', gap: 10,
        overflowX: 'auto', overflowY: 'hidden',
        alignItems: 'center',
      }}>
        {COLORING_ORDER.map((id) => {
          const x = COLORING_TEMPLATES[id];
          const active = id === currentId;
          return (
            <button key={id} onClick={() => setCurrentId(id)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
              style={{
                flex: '0 0 auto',
                width: 130, height: 64,
                background: active ? colorCat : '#fff',
                color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: t.cardRadius,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: active ? t.shadow : t.shadowSm,
                padding: '0 10px',
              }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>{x.emoji}</span>
              <span style={{ fontSize: fontSize - 4, fontWeight: 900, whiteSpace: 'nowrap' }}>{x.name}</span>
            </button>
          );
        })}
      </div>

      {/* 메인: 캔버스 + 도구바 */}
      <div style={{ flex: 1, display: 'flex', gap: 12, padding: '0 24px', minHeight: 0 }}>
        <div ref={containerRef} style={{
          flex: 1,
          background: '#fff',
          border: t.outline === 'none' ? 'none' : t.outline,
          borderRadius: t.cardRadius,
          boxShadow: t.shadowSm,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* 캔버스 (사용자 브러시) */}
          <canvas ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              position: 'absolute', inset: 0,
              touchAction: 'none',
              cursor: armedSticker ? 'cell' : 'crosshair',
            }} />
          {/* 도안 윤곽선 레이어 (캔버스 위, 항상 보임, 포인터 이벤트 차단 안 함) */}
          <svg viewBox={tpl.viewBox} preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              pointerEvents: 'none',
            }}>
            {tpl.parts.map((p) => (
              <path key={p.id} d={p.d}
                fill="none"
                stroke={t.text} strokeWidth="3.5"
                strokeLinejoin="round" strokeLinecap="round"
              />
            ))}
          </svg>
          {/* 스티커 레이어 (DOM, 화면 표시용) */}
          {stickerActions.map((a) => (
            <div key={a.sticker.id} style={{
              position: 'absolute',
              left: a.sticker.x, top: a.sticker.y,
              transform: 'translate(-50%, -50%)',
              fontSize: a.sticker.size, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.18))',
            }}>{a.sticker.emoji}</div>
          ))}
          {armedSticker && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(0,0,0,0.78)', color: '#fff',
              padding: '8px 14px', borderRadius: 18,
              fontSize: fontSize - 4, fontWeight: 800,
              pointerEvents: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 22 }}>{armedSticker}</span>
              <span>탭한 곳에 붙여요</span>
            </div>
          )}
        </div>

        {/* 우측 도구바 */}
        <div style={{ flex: '0 0 auto', width: 88, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FREE_TOOLS.map((tw) => {
            const active = tool === tw.id;
            return (
              <button key={tw.id} onClick={() => { setTool(tw.id); setArmedSticker(null); playToolVoice(tw.id); }}
                onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.92)'}],{duration:130})}
                style={{
                  flex: 1, minHeight: 0,
                  background: active ? accent : '#fff',
                  color: active ? t.textOnColor : t.text,
                  border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                  borderRadius: 18,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  boxShadow: active ? t.shadow : t.shadowSm,
                  padding: 4,
                  transform: active ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.12s, background 0.15s',
                }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{tw.emoji}</span>
                <span style={{ fontSize: fontSize - 12, fontWeight: 900 }}>{tw.name}</span>
              </button>
            );
          })}
          <button onClick={() => setShowStickerPalette((v) => { const nv = !v; if (nv) playToolVoice('sticker'); return nv; })}
            onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.92)'}],{duration:130})}
            style={{
              flex: 1, minHeight: 0,
              background: showStickerPalette ? accent : '#fff',
              color: showStickerPalette ? t.textOnColor : t.text,
              border: showStickerPalette ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
              borderRadius: 18,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              boxShadow: showStickerPalette ? t.shadow : t.shadowSm,
              padding: 4,
            }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>✨</span>
            <span style={{ fontSize: fontSize - 12, fontWeight: 900 }}>스티커</span>
          </button>
        </div>
      </div>

      {/* 스티커 팔레트 (토글) */}
      {showStickerPalette && (
        <div style={{
          padding: '8px 24px 0',
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {FREE_STICKERS.map((s) => {
            const active = armedSticker === s;
            return (
              <button key={s} onClick={() => { setArmedSticker(active ? null : s); playSfx('select'); }}
                onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.88)'}],{duration:130})}
                style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: active ? accent : '#fff',
                  border: active ? `3px solid ${t.text}` : `2px solid rgba(0,0,0,0.12)`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 30, lineHeight: 1,
                  boxShadow: active ? t.shadow : t.shadowSm,
                  padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{s}</button>
            );
          })}
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div style={{ padding: '8px 24px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 12색 팔레트 + "지금 색" 미리보기 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {FREE_COLOR_PALETTE.map((c) => {
            const active = color.toLowerCase() === c.toLowerCase();
            const isWhite = c === '#FFFFFF';
            return (
              <button key={c} onClick={() => { setColor(c); setHue(hexToHue(c)); }}
                onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.88)'}],{duration:130})}
                aria-label={`색상 ${c}`}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: c,
                  border: active ? `4px solid ${t.text}` : isWhite ? `2px dashed rgba(0,0,0,0.35)` : `2px solid rgba(0,0,0,0.10)`,
                  boxShadow: active ? `0 0 0 4px ${t.accent}, ${t.shadow}` : t.shadowSm,
                  cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                  transform: active ? 'translateY(-4px)' : 'translateY(0)',
                  transition: 'transform 0.12s',
                }} />
            );
          })}
          {/* "지금 색" 큰 미리보기 — 12색이든 슬라이더든 현재 사용 색을 표시 */}
          <div aria-label="현재 색"
            style={{
              marginLeft: 8,
              width: 56, height: 44, borderRadius: 14,
              background: color,
              border: `3px solid ${t.text}`,
              boxShadow: t.shadowSm,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.45)',
            }}>색</div>
        </div>
        {/* 무지개 슬라이더 — 상시 노출, 무지개 배경, 큰 thumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>🌈</span>
          <input type="range" min="0" max="360" value={hue}
            className="kw-rainbow-slider"
            onChange={(e) => { const h = Number(e.target.value); setHue(h); setColor(`hsl(${h}, 80%, 55%)`); }}
            style={{ flex: 1 }} />
        </div>
        {/* 크기 + 투명도 */}
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: fontSize - 6, fontWeight: 900, color: t.textMuted, marginRight: 4 }}>크기</span>
            {FREE_SIZES.map((s) => {
              const active = brushSize === s.id;
              const dotPx = s.id === 's' ? 10 : s.id === 'm' ? 18 : 28;
              return (
                <button key={s.id} onClick={() => setBrushSize(s.id)}
                  onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.9)'}],{duration:120})}
                  aria-label={`크기 ${s.label}`}
                  style={{
                    width: 56, height: 44, borderRadius: 14,
                    background: active ? accent : '#fff',
                    border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: active ? t.shadow : t.shadowSm,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}>
                  <span style={{
                    width: dotPx, height: dotPx, borderRadius: dotPx / 2,
                    background: active ? '#fff' : t.text, display: 'inline-block',
                  }} />
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: fontSize - 6, fontWeight: 900, color: t.textMuted, marginRight: 4 }}>투명도</span>
            {FREE_OPACITIES.map((o) => {
              const active = opacity === o.id;
              return (
                <button key={o.id} onClick={() => setOpacity(o.id)}
                  onPointerDown={(e) => e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.92)'}],{duration:120})}
                  style={{
                    minWidth: 70, height: 44, borderRadius: 14,
                    background: active ? accent : '#fff',
                    color: active ? t.textOnColor : t.text,
                    border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: fontSize - 6, fontWeight: 900,
                    boxShadow: active ? t.shadow : t.shadowSm,
                    padding: '0 10px',
                  }}>{o.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 저장 토스트 */}
      {saved && (
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.82)', color: '#fff',
          padding: '18px 32px', borderRadius: 32,
          fontSize: fontSize + 4, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'kw-toast 1.4s ease both',
          pointerEvents: 'none', zIndex: 50,
        }}>
          <span style={{ fontSize: 38 }}>💾</span>저장됐어!
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text="도구와 색을 골라 자유롭게 그려봐" fontSize={fontSize - 4} />
    </div>
  );
}

function FreeTopBtn({ t, accentBorder, onClick, disabled, icon, label }) {
  return (
    <button onClick={onClick} aria-label={label} disabled={disabled}
      onPointerDown={(e) => { if (!disabled) e.currentTarget.animate([{transform:'scale(1)'},{transform:'scale(0.92)'}],{duration:130}); }}
      style={{
        width: 56, height: 56, borderRadius: 28,
        background: '#fff', border: accentBorder,
        cursor: disabled ? 'default' : 'pointer', fontSize: 24, fontFamily: 'inherit',
        boxShadow: disabled ? 'none' : t.shadowSm, color: t.text,
        opacity: disabled ? 0.4 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// 2) 한글 — 자/모 학습 화면 (자음 익히기 Lv.1 / 모음 익히기 Lv.1)
// ─────────────────────────────────────────────────────────────
const CONSONANTS = [
  { ch: 'ㄱ', name: '기역', word: '기린',    emoji: '🦒' },
  { ch: 'ㄴ', name: '니은', word: '나비',    emoji: '🦋' },
  { ch: 'ㄷ', name: '디귿', word: '다람쥐',  emoji: '🐿️' },
  { ch: 'ㄹ', name: '리을', word: '라면',    emoji: '🍜' },
  { ch: 'ㅁ', name: '미음', word: '망고',    emoji: '🥭' },
  { ch: 'ㅂ', name: '비읍', word: '바나나',  emoji: '🍌' },
  { ch: 'ㅅ', name: '시옷', word: '사과',    emoji: '🍎' },
  { ch: 'ㅇ', name: '이응', word: '오리',    emoji: '🦆' },
  { ch: 'ㅈ', name: '지읒', word: '자전거',  emoji: '🚲' },
  { ch: 'ㅊ', name: '치읓', word: '치즈',    emoji: '🧀' },
  { ch: 'ㅋ', name: '키읔', word: '코끼리',  emoji: '🐘' },
  { ch: 'ㅌ', name: '티읕', word: '토끼',    emoji: '🐰' },
  { ch: 'ㅍ', name: '피읖', word: '포도',    emoji: '🍇' },
  { ch: 'ㅎ', name: '히읗', word: '하트',    emoji: '❤️' },
];
const VOWELS = [
  { ch: 'ㅏ', name: '아', word: '아빠',  emoji: '👨' },
  { ch: 'ㅑ', name: '야', word: '야구',  emoji: '⚾' },
  { ch: 'ㅓ', name: '어', word: '어항',  emoji: '🐠' },
  { ch: 'ㅕ', name: '여', word: '여우',  emoji: '🦊' },
  { ch: 'ㅗ', name: '오', word: '오리',  emoji: '🦆' },
  { ch: 'ㅛ', name: '요', word: '요리',  emoji: '🍳' },
  { ch: 'ㅜ', name: '우', word: '우유',  emoji: '🥛' },
  { ch: 'ㅠ', name: '유', word: '유리',  emoji: '🪟' },
  { ch: 'ㅡ', name: '으', word: '으름',  emoji: '🌫️' },
  { ch: 'ㅣ', name: '이', word: '이불',  emoji: '🛏️' },
];

function HangulActivity({ tone, subId, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const isVowels = subId === 'vowels';
  const data = isVowels ? VOWELS : CONSONANTS;
  const [idx, setIdx] = useStateA(0);
  const [collected, setCollected] = useStateA(() => new Set());
  const [pingKey, setPingKey] = useStateA(0); // 글자 탭 → 사운드 파동
  const cur = data[idx];
  const color = t.cat.hangul;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  // 글자/발음 버튼 탭 → 학습 완료 + 별
  const learn = () => {
    setPingKey((k) => k + 1);
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
  const next = () => setIdx((i) => (i + 1) % data.length);
  const prev = () => setIdx((i) => (i - 1 + data.length) % data.length);

  // 예시 단어 — 첫 글자에 색 강조
  const firstChar = cur.word.charAt(0);
  const restWord  = cur.word.slice(1);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* ─ 타이틀 ─ */}
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36, color: color }}>{isVowels ? 'ㅏ' : 'ㄱ'}</span>
          {isVowels ? '모음' : '자음'} 익히기
          <span style={{
            fontSize: fontSize - 2, fontWeight: 900,
            background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16,
            border: t.outline === 'none' ? 'none' : t.outline,
            marginLeft: 6,
          }}>Lv.1</span>
        </div>
      </div>

      {/* ─ 메인 row: ◀ | content | ▶ ─ */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        <HangulNavButton onClick={prev} dir="left" tone={t} />

        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minWidth: 0 }}>
          {/* 거대한 글자 + 발음 + 🔊 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button onClick={learn}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 150 })}
              style={{
                position: 'relative',
                width: 300, height: 300,
                background: color,
                border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: t.cardRadius + 12,
                fontSize: 220, fontWeight: 900, lineHeight: 1,
                color: t.textOnColor,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: t.shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
                overflow: 'hidden',
              }}>
              {cur.ch}
              {collected.has(idx) && (
                <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 44 }}>⭐</span>
              )}
              {/* 사운드 파동 */}
              <span key={pingKey} aria-hidden style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit',
                border: `6px solid ${t.accent}`,
                animation: pingKey ? 'kw-ring 0.7s ease-out' : 'none',
                pointerEvents: 'none',
              }} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
              {/* 발음 말풍선 */}
              <div style={{
                background: '#fff',
                border: accentBorder,
                borderRadius: 28,
                padding: '20px 28px',
                fontSize: 64, fontWeight: 900, lineHeight: 1,
                color: t.text,
                boxShadow: t.shadow,
                position: 'relative',
                whiteSpace: 'nowrap',
              }}>
                {cur.name}!
                <span style={{
                  position: 'absolute', left: -18, top: '50%', transform: 'translateY(-50%)',
                  width: 0, height: 0,
                  borderTop: '14px solid transparent',
                  borderBottom: '14px solid transparent',
                  borderRight: `20px solid ${t.text}`,
                }} />
              </div>
              {/* 🔊 들어보기 */}
              <button onClick={learn}
                onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                style={{
                  background: t.accent, color: t.text,
                  border: t.outline === 'none' ? 'none' : t.outline,
                  borderRadius: 36, padding: '14px 24px',
                  fontSize: fontSize + 4, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: t.shadow,
                  display: 'flex', alignItems: 'center', gap: 10,
                  height: 64,
                }}>
                <span style={{ fontSize: 30, lineHeight: 1 }}>🔊</span>들어보기
              </button>
            </div>
          </div>

          {/* 연관 예시 그림 */}
          <div style={{
            background: '#fff',
            border: t.outline === 'none' ? `4px solid ${color}` : t.outline,
            borderRadius: t.cardRadius + 8,
            padding: '12px 28px',
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: t.shadowSm,
            maxWidth: 480,
          }}>
            <span style={{ fontSize: 80, lineHeight: 1 }}>{cur.emoji}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: fontSize - 6, color: t.textMuted, fontWeight: 800, letterSpacing: '0.04em' }}>예시</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: t.text, lineHeight: 1, marginTop: 4 }}>
                <span style={{ color: color }}>{firstChar}</span>{restWord}
              </div>
            </div>
          </div>
        </div>

        <HangulNavButton onClick={next} dir="right" tone={t} />
      </div>

      {/* ─ 하단 자모 네비게이션 ─ */}
      <div style={{
        flex: '0 0 auto',
        padding: '6px 18px 14px',
        display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap',
      }}>
        {data.map((d, i) => {
          const active = i === idx;
          const learned = collected.has(i);
          return (
            <button key={i} onClick={() => setIdx(i)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 120 })}
              style={{
                flex: '0 0 auto',
                width: 56, height: 56,
                background: active ? color : '#fff',
                color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : `2px solid rgba(0,0,0,0.12)`,
                borderRadius: 14,
                fontSize: 28, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                position: 'relative',
                boxShadow: active ? t.shadow : t.shadowSm,
                padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {d.ch}
              {learned && (
                <span style={{
                  position: 'absolute', top: -8, right: -8,
                  fontSize: 20, lineHeight: 1,
                  filter: 'drop-shadow(0 1px 0 #fff)',
                }}>⭐</span>
              )}
            </button>
          );
        })}
      </div>

      <VoiceGuide tone={t} show={voiceShow} text={`${cur.ch}, ${cur.name}! ${cur.word}.`} fontSize={fontSize - 4} />
    </div>
  );
}

function HangulNavButton({ onClick, dir, tone }) {
  const t = tone;
  return (
    <button onClick={onClick} aria-label={dir === 'left' ? '이전' : '다음'}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
      style={{
        flex: '0 0 auto',
        width: 88, height: 168, borderRadius: 28,
        background: t.cat.hangul, color: t.textOnColor,
        border: t.outline === 'none' ? 'none' : t.outline,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: t.shadow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d={dir === 'left' ? 'M 26 6 L 12 20 L 26 34' : 'M 14 6 L 28 20 L 14 34'}
          stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 3-bis) 기초 덧셈 — 그림 + 숫자 등식 + 4지선다 + 10문항 진행
// ─────────────────────────────────────────────────────────────
function AdditionActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.math;
  const TOTAL_Q = 10;
  const maxOperand = subId === 'add10' ? 9 : 5;

  const newRound = () => {
    const a = 1 + Math.floor(Math.random() * maxOperand);
    const b = 1 + Math.floor(Math.random() * maxOperand);
    const target = a + b;
    const opts = new Set([target]);
    // 인접 오답 3개
    let tries = 0;
    while (opts.size < 4 && tries < 30) {
      const delta = Math.floor(Math.random() * 5) - 2; // -2..+2
      const cand = target + (delta === 0 ? (Math.random() < 0.5 ? -1 : 1) : delta);
      if (cand >= 1 && cand <= maxOperand * 2 + 2) opts.add(cand);
      tries++;
    }
    while (opts.size < 4) opts.add(opts.size + target + 1);
    const objIdx = Math.floor(Math.random() * MATH_OBJECTS.length);
    return { a, b, target, objIdx, opts: Array.from(opts).sort((x, y) => x - y) };
  };

  const [round, setRound] = useStateA(newRound);
  const [status, setStatus] = useStateA('q');         // q | right | wrong
  const [progress, setProgress] = useStateA(0);       // 정답 누적
  const [picked, setPicked] = useStateA(null);        // 선택된 오답 표시
  const [done, setDone] = useStateA(false);

  const onPick = (n) => {
    if (status !== 'q' || done) return;
    if (n === round.target) {
      setStatus('right');
      setPicked(n);
      onComplete && onComplete(1);
      const nextN = progress + 1;
      setProgress(nextN);
      setTimeout(() => {
        if (nextN >= TOTAL_Q) {
          setDone(true);
          onComplete && onComplete(3); // 완료 보너스
          onFinish && onFinish();
        } else {
          setRound(newRound()); setStatus('q'); setPicked(null);
        }
      }, 1100);
    } else {
      playSfx('wrong');
      setStatus('wrong');
      setPicked(n);
      setTimeout(() => { setStatus('q'); setPicked(null); }, 700);
    }
  };
  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* ─ 타이틀 ─ */}
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36, color }}>➕</span>
          기초 덧셈
          <span style={{
            fontSize: fontSize - 2, fontWeight: 900,
            background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16,
            border: t.outline === 'none' ? 'none' : t.outline,
            marginLeft: 6,
          }}>Lv.1</span>
        </div>
      </div>

      {!done ? (
        <React.Fragment>
          {/* ─ 문제 패널 ─ */}
          <div style={{ flex: 1, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            <div style={{
              width: '100%', height: '100%',
              background: color,
              border: t.outline === 'none' ? 'none' : t.outline,
              borderRadius: t.cardRadius + 8,
              padding: '22px 28px',
              boxShadow: t.shadow,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 18,
              transform: status === 'wrong' ? 'translateX(-6px)' : 'translateX(0)',
              transition: 'transform 0.08s',
              boxSizing: 'border-box',
            }}>
              {/* 그림 등식 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <FruitGroup n={round.a} obj={MATH_OBJECTS[round.objIdx]} tone={t} />
                <span style={{ fontSize: 64, fontWeight: 900, color: t.textOnColor, lineHeight: 1 }}>+</span>
                <FruitGroup n={round.b} obj={MATH_OBJECTS[round.objIdx]} tone={t} />
                <span style={{ fontSize: 64, fontWeight: 900, color: t.textOnColor, lineHeight: 1 }}>=</span>
                <div style={{
                  width: 108, height: 108, borderRadius: 22,
                  background: '#fff', color: t.text,
                  fontSize: 76, fontWeight: 900, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: t.outline === 'none' ? `4px dashed ${t.text}` : t.outline,
                  flex: '0 0 auto',
                }}>{status === 'right' ? round.target : '?'}</div>
              </div>

              {/* 숫자 등식 */}
              <div style={{
                background: '#fff',
                border: accentBorder,
                borderRadius: 18,
                padding: '6px 22px',
                fontSize: 40, fontWeight: 900, color: t.text,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.04em',
                boxShadow: t.shadowSm,
              }}>
                {round.a} + {round.b} = {status === 'right' ? round.target : '?'}
              </div>
            </div>
          </div>

          {/* ─ 4지선다 ─ */}
          <div style={{ flex: '0 0 auto', padding: '12px 32px 4px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {round.opts.map((n) => {
              const isRight = status === 'right' && n === round.target;
              const isWrong = status === 'wrong' && picked === n;
              return (
                <button key={n} onClick={() => onPick(n)}
                  onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{
                    height: 92, fontSize: 56, fontWeight: 900,
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    color: t.text,
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: t.shadow,
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'background 0.2s',
                  }}>{n}</button>
              );
            })}
          </div>

          {/* ─ 진행 도트 ─ */}
          <div style={{ flex: '0 0 auto', padding: '10px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
              {Array.from({ length: TOTAL_Q }).map((_, i) => {
                const filled = i < progress;
                return (
                  <span key={i} style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: filled ? color : '#fff',
                    border: filled ? (t.outline === 'none' ? 'none' : `2px solid ${t.text}`) : `2px solid rgba(0,0,0,0.18)`,
                    boxShadow: filled ? t.shadowSm : 'none',
                    transition: 'all 0.25s ease',
                    display: 'inline-block',
                  }} />
                );
              })}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text, fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right' }}>
              {progress}/{TOTAL_Q}
            </div>
          </div>
        </React.Fragment>
      ) : (
        // ─ 완료 화면 ─
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 32px 24px' }}>
          <div style={{ fontSize: 160, lineHeight: 1, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 28, fontWeight: 900, color: t.text }}>다 풀었어!</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fff', border: accentBorder, borderRadius: 999,
            padding: '10px 22px', boxShadow: t.shadowSm,
            fontSize: fontSize + 4, fontWeight: 900, color: t.text,
          }}>
            <span style={{ fontSize: 36 }}>⭐</span>
            {TOTAL_Q + 3}개 별 획득!
          </div>
          <button onClick={restart}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
            style={{
              background: color, color: t.textOnColor,
              border: t.outline === 'none' ? 'none' : t.outline,
              borderRadius: 32, padding: '18px 36px', marginTop: 8,
              fontSize: fontSize + 6, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: t.shadow,
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>🔄 다시 풀기</button>
        </div>
      )}

      <VoiceGuide tone={t}
        show={voiceShow}
        text={done ? '잘했어!' : status === 'right' ? '정답!' : `${round.a} 더하기 ${round.b}는?`}
        fontSize={fontSize - 4} />
    </div>
  );
}

function FruitGroup({ n, obj, tone }) {
  const t = tone;
  // 1~5는 한 줄, 6 이상은 두 줄
  const cols = n <= 5 ? n : Math.ceil(n / 2);
  const size = n <= 4 ? 46 : 36;
  return (
    <div style={{
      background: '#fff',
      border: t.outline === 'none' ? 'none' : t.outline,
      borderRadius: 18,
      padding: '10px 12px',
      minWidth: 96, minHeight: 96,
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 4,
      placeItems: 'center',
      boxShadow: 'inset 0 4px 0 rgba(0,0,0,0.05)',
      flex: '0 0 auto',
    }}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} style={{
          fontSize: size, lineHeight: 1,
          animation: `kw-pop 0.4s ease ${i * 0.06}s both`,
        }}>{obj}</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3) 수학 — 사물 N개 보여주고 정답 숫자 고르기
// ─────────────────────────────────────────────────────────────
const MATH_OBJECTS = ['🍎','🍊','🍋','🍌','🍇','🍓','🍑','🍒'];
function MathActivity({ tone, subId, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.math;
  const maxN = subId === 'count10' ? 10 : 5;
  const minN = subId === 'count10' ? 6 : 1;
  const newRound = () => {
    const target = Math.floor(Math.random() * (maxN - minN + 1)) + minN;
    const objIdx = Math.floor(Math.random() * MATH_OBJECTS.length);
    // 보기 4개 — 정답 + 근접 오답
    const opts = new Set([target]);
    while (opts.size < 4) opts.add(Math.max(1, Math.min(maxN, target + (Math.floor(Math.random() * 5) - 2))));
    const arr = Array.from(opts).sort(() => Math.random() - 0.5);
    return { target, objIdx, opts: arr };
  };
  const [round, setRound] = useStateA(newRound);
  const [status, setStatus] = useStateA('q'); // q | right | wrong
  const [streak, setStreak] = useStateA(0);

  const onPick = (n) => {
    if (status !== 'q') return;
    if (n === round.target) {
      setStatus('right');
      onComplete && onComplete(1);
      setStreak((s) => s + 1);
      setTimeout(() => { setRound(newRound()); setStatus('q'); }, 1200);
    } else {
      playSfx('wrong');
      setStatus('wrong');
      setTimeout(() => setStatus('q'), 700);
    }
  };

  return (
    <div style={{ padding: '88px 56px 28px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: fontSize + 8, fontWeight: 800, color: t.text }}>
          {subId === 'compare' ? '뭐가 더 많아?' : '몇 개일까?'}
        </div>
        <div style={{ fontSize: fontSize, color: t.textMuted, fontWeight: 700 }}>연속 정답 {streak}</div>
      </div>

      <div style={{
        flex: 1, background: color,
        border: t.outline === 'none' ? 'none' : t.outline,
        borderRadius: t.cardRadius + 4,
        padding: 28,
        boxShadow: t.shadow,
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
        gap: 16,
        transform: status === 'wrong' ? 'translateX(-4px)' : 'translateX(0)',
        transition: 'transform 0.08s',
      }}>
        {Array.from({ length: round.target }).map((_, i) => (
          <span key={i} style={{
            fontSize: round.target > 6 ? 72 : 92, lineHeight: 1,
            animation: `kw-pop 0.4s ease ${i * 0.05}s both`,
          }}>{MATH_OBJECTS[round.objIdx]}</span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {round.opts.map((n) => (
          <button key={n} onClick={() => onPick(n)}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
            style={{
              height: 96, fontSize: 56, fontWeight: 900,
              background: status === 'right' && n === round.target ? t.cat.code : '#fff',
              color: t.text,
              border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
              borderRadius: t.cardRadius,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: t.shadow,
            }}>{n}</button>
        ))}
      </div>

      <VoiceGuide tone={t} show={voiceShow} text={status === 'right' ? '정답! 🎉' : '몇 개인지 세어볼까?'} fontSize={fontSize - 4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4) 음악 — 피아노 (1옥타브: 흰 8 + 검 5) + 자유연주/따라치기/연습곡
// ─────────────────────────────────────────────────────────────
// 흰건반: 무지경(빨/주/노/연두/하늘/남/보/분홍) 색상 가이드
const PIANO_WHITE = [
  { id: 'C',  ko: '도', freq: 261.63, color: '#FF6B6B' },
  { id: 'D',  ko: '레', freq: 293.66, color: '#FF8A5C' },
  { id: 'E',  ko: '미', freq: 329.63, color: '#FFCB57' },
  { id: 'F',  ko: '파', freq: 349.23, color: '#98D6A6' },
  { id: 'G',  ko: '솔', freq: 392.00, color: '#87CEEB' },
  { id: 'A',  ko: '라', freq: 440.00, color: '#5C8AE6' },
  { id: 'B',  ko: '시', freq: 493.88, color: '#AA96DA' },
  { id: 'C5', ko: '도', freq: 523.25, color: '#F38181' },
];
// 검은건반 5개 — 'after'는 그 다음에 놓일 흰건반 인덱스(=경계)
const PIANO_BLACK = [
  { id: 'Cs', ko: '도#', freq: 277.18, after: 0 },
  { id: 'Ds', ko: '레#', freq: 311.13, after: 1 },
  { id: 'Fs', ko: '파#', freq: 369.99, after: 3 },
  { id: 'Gs', ko: '솔#', freq: 415.30, after: 4 },
  { id: 'As', ko: '라#', freq: 466.16, after: 5 },
];
// 연습곡 — 단순 스케일 / 아르페지오 패턴 (저작권 곡 아님)
const PIANO_SONGS = [
  { id: 's1', name: '오르락 내리락', emoji: '⛰️', notes: ['C','D','E','F','G','F','E','D','C'] },
  { id: 's2', name: '둥글둥글',     emoji: '🔵', notes: ['C','E','G','E','C','E','G','C5'] },
  { id: 's3', name: '깡총깡총',     emoji: '🐰', notes: ['C','G','D','A','E','B'] },
  { id: 's4', name: '계단 오르기',  emoji: '🪜', notes: ['C','D','C','E','D','F','E','G','F','A'] },
];

const MUSIC_MODES = [
  { id: 'free',   name: '자유연주', emoji: '🎹' },
  { id: 'follow', name: '따라치기', emoji: '🎼' },
  { id: 'song',   name: '연습곡',   emoji: '🎵' },
];

function MusicActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.music;
  const [mode, setMode] = useStateA('free');
  const [pressed, setPressed] = useStateA(null);
  const [pattern, setPattern] = useStateA([]);
  const [step, setStep] = useStateA(0);
  const [songId, setSongId] = useStateA(null);
  const [feedback, setFeedback] = useStateA(null); // 'ok' | 'wrong' | 'done'
  const [playedCount, setPlayedCount] = useStateA(new Set()); // 자유연주 진행
  const acRef = useRefA(null);
  const previewing = useRefA(false);

  // 모드 변경 시 초기화
  useEffectA(() => {
    setPattern([]); setStep(0); setSongId(null); setFeedback(null);
  }, [mode]);

  // 건반음은 공유 오디오 모듈 경유 → 효과음 음량 슬라이더 적용 + 단일 AudioContext
  const playSound = (freq) => playTone(freq);

  const tap = (note) => {
    if (previewing.current) return;
    setPressed(note.id);
    playSound(note.freq);
    setTimeout(() => setPressed((p) => (p === note.id ? null : p)), 180);

    // 자유연주 — 8가지 누르면 별
    if (mode === 'free') {
      const isWhite = PIANO_WHITE.some((w) => w.id === note.id);
      if (isWhite) {
        const next = new Set(playedCount);
        if (!next.has(note.id)) {
          next.add(note.id);
          setPlayedCount(next);
          if (next.size === PIANO_WHITE.length) { onComplete && onComplete(3); onFinish && onFinish(); }
          else if (next.size === 4) onComplete && onComplete(1);
        }
      }
      return;
    }

    // 따라치기 / 연습곡 — 정답 체크
    if ((mode === 'follow' || mode === 'song') && pattern.length && feedback !== 'done') {
      const expected = pattern[step];
      if (note.id === expected) {
        const nextStep = step + 1;
        if (nextStep >= pattern.length) {
          setStep(nextStep); setFeedback('done');
          onComplete && onComplete(mode === 'song' ? 3 : 2);
          onFinish && onFinish();
        } else {
          setStep(nextStep); setFeedback('ok');
          setTimeout(() => setFeedback((f) => (f === 'ok' ? null : f)), 220);
        }
      } else {
        playSfx('wrong');
        setFeedback('wrong');
        setTimeout(() => setFeedback((f) => (f === 'wrong' ? null : f)), 420);
      }
    }
  };

  const newFollow = () => {
    const noteIds = PIANO_WHITE.slice(0, 7).map((n) => n.id);
    const len = 4 + Math.floor(Math.random() * 3); // 4~6음
    const p = [];
    for (let i = 0; i < len; i++) p.push(noteIds[Math.floor(Math.random() * noteIds.length)]);
    setPattern(p); setStep(0); setFeedback(null);
  };
  const selectSong = (s) => { setSongId(s.id); setPattern(s.notes); setStep(0); setFeedback(null); };
  const replayPattern = () => { setStep(0); setFeedback(null); };
  const preview = async () => {
    if (previewing.current || !pattern.length) return;
    previewing.current = true; setStep(0); setFeedback(null);
    for (let i = 0; i < pattern.length; i++) {
      const n = PIANO_WHITE.find((w) => w.id === pattern[i]);
      if (n) {
        setPressed(n.id); playSound(n.freq);
        await new Promise((r) => setTimeout(r, 380));
        setPressed(null);
        await new Promise((r) => setTimeout(r, 70));
      }
    }
    previewing.current = false;
  };

  // 키보드 치수
  const WHITE_W = 110, WHITE_H = 280, BLACK_W = 60, BLACK_H = 172;
  const totalW = PIANO_WHITE.length * WHITE_W;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  // 현재 기대 노트 (가이드 글로우)
  const expectedId = (mode === 'follow' || mode === 'song') && feedback !== 'done' ? pattern[step] : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* ─ 타이틀 ─ */}
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🎵</span>피아노
        </div>
      </div>

      {/* ─ 모드 탭 ─ */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 10, justifyContent: 'center' }}>
        {MUSIC_MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
              style={{
                flex: '0 0 auto',
                minWidth: 180, height: 54,
                background: active ? color : '#fff',
                color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: 27,
                fontSize: fontSize - 2, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? t.shadow : t.shadowSm,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '0 18px',
              }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>{m.name}
            </button>
          );
        })}
      </div>

      {/* ─ 모드별 가이드 패널 ─ */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 6px', minHeight: 110 }}>
        {mode === 'free' && (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2,
            padding: '14px 22px', boxShadow: t.shadowSm,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ fontSize: fontSize, fontWeight: 800, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 30 }}>🎹</span>
              건반을 마음대로 눌러봐!
            </div>
            <div style={{
              fontSize: fontSize - 2, color: t.textMuted, fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {playedCount.size} / {PIANO_WHITE.length} 음
            </div>
          </div>
        )}

        {(mode === 'follow' || mode === 'song') && (
          <div style={{
            background: '#fff', border: accentBorder, borderRadius: t.cardRadius + 2,
            padding: '12px 16px', boxShadow: t.shadowSm,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {mode === 'song' ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {PIANO_SONGS.map((s) => (
                      <button key={s.id} onClick={() => selectSong(s)}
                        style={{
                          height: 40, padding: '0 14px',
                          background: songId === s.id ? color : '#F7F7F7',
                          color: songId === s.id ? t.textOnColor : t.text,
                          border: songId === s.id ? (t.outline === 'none' ? 'none' : t.outline) : `2px solid rgba(0,0,0,0.10)`,
                          borderRadius: 20, fontSize: fontSize - 4, fontWeight: 800,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}>
                        <span style={{ fontSize: 18 }}>{s.emoji}</span>{s.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button onClick={newFollow}
                    onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
                    style={{
                      height: 42, padding: '0 18px', borderRadius: 21,
                      background: t.accent, color: t.text,
                      border: t.outline === 'none' ? 'none' : t.outline,
                      fontSize: fontSize - 2, fontWeight: 900,
                      cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
                    }}>🎲 새 패턴</button>
                )}
              </div>
              {pattern.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={preview}
                    style={{
                      height: 38, padding: '0 14px', borderRadius: 19,
                      background: '#fff', color: t.text,
                      border: accentBorder,
                      fontSize: fontSize - 4, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>🔊 들어보기</button>
                  <button onClick={replayPattern}
                    style={{
                      height: 38, padding: '0 14px', borderRadius: 19,
                      background: '#fff', color: t.text,
                      border: accentBorder,
                      fontSize: fontSize - 4, fontWeight: 800,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>↻ 처음부터</button>
                </div>
              )}
            </div>

            {/* 패턴 칩 */}
            {pattern.length > 0 ? (
              <div style={{
                display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
                animation: feedback === 'wrong' ? 'kw-shake 0.4s ease' : 'none',
              }}>
                {pattern.map((nid, i) => {
                  const n = PIANO_WHITE.find((w) => w.id === nid);
                  const passed = i < step || feedback === 'done';
                  const isCurrent = i === step && feedback !== 'done';
                  return (
                    <div key={i} style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: passed ? n.color : '#fff',
                      border: isCurrent ? `3px solid ${t.text}` : `2px solid rgba(0,0,0,0.10)`,
                      color: passed ? t.textOnColor : t.text,
                      fontSize: 22, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isCurrent ? `0 0 0 3px ${t.accent}` : 'none',
                      transition: 'background 0.2s, box-shadow 0.15s',
                    }}>{n ? n.ko : '?'}</div>
                  );
                })}
                {feedback === 'done' && (
                  <div style={{
                    marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: fontSize - 2, fontWeight: 900, color: t.cat.code,
                  }}>🎉 잘했어!</div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700 }}>
                {mode === 'follow' ? '🎲 새 패턴을 눌러서 시작해봐' : '연주할 곡을 골라봐'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─ 피아노 키보드 ─ */}
      <div style={{ flex: 1, padding: '6px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <div style={{ position: 'relative', width: totalW, height: WHITE_H, maxWidth: '100%' }}>
          {/* 흰건반 */}
          <div style={{ display: 'flex', height: '100%' }}>
            {PIANO_WHITE.map((n, i) => {
              const active = pressed === n.id;
              const expected = expectedId === n.id;
              return (
                <button key={n.id} onPointerDown={() => tap(n)}
                  style={{
                    width: WHITE_W, height: '100%',
                    background: '#fff', color: t.text,
                    border: `2px solid rgba(0,0,0,0.10)`,
                    borderRight: i === PIANO_WHITE.length - 1 ? '2px solid rgba(0,0,0,0.10)' : 'none',
                    borderRadius: i === 0 ? '0 0 0 18px' : i === PIANO_WHITE.length - 1 ? '0 0 18px 0' : 0,
                    cursor: 'pointer', fontFamily: 'inherit',
                    padding: 0,
                    position: 'relative',
                    transform: active ? 'translateY(4px)' : 'translateY(0)',
                    boxShadow: active ? 'inset 0 6px 14px rgba(0,0,0,0.18)' : 'none',
                    transition: 'transform 0.09s, box-shadow 0.09s, background 0.18s',
                    backgroundColor: expected ? `${t.accent}` : '#fff',
                  }}>
                  {/* 무지개 색 하단 바 */}
                  <div style={{
                    position: 'absolute', left: 6, right: 6, bottom: 70,
                    height: 14, borderRadius: 7,
                    background: n.color,
                    boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.10)',
                  }} />
                  {/* 도/레/미 라벨 */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 16,
                    fontSize: 30, fontWeight: 900,
                    color: n.color,
                    textAlign: 'center', lineHeight: 1,
                    filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.06))',
                  }}>{n.ko}</div>
                  <div style={{
                    position: 'absolute', left: 0, right: 0, bottom: 2,
                    fontSize: 12, fontWeight: 800,
                    color: t.textMuted,
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{n.id}</div>
                </button>
              );
            })}
          </div>

          {/* 검은건반 */}
          {PIANO_BLACK.map((n) => {
            const active = pressed === n.id;
            const left = (n.after + 1) * WHITE_W - BLACK_W / 2;
            return (
              <button key={n.id} onPointerDown={(e) => { e.stopPropagation(); tap(n); }}
                style={{
                  position: 'absolute', top: 0, left,
                  width: BLACK_W, height: BLACK_H,
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 80%, #0a0a0a 100%)',
                  border: 'none',
                  borderRadius: '0 0 10px 10px',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: active
                    ? 'inset 0 6px 12px rgba(0,0,0,0.55)'
                    : '0 4px 0 #000, 0 6px 14px rgba(0,0,0,0.35)',
                  transform: active ? 'translateY(4px)' : 'translateY(0)',
                  transition: 'transform 0.08s, box-shadow 0.08s',
                  zIndex: 2,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 800,
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: 10,
                  opacity: 0.96,
                }}>
                <span style={{ opacity: 0.6 }}>{n.ko}</span>
              </button>
            );
          })}
        </div>
      </div>

      <VoiceGuide tone={t}
        show={voiceShow}
        text={mode === 'free' ? '마음대로 건반을 눌러봐!'
              : feedback === 'done' ? '와아! 완벽해!'
              : feedback === 'wrong' ? '다시 들어볼까?'
              : pattern.length ? `다음: ${PIANO_WHITE.find((w) => w.id === pattern[step])?.ko || ''}`
              : mode === 'follow' ? '새 패턴을 눌러봐' : '곡을 골라봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5) 두뇌게임 — 카드 뒤집기 (4×3 = 6쌍, 3D flip)
// ─────────────────────────────────────────────────────────────
const MEMORY_EMOJI = ['🐶','🐱','🐰','🦊','🐻','🐼','🦁','🐯','🐸','🐵'];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.brain;
  const PAIRS = 6;
  const COLS = 4;

  const buildDeck = () => {
    const picked = shuffle(MEMORY_EMOJI).slice(0, PAIRS);
    return shuffle([...picked, ...picked]).map((e, i) => ({ id: i, e, matched: false }));
  };
  const [cards, setCards] = useStateA(buildDeck);
  const [flipped, setFlipped] = useStateA([]); // 현재 펼친 인덱스 (최대 2)
  const [locked, setLocked] = useStateA(false);
  const [attempts, setAttempts] = useStateA(0);
  const [missFlash, setMissFlash] = useStateA(null); // 잘못 짝지은 인덱스 쌍
  const pairsFound = cards.filter((c) => c.matched).length / 2;
  const allMatched = pairsFound === PAIRS;
  const wonRef = useRefA(false);

  useEffectA(() => {
    if (allMatched && !wonRef.current) {
      wonRef.current = true;
      onComplete && onComplete(3);
      onFinish && onFinish();
    }
  }, [allMatched]);

  const onFlip = (i) => {
    if (locked) return;
    if (cards[i].matched) return;
    if (flipped.includes(i)) return;
    const nf = [...flipped, i];
    setFlipped(nf);
    if (nf.length === 2) {
      setLocked(true);
      setAttempts((a) => a + 1);
      const [a, b] = nf;
      if (cards[a].e === cards[b].e) {
        // 정답
        playSfx('correct');
        setTimeout(() => {
          setCards((cs) => cs.map((c, idx) => (idx === a || idx === b) ? { ...c, matched: true } : c));
          setFlipped([]); setLocked(false);
        }, 650);
      } else {
        // 오답 — 흔들리고 뒤집기
        playSfx('wrong');
        setMissFlash([a, b]);
        setTimeout(() => {
          setFlipped([]); setLocked(false); setMissFlash(null);
        }, 1000);
      }
    }
  };

  const restart = () => {
    wonRef.current = false;
    setCards(buildDeck());
    setFlipped([]); setLocked(false); setAttempts(0); setMissFlash(null);
  };

  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* ─ 타이틀 ─ */}
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🃏</span>
          카드 뒤집기
          <span style={{
            fontSize: fontSize - 2, fontWeight: 900,
            background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16,
            border: t.outline === 'none' ? 'none' : t.outline,
            marginLeft: 6,
          }}>Lv.1</span>
        </div>
      </div>

      {/* ─ 정보바 ─ */}
      <div style={{
        flex: '0 0 auto',
        padding: '0 28px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
      }}>
        <div style={{
          background: '#fff', borderRadius: 999,
          padding: '8px 20px',
          border: accentBorder,
          fontSize: fontSize, fontWeight: 900, color: t.text,
          boxShadow: t.shadowSm,
          display: 'flex', alignItems: 'center', gap: 8,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>🎯</span>
          시도 횟수 <span style={{ color: color }}>{attempts}</span>
        </div>
        <div style={{
          background: '#fff', borderRadius: 999,
          padding: '8px 20px',
          border: accentBorder,
          fontSize: fontSize, fontWeight: 900, color: t.text,
          boxShadow: t.shadowSm,
          display: 'flex', alignItems: 'center', gap: 8,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>💑</span>
          짝 찾기 <span style={{ color: color }}>{pairsFound}/{PAIRS}</span>
        </div>
        <button onClick={restart}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
          style={{
            background: t.accent, color: t.text,
            border: t.outline === 'none' ? 'none' : t.outline,
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: fontSize - 2, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: t.shadowSm,
          }}>🔄 새 게임</button>
      </div>

      {/* ─ 카드 그리드 (4×3) ─ */}
      <div style={{
        flex: 1, padding: '0 28px 8px',
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(cards.length / COLS)}, 1fr)`,
        gap: 16,
        minHeight: 0,
      }}>
        {cards.map((c, i) => {
          const open = flipped.includes(i) || c.matched;
          const isMissing = missFlash && missFlash.includes(i);
          return (
            <div key={c.id} onClick={() => onFlip(i)}
              style={{
                perspective: 1000,
                cursor: c.matched ? 'default' : 'pointer',
                animation: isMissing ? 'kw-shake 0.5s ease' : 'none',
              }}>
              <div style={{
                position: 'relative',
                width: '100%', height: '100%',
                transformStyle: 'preserve-3d',
                transform: open ? 'rotateY(180deg)' : 'rotateY(0)',
                transition: 'transform 0.55s cubic-bezier(.34,1.2,.4,1)',
              }}>
                {/* 뒷면 ❓ */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: color,
                  border: t.outline === 'none' ? 'none' : t.outline,
                  borderRadius: t.cardRadius,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 80, lineHeight: 1, color: t.textOnColor, fontWeight: 900,
                  boxShadow: t.shadow,
                  backgroundImage: t.id === 'C' ? 'none' : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.32), transparent 60%)`,
                }}>
                  <span style={{
                    fontSize: 60, opacity: 0.9,
                    textShadow: '0 3px 0 rgba(0,0,0,0.18)',
                  }}>❓</span>
                </div>
                {/* 앞면 (정답 그림) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#fff',
                  border: c.matched ? `4px solid ${t.cat.code}` : accentBorder,
                  borderRadius: t.cardRadius,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 88, lineHeight: 1,
                  boxShadow: c.matched ? `0 0 0 4px ${t.cat.code}33, ${t.shadowSm}` : t.shadowSm,
                  opacity: c.matched ? 0.92 : 1,
                  position: 'relative',
                }}>
                  <span>{c.e}</span>
                  {c.matched && (
                    <span style={{
                      position: 'absolute', top: 8, right: 10,
                      fontSize: 28, lineHeight: 1,
                      animation: 'kw-pop 0.4s ease both',
                    }}>✅</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 완료 토스트 */}
      {allMatched && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          background: t.cat.code, color: t.textOnColor,
          padding: '22px 36px', borderRadius: 32,
          fontSize: fontSize + 10, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'kw-toast 1.8s ease both',
          pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: 56 }}>🎉</span>
          다 찾았어! <span style={{ fontSize: fontSize, opacity: 0.85, marginLeft: 4 }}>{attempts}번 만에!</span>
        </div>
      )}

      <VoiceGuide tone={t}
        show={voiceShow}
        text={allMatched ? '와! 다 맞췄어!' : flipped.length === 2 ? '같은 그림일까?' : '같은 짝을 찾아봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6) 코딩 놀이 — 5×5 격자맵 + 명령 큐 + 실행
// ─────────────────────────────────────────────────────────────
const CODING_GRID = 5;
const CODING_LEVEL = {
  start: { x: 0, y: 0 },
  goal:  { x: 4, y: 4 },
  obstacles: [
    { x: 3, y: 0 }, { x: 1, y: 1 }, { x: 3, y: 2 },
    { x: 2, y: 3 }, { x: 0, y: 4 },
  ],
};
const CODING_DIRS = [
  { id: 'up',    label: '⬆', dx: 0,  dy: -1, name: '위' },
  { id: 'down',  label: '⬇', dx: 0,  dy: 1,  name: '아래' },
  { id: 'left',  label: '⬅', dx: -1, dy: 0,  name: '왼쪽' },
  { id: 'right', label: '➡', dx: 1,  dy: 0,  name: '오른쪽' },
];

function CodingActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.code;
  const level = CODING_LEVEL;
  const [commands, setCommands] = useStateA([]);
  const [charPos, setCharPos] = useStateA(level.start);
  const [status, setStatus] = useStateA('idle'); // idle | running | success | fail
  const [stepIdx, setStepIdx] = useStateA(-1);
  const wonRef = useRefA(false);

  const reset = () => {
    setCommands([]);
    setCharPos(level.start);
    setStatus('idle');
    setStepIdx(-1);
  };
  const softReset = () => {
    setCharPos(level.start);
    setStatus('idle');
    setStepIdx(-1);
  };

  const addCmd = (dirId) => {
    if (status === 'running') return;
    if (status === 'success' || status === 'fail') softReset();
    setCommands((c) => [...c, dirId]);
  };
  const removeCmd = (i) => {
    if (status === 'running') return;
    setCommands((c) => c.filter((_, idx) => idx !== i));
  };

  const run = async () => {
    if (status === 'running' || !commands.length) return;
    setStatus('running');
    setCharPos(level.start);
    setStepIdx(-1);
    let pos = level.start;
    await new Promise((r) => setTimeout(r, 200));
    for (let i = 0; i < commands.length; i++) {
      setStepIdx(i);
      const dir = CODING_DIRS.find((d) => d.id === commands[i]);
      const next = { x: pos.x + dir.dx, y: pos.y + dir.dy };
      // 경계 / 장애물 검사
      const oob = next.x < 0 || next.x >= CODING_GRID || next.y < 0 || next.y >= CODING_GRID;
      const hit = level.obstacles.some((o) => o.x === next.x && o.y === next.y);
      if (oob || hit) { setStatus('fail'); return; }
      pos = next;
      setCharPos(pos);
      await new Promise((r) => setTimeout(r, 440));
      if (pos.x === level.goal.x && pos.y === level.goal.y) {
        setStatus('success');
        if (!wonRef.current) { wonRef.current = true; onComplete && onComplete(3); onFinish && onFinish(); }
        return;
      }
    }
    // 명령 다 썼는데 목표 못 감
    setStatus('fail');
  };

  // 격자 셀 크기
  const CELL = 76, GAP = 8;
  const boardSize = CODING_GRID * CELL + (CODING_GRID - 1) * GAP;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* ─ 타이틀 ─ */}
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🤖</span>
          코딩 놀이
          <span style={{
            fontSize: fontSize - 2, fontWeight: 900,
            background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16,
            border: t.outline === 'none' ? 'none' : t.outline,
            marginLeft: 6,
          }}>스테이지 1</span>
        </div>
      </div>

      {/* ─ 메인 row: 격자 | 명령패널 ─ */}
      <div style={{ flex: 1, display: 'flex', gap: 18, padding: '0 24px', minHeight: 0, alignItems: 'flex-start' }}>
        {/* 격자맵 */}
        <div style={{
          flex: '0 0 auto',
          background: '#fff',
          borderRadius: t.cardRadius + 4,
          padding: 14,
          border: t.outline === 'none' ? 'none' : t.outline,
          boxShadow: t.shadow,
          position: 'relative',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${CODING_GRID}, ${CELL}px)`,
            gridAutoRows: `${CELL}px`,
            gap: GAP,
            width: boardSize,
            height: boardSize,
          }}>
            {Array.from({ length: CODING_GRID * CODING_GRID }).map((_, i) => {
              const x = i % CODING_GRID, y = Math.floor(i / CODING_GRID);
              const isObs = level.obstacles.some((o) => o.x === x && o.y === y);
              const isGoal = level.goal.x === x && level.goal.y === y;
              const isStart = level.start.x === x && level.start.y === y;
              return (
                <div key={i} style={{
                  background: isObs ? '#3a3a40' : '#F7F7F7',
                  border: isObs ? 'none' : `2px dashed rgba(0,0,0,0.10)`,
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: CELL - 28, lineHeight: 1,
                  position: 'relative',
                }}>
                  {isGoal && <span style={{ fontSize: CELL - 20, filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.15))', animation: 'kw-pop 0.6s ease both' }}>⭐</span>}
                  {isObs && <span style={{ fontSize: CELL - 36 }}>🧱</span>}
                  {isStart && !isGoal && (
                    <span style={{
                      position: 'absolute', inset: 6, borderRadius: 10,
                      border: `3px dashed ${color}`,
                      opacity: 0.55,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          {/* 캐릭터 */}
          <div style={{
            position: 'absolute',
            left: 14 + charPos.x * (CELL + GAP),
            top:  14 + charPos.y * (CELL + GAP),
            width: CELL, height: CELL,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: CELL - 16, lineHeight: 1,
            transition: 'left 0.4s cubic-bezier(.34,1.4,.6,1), top 0.4s cubic-bezier(.34,1.4,.6,1)',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
            pointerEvents: 'none',
          }}>🏠</div>
        </div>

        {/* 우측 패널 */}
        <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* 명령 순서 */}
          <div style={{
            flex: 1,
            background: '#fff',
            border: accentBorder,
            borderRadius: t.cardRadius + 4,
            padding: '14px 16px',
            boxShadow: t.shadowSm,
            display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: fontSize - 2, fontWeight: 900, color: t.textMuted, letterSpacing: '0.04em' }}>📝 명령 순서</div>
              <div style={{ fontSize: fontSize - 4, color: t.textMuted, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{commands.length}개</div>
            </div>
            <div style={{
              flex: 1, minHeight: 0,
              display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start',
              gap: 8, padding: 10,
              background: '#F7F7F7',
              borderRadius: t.cardRadius - 4,
              border: '2px dashed rgba(0,0,0,0.10)',
              overflow: 'auto',
            }}>
              {commands.length === 0 && (
                <div style={{ alignSelf: 'center', width: '100%', textAlign: 'center', color: t.textMuted, fontSize: fontSize - 4, fontWeight: 700 }}>
                  아래 화살표를 눌러 명령을 만들어요
                </div>
              )}
              {commands.map((c, i) => {
                const dir = CODING_DIRS.find((d) => d.id === c);
                const active = stepIdx === i;
                return (
                  <button key={i} onClick={() => removeCmd(i)} aria-label={`명령 ${i + 1} 삭제`}
                    onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.88)' }], { duration: 130 })}
                    style={{
                      width: 52, height: 52,
                      fontSize: 30, lineHeight: 1,
                      background: active ? t.accent : color,
                      color: active ? t.text : t.textOnColor,
                      border: active ? `3px solid ${t.text}` : (t.outline === 'none' ? 'none' : t.outline),
                      borderRadius: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                      padding: 0,
                      boxShadow: active ? `0 0 0 4px ${t.accent}55, ${t.shadow}` : t.shadowSm,
                      transition: 'background 0.15s, box-shadow 0.15s',
                    }}>{dir.label}</button>
                );
              })}
            </div>
            <div style={{ fontSize: fontSize - 6, color: t.textMuted }}>탭하면 삭제돼요</div>
          </div>

          {/* 실행 / 초기화 */}
          <div style={{ flex: '0 0 auto', display: 'flex', gap: 12 }}>
            <button onClick={run} disabled={status === 'running' || !commands.length}
              onPointerDown={(e) => !e.currentTarget.disabled && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{
                flex: 2, height: 76,
                background: t.cat.code, color: t.textOnColor,
                border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 38,
                fontSize: fontSize + 6, fontWeight: 900,
                cursor: (status === 'running' || !commands.length) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: t.shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: (status === 'running' || !commands.length) ? 0.55 : 1,
              }}>
              <span style={{ fontSize: 30 }}>▶</span>실행
            </button>
            <button onClick={reset}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{
                flex: 1, height: 76,
                background: '#fff', color: t.text,
                border: accentBorder,
                borderRadius: 38,
                fontSize: fontSize + 4, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: t.shadowSm,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <span style={{ fontSize: 28 }}>🗑</span>초기화
            </button>
          </div>
        </div>
      </div>

      {/* ─ 하단 방향 블록 ─ */}
      <div style={{
        flex: '0 0 auto',
        padding: '14px 24px 18px',
        display: 'flex', justifyContent: 'center', gap: 14,
      }}>
        {CODING_DIRS.map((d) => (
          <button key={d.id} onClick={() => addCmd(d.id)} aria-label={d.name}
            onPointerDown={(e) => e.currentTarget.animate(
              [{ transform: 'scale(1) translateY(0)' }, { transform: 'scale(0.92) translateY(2px)' }],
              { duration: 130 })}
            style={{
              width: 80, height: 80,
              background: '#fff', color: t.text,
              border: accentBorder,
              borderRadius: 18,
              fontSize: 44, lineHeight: 1,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: t.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
              position: 'relative',
            }}>
            {d.label}
            <span style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 11, fontWeight: 800, color: t.textMuted }}>drag</span>
          </button>
        ))}
      </div>

      {/* 결과 토스트 */}
      {(status === 'success' || status === 'fail') && (
        <div style={{
          position: 'absolute', top: '36%', left: '50%', transform: 'translate(-50%, -50%)',
          background: status === 'success' ? t.cat.code : t.cat.shape,
          color: t.textOnColor,
          padding: '22px 36px', borderRadius: 32,
          fontSize: fontSize + 10, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 14,
          animation: 'kw-toast 1.6s ease both',
          pointerEvents: 'none', zIndex: 50,
          boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        }}>
          <span style={{ fontSize: 56 }}>{status === 'success' ? '🎉' : '💥'}</span>
          {status === 'success' ? '도착했어!' : '어이쿠! 다시 해볼까?'}
        </div>
      )}

      <VoiceGuide tone={t}
        show={voiceShow}
        text={status === 'success' ? '성공!' : status === 'fail' ? '다시 도전!' : '🏠를 ⭐까지 보내봐'}
        fontSize={fontSize - 4} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 활동 라우터
// ─────────────────────────────────────────────────────────────
function Activity({ tone, cat, sub, fontSize, onComplete, onFinish, voiceShow }) {
  if (cat.id === 'color') {
    if (sub?.id === 'free') return <FreeColoringActivity tone={tone} subId={sub?.tplId} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
    return <ColoringActivity tone={tone} subId={sub?.id || 'cat'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  }
  if (cat.id === 'hangul') return <HangulActivity   tone={tone} subId={sub?.id || 'consonants'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  if (cat.id === 'math')   return (sub?.id === 'add5' || sub?.id === 'add10')
    ? <AdditionActivity tone={tone} subId={sub?.id || 'add5'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />
    : <MathActivity     tone={tone} subId={sub?.id || 'count5'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  if (cat.id === 'music')  return <MusicActivity    tone={tone} subId={sub?.id || 'piano'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  if (cat.id === 'brain')  return <MemoryActivity   tone={tone} subId={sub?.id || 'memory'} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  if (cat.id === 'code')   return <CodingActivity   tone={tone} fontSize={fontSize} onComplete={onComplete} onFinish={onFinish} voiceShow={voiceShow} />;
  return <PlaceholderScreen tone={tone} cat={cat} fontSize={fontSize} />;
}

export { Activity, COLORING_TEMPLATES }
