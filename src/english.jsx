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
  { targets: 1, options: 4, questions: 6 },
  { targets: 1, options: 4, questions: 8 },
  { targets: 1, options: 6, questions: 10 },
  { targets: 2, options: 6, questions: 8 },
  { targets: 3, options: 8, questions: 10 },
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

// 대문자/소문자 플래시카드 — HangulActivity 미러. subId: 'upper' | 'lower'
function AlphabetActivity({ tone, subId, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const isLower = subId === 'lower';
  const color = t.cat.english;
  const [idx, setIdx] = useS(0);
  const [collected, setCollected] = useS(() => new Set());
  const cur = ALPHABET[idx];
  const glyph = isLower ? cur.l : cur.u;

  const learn = () => {
    speakEn(`${cur.u}. ${cur.word}`);
    if (!collected.has(idx)) {
      const ns = new Set(collected); ns.add(idx); setCollected(ns);
      onComplete && onComplete(1);
    }
  };
  const next = () => setIdx((i) => (i + 1) % ALPHABET.length);
  const prev = () => setIdx((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
  const navBtn = (onClick, label) => (
    <button onClick={onClick}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 120 })}
      style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', border: accent(t), color: t.text,
        fontSize: 32, fontFamily: 'inherit', cursor: 'pointer', boxShadow: t.shadow, flex: '0 0 auto' }}>{label}</button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon={isLower ? 'a' : 'A'} title={isLower ? '소문자 abc' : '대문자 ABC'} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        {navBtn(prev, '◀')}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minWidth: 0 }}>
          <button onClick={learn}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 150 })}
            style={{ position: 'relative', width: 300, height: 300, background: color,
              border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 12,
              fontSize: 200, fontWeight: 900, lineHeight: 1, color: t.textOnColor, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            {glyph}
            {collected.has(idx) && <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 44 }}>⭐</span>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#fff', border: accent(t),
            borderRadius: t.cardRadius + 8, padding: '12px 26px', boxShadow: t.shadowSm }}>
            <span style={{ fontSize: 72, lineHeight: 1 }}>{cur.emoji}</span>
            <div style={{ fontSize: 48, fontWeight: 900, color: t.text }}>
              <span style={{ color }}>{isLower ? cur.l : cur.u}</span>{cur.word.slice(1)}
            </div>
            <button onClick={learn}
              style={{ background: t.accent, color: t.text, border: t.outline === 'none' ? 'none' : t.outline,
                borderRadius: 36, padding: '12px 18px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 26 }}>🔊</span>듣기
            </button>
          </div>
        </div>
        {navBtn(next, '▶')}
      </div>
      <div style={{ flex: '0 0 auto', padding: '6px 16px 14px', display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
        {ALPHABET.map((a, i) => {
          const active = i === idx; const learned = collected.has(i);
          return (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: 38, height: 38, borderRadius: 10, fontSize: 18, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : `2px solid rgba(0,0,0,0.12)`,
                boxShadow: learned ? `0 0 0 2px ${t.accent}` : 'none' }}>{isLower ? a.l : a.u}</button>
          );
        })}
      </div>
      <VoiceGuide tone={t} show={voiceShow} text={`${cur.u} is for ${cur.word}!`} fontSize={fontSize - 4} />
    </div>
  );
}

