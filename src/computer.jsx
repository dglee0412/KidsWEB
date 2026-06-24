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

function rand(min, max) { return min + Math.random() * (max - min); }

// 터치 튜토리얼 — 탭/드래그/스와이프 순차
function TouchTutorialActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const idRef = useRefA(1);
  const [gi, setGi] = useStateA(0);
  const g = TOUCH_GESTURES[gi];
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [balloons, setBalloons] = useStateA([]);
  const [itemPos, setItemPos] = useStateA({ x: 28, y: 45 });
  const [dragging, setDragging] = useStateA(false);
  const [swipeX, setSwipeX] = useStateA(0);
  const swipeStart = useRefA(null);

  const setupGesture = (idx) => {
    const gg = TOUCH_GESTURES[idx];
    setProgress(0); setSwipeX(0); setDragging(false);
    if (gg.id === 'tap') setBalloons(Array.from({ length: gg.count }, () => ({ id: idRef.current++, x: rand(14, 86), y: rand(18, 78) })));
    else setBalloons([]);
    if (gg.id === 'drag') setItemPos({ x: rand(14, 38), y: rand(28, 68) });
    speakKo(gg.prompt);
  };
  useEffectA(() => { setupGesture(gi); }, [gi]);

  const finishGesture = () => {
    if (gi >= TOUCH_GESTURES.length - 1) { setDone(true); onComplete && onComplete(3); }
    else setGi(gi + 1);
  };
  const repDone = () => {
    playSfx('correct'); onComplete && onComplete(1);
    const np = progress + 1;
    if (np >= g.count) finishGesture();
    else {
      setProgress(np);
      if (g.id === 'drag') setItemPos({ x: rand(14, 38), y: rand(28, 68) });
      if (g.id === 'swipe') setSwipeX(0);
    }
  };

  // 탭: 풍선 터뜨리기
  const popBalloon = (id) => {
    playSfx('select'); onComplete && onComplete(1);
    setBalloons((b) => {
      const rest = b.filter((x) => x.id !== id);
      if (rest.length === 0) finishGesture();
      return rest;
    });
  };

  // 드래그: 사과 → 바구니
  const pct = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
             y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const itemDown = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDragging(true); };
  const itemMove = (e) => { if (!dragging) return; setItemPos(pct(e)); };
  const itemUp = (e) => {
    if (!dragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDragging(false);
    const p = pct(e);
    if (p.x > 68 && p.y > 58) repDone();
    else setItemPos({ x: rand(14, 38), y: rand(28, 68) });
  };

  // 스와이프: 카드 밀기
  const swDown = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} swipeStart.current = e.clientX; };
  const swMove = (e) => { if (swipeStart.current == null) return; setSwipeX(e.clientX - swipeStart.current); };
  const swUp = (e) => {
    if (swipeStart.current == null) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    const dx = e.clientX - swipeStart.current; swipeStart.current = null;
    if (Math.abs(dx) > 120) repDone();
    else setSwipeX(0);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>👆</span>터치 연습
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>{g.name}</span>
        </div>
      </div>

      {!done ? (
        <React.Fragment>
          <button onClick={() => speakKo(g.prompt)}
            style={{ flex: '0 0 auto', alignSelf: 'center', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: accentBorder, borderRadius: 24, padding: '10px 22px', boxShadow: t.shadowSm, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 24 }}>🔊</span><span style={{ fontSize: fontSize + 4, fontWeight: 900, color: t.text }}>{g.prompt}</span>
          </button>

          <div ref={stageRef} style={{ flex: 1, position: 'relative', margin: '0 28px 14px', borderRadius: 18,
            background: t.surfaceAlt || '#FAFAFA', border: accentBorder, overflow: 'hidden', touchAction: 'none', minHeight: 0 }}>
            {g.id === 'tap' && balloons.map((b) => (
              <button key={b.id} onClick={() => popBalloon(b.id)}
                style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 72, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, touchAction: 'none' }}>{g.emoji}</button>
            ))}
            {g.id === 'drag' && (
              <React.Fragment>
                <div style={{ position: 'absolute', right: '6%', bottom: '6%', fontSize: 96, lineHeight: 1 }}>{g.target}</div>
                <div onPointerDown={itemDown} onPointerMove={itemMove} onPointerUp={itemUp} onPointerCancel={itemUp}
                  style={{ position: 'absolute', left: `${itemPos.x}%`, top: `${itemPos.y}%`, transform: 'translate(-50%, -50%)',
                    fontSize: 72, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{g.emoji}</div>
              </React.Fragment>
            )}
            {g.id === 'swipe' && (
              <div onPointerDown={swDown} onPointerMove={swMove} onPointerUp={swUp} onPointerCancel={swUp}
                style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${swipeX}px), -50%) rotate(${swipeX / 20}deg)`,
                  width: 150, height: 200, borderRadius: 18, background: '#fff', border: accentBorder, boxShadow: t.shadow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 90, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{g.emoji}</div>
            )}
          </div>

          <div style={{ flex: '0 0 auto', padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {TOUCH_GESTURES.map((_, i) => (
                <span key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < gi ? color : i === gi ? t.accent : '#fff',
                  border: i <= gi ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{g.count}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>다 했어요!</div>
          <button onClick={() => { setGi(0); setDone(false); }}
            style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
              padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>🔄 다시</button>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : g.prompt} fontSize={fontSize - 4} />
    </div>
  );
}

// 마우스 놀이 — 가상 커서 + 클릭/더블클릭/드래그
function MousePlayActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.computer;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const [ti, setTi] = useStateA(0);
  const task = MOUSE_TASKS[ti];
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const [cursor, setCursor] = useStateA({ x: 50, y: 60 });
  const [targetPos, setTargetPos] = useStateA({ x: 50, y: 40 });
  const [opened, setOpened] = useStateA(false);   // double: 상자 열림
  const [dragging, setDragging] = useStateA(false);
  const lastTap = useRefA(0);

  const pct = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
             y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) };
  };
  const setupTask = (idx) => {
    setProgress(0); setOpened(false); setDragging(false);
    setTargetPos({ x: rand(25, 75), y: rand(22, 55) });
    speakKo(MOUSE_TASKS[idx].prompt);
  };
  useEffectA(() => { setupTask(ti); }, [ti]);

  const onStageMove = (e) => { const p = pct(e); setCursor({ x: p.x, y: Math.max(0, p.y - 6) }); };

  const finishTask = () => {
    if (ti >= MOUSE_TASKS.length - 1) { setDone(true); onComplete && onComplete(3); }
    else setTi(ti + 1);
  };
  const repDone = () => {
    playSfx('correct'); onComplete && onComplete(1);
    const np = progress + 1;
    if (np >= task.count) finishTask();
    else { setProgress(np); setOpened(false); setTargetPos({ x: rand(25, 75), y: rand(22, 55) }); }
  };

  // 클릭: 별 탭
  const onClickTarget = () => { if (task.id === 'click') repDone(); };
  // 더블클릭: 빠른 두 번 탭
  const onBoxTap = () => {
    if (task.id !== 'double' || opened) return;
    const now = Date.now();
    if (now - lastTap.current < 450) { lastTap.current = 0; setOpened(true); playSfx('select'); setTimeout(repDone, 500); }
    else { lastTap.current = now; playSfx('select'); }
  };
  // 드래그: 선물을 상자로 (상자는 우하단 고정, 선물 targetPos 이동)
  const giftDown = (e) => { if (task.id !== 'drag') return; e.stopPropagation(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDragging(true); };
  const giftMove = (e) => { if (task.id !== 'drag' || !dragging) return; setTargetPos(pct(e)); };
  const giftUp = (e) => {
    if (task.id !== 'drag' || !dragging) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDragging(false);
    const p = pct(e);
    if (p.x > 66 && p.y > 58) repDone();
    else setTargetPos({ x: rand(25, 60), y: rand(22, 50) });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🖱️</span>마우스 놀이
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>{task.name}</span>
        </div>
      </div>

      {!done ? (
        <React.Fragment>
          <button onClick={() => speakKo(task.prompt)}
            style={{ flex: '0 0 auto', alignSelf: 'center', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff', border: accentBorder, borderRadius: 24, padding: '10px 22px', boxShadow: t.shadowSm, cursor: 'pointer', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 24 }}>🔊</span><span style={{ fontSize: fontSize + 4, fontWeight: 900, color: t.text }}>{task.prompt}</span>
          </button>

          <div ref={stageRef} onPointerMove={onStageMove}
            style={{ flex: 1, position: 'relative', margin: '0 28px 14px', borderRadius: 18,
              background: t.surfaceAlt || '#FAFAFA', border: accentBorder, overflow: 'hidden', touchAction: 'none', minHeight: 0, cursor: 'none' }}>
            {/* 클릭 타겟 */}
            {task.id === 'click' && (
              <button onClick={onClickTarget}
                style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 80, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{task.emoji}</button>
            )}
            {/* 더블클릭 상자 */}
            {task.id === 'double' && (
              <button onClick={onBoxTap}
                style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                  fontSize: 88, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{opened ? task.open : task.emoji}</button>
            )}
            {/* 드래그: 선물 + 상자 */}
            {task.id === 'drag' && (
              <React.Fragment>
                <div style={{ position: 'absolute', right: '6%', bottom: '6%', fontSize: 96, lineHeight: 1 }}>{task.target}</div>
                <div onPointerDown={giftDown} onPointerMove={giftMove} onPointerUp={giftUp} onPointerCancel={giftUp}
                  style={{ position: 'absolute', left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)',
                    fontSize: 72, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{task.emoji}</div>
              </React.Fragment>
            )}
            {/* 가상 커서 */}
            <div style={{ position: 'absolute', left: `${cursor.x}%`, top: `${cursor.y}%`, transform: 'translate(-30%, -20%)',
              fontSize: 44, lineHeight: 1, pointerEvents: 'none', zIndex: 50, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>🖱️</div>
          </div>

          <div style={{ flex: '0 0 auto', padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {MOUSE_TASKS.map((_, i) => (
                <span key={i} style={{ flex: 1, height: 12, borderRadius: 6, background: i < ti ? color : i === ti ? t.accent : '#fff',
                  border: i <= ti ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{task.count}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>다 했어요!</div>
          <button onClick={() => { setTi(0); setDone(false); }}
            style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
              padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>🔄 다시</button>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : task.prompt} fontSize={fontSize - 4} />
    </div>
  );
}
