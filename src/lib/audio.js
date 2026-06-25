// kidsweb-audio.js
// 앱 전역 오디오 싱글톤 (React 비의존).
//  - 효과음(SFX): Web Audio API 합성음 — 하나의 공유 AudioContext + sfxGain 마스터.
//  - 장소 음성(TTS): 사전 생성한 /voices/place-<catId>.mp3 재생, 없으면 speechSynthesis 폴백.
//  - 음량: 부모설정(kw-parent-settings)의 volSfx / volVoice 와 연동(setVolumes).
// autoplay 정책상 첫 사용자 제스처에서 unlockAudio() 호출 필요.

// catId → 장소 음성 텍스트 (사전생성 mp3가 없을 때 speechSynthesis 폴백에 사용)
export const PLACE_VOICE_TEXT = {
  color:    '색칠 언덕으로 가자!',
  shape:    '모양 꽃밭으로 가자!',
  music:    '노래 폭포로 가자!',
  hangul:   '글자나무 숲으로 가자!',
  english:  '에이비씨 모래사장으로 가자!',
  math:     '숫자 산으로 가자!',
  code:     '로봇 공장으로 가자!',
  brain:    '수수께끼 동굴로 가자!',
  computer: '반짝 등대로 가자!',
  social:   '친구 광장으로 가자!',
};

// toolId → 도구 음성 폴백 텍스트 (mp3 없을 때 speechSynthesis)
export const TOOL_VOICE_TEXT = {
  crayon:  '크레용!',
  brush:   '붓!',
  marker:  '마커!',
  pencil:  '연필!',
  eraser:  '지우개!',
  sticker: '스티커!',
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// 0–1 게인 (부모설정 기본값 → 0.7 / 배경음 50 → 0.5). setVolumes 로 갱신.
let vols = { sfx: 0.7, voice: 0.7, bgm: 0.5 };

let ctx = null;
let sfxGain = null;

function ensureCtx() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  sfxGain = ctx.createGain();
  sfxGain.gain.value = vols.sfx;
  sfxGain.connect(ctx.destination);
}

// 첫 제스처에서 호출 — context 생성/재개. 멱등.
export function unlockAudio() {
  try {
    ensureCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch {}
}

// 0–100 입력 → 0–1 게인. ctx 가 없으면 값만 저장(제스처 전 생성 방지).
export function setVolumes({ sfx, voice, bgm } = {}) {
  if (typeof sfx === 'number') vols.sfx = clamp01(sfx / 100);
  if (typeof voice === 'number') vols.voice = clamp01(voice / 100);
  if (typeof bgm === 'number') vols.bgm = clamp01(bgm / 100);
  if (sfxGain) sfxGain.gain.value = vols.sfx;
  for (const k in voiceCache) { try { voiceCache[k].volume = vols.voice; } catch {} }
  const cur = bgmActive >= 0 ? bgmEls[bgmActive] : null;
  if (cur) { try { cur.volume = vols.bgm; } catch {} }
}

// ── 효과음 합성 ──────────────────────────────────────────────
// MusicActivity 와 동일한 triangle + 지수 envelope 패턴, sfxGain 경유(슬라이더 연동).
function blip(freq, t0, dur, peak, type = 'triangle') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export function playSfx(type) {
  try {
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    switch (type) {
      case 'tap':
      case 'select':
        blip(660, now, 0.12, 0.25);
        break;
      case 'correct':            // 상승 두 음
        blip(660, now, 0.12, 0.30);
        blip(880, now + 0.09, 0.14, 0.30);
        break;
      case 'wrong':              // 부드러운 하강 (sine)
        blip(300, now, 0.18, 0.26, 'sine');
        blip(180, now + 0.08, 0.22, 0.24, 'sine');
        break;
      case 'star':               // 반짝 아르페지오
        blip(784, now, 0.14, 0.32);
        blip(988, now + 0.07, 0.14, 0.32);
        blip(1319, now + 0.14, 0.18, 0.32);
        break;
      case 'sticker':            // 팝 + 반짝
        blip(523, now, 0.10, 0.30);
        blip(1047, now + 0.06, 0.16, 0.28);
        break;
      default:
        blip(660, now, 0.10, 0.25);
    }
  } catch {}
}

// MusicActivity 의 건반음 — 공유 ctx/sfxGain 으로 라우팅(효과음 슬라이더 적용).
export function playTone(freq, { dur = 0.7, peak = 0.4, type = 'triangle' } = {}) {
  try {
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.1, dur - 0.1));
    o.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur);
  } catch {}
}