// 파닉스 — 🔊 글자 소리 듣고 보기에서 고르기. 레벨(LevelStepper, 항상 1부터).
function PhonicsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [levelIdx, setLevelIdx] = useS(0);
  const cfg = englishLevelConfig(levelIdx);
  const newRound = () => {
    const target = Math.floor(Math.random() * ALPHABET.length);
    return { target, opts: phonicsOptions(target, cfg.options, ALPHABET.length) };
  };
  const [round, setRound] = useS(newRound);
  const [status, setStatus] = useS('q'); // q|right|wrong
  const [picked, setPicked] = useS(null);
  const [progress, setProgress] = useS(0);
  const [done, setDone] = useS(false);

  useE(() => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); }, [levelIdx]);

  const say = () => speakEn(ALPHABET[round.target].u);
  useE(() => { const id = setTimeout(say, 350); return () => clearTimeout(id); }, [round]);

  const pick = (i) => {
    if (status !== 'q' || done) return;
    if (i === round.target) {
      playSfx('correct'); setStatus('right'); setPicked(i);
      speakEn(`${ALPHABET[i].u}. ${ALPHABET[i].word}`);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); setStatus('q'); setPicked(null); }
      }, 950);
    } else { playSfx('wrong'); setStatus('wrong'); setPicked(i); setTimeout(() => { setStatus('q'); setPicked(null); }, 650); }
  };
  const nextLevel = () => { if (levelIdx < 2) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🔊" title="파닉스"
        levelStepper={<LevelStepper tone={t} cur={levelIdx} total={3} onPrev={prevLevel} onNext={nextLevel} />} />
      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 0, padding: '0 32px' }}>
            <div style={{ fontSize: fontSize, fontWeight: 800, color: t.textMuted }}>소리를 듣고 맞는 글자를 골라봐</div>
            <button onClick={say}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ width: 200, height: 200, borderRadius: 100, background: color, color: t.textOnColor,
                border: t.outline === 'none' ? 'none' : t.outline, fontSize: 96, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: t.shadow, animation: status === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>🔊</button>
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${cfg.options}, 1fr)`, gap: 14 }}>
            {round.opts.map((i) => {
              const isRight = status === 'right' && i === round.target;
              const isWrong = status === 'wrong' && picked === i;
              return (
                <button key={i} onClick={() => pick(i)}
                  onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ height: 96, fontSize: 56, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow }}>
                  {ALPHABET[i].u}
                </button>
              );
            })}
          </div>
          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: cfg.questions }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{cfg.questions}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>
            {levelIdx < 2 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accent(t), borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < 2 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '소리를 듣고 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}

// 단어 맞추기 — 그림(이모지) 보고 영어 단어 고르기. 레벨.
function EnglishWordsActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [levelIdx, setLevelIdx] = useS(0);
  const cfg = englishLevelConfig(levelIdx);
  const newRound = () => {
    const target = WORD_SET[Math.floor(Math.random() * WORD_SET.length)];
    return { target, opts: wordOptions(target.word, cfg.options, WORD_SET) };
  };
  const [round, setRound] = useS(newRound);
  const [status, setStatus] = useS('q');
  const [picked, setPicked] = useS(null);
  const [progress, setProgress] = useS(0);
  const [done, setDone] = useS(false);

  useE(() => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); }, [levelIdx]);

  const pick = (w) => {
    if (status !== 'q' || done) return;
    if (w === round.target.word) {
      playSfx('correct'); setStatus('right'); setPicked(w); speakEn(round.target.word);
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      setTimeout(() => {
        if (n >= cfg.questions) { setDone(true); onComplete && onComplete(3); }
        else { setRound(newRound()); setStatus('q'); setPicked(null); }
      }, 950);
    } else { playSfx('wrong'); setStatus('wrong'); setPicked(w); setTimeout(() => { setStatus('q'); setPicked(null); }, 650); }
  };
  const nextLevel = () => { if (levelIdx < 2) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };
  const restart = () => { setProgress(0); setDone(false); setStatus('q'); setPicked(null); setRound(newRound()); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🧩" title="단어 맞추기"
        levelStepper={<LevelStepper tone={t} cur={levelIdx} total={3} onPrev={prevLevel} onNext={nextLevel} />} />
      {!done ? (
        <React.Fragment>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0 32px' }}>
            <div style={{ background: color, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: t.cardRadius + 8,
              padding: '24px 48px', boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: status === 'wrong' ? 'kw-shake 0.4s ease' : 'none' }}>
              <span style={{ fontSize: 180, lineHeight: 1 }}>{round.target.emoji}</span>
            </div>
          </div>
          <div style={{ flex: '0 0 auto', padding: '14px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(cfg.options, WORD_SET.length)}, 1fr)`, gap: 14 }}>
            {round.opts.map((w) => {
              const isRight = status === 'right' && w === round.target.word;
              const isWrong = status === 'wrong' && picked === w;
              return (
                <button key={w} onClick={() => pick(w)}
                  onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ height: 88, fontSize: 34, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                    background: isRight ? t.cat.code : isWrong ? t.cat.shape : '#fff',
                    border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline, borderRadius: t.cardRadius, boxShadow: t.shadow }}>
                  {w}
                </button>
              );
            })}
          </div>
          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: cfg.questions }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{cfg.questions}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>
            {levelIdx < 2 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accent(t), borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < 2 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}
      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '그림에 맞는 단어를 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}

