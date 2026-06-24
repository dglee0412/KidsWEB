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

function MessengerActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [levelIdx, setLevelIdx] = useStateA(0);
  const [round, setRound] = useStateA(() => buildMessengerRound(0, MESSENGER_LEVELS));
  const [chat, setChat] = useStateA([]);            // [{ who:'them'|'me', text?, emoji? }]
  const [progress, setProgress] = useStateA(0);
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const startRound = (lvl) => {
    const r = buildMessengerRound(lvl, MESSENGER_LEVELS);
    setRound(r); setChat([{ who: 'them', text: r.ask }]);
    addTimer(setTimeout(() => speakKo(r.ask), 300));
  };
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    setProgress(0); setDone(false); mp.reset(); startRound(levelIdx);
  }, [levelIdx]);

  const onPick = (emoji) => {
    if (done) return;
    const lvl = levelIdx;
    const res = mp.pick(emoji, [round.answer]);
    if (res === 'wrong') playSfx('wrong');
    else if (res === 'complete') {
      playSfx('correct');
      setChat((c) => [...c, { who: 'me', emoji }, { who: 'them', emoji: '😊' }]);
      addTimer(setTimeout(() => speakKo('좋아!'), 250));
      onComplete && onComplete(1);
      const n = progress + 1; setProgress(n);
      addTimer(setTimeout(() => {
        if (n >= MESSENGER_QUESTIONS) { setDone(true); onComplete && onComplete(3); }
        else { timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; mp.reset(); startRound(lvl); }
      }, 1200));
    }
  };
  const restart = () => { setProgress(0); setDone(false); mp.reset(); startRound(levelIdx); };
  const nextLevel = () => { if (levelIdx < MESSENGER_LEVELS.length - 1) setLevelIdx(levelIdx + 1); else onFinish && onFinish(); };
  const prevLevel = () => { if (levelIdx > 0) setLevelIdx(levelIdx - 1); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>💬</span>메신저 놀이
          <span style={{ fontSize: fontSize - 2, fontWeight: 900, background: t.accent, color: t.text,
            padding: '4px 14px', borderRadius: 16, border: t.outline === 'none' ? 'none' : t.outline, marginLeft: 6 }}>Lv.{levelIdx + 1}</span>
        </div>
        <LevelStepper tone={t} cur={levelIdx} total={MESSENGER_LEVELS.length} onPrev={prevLevel} onNext={nextLevel} />
      </div>

      {!done ? (
        <React.Fragment>
          {/* 채팅 말풍선 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 36px', overflow: 'auto', minHeight: 0 }}>
            {chat.map((m, i) => {
              const me = m.who === 'me';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '70%', background: me ? color : '#fff', color: me ? t.textOnColor : t.text,
                    border: me ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, borderRadius: 24,
                    padding: m.emoji ? '10px 16px' : '14px 20px', fontSize: m.emoji ? 48 : fontSize + 4, fontWeight: 900, boxShadow: t.shadowSm }}>
                    {m.emoji || m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 보기 이모티콘 */}
          <div style={{ flex: '0 0 auto', padding: '10px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${round.options.length}, 1fr)`, gap: 14 }}>
            {round.options.map((emoji) => {
              const isRight = mp.found.includes(emoji);
              const isWrong = mp.wrongKey === emoji;
              return (
                <button key={emoji} onClick={() => onPick(emoji)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 96, fontSize: 52, fontFamily: 'inherit', cursor: isRight ? 'default' : 'pointer',
                    background: isRight ? t.cat.code : '#fff', border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {emoji}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>

          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {Array.from({ length: MESSENGER_QUESTIONS }).map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < progress ? color : '#fff',
                  border: i < progress ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{progress}/{MESSENGER_QUESTIONS}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{levelIdx < MESSENGER_LEVELS.length - 1 ? `Lv.${levelIdx + 1} 성공!` : '모든 레벨 성공!'}</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextLevel}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {levelIdx < MESSENGER_LEVELS.length - 1 ? '다음 레벨 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '알맞은 답을 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}

function RoleplayActivity({ tone, fontSize, onComplete, onFinish, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const [jobIdx, setJobIdx] = useStateA(0);
  const [stepIdx, setStepIdx] = useStateA(0);
  const job = ROLES[jobIdx];
  const step = job.steps[stepIdx];
  const [round, setRound] = useStateA(() => buildRoleStepOptions(ROLES[0].steps[0]));
  const [done, setDone] = useStateA(false);
  const mp = useMultiPick();
  const timersRef = useRefA([]);
  const addTimer = (id) => timersRef.current.push(id);
  useEffectA(() => () => { timersRef.current.forEach((id) => clearTimeout(id)); }, []);

  const startStep = (ji, si) => {
    const s = ROLES[ji].steps[si];
    setRound(buildRoleStepOptions(s)); mp.reset();
    addTimer(setTimeout(() => speakKo(s.prompt), 300));
  };
  useEffectA(() => {
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = [];
    setStepIdx(0); setDone(false); startStep(jobIdx, 0);
  }, [jobIdx]);

  const onPick = (emoji) => {
    if (done) return;
    const res = mp.pick(emoji, [round.tool]);
    if (res === 'wrong') playSfx('wrong');
    else if (res === 'complete') {
      playSfx('correct'); onComplete && onComplete(1);
      const last = stepIdx >= job.steps.length - 1;
      addTimer(setTimeout(() => {
        if (last) { setDone(true); onComplete && onComplete(3); }
        else { const ns = stepIdx + 1; setStepIdx(ns); startStep(jobIdx, ns); }
      }, 700));
    }
  };
  const restart = () => { setStepIdx(0); setDone(false); startStep(jobIdx, 0); };
  const nextJob = () => { if (jobIdx < ROLES.length - 1) setJobIdx(jobIdx + 1); else onFinish && onFinish(); };
  const prevJob = () => { if (jobIdx > 0) setJobIdx(jobIdx - 1); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>{job.emoji}</span>{job.name} 놀이
        </div>
        <LevelStepper tone={t} cur={jobIdx} total={ROLES.length} onPrev={prevJob} onNext={nextJob} />
      </div>

      {!done ? (
        <React.Fragment>
          {/* 안내 — 직업 + 현재 할 일 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, minHeight: 0, padding: '0 32px' }}>
            <div style={{ fontSize: 130, lineHeight: 1 }}>{job.emoji}</div>
            <button onClick={() => speakKo(step.prompt)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: accentBorder,
                borderRadius: 28, padding: '16px 30px', boxShadow: t.shadow, cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 28 }}>🔊</span>
              <span style={{ fontSize: fontSize + 20, fontWeight: 900, color: t.text }}>{step.prompt}</span>
            </button>
          </div>

          {/* 도구 보기 */}
          <div style={{ flex: '0 0 auto', padding: '10px 32px 4px', display: 'grid', gridTemplateColumns: `repeat(${round.options.length}, 1fr)`, gap: 14 }}>
            {round.options.map((emoji) => {
              const isRight = mp.found.includes(emoji);
              const isWrong = mp.wrongKey === emoji;
              return (
                <button key={emoji} onClick={() => onPick(emoji)} disabled={isRight}
                  onPointerDown={(e) => !isRight && e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
                  style={{ position: 'relative', height: 104, fontSize: 56, fontFamily: 'inherit', cursor: isRight ? 'default' : 'pointer',
                    background: isRight ? t.cat.code : '#fff', border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
                    borderRadius: t.cardRadius, boxShadow: t.shadow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isWrong ? 'kw-shake 0.4s ease' : 'none' }}>
                  {emoji}
                  {isRight && <PickMark kind="right" />}
                  {isWrong && <PickMark kind="wrong" />}
                </button>
              );
            })}
          </div>

          {/* 스텝 진행 */}
          <div style={{ flex: '0 0 auto', padding: '12px 32px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, display: 'flex', gap: 10 }}>
              {job.steps.map((_, i) => (
                <span key={i} style={{ width: 20, height: 20, borderRadius: 10, background: i < stepIdx ? color : i === stepIdx ? t.accent : '#fff',
                  border: i <= stepIdx ? 'none' : `2px solid rgba(0,0,0,0.18)` }} />
              ))}
            </div>
            <div style={{ fontSize: fontSize, fontWeight: 900, color: t.text }}>{stepIdx + 1}/{job.steps.length}</div>
          </div>
        </React.Fragment>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <div style={{ fontSize: 140, animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both' }}>🎉</div>
          <div style={{ fontSize: fontSize + 22, fontWeight: 900, color: t.text }}>{job.name} 완수!</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={restart} style={{ background: '#fff', color: t.text, border: accentBorder, borderRadius: 28,
              padding: '16px 28px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm }}>🔄 다시</button>
            <button onClick={nextJob}
              style={{ background: color, color: t.textOnColor, border: t.outline === 'none' ? 'none' : t.outline, borderRadius: 28,
                padding: '16px 30px', fontSize: fontSize + 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadow }}>
              {jobIdx < ROLES.length - 1 ? '다음 직업 ▶' : '끝내기 🎀'}
            </button>
          </div>
        </div>
      )}

      <VoiceGuide tone={t} show={voiceShow} text={done ? '잘했어!' : '알맞은 도구를 골라봐'} fontSize={fontSize - 4} />
    </div>
  );
}

function DecorateActivity({ tone, fontSize, onComplete, voiceShow }) {
  const t = tone;
  const color = t.cat.social;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.text}` : t.outline;
  const stageRef = useRefA(null);
  const [sceneIdx, setSceneIdx] = useStateA(0);
  const [frameIdx, setFrameIdx] = useStateA(0);
  const [placed, setPlaced] = useStateA([]);     // [{ id, emoji, x, y }] x,y = % (0~100)
  const [drag, setDrag] = useStateA(null);        // { id }
  const [saved, setSaved] = useStateA(false);
  const idRef = useRefA(1);
  const scene = SCENES[sceneIdx];
  const frame = FRAMES[frameIdx];

  const addSticker = (emoji) => {
    const id = idRef.current++;
    setPlaced((p) => [...p, { id, emoji, x: 50, y: 48 }]);
    playSfx('select');
  };
  const pctFromEvent = (e) => {
    const el = stageRef.current; if (!el) return { x: 50, y: 50 };
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100));
    return { x, y };
  };
  const onStickerDown = (e, id) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setDrag({ id });
  };
  const onStickerMove = (e, id) => {
    if (!drag || drag.id !== id) return;
    e.stopPropagation();
    const p = pctFromEvent(e);
    setPlaced((arr) => arr.map((s) => (s.id === id ? { ...s, x: p.x, y: p.y } : s)));
  };
  const onStickerUp = (e, id) => {
    if (!drag || drag.id !== id) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    setDrag(null);
  };
  const clearAll = () => setPlaced([]);

  const onSave = () => {
    const W = 800, H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, scene.c1); grad.addColorStop(1, scene.c2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    placed.forEach((s) => {
      ctx.font = '72px serif';
      ctx.fillText(s.emoji, (s.x / 100) * W, (s.y / 100) * H);
    });
    if (frame.width > 0) {
      ctx.strokeStyle = frame.color; ctx.lineWidth = frame.width * 2;
      ctx.strokeRect(frame.width, frame.width, W - frame.width * 2, H - frame.width * 2);
    }
    try {
      const png = canvas.toDataURL('image/png');
      const list = JSON.parse(localStorage.getItem('kw-gallery') || '[]');
      list.unshift({ id: Date.now(), type: 'free', png, savedAt: new Date().toISOString() });
      if (list.length > 24) list.length = 24;
      localStorage.setItem('kw-gallery', JSON.stringify(list));
    } catch {}
    playSfx('star'); onComplete && onComplete(3);
    setSaved(true); setTimeout(() => setSaved(false), 1400);
  };

  const frameBorder = frame.width > 0 ? `${frame.width}px solid ${frame.color}` : 'none';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: 88, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 36 }}>🎀</span>꾸미기
        </div>
        <button onClick={onSave} aria-label="저장"
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
          style={{ position: 'absolute', top: 16, right: 130, width: 64, height: 64, borderRadius: 32,
            background: '#fff', border: accentBorder, cursor: 'pointer', fontSize: 30, fontFamily: 'inherit', boxShadow: t.shadowSm, color: t.text }}>💾</button>
      </div>

      {/* 장면 + 프레임 선택 */}
      <div style={{ flex: '0 0 auto', padding: '0 28px 8px', display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => setSceneIdx(i)}
            style={{ height: 38, padding: '0 14px', borderRadius: 19, background: i === sceneIdx ? color : '#fff', color: i === sceneIdx ? t.textOnColor : t.text,
              border: i === sceneIdx ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder, fontSize: fontSize - 4, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>{s.name}</button>
        ))}
        {FRAMES.map((f, i) => (
          <button key={f.id} onClick={() => setFrameIdx(i)} aria-label={`프레임 ${f.name}`}
            style={{ width: 38, height: 38, borderRadius: 19, background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              border: i === frameIdx ? `4px solid ${t.text}` : accentBorder, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 20, height: 20, borderRadius: 6, border: f.width > 0 ? `4px solid ${f.color}` : `2px dashed ${t.textMuted}` }} />
          </button>
        ))}
      </div>

      {/* 꾸미기 무대 */}
      <div style={{ flex: 1, padding: '0 28px', minHeight: 0, display: 'flex', justifyContent: 'center' }}>
        <div ref={stageRef} style={{ position: 'relative', width: '100%', maxWidth: 720, aspectRatio: '4 / 3',
          background: `linear-gradient(180deg, ${scene.c1}, ${scene.c2})`, borderRadius: 18, overflow: 'hidden',
          border: frameBorder, boxShadow: t.shadow, touchAction: 'none' }}>
          {placed.map((s) => (
            <div key={s.id}
              onPointerDown={(e) => onStickerDown(e, s.id)} onPointerMove={(e) => onStickerMove(e, s.id)}
              onPointerUp={(e) => onStickerUp(e, s.id)} onPointerCancel={(e) => onStickerUp(e, s.id)}
              style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)',
                fontSize: 56, lineHeight: 1, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>{s.emoji}</div>
          ))}
          {saved && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.6)', fontSize: fontSize + 12, fontWeight: 900, color: t.text }}>저장했어요! 🖼️</div>
          )}
        </div>
      </div>

      {/* 스티커 팔레트 + 지우기 */}
      <div style={{ flex: '0 0 auto', padding: '10px 24px 16px', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
        {DECORATE_STICKERS.map((emoji) => (
          <button key={emoji} onClick={() => addSticker(emoji)}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }], { duration: 120 })}
            style={{ width: 60, height: 60, borderRadius: t.cardRadius, background: '#fff', border: accentBorder,
              fontSize: 34, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit', boxShadow: t.shadowSm,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emoji}</button>
        ))}
        <button onClick={clearAll}
          style={{ height: 60, padding: '0 18px', borderRadius: t.cardRadius, background: '#fff', border: accentBorder,
            fontSize: fontSize - 2, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', color: t.text, boxShadow: t.shadowSm }}>🧽 지우기</button>
      </div>

      <VoiceGuide tone={t} show={voiceShow} text="스티커를 콕 누르고 끌어서 꾸며봐" fontSize={fontSize - 4} />
    </div>
  );
}

export function SocialActivity({ tone, subId, fontSize, onComplete, onFinish, voiceShow }) {
  const p = { tone, fontSize, onComplete, onFinish, voiceShow };
  if (subId === 'roleplay') return <RoleplayActivity {...p} />;
  if (subId === 'decorate') return <DecorateActivity {...p} />;
  return <MessengerActivity {...p} />; // 'messenger' 기본
}