// 드럼 합성음 — kick/snare/hihat/tom 4종, sfxGain 라우팅
export function playDrum(type) {
  try {
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    if (type === 'kick') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, t0);
      o.frequency.exponentialRampToValueAtTime(40, t0 + 0.18);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.7, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + 0.25);
    } else if (type === 'snare') {
      // 노이즈 + 짧은 사각파
      const buf = getNoiseBuffer();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      src.connect(hp); hp.connect(g); g.connect(sfxGain);
      src.start(t0); src.stop(t0 + 0.2);
      // tonal 컴포넌트
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 220;
      og.gain.setValueAtTime(0.0001, t0);
      og.gain.exponentialRampToValueAtTime(0.25, t0 + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
      o.connect(og); og.connect(sfxGain);
      o.start(t0); o.stop(t0 + 0.14);
    } else if (type === 'hihat') {
      const buf = getNoiseBuffer();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.32, t0 + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
      src.connect(hp); hp.connect(g); g.connect(sfxGain);
      src.start(t0); src.stop(t0 + 0.1);
    } else if (type === 'tom') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(220, t0);
      o.frequency.exponentialRampToValueAtTime(110, t0 + 0.2);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + 0.3);
    } else if (type === 'cymbal') {
      const buf = getNoiseBuffer();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 6500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      src.connect(hp); hp.connect(g); g.connect(sfxGain);
      src.start(t0); src.stop(t0 + 0.6);
    }
  } catch {}
}

// ── 그리기/지우기 합성음 (연속) ──────────────────────────────
let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer || !ctx) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 1.0);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

let drawNodes = null;   // { src, filter, gain }
let drawBase = 0;       // 기본 음량(도구별)

export function startDraw(kind = 'draw') {
  try {
    ensureCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    stopDraw();                       // 이전 세션 정리
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    if (kind === 'erase') { filter.type = 'lowpass'; filter.frequency.value = 900; }
    else { filter.type = 'bandpass'; filter.frequency.value = 1800; filter.Q.value = 0.7; }
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    src.connect(filter); filter.connect(gain); gain.connect(sfxGain);
    src.start();
    drawNodes = { src, filter, gain };
    drawBase = kind === 'erase' ? 0.10 : 0.07;
    gain.gain.setTargetAtTime(drawBase, ctx.currentTime, 0.03);
  } catch {}
}

// onPointerMove 에서 호출 — 이동 속도(px)에 비례해 음량 변조(멈추면 작게).
export function drawTick(speed = 0) {
  if (!drawNodes || !ctx) return;
  const lvl = Math.min(0.16, drawBase + Math.min(0.09, speed / 1200));
  try { drawNodes.gain.gain.setTargetAtTime(lvl, ctx.currentTime, 0.02); } catch {}
}

export function stopDraw() {
  if (!drawNodes || !ctx) { drawNodes = null; return; }
  const { src, gain } = drawNodes;
  drawNodes = null;
  try {
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
    src.stop(ctx.currentTime + 0.12);
  } catch {}
}

// ── 음성 (장소/도구) ─────────────────────────────────────────
// voiceCache 는 전체 파일 키로 캐싱: 'place-color', 'tool-crayon' 등.
const voiceCache = {};

function getVoiceEl(key) {
  if (!voiceCache[key]) {
    const a = new Audio(`/voices/${key}.mp3`);
    a.preload = 'auto';
    voiceCache[key] = a;
  }
  return voiceCache[key];
}

function fallbackSpeak(text) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.3;          // 아이 느낌으로 약간 높게
    u.volume = vols.voice;
    window.speechSynthesis.speak(u);
  } catch {}
}

// 같은 언어의 보이스 중 품질 좋은 것 우선(없으면 첫 매칭, 그것도 없으면 기본).
const VOICE_PREFER = /google|neural|natural|yuna|유나|premium|enhanced/i;
function pickVoice(langPrefix) {
  try {
    const all = window.speechSynthesis.getVoices() || [];
    const same = all.filter((v) => new RegExp('^' + langPrefix, 'i').test(v.lang));
    return same.find((v) => VOICE_PREFER.test(v.name)) || same[0] || null;
  } catch { return null; }
}