// 따라쓰기 — 큰 대문자 가이드 위에 그리기. 획 누적 길이가 임계치 넘으면 완료→다음 글자.
function EnglishTraceActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [idx, setIdx] = useS(0);
  const [doneSet, setDoneSet] = useS(() => new Set());
  const [drawn, setDrawn] = useS(0);   // 누적 길이(px)
  const cur = ALPHABET[idx];
  const canvasRef = useR(null);
  const drawing = useR(false);
  const last = useR(null);
  const wonRef = useR(false);
  const THRESH = 1400; // 완료 임계 길이(px)

  const reset = () => {
    setDrawn(0); wonRef.current = false;
    const c = canvasRef.current; if (c) { const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); }
  };
  useE(() => { reset(); }, [idx]);

  const pos = (e) => {
    const c = canvasRef.current; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const down = (e) => { drawing.current = true; last.current = pos(e); speakEn(cur.u); };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e); const l = last.current;
    const c = canvasRef.current; const ctx = c.getContext('2d');
    ctx.strokeStyle = color; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    const d = Math.hypot(p.x - l.x, p.y - l.y); last.current = p;
    setDrawn((v) => {
      const nv = v + d;
      if (nv >= THRESH && !wonRef.current) {
        wonRef.current = true;
        if (!doneSet.has(idx)) { const ns = new Set(doneSet); ns.add(idx); setDoneSet(ns); onComplete && onComplete(2); }
      }
      return nv;
    });
  };
  const up = () => { drawing.current = false; last.current = null; };
  const next = () => setIdx((i) => (i + 1) % ALPHABET.length);
  const prev = () => setIdx((i) => (i - 1 + ALPHABET.length) % ALPHABET.length);
  const navBtn = (onClick, label) => (
    <button onClick={onClick} style={{ width: 72, height: 72, borderRadius: 36, background: '#fff', border: accent(t),
      color: t.text, fontSize: 32, fontFamily: 'inherit', cursor: 'pointer', boxShadow: t.shadow, flex: '0 0 auto' }}>{label}</button>
  );
  const pct = Math.min(100, Math.round((drawn / THRESH) * 100));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon="✏️" title={`따라쓰기 — ${cur.u}`} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', minHeight: 0 }}>
        {navBtn(prev, '◀')}
        <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <div style={{ position: 'relative', width: 460, height: 460, maxWidth: '100%', maxHeight: '100%',
            background: '#fff', border: accent(t), borderRadius: t.cardRadius + 8, boxShadow: t.shadow, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 360, fontWeight: 900, color: 'rgba(0,0,0,0.10)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{cur.u}</div>
            <canvas ref={canvasRef} width={460} height={460}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }} />
            {doneSet.has(idx) && <span style={{ position: 'absolute', top: 12, right: 16, fontSize: 48 }}>⭐</span>}
          </div>
        </div>
        {navBtn(next, '▶')}
      </div>
      <div style={{ flex: '0 0 auto', padding: '8px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, height: 16, borderRadius: 8, background: '#eee', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.1s' }} />
        </div>
        <button onClick={reset} style={{ height: 48, padding: '0 18px', borderRadius: 24, background: t.accent, color: t.text,
          border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>↺ 지우기</button>
      </div>
      <VoiceGuide tone={t} show={voiceShow} text={doneSet.has(idx) ? '잘했어!' : `${cur.u}를 따라 써봐`} fontSize={fontSize - 4} />
    </div>
  );
}

// ABC 노래 — A~Z 격자. ▶ 누르면 순서대로 하이라이트하며 speakEn. 탭하면 그 글자 발음.
function AbcSongActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.english;
  const [playIdx, setPlayIdx] = useS(-1); // 재생 중 하이라이트 인덱스
  const [isPlaying, setIsPlaying] = useS(false);
  const playing = useR(false);
  const wonRef = useR(false);
  const timersRef = useR([]);
  const addT = (id) => timersRef.current.push(id);
  useE(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const stop = () => {
    playing.current = false; setIsPlaying(false); setPlayIdx(-1);
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
  };
  const play = () => {
    if (playing.current) { stop(); return; }
    playing.current = true; setIsPlaying(true);
    ALPHABET.forEach((a, i) => {
      addT(setTimeout(() => {
        if (!playing.current) return;
        setPlayIdx(i); speakEn(a.u, { rate: 0.9 });
        if (i === ALPHABET.length - 1) {
          addT(setTimeout(() => {
            playing.current = false; setIsPlaying(false); setPlayIdx(-1);
            if (!wonRef.current) { wonRef.current = true; onComplete && onComplete(3); }
          }, 700));
        }
      }, i * 700));
    });
  };
  const tapLetter = (a) => { if (!playing.current) speakEn(a.u); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <TitleBar t={t} fontSize={fontSize} icon="🎵" title="ABC 노래" />
      <div style={{ flex: '0 0 auto', padding: '0 32px 10px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={play}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }], { duration: 140 })}
          style={{ height: 60, padding: '0 28px', borderRadius: 30, background: color, color: t.textOnColor,
            border: t.outline === 'none' ? 'none' : t.outline, fontSize: fontSize + 4, fontWeight: 900, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>{isPlaying ? '⏸' : '▶'}</span>{isPlaying ? '멈추기' : '노래 부르기'}
        </button>
      </div>
      <div style={{ flex: 1, padding: '0 28px 18px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: '1fr', gap: 12, minHeight: 0, alignContent: 'center' }}>
        {ALPHABET.map((a, i) => {
          const active = playIdx === i;
          return (
            <button key={a.u} onClick={() => tapLetter(a)}
              style={{ borderRadius: 16, fontSize: 44, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? color : '#fff', color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : `3px solid rgba(0,0,0,0.10)`,
                boxShadow: active ? `0 0 0 4px ${t.accent}, ${t.shadow}` : t.shadowSm,
                transform: active ? 'translateY(-3px)' : 'none', transition: 'all 0.12s', minHeight: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span>{a.u}</span><span style={{ fontSize: 22, opacity: 0.6 }}>{a.l}</span>
            </button>
          );
        })}
      </div>
      <VoiceGuide tone={t} show={voiceShow} text="▶를 눌러 노래하거나 글자를 눌러봐" fontSize={fontSize - 4} />
    </div>
  );
}

// 라우터 — subId로 분기. activities.jsx 디스패처가 이걸 호출.
export function EnglishActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'lower' || subId === 'upper') return <AlphabetActivity {...p} subId={subId} />;
  if (subId === 'trace')   return <EnglishTraceActivity {...p} />;
  if (subId === 'phonics') return <PhonicsActivity {...p} />;
  if (subId === 'words')   return <EnglishWordsActivity {...p} />;
  if (subId === 'song')    return <AbcSongActivity {...p} />;
  return <AlphabetActivity {...p} subId="upper" />;
}
