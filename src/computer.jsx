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

const TYPING_QUESTIONS = 5;
const TYPING_LEVELS = 3;

// 공용 키보드 — explore(자유 탐색) | type(타자 연습)
function KeyboardActivity({ tone, fontSize, onComplete, onFinish, voiceShow, mode }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const isType = mode === 'type';
  const [lang, setLang] = useStateA('ko');
  const layout = lang === 'ko' ? KEYBOARD_KO : KEYBOARD_EN;
  const flatKeys = layout.flat();
  const [pressed, setPressed] = useStateA(null);   // explore: 마지막 누른 키
  const [levelIdx, setLevelIdx] = useStateA(0);
  const [target, setTarget] = useStateA(() => (mode === 'type' ? pickTypingTarget(KEYBOARD_KO.flat(), null) : null));
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [wrongKey, setWrongKey] = useStateA(null);
  const wrongTimer = useRefA(null);
  const showHint = isType && levelIdx === 0;

  useEffectA(() => () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); }, []);
  // 레벨/언어 변경 → 타자 라운드 리셋
  useEffectA(() => {
    if (!isType) return;
    setProgress(0); setDone(false); setTarget(pickTypingTarget((lang === 'ko' ? KEYBOARD_KO : KEYBOARD_EN).flat(), null));
  }, [levelIdx, lang]);

  const onKey = (key) => {
    if (!isType) { setPressed(key); speakKo(key); playSfx('select'); return; }
    if (done) return;
    if (key === target) {
      playSfx('correct'); speakKo(key); onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      if (n >= TYPING_QUESTIONS) { setDone(true); onComplete && onComplete(3); }
      else setTarget(pickTypingTarget(flatKeys, target));
    } else {
      playSfx('wrong'); setWrongKey(key);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongKey(null), 500);
    }
  };
  const restart = () => { setProgress(0); setDone(false); setTarget(pickTypingTarget(flatKeys, target)); };
  const nextLevel = () => { if (levelIdx < TYPING_LEVELS - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  const keyBtn = (key) => {
    const isTarget = isType && key === target;
    const isWrong = wrongKey === key;
    return (
      <button key={key} onClick={() => onKey(key)}
        onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 110 })}
        style={{ position: 'relative', width: 78, height: 72, borderRadius: t.cardRadius - 4, fontFamily: 'inherit',
          fontSize: 34, fontWeight: 900, cursor: 'pointer', color: t.text,
          background: showHint && isTarget ? t.accent : '#fff',
          border: showHint && isTarget ? `4px solid ${color}` : accentBorder,
          boxShadow: t.shadowSm, animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
        {key}
        {isWrong && <PickMark kind="wrong" />}
      </button>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{isType ? '🔤' : '⌨️'}</span>{isType ? '타자 연습' : '가상 키보드'}
          {isType && <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>}
        </div>
        {isType && <LevelStepper tone={t} cur={levelIdx} total={TYPING_LEVELS} onPrev={prevLevel} onNext={nextLevel} />}
      </div>

      {/* 한/영 토글 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 8, justifyContent: 'center' }}>
        {[['ko', '한글'], ['en', '영어']].map(([id, name]) => (
          <button key={id} onClick={() => { setLang(id); setPressed(null); }}
            style={{ height: 40, padding: '0 20px', borderRadius: 20, background: lang === id ? color : '#fff', color: lang === id ? t.textOnColor : t.text,
              border: lang === id ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{name}</button>
        ))}
      </div>

      {!done ? (
        <React.Fragment>
          {/* 표시 영역 */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, padding: '0 28px' }}>
            {isType ? (
              <button onClick={() => target && speakKo(target)}
                style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: accentBorder, borderRadius: 28,
                  padding: '14px 30px', boxShadow: t.shadow, cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: 28 }}>🔊</span>
                <span style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text }}>찾아봐:</span>
                <span style={{ fontSize: 72, fontWeight: 900, color: color, lineHeight: 1 }}>{target}</span>
              </button>
            ) : (
              <div style={{ width: 220, height: 220, borderRadius: 32, background: '#fff', border: accentBorder, boxShadow: t.shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 130, fontWeight: 900, color: t.text }}>
                {pressed || '⌨️'}
              </div>
            )}
          </div>

          {/* 키보드 */}
          <div style={{ flex: '0 0 auto', padding: '8px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {layout.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 8 }}>{row.map(keyBtn)}</div>
            ))}
          </div>

          {isType && (
            <div style={{ flex: '0 0 auto', padding: '0 32px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                {Array.from({ length: TYPING_QUESTIONS }).map((_, i) => (
                  <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                    border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
                ))}
              </div>
              <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{TYPING_QUESTIONS}</div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < TYPING_LEVELS - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < TYPING_LEVELS - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow}
        text={isType ? (done ? '잘했어!' : '글자를 키보드에서 찾아 눌러봐') : '키를 눌러서 글자 소리를 들어봐'} fontSize={fontSize - 4} />
    </div>
  );
}