// 영어 음성 — speechSynthesis en-US. 음량은 voice 슬라이더(vols.voice)와 연동.
export function speakEn(text, { rate = 0.9, pitch = 1.0 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    u.voice = pickVoice('en');
    window.speechSynthesis.speak(u);
  } catch {}
}

// 한국어 단어 음성 — speechSynthesis ko-KR. 음량은 voice 슬라이더 연동.
export function speakKo(text, { rate = 0.9, pitch = 1.05 } = {}) {
  try {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ko-KR';
    u.rate = rate; u.pitch = pitch; u.volume = vols.voice;
    u.voice = pickVoice('ko');
    window.speechSynthesis.speak(u);
  } catch {}
}

// /voices/<key>.mp3 재생. 없거나 실패하면 speechSynthesis(fallbackText) 폴백.
function playVoice(key, fallbackText) {
  unlockAudio();
  try {
    const el = getVoiceEl(key);
    let fellBack = false;
    const fall = () => { if (!fellBack) { fellBack = true; fallbackSpeak(fallbackText); } };
    el.onerror = fall;
    el.volume = vols.voice;
    el.currentTime = 0;
    const p = el.play();
    if (p && p.catch) p.catch(fall);
  } catch {
    fallbackSpeak(fallbackText);
  }
}

export function playPlaceVoice(catId) {
  playVoice(`place-${catId}`, PLACE_VOICE_TEXT[catId]);
}

export function playToolVoice(toolId) {
  playVoice(`tool-${toolId}`, TOOL_VOICE_TEXT[toolId]);
}

// 첫 제스처 후 클립 워밍(best-effort). 파일 미추가 시 404 콘솔 경고는 정상.
export function preloadPlaceVoices() {
  try {
    for (const catId in PLACE_VOICE_TEXT) getVoiceEl(`place-${catId}`);
    for (const toolId in TOOL_VOICE_TEXT) getVoiceEl(`tool-${toolId}`);
  } catch {}
}

// ── 배경음악 (BGM) ───────────────────────────────────────────
// HTMLAudioElement 2개로 계절 전환 시 크로스페이드(약 0.6초).
const bgmEls = [null, null];
let bgmActive = -1;              // 현재 들리는 element 인덱스 (-1 = 없음)
let bgmSeason = null;           // 현재 재생 중인 계절
const bgmFades = [null, null];  // element별 진행 중 fade interval id

function getBgmEl(i) {
  if (!bgmEls[i]) {
    const a = new Audio();
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    bgmEls[i] = a;
  }
  return bgmEls[i];
}

function fadeEl(i, to, ms) {
  const el = bgmEls[i];
  if (!el) return;
  if (bgmFades[i]) { clearInterval(bgmFades[i]); bgmFades[i] = null; }
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 40));
  let n = 0;
  bgmFades[i] = setInterval(() => {
    n++;
    el.volume = clamp01(from + (to - from) * (n / steps));
    if (n >= steps) {
      clearInterval(bgmFades[i]); bgmFades[i] = null;
      if (to === 0) { try { el.pause(); } catch {} }
    }
  }, 40);
}

// 계절 곡으로 전환. 같은 곡이면 (autoplay 차단 후 재개만) 처리.
export function playBgm(season) {
  if (season === bgmSeason && bgmActive >= 0) {
    const cur = bgmEls[bgmActive];
    if (cur && cur.paused) cur.play().catch(() => {});
    return;
  }
  const next = bgmActive === 0 ? 1 : 0;
  const el = getBgmEl(next);
  el.src = `/bgm/${season}.mp3`;
  el.volume = 0;
  const p = el.play();
  if (p && p.catch) p.catch(() => {});   // autoplay 차단 시 조용히 실패(제스처 후 재시도)
  fadeEl(next, vols.bgm, 600);
  if (bgmActive >= 0) fadeEl(bgmActive, 0, 600);
  bgmActive = next;
  bgmSeason = season;
}

export function stopBgm() {
  const i = bgmActive;
  bgmActive = -1;
  bgmSeason = null;
  if (i >= 0) fadeEl(i, 0, 400);
}
