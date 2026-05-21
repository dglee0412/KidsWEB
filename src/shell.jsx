// kidsweb-shell.jsx
// 앱 셸: iPad 프레임, 화면 라우터, 홈, 서브메뉴, 상단 chrome (뒤로/별/마스코트)
// 톤은 prop으로 받아서 통째로 갈아끼움.

import React from 'react'
import { KIDS_CATEGORIES } from './themes.jsx'
import { COLORING_TEMPLATES } from './activities.jsx'

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────────────────────
// iPad 프레임 (가로모드 1024x768 화면)
// 외곽 1140×830, 베젤 ~58/31, 카메라 점, 홈 인디케이터
// ─────────────────────────────────────────────────────────────
function IPadFrame({ children }) {
  return (
    <div style={{
      width: 1140, height: 830,
      background: 'linear-gradient(160deg, #2b2b30 0%, #1a1a1f 100%)',
      borderRadius: 46,
      padding: 28,
      boxSizing: 'border-box',
      position: 'relative',
      boxShadow: 'inset 0 0 0 2px #000, inset 0 0 0 4px #3a3a40',
    }}>
      {/* 카메라 점 */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 8, height: 8, borderRadius: 8, background: '#0a0a0c',
        boxShadow: 'inset 0 0 0 1px #2a2a30',
      }} />
      {/* 스크린 */}
      <div style={{
        width: 1024, height: 768,
        background: '#000',
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {children}
      </div>
      {/* 우측 홈버튼 (가로모드 기준 우측) */}
      <div style={{
        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
        width: 12, height: 60, borderRadius: 4, background: '#0e0e12',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 마스코트 "곰곰이" — 오리지널 곰돌이, 도형 + 이모지 기반
// 표정 변화: idle / happy / wave
// ─────────────────────────────────────────────────────────────
function Mascot({ tone, mood = 'idle', size = 120, message = null, fontSize = 24 }) {
  const fur = tone.id === 'C' ? '#C89968' : tone.id === 'B' ? '#FFD5B0' : '#F5B97B';
  const earIn = tone.id === 'C' ? '#A07549' : tone.id === 'B' ? '#FFB890' : '#E8965A';
  const cheek = tone.id === 'B' ? '#FFA8C8' : '#FF7F7F';
  const stroke = tone.id === 'C' ? '#3D2E1F' : '#3A2A1F';

  const eyeY = mood === 'happy' ? 56 : 54;
  const eyeShape = mood === 'happy'
    ? <><path d={`M 38 ${eyeY} q 6 -6 12 0`} stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round"/><path d={`M 70 ${eyeY} q 6 -6 12 0`} stroke={stroke} strokeWidth="3" fill="none" strokeLinecap="round"/></>
    : <><circle cx="44" cy={eyeY} r="3.5" fill={stroke}/><circle cx="76" cy={eyeY} r="3.5" fill={stroke}/></>;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg viewBox="0 0 120 120" width={size} height={size}>
          {/* 귀 */}
          <circle cx="30" cy="30" r="16" fill={fur} stroke={stroke} strokeWidth="2"/>
          <circle cx="90" cy="30" r="16" fill={fur} stroke={stroke} strokeWidth="2"/>
          <circle cx="30" cy="30" r="8" fill={earIn}/>
          <circle cx="90" cy="30" r="8" fill={earIn}/>
          {/* 얼굴 */}
          <circle cx="60" cy="62" r="38" fill={fur} stroke={stroke} strokeWidth="2.5"/>
          {/* 주둥이 */}
          <ellipse cx="60" cy="76" rx="20" ry="14" fill="#FFF1DC" stroke={stroke} strokeWidth="2"/>
          {/* 코 */}
          <ellipse cx="60" cy="70" rx="5" ry="3.5" fill={stroke}/>
          {/* 입 */}
          {mood === 'happy'
            ? <path d="M 50 80 q 10 10 20 0" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            : <path d="M 54 80 q 6 4 12 0" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
          {/* 눈 */}
          {eyeShape}
          {/* 볼터치 */}
          <circle cx="32" cy="72" r="6" fill={cheek} opacity="0.7"/>
          <circle cx="88" cy="72" r="6" fill={cheek} opacity="0.7"/>
          {mood === 'wave' && (
            <g style={{ transformOrigin: '100px 90px', animation: 'kw-wave 1.4s ease-in-out infinite' }}>
              <ellipse cx="105" cy="85" rx="10" ry="14" fill={fur} stroke={stroke} strokeWidth="2"/>
            </g>
          )}
        </svg>
      </div>
      {message && (
        <div style={{
          background: '#fff',
          padding: '14px 20px',
          borderRadius: 20,
          border: tone.outline === 'none' ? `3px solid ${tone.text}` : tone.outline,
          fontSize, lineHeight: 1.3,
          color: tone.text,
          fontWeight: 600,
          position: 'relative',
          maxWidth: 380,
          boxShadow: tone.shadowSm,
        }}>
          {message}
          <div style={{
            position: 'absolute', left: -14, top: 22,
            width: 0, height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderRight: `14px solid ${tone.text}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 별 카운터 (우상단 고정, 흰색 알약형)
// ─────────────────────────────────────────────────────────────
function StarCounter({ tone, stars, fontSize = 22, popKey }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || popKey === 0) return;
    ref.current.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
      { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' },
    );
  }, [popKey]);
  return (
    <div ref={ref} style={{
      position: 'absolute', top: 16, right: 18,
      background: '#fff',
      border: tone.outline === 'none' ? `3px solid ${tone.accent}` : tone.outline,
      borderRadius: 999,
      padding: '8px 18px 8px 14px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize, fontWeight: 800,
      color: tone.text,
      boxShadow: tone.shadowSm,
      zIndex: 20,
    }}>
      <span style={{ fontSize: fontSize + 6, lineHeight: 1 }}>⭐</span>
      <span style={{ minWidth: 28, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{stars}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 뒤로가기 — 좌상단, 원형 64×64
// ─────────────────────────────────────────────────────────────
function BackButton({ tone, onClick }) {
  return (
    <button onClick={onClick} aria-label="뒤로"
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 120 })}
      style={{
        position: 'absolute', top: 16, left: 18,
        width: 64, height: 64, borderRadius: 32,
        background: '#fff',
        border: tone.outline === 'none' ? `3px solid ${tone.text}` : tone.outline,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: tone.shadowSm,
        color: tone.text,
        zIndex: 20,
      }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M18 6 L10 14 L18 22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 음성 가이드 표시기 (Tweak으로 on/off)
// ─────────────────────────────────────────────────────────────
function VoiceGuide({ tone, text, show, fontSize = 20 }) {
  if (!show || !text) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.78)',
      color: '#fff',
      padding: '10px 22px',
      borderRadius: 999,
      fontSize, fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 10,
      zIndex: 15,
      maxWidth: 720,
    }}>
      <span style={{ fontSize: fontSize + 6, lineHeight: 1 }}>🔊</span>
      <span>{text}</span>
      <span aria-hidden style={{ display: 'inline-flex', gap: 3, marginLeft: 4 }}>
        <span className="kw-voice-bar" style={{ animationDelay: '0s' }} />
        <span className="kw-voice-bar" style={{ animationDelay: '0.15s' }} />
        <span className="kw-voice-bar" style={{ animationDelay: '0.3s' }} />
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 큰 둥근 버튼 (공통)
// ─────────────────────────────────────────────────────────────
function BigButton({ tone, color, children, onClick, fontSize = 26, minWidth = 200, height = 72 }) {
  const bg = color || tone.primary;
  return (
    <button onClick={onClick}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
      style={{
        background: bg,
        color: tone.textOnColor,
        border: tone.outline === 'none' ? 'none' : tone.outline,
        borderRadius: 32,
        minWidth, height,
        padding: '0 28px',
        fontSize, fontWeight: 800,
        cursor: 'pointer',
        boxShadow: tone.shadow,
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 홈 — 상단바(구름 | 로고 | 별·설정) + 마스코트 + 2×5 그리드 + 하단 자연 장식
// ─────────────────────────────────────────────────────────────
function HomeScreen({ tone, fontSize, onPick, mascotOn, stars, onSettings }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.accent}` : t.outline;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* ─ 상단바 ─ */}
      <div style={{
        height: 72, padding: '0 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flex: '0 0 auto',
      }}>
        {/* 좌: 구름 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, fontSize: 38, lineHeight: 1, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
          <span style={{ animation: 'kw-float 4s ease-in-out infinite' }}>☁</span>
          <span style={{ marginTop: 10, fontSize: 30, animation: 'kw-float 4s ease-in-out 0.6s infinite' }}>☁</span>
        </div>
        {/* 중앙: 로고 */}
        <div style={{
          fontSize: 36, fontWeight: 900,
          color: t.text,
          letterSpacing: '-0.03em',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 40 }}>🌈</span>
          <span style={{ textShadow: '0 2px 0 rgba(255,255,255,0.6)' }}>KidsWeb</span>
        </div>
        {/* 우: 별 카운터 + 설정 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#fff', borderRadius: 999,
            padding: '8px 18px 8px 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 22, fontWeight: 900, color: t.text,
            border: accentBorder,
            boxShadow: t.shadowSm,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 64,
          }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>⭐</span>{stars}
          </div>
          <button onClick={onSettings} aria-label="부모 설정"
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
            style={{
              width: 56, height: 56, borderRadius: 28,
              background: '#fff', border: accentBorder,
              cursor: 'pointer', fontSize: 28,
              boxShadow: t.shadowSm,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', color: t.text,
            }}>⚙</button>
        </div>
      </div>

      {/* ─ 마스코트 + 말풍선 ─ */}
      <div style={{ padding: '4px 28px 8px', flex: '0 0 auto', minHeight: 116 }}>
        {mascotOn ? (
          <Mascot tone={t} mood="wave" size={92} message="안녕! 오늘은 뭐 하고 놀까?" fontSize={fontSize - 2} />
        ) : (
          <div style={{
            display: 'inline-block',
            background: '#fff',
            padding: '14px 22px', borderRadius: 22,
            border: t.outline === 'none' ? `3px solid ${t.text}` : t.outline,
            fontSize: fontSize, fontWeight: 700,
            color: t.text, boxShadow: t.shadowSm,
          }}>안녕! 오늘은 뭐 하고 놀까?</div>
        )}
      </div>

      {/* ─ 카테고리 2×5 그리드 ─ */}
      <div style={{ padding: '0 24px', flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
          width: '100%',
        }}>
          {KIDS_CATEGORIES.map((c) => (
            <CategoryCard key={c.id} tone={t} cat={c} fontSize={fontSize} onClick={() => onPick(c)} />
          ))}
        </div>
      </div>

      {/* ─ 하단 자연 장식 🌿🌸🏠🌼🌿 ─ */}
      <div style={{
        flex: '0 0 auto',
        height: 80,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
        padding: '0 40px 12px',
        position: 'relative',
        pointerEvents: 'none',
      }}>
        {/* 잔디 라인 */}
        <div aria-hidden style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: 28,
          background: 'linear-gradient(180deg, rgba(152,214,166,0) 0%, rgba(152,214,166,0.55) 100%)',
        }} />
        <span style={{ fontSize: 50, transform: 'rotate(-8deg)' }}>🌿</span>
        <span style={{ fontSize: 44 }}>🌸</span>
        <span style={{ fontSize: 64 }}>🏠</span>
        <span style={{ fontSize: 44 }}>🌼</span>
        <span style={{ fontSize: 50, transform: 'rotate(8deg) scaleX(-1)' }}>🌿</span>
      </div>
    </div>
  );
}

function CategoryCard({ tone, cat, fontSize, onClick }) {
  const t = tone;
  const color = t.cat[cat.id];
  const isWhite = t.cardFill === 'white';
  const isPaper = t.cardFill === 'paper';
  const isText = cat.iconKind === 'text';

  // 텍스트 아이콘은 글자 수에 따라 크기 조절
  const textIconSize = cat.emoji.length === 1 ? 64 : 44;

  return (
    <button onClick={onClick}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
      style={{
        position: 'relative',
        background: isWhite ? '#fff' : isPaper ? t.surface : color,
        border: t.outline === 'none' ? 'none' : t.outline,
        borderRadius: t.cardRadius,
        height: 152,
        padding: 0,
        cursor: 'pointer',
        boxShadow: t.shadow,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 4,
        fontFamily: 'inherit',
        overflow: 'hidden',
      }}>
      {/* 컬러 액센트 — 흰/종이 카드에는 상단 컬러 바 */}
      {(isWhite || isPaper) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: isPaper ? 6 : 12,
          background: color,
          borderTopLeftRadius: t.cardRadius, borderTopRightRadius: t.cardRadius,
        }} />
      )}
      {isText ? (
        <div style={{
          fontSize: textIconSize, lineHeight: 1, fontWeight: 900,
          color: (isWhite || isPaper) ? t.text : t.textOnColor,
          letterSpacing: cat.emoji.length === 1 ? '-0.04em' : '0.02em',
          marginTop: (isWhite || isPaper) ? 14 : 6,
        }}>{cat.emoji}</div>
      ) : (
        <div style={{
          fontSize: 56,
          lineHeight: 1,
          filter: t.id === 'C' ? 'saturate(0.85)' : 'none',
          marginTop: (isWhite || isPaper) ? 8 : 0,
        }}>{cat.emoji}</div>
      )}
      <div style={{
        fontSize: fontSize, fontWeight: 800,
        color: t.textOnColor,
        marginTop: 4,
        whiteSpace: 'nowrap',
        letterSpacing: '-0.02em',
      }}>{cat.name}</div>
      {!cat.done && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: 14, fontWeight: 700,
          padding: '4px 10px', borderRadius: 12,
        }}>곧!</div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// 자유 색칠 — 배경 선택 화면
// 업로드 영역 + 5탭(동물/풍경/탈것/캐릭터/패턴) + 4×2 썸네일 + 최근 3개
// ─────────────────────────────────────────────────────────────
const FREE_BG_TABS = [
  { id: 'animal',    name: '동물',   items: ['🐱','🐶','🐰','🦁','🐘','🦋','🐟','🦄'] },
  { id: 'scene',     name: '풍경',   items: ['🏖️','🌄','🌃','🌅','🏞️','🏔️','🌲','🌊'] },
  { id: 'vehicle',   name: '탈것',   items: ['🚗','🚌','🚀','🚂','🚁','✈️','🚢','🚲'] },
  { id: 'character', name: '캐릭터', items: ['🐻','🐼','🐨','🦊','🐯','🐸','🦄','🐲'] },
  { id: 'pattern',   name: '패턴',   items: ['🌈','✨','⭐','🎯','🌟','💎','🎈','🎀'] },
];

function FreeBgScreen({ tone, fontSize, onPick, mascotOn }) {
  const t = tone;
  const color = t.cat.color;
  const [tab, setTab] = useState('animal');
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kw-recent-bg') || '[]'); } catch { return []; }
  });

  const pick = (item, kind = 'emoji') => {
    const key = kind + ':' + item;
    const next = [{ kind, item }, ...recent.filter((r) => (r.kind + ':' + r.item) !== key)].slice(0, 3);
    setRecent(next);
    try { localStorage.setItem('kw-recent-bg', JSON.stringify(next)); } catch {}
    onPick({ bg: item, bgKind: kind });
  };

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => pick(reader.result, 'image');
    reader.readAsDataURL(f);
  };

  const current = FREE_BG_TABS.find((x) => x.id === tab) || FREE_BG_TABS[0];
  const accentBorder = t.outline === 'none' ? `3px solid ${color}` : t.outline;

  return (
    <div style={{ padding: '88px 56px 24px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 타이틀 (좌측 ◀ 자리 80px 띄움) */}
      <div style={{ paddingLeft: 80, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 44 }}>🖌️</span>
        <div>
          <div style={{ fontSize: fontSize + 16, fontWeight: 900, color: t.text, lineHeight: 1 }}>배경 선택</div>
          <div style={{ fontSize: fontSize - 4, color: t.textMuted, marginTop: 4 }}>그리고 싶은 배경을 골라봐</div>
        </div>
      </div>

      {/* 업로드 영역 */}
      <label style={{
        flex: '0 0 auto',
        border: `4px dashed ${color}`,
        background: '#fff',
        borderRadius: t.cardRadius + 4,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
        cursor: 'pointer',
        boxShadow: t.shadowSm,
        position: 'relative',
        overflow: 'hidden',
      }}
      onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.99)' }], { duration: 120 })}>
        <input type="file" accept="image/*" onChange={onFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        <span style={{ fontSize: 56, lineHeight: 1 }}>📤</span>
        <div>
          <div style={{ fontSize: fontSize + 4, fontWeight: 900, color: t.text }}>내 사진에서 배경 가져오기</div>
          <div style={{ fontSize: fontSize - 4, color: t.textMuted, marginTop: 4 }}>탭하면 사진을 고를 수 있어요</div>
        </div>
      </label>

      {/* 구분선 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: t.textMuted, fontWeight: 700, fontSize: fontSize - 4 }}>
        <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.10)', borderRadius: 3 }} />
        <span>또는 기본 배경</span>
        <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.10)', borderRadius: 3 }} />
      </div>

      {/* 카테고리 탭 */}
      <div style={{ display: 'flex', gap: 10, flex: '0 0 auto' }}>
        {FREE_BG_TABS.map((x) => {
          const active = x.id === tab;
          return (
            <button key={x.id} onClick={() => setTab(x.id)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 130 })}
              style={{
                flex: 1, height: 52,
                background: active ? color : '#fff',
                color: active ? t.textOnColor : t.text,
                border: active ? (t.outline === 'none' ? 'none' : t.outline) : accentBorder,
                borderRadius: 26,
                fontSize: fontSize - 2, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: active ? t.shadow : t.shadowSm,
              }}>{x.name}</button>
          );
        })}
      </div>

      {/* 4×2 썸네일 그리드 */}
      <div style={{
        flex: '1 1 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 12,
        minHeight: 0,
      }}>
        {current.items.map((e, i) => (
          <button key={x_key(tab, i)} onClick={() => pick(e)}
            onPointerDown={(ev) => ev.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
            style={{
              background: '#fff',
              border: accentBorder,
              borderRadius: t.cardRadius,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 64, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: t.shadowSm,
              padding: 0,
            }}>{e}</button>
        ))}
      </div>

      {/* 최근 사용 */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: fontSize - 4, fontWeight: 800, color: t.textMuted }}>🕒 최근</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {[0,1,2].map((i) => {
            const r = recent[i];
            if (!r) {
              return (
                <div key={i} style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(0,0,0,0.04)',
                  border: '2px dashed rgba(0,0,0,0.15)',
                }} />
              );
            }
            return (
              <button key={i} onClick={() => pick(r.item, r.kind)}
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: r.kind === 'image' ? '#fff' : '#fff',
                  backgroundImage: r.kind === 'image' ? `url(${r.item})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: accentBorder,
                  cursor: 'pointer', fontSize: 36, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit', padding: 0,
                  boxShadow: t.shadowSm,
                }}>{r.kind === 'emoji' ? r.item : ''}</button>
            );
          })}
        </div>
        {mascotOn && (
          <div style={{ marginLeft: 'auto' }}>
            <Mascot tone={t} mood="happy" size={64} />
          </div>
        )}
      </div>
    </div>
  );
}
function x_key(tab, i) { return tab + ':' + i; }

// ─────────────────────────────────────────────────────────────
// 색칠놀이 메뉴 — 2×2 큰 카드: 자유 색칠 / 영역 색칠 / 내 갤러리 / 잠금
// ─────────────────────────────────────────────────────────────
const COLOR_MENU_ITEMS = [
  { id: 'free',    name: '자유 색칠', emoji: '🖌️', desc: '마음대로 그려요',     bg: 'cat' },
  { id: 'fill',    name: '영역 색칠', emoji: '🪣', desc: '도안에 색을 채워요',  bg: 'cat' },
  { id: 'gallery', name: '내 갤러리', emoji: '🖼️', desc: '내가 그린 그림',     bg: 'white', locked: false },
  { id: 'locked',  name: '잠금',     emoji: '🔒', desc: '부모님 확인 필요',   bg: 'white', locked: true },
];

function ColorMenuScreen({ tone, fontSize, onPick, mascotOn }) {
  const t = tone;
  const color = t.cat.color;
  return (
    <div style={{ padding: '88px 56px 28px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 (BackButton/StarCounter는 앱 셸이 그려줌; 여기는 타이틀만) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26, paddingLeft: 80 }}>
        <div style={{
          width: 76, height: 76, borderRadius: t.cardRadius,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, boxShadow: t.shadowSm,
          border: t.outline === 'none' ? 'none' : t.outline,
        }}>🎨</div>
        <div>
          <div style={{ fontSize: fontSize + 18, fontWeight: 900, color: t.text, lineHeight: 1 }}>색칠놀이</div>
          <div style={{ fontSize: fontSize - 2, color: t.textMuted, marginTop: 6 }}>어떻게 색칠해볼까?</div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 22,
        padding: '0 36px',
      }}>
        {COLOR_MENU_ITEMS.map((it) => {
          const isColor = it.bg === 'cat';
          const bg = isColor ? color : '#fff';
          const fg = isColor ? t.textOnColor : t.text;
          const dimmed = it.locked;
          return (
            <button key={it.id}
              onClick={() => onPick(it)}
              onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
              style={{
                position: 'relative',
                background: bg,
                border: t.outline === 'none' ? (isColor ? 'none' : `4px solid ${color}`) : t.outline,
                borderRadius: t.cardRadius + 4,
                cursor: 'pointer',
                boxShadow: t.shadow,
                fontFamily: 'inherit',
                color: fg,
                padding: '22px 26px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
                gap: 8,
                textAlign: 'left',
                overflow: 'hidden',
                opacity: dimmed ? 0.88 : 1,
              }}>
              {/* 우상단 큰 아이콘 */}
              <div style={{
                position: 'absolute', right: 18, top: 18,
                fontSize: 96, lineHeight: 1,
                opacity: isColor ? 0.92 : 1,
                filter: t.id === 'C' ? 'saturate(0.85)' : 'none',
              }}>{it.emoji}</div>

              <div style={{ fontSize: fontSize + 12, fontWeight: 900, letterSpacing: '-0.02em' }}>{it.name}</div>
              <div style={{ fontSize: fontSize - 2, fontWeight: 700, opacity: 0.78 }}>{it.desc}</div>

              {it.locked && (
                <div style={{
                  marginTop: 6,
                  background: 'rgba(0,0,0,0.55)', color: '#fff',
                  fontSize: 14, fontWeight: 800,
                  padding: '5px 12px', borderRadius: 12,
                }}>부모님만</div>
              )}
            </button>
          );
        })}
      </div>

      {mascotOn && (
        <div style={{ position: 'absolute', right: 28, bottom: 18 }}>
          <Mascot tone={t} mood="happy" size={72} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 서브메뉴 — 카테고리별로 항목들
// ─────────────────────────────────────────────────────────────
const SUBMENUS = {
  color: {
    title: '뭘 색칠할까?',
    items: [
      { id: 'apple',    name: '사과',   emoji: '🍎' },
      { id: 'fish',     name: '물고기',  emoji: '🐟' },
      { id: 'star',     name: '별',     emoji: '⭐' },
      { id: 'flower',   name: '꽃',     emoji: '🌸' },
      { id: 'butterfly',name: '나비',    emoji: '🦋' },
      { id: 'dino',     name: '공룡',    emoji: '🦕' },
    ],
  },
  hangul: {
    title: '뭘 배워볼까?',
    items: [
      { id: 'consonants', name: '자음', emoji: 'ㄱㄴㄷ', sub: '14개' },
      { id: 'vowels',     name: '모음', emoji: 'ㅏㅑㅓ', sub: '10개' },
      { id: 'words',      name: '낱말', emoji: '🍓', sub: '20개' },
    ],
  },
  math: {
    title: '숫자 놀이',
    items: [
      { id: 'add5',    name: '덧셈',     emoji: '➕' },
      { id: 'count5',  name: '1~5 세기',  emoji: '🍎' },
      { id: 'count10', name: '6~10 세기', emoji: '🍇' },
    ],
  },
  music: {
    title: '소리 놀이',
    items: [
      { id: 'piano',   name: '피아노',  emoji: '🎹' },
      { id: 'drum',    name: '북',     emoji: '🥁' },
      { id: 'xylo',    name: '실로폰', emoji: '🎼' },
    ],
  },
  brain: {
    title: '머리 쓰기',
    items: [
      { id: 'memory',  name: '같은 짝',  emoji: '🃏' },
      { id: 'pattern', name: '패턴',    emoji: '🔺' },
      { id: 'shadow',  name: '그림자',   emoji: '👤' },
    ],
  },
};

function SubmenuScreen({ tone, cat, fontSize, onPick, mascotOn }) {
  const t = tone;
  const submenu = SUBMENUS[cat.id];
  const color = t.cat[cat.id];
  if (!submenu) return <PlaceholderScreen tone={t} cat={cat} fontSize={fontSize} />;
  return (
    <div style={{ padding: '88px 56px 32px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
        <div style={{
          width: 88, height: 88, borderRadius: t.cardRadius,
          background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52, boxShadow: t.shadowSm,
          border: t.outline === 'none' ? 'none' : t.outline,
        }}>{cat.emoji}</div>
        <div>
          <div style={{ fontSize: fontSize + 18, fontWeight: 800, color: t.text }}>{cat.name}</div>
          <div style={{ fontSize: fontSize, color: t.textMuted, marginTop: 4 }}>{submenu.title}</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(submenu.items.length, 3)}, 1fr)`,
        gap: 24,
        flex: 1,
        alignContent: 'start',
      }}>
        {submenu.items.map((it) => (
          <button key={it.id} onClick={() => onPick(it)}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 130 })}
            style={{
              background: t.surface,
              border: t.outline === 'none' ? `4px solid ${color}` : t.outline,
              borderRadius: t.cardRadius + 4,
              minHeight: 220,
              padding: 24,
              cursor: 'pointer',
              boxShadow: t.shadow,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 12,
              fontFamily: 'inherit',
              color: t.text,
            }}>
            <div style={{ fontSize: it.emoji.length > 3 ? 56 : 88, lineHeight: 1, fontWeight: 800, color: t.text }}>{it.emoji}</div>
            <div style={{ fontSize: fontSize + 8, fontWeight: 800 }}>{it.name}</div>
            {it.sub && <div style={{ fontSize: fontSize - 4, color: t.textMuted }}>{it.sub}</div>}
          </button>
        ))}
      </div>
      {mascotOn && (
        <div style={{ position: 'absolute', left: 56, bottom: 28 }}>
          <Mascot tone={t} mood="happy" size={84} message="원하는 걸 골라봐!" fontSize={fontSize - 2} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 내 갤러리 — 4×N 썸네일, 빈 상태 처리
// ─────────────────────────────────────────────────────────────
function GalleryScreen({ tone, fontSize, onPickColor }) {
  const t = tone;
  const color = t.cat.color;
  const accentBorder = t.outline === 'none' ? `3px solid ${color}` : t.outline;
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kw-gallery') || '[]'); } catch { return []; }
  });

  const remove = (id) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    try { localStorage.setItem('kw-gallery', JSON.stringify(next)); } catch {}
  };

  // 빈 상태
  if (!items.length) {
    return (
      <div style={{ padding: '88px 56px 28px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ paddingLeft: 80, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <span style={{ fontSize: 44 }}>🖼️</span>
          <div>
            <div style={{ fontSize: fontSize + 16, fontWeight: 900, color: t.text, lineHeight: 1 }}>내 갤러리</div>
            <div style={{ fontSize: fontSize - 4, color: t.textMuted, marginTop: 4 }}>내가 그린 작품을 모아봐</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div style={{
            fontSize: 160, lineHeight: 1,
            filter: 'grayscale(0.4)',
            animation: 'kw-pop 0.6s cubic-bezier(.34,1.56,.64,1) both',
          }}>🖼️</div>
          <div style={{ fontSize: fontSize + 16, fontWeight: 900, color: t.text, textAlign: 'center' }}>
            아직 작품이 없어요
          </div>
          <div style={{ fontSize: fontSize, color: t.textMuted, fontWeight: 700, textAlign: 'center' }}>
            색칠하러 가볼까?
          </div>
          <button onClick={onPickColor}
            onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 140 })}
            style={{
              background: color, color: t.textOnColor,
              border: t.outline === 'none' ? 'none' : t.outline,
              borderRadius: 36, padding: '18px 32px',
              fontSize: fontSize + 6, fontWeight: 900,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: t.shadow,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              marginTop: 6,
            }}>
            <span style={{ fontSize: 32 }}>🎨</span>색칠하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* 타이틀 */}
      <div style={{ height: 88, paddingLeft: 96, paddingRight: 110, display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
        <span style={{ fontSize: 36 }}>🖼️</span>
        <div style={{ fontSize: fontSize + 14, fontWeight: 900, color: t.text, lineHeight: 1 }}>내 갤러리</div>
        <div style={{
          fontSize: fontSize - 4, fontWeight: 900,
          background: '#fff', color: t.text,
          padding: '4px 12px', borderRadius: 12,
          border: accentBorder,
          marginLeft: 6,
        }}>{items.length}점</div>
      </div>

      {/* 4-column grid */}
      <div style={{ flex: 1, padding: '0 28px 24px', overflow: 'auto', minHeight: 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          {items.map((it) => (
            <GalleryThumb key={it.id} item={it} tone={t} fontSize={fontSize} onRemove={() => remove(it.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryThumb({ item, tone, fontSize, onRemove }) {
  const t = tone;
  const tpl = (COLORING_TEMPLATES && COLORING_TEMPLATES[item.tplId]) || null;
  const [confirming, setConfirming] = useState(false);
  const d = new Date(item.savedAt);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.cat.color}` : t.outline;

  return (
    <div style={{
      position: 'relative',
      background: '#fff',
      border: accentBorder,
      borderRadius: t.cardRadius,
      padding: 10,
      boxShadow: t.shadowSm,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* SVG 썸네일 */}
      <div style={{
        background: '#FAFAFA', borderRadius: t.cardRadius - 6,
        aspectRatio: '1 / 1',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 8,
        overflow: 'hidden',
      }}>
        {tpl ? (
          <svg viewBox={tpl.viewBox} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
            {tpl.parts.map((p) => (
              <path key={p.id} d={p.d}
                fill={item.fills[p.id] || '#FFFFFF'}
                stroke={t.text}
                strokeWidth="3"
                strokeLinejoin="round" strokeLinecap="round"
              />
            ))}
          </svg>
        ) : (
          <div style={{ fontSize: 48, color: t.textMuted }}>?</div>
        )}
      </div>

      {/* 메타 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{tpl ? tpl.emoji : '🎨'}</span>
          <span style={{ fontSize: fontSize - 6, fontWeight: 800, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tpl ? tpl.name : '작품'}
          </span>
        </div>
        <span style={{ fontSize: fontSize - 8, fontWeight: 700, color: t.textMuted, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto' }}>{dateStr}</span>
      </div>

      {/* 삭제 버튼 (2-tap confirm) */}
      <button onClick={() => { if (confirming) { onRemove(); } else { setConfirming(true); setTimeout(() => setConfirming(false), 2000); } }}
        aria-label="삭제"
        onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.88)' }], { duration: 130 })}
        style={{
          position: 'absolute', top: 6, right: 6,
          width: confirming ? 'auto' : 40, height: 40,
          padding: confirming ? '0 12px' : 0,
          borderRadius: 20,
          background: confirming ? '#C92A2A' : 'rgba(255,255,255,0.92)',
          color: confirming ? '#fff' : '#C92A2A',
          border: confirming ? 'none' : `2px solid #C92A2A55`,
          fontSize: confirming ? 13 : 22, fontWeight: 900,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
          whiteSpace: 'nowrap',
        }}>
        {confirming ? '한 번 더 탭' : '🗑'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 부모 설정 — 차분한 톤, 스크롤 가능 카드 섹션
// ─────────────────────────────────────────────────────────────
const SETTINGS_DEFAULTS = {
  timeLimit: '20',           // '10' | '20' | '30' | 'none'
  volBg: 50,
  volSfx: 70,
  volVoice: 70,
  catEnabled: {
    color: true, hangul: true, english: true, math: true, shape: true,
    music: true, code: true, brain: true, computer: true, social: true,
  },
};
const TIME_OPTIONS = [
  { v: '10', label: '10분' },
  { v: '20', label: '20분' },
  { v: '30', label: '30분' },
  { v: 'none', label: '무제한' },
];

function ParentSettings({ tone, onClose }) {
  const t = tone;
  // 어른 화면 — 차분한 회색 톤, 카테고리 컬러는 액센트로만
  const [settings, setSettings] = useState(() => {
    try { return { ...SETTINGS_DEFAULTS, ...(JSON.parse(localStorage.getItem('kw-parent-settings') || '{}')) }; }
    catch { return SETTINGS_DEFAULTS; }
  });
  const [toast, setToast] = useState(null);

  const save = (next) => {
    setSettings(next);
    try { localStorage.setItem('kw-parent-settings', JSON.stringify(next)); } catch {}
  };
  const set = (k, v) => save({ ...settings, [k]: v });
  const toggleCat = (id) => save({ ...settings, catEnabled: { ...settings.catEnabled, [id]: !settings.catEnabled[id] } });

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800); };
  const wipeGallery = () => {
    try { localStorage.removeItem('kw-gallery'); localStorage.removeItem('kw-recent-bg'); } catch {}
    flash('🖼️ 갤러리를 초기화했어요');
  };
  const wipeProgress = () => {
    try { localStorage.removeItem('kw-progress'); localStorage.removeItem('kw-stars'); } catch {}
    flash('📊 진행 기록을 초기화했어요');
  };

  // 어른용 팔레트 (톤마다 살짝 다른 중성 배경)
  const adultBg = t.id === 'C' ? '#EBE4D2' : t.id === 'B' ? '#F4F1F4' : '#EDEEF2';
  const cardBg = '#FFFFFF';
  const ink = t.id === 'C' ? '#3D2E1F' : '#2A2E3A';
  const subInk = t.id === 'C' ? '#7A6648' : '#6B7280';
  const hairline = 'rgba(0,0,0,0.08)';
  const dangerBg = '#FFEEEE';
  const dangerInk = '#C92A2A';
  const accent = t.cat.code; // 토글 on 색 — 차분한 녹색 계열

  // 데모 리포트 데이터 (실제 진행도 연결 전)
  const report = {
    minutesToday: 18,
    sessions: 3,
    starsToday: 12,
    topActs: [
      { name: '카드 뒤집기', minutes: 7, emoji: '🃏' },
      { name: '영역 색칠',   minutes: 6, emoji: '🪣' },
      { name: '기초 덧셈',   minutes: 5, emoji: '➕' },
    ],
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: adultBg,
      fontFamily: 'inherit',
      color: ink,
      display: 'flex', flexDirection: 'column',
      zIndex: 60,
    }}>
      {/* 상단바 */}
      <div style={{
        flex: '0 0 auto',
        height: 64, padding: '0 20px',
        background: '#FFFFFF',
        borderBottom: `1px solid ${hairline}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={onClose}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }], { duration: 120 })}
          aria-label="닫기"
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'transparent',
            border: `1px solid ${hairline}`,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: ink, padding: 0,
          }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 5 L8 11 L14 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>부모 설정</div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: subInk, fontWeight: 600 }}>
          변경 사항은 자동 저장돼요
        </div>
      </div>

      {/* 본문 스크롤 */}
      <div style={{
        flex: 1, overflow: 'auto',
        padding: '20px 32px 28px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          maxWidth: 960, margin: '0 auto',
        }}>
          {/* 1) 사용시간 제한 */}
          <SettingsCard title="사용시간 제한" emoji="⏱" subInk={subInk} ink={ink} cardBg={cardBg} hairline={hairline}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {TIME_OPTIONS.map((o) => {
                const active = settings.timeLimit === o.v;
                return (
                  <button key={o.v} onClick={() => set('timeLimit', o.v)}
                    style={{
                      height: 44, padding: '0 8px',
                      background: active ? ink : '#fff',
                      color: active ? '#fff' : ink,
                      border: `1.5px solid ${active ? ink : hairline}`,
                      borderRadius: 10,
                      fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 0.12s, color 0.12s, border 0.12s',
                    }}>{o.label}</button>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: subInk }}>
              제한 시간이 끝나면 부드러운 안내와 함께 활동이 일시정지돼요.
            </div>
          </SettingsCard>

          {/* 2) 음량 */}
          <SettingsCard title="음량" emoji="🔊" subInk={subInk} ink={ink} cardBg={cardBg} hairline={hairline}>
            <SlidRow label="배경음"     value={settings.volBg}    onChange={(v) => set('volBg', v)}    ink={ink} accent={accent} />
            <SlidRow label="효과음"     value={settings.volSfx}   onChange={(v) => set('volSfx', v)}   ink={ink} accent={accent} />
            <SlidRow label="음성 안내" value={settings.volVoice} onChange={(v) => set('volVoice', v)} ink={ink} accent={accent} last />
          </SettingsCard>

          {/* 3) 학습 리포트 */}
          <SettingsCard title="학습 리포트" emoji="📊" subInk={subInk} ink={ink} cardBg={cardBg} hairline={hairline} wide>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <Stat label="사용시간" value={`${report.minutesToday}분`} sub={`세션 ${report.sessions}회`} ink={ink} subInk={subInk} hairline={hairline} />
              <Stat label="획득 별"   value={`⭐ ${report.starsToday}개`} sub="오늘" ink={ink} subInk={subInk} hairline={hairline} />
              <Stat label="가장 많이" value={report.topActs[0].emoji + ' ' + report.topActs[0].name} sub={`${report.topActs[0].minutes}분`} ink={ink} subInk={subInk} hairline={hairline} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: subInk, marginBottom: 6, letterSpacing: '0.04em' }}>주요 활동</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {report.topActs.map((a, i) => {
                const max = Math.max(...report.topActs.map((x) => x.minutes));
                const pct = Math.round((a.minutes / max) * 100);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < report.topActs.length - 1 ? `1px solid ${hairline}` : 'none' }}>
                    <span style={{ fontSize: 22, lineHeight: 1, width: 26 }}>{a.emoji}</span>
                    <span style={{ flex: '0 0 96px', fontSize: 14, fontWeight: 600 }}>{a.name}</span>
                    <div style={{ flex: 1, height: 6, background: hairline, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 3 }} />
                    </div>
                    <span style={{ flex: '0 0 50px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums' }}>{a.minutes}분</span>
                  </div>
                );
              })}
            </div>
          </SettingsCard>

          {/* 4) 카테고리 관리 */}
          <SettingsCard title="카테고리 관리" emoji="🔒" subInk={subInk} ink={ink} cardBg={cardBg} hairline={hairline} wide>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {KIDS_CATEGORIES.map((c) => {
                const on = settings.catEnabled[c.id] !== false;
                return (
                  <button key={c.id} onClick={() => toggleCat(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px',
                      background: '#fff', color: ink,
                      border: `1.5px solid ${on ? accent : hairline}`,
                      borderRadius: 10,
                      cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left',
                    }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: on ? accent : '#fff',
                      border: `1.5px solid ${on ? accent : 'rgba(0,0,0,0.25)'}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 14, fontWeight: 900, lineHeight: 1,
                    }}>{on ? '✓' : ''}</span>
                    <span style={{ width: 20, fontSize: 18, lineHeight: 1, textAlign: 'center', fontWeight: 800, color: t.cat[c.id] }}>{c.emoji.length <= 2 ? c.emoji : c.emoji.slice(0, 1)}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? accent : subInk, opacity: 0.85 }}>{on ? 'ON' : 'OFF'}</span>
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          {/* 5) 데이터 관리 */}
          <SettingsCard title="데이터 관리" emoji="🗑" subInk={subInk} ink={ink} cardBg={cardBg} hairline={hairline} wide>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={wipeGallery}
                onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }], { duration: 130 })}
                style={{
                  flex: 1, minWidth: 200,
                  background: dangerBg, color: dangerInk,
                  border: `1.5px solid ${dangerInk}33`,
                  borderRadius: 10, padding: '12px 16px',
                  fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <span style={{ fontSize: 20 }}>🖼️</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>갤러리 초기화</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: dangerInk, opacity: 0.8 }}>저장된 그림을 모두 삭제</span>
                </div>
              </button>
              <button onClick={wipeProgress}
                onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }], { duration: 130 })}
                style={{
                  flex: 1, minWidth: 200,
                  background: dangerBg, color: dangerInk,
                  border: `1.5px solid ${dangerInk}33`,
                  borderRadius: 10, padding: '12px 16px',
                  fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span>진행 초기화</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: dangerInk, opacity: 0.8 }}>학습 기록과 별을 초기화</span>
                </div>
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: subInk }}>
              초기화는 되돌릴 수 없어요. 신중히 결정해주세요.
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: ink, color: '#fff',
          padding: '10px 18px', borderRadius: 22,
          fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'kw-celeb-card 0.3s ease both',
        }}>{toast}</div>
      )}
    </div>
  );
}

function SettingsCard({ title, emoji, children, ink, subInk, cardBg, hairline, wide }) {
  return (
    <div style={{
      gridColumn: wide ? '1 / -1' : 'auto',
      background: cardBg,
      borderRadius: 14,
      padding: '14px 18px 16px',
      border: `1px solid ${hairline}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: ink, letterSpacing: '-0.01em' }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function SlidRow({ label, value, onChange, ink, accent, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
      <span style={{ flex: '0 0 72px', fontSize: 13, fontWeight: 600, color: ink }}>{label}</span>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{
          flex: 1, accentColor: accent, height: 4,
        }} />
      <span style={{ flex: '0 0 36px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: ink, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function Stat({ label, value, sub, ink, subInk, hairline }) {
  return (
    <div style={{ background: '#FAFAFB', border: `1px solid ${hairline}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: subInk, letterSpacing: '0.04em' }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: ink, marginTop: 2, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: subInk, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 결과/칭찬 화면 — 활동 완료 후
// ─────────────────────────────────────────────────────────────
function CelebrationScreen({ tone, fontSize, sessionStars, totalStars, onHome, onRetry }) {
  const t = tone;
  // 컨페티 파티클 — 시드된 좌표 (re-render 시 안정)
  const particles = React.useMemo(() => {
    const emojis = ['🎊', '🎉', '✨', '🌟', '⭐', '🎈'];
    return Array.from({ length: 32 }).map((_, i) => ({
      id: i,
      e: emojis[i % emojis.length],
      left: Math.round((i * 37 + 13) % 100),
      delay: ((i * 0.17) % 2.5).toFixed(2),
      dur: (2.6 + (i % 5) * 0.4).toFixed(2),
      drift: (i % 2 === 0 ? 1 : -1) * (8 + (i % 6) * 5),
      size: 26 + (i % 5) * 8,
      rot: (i % 2 === 0 ? 1 : -1) * (180 + (i % 3) * 120),
    }));
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #FFE66D 0%, #FFB454 55%, #FF8A5C 100%)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* 컨페티 */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map((p) => (
          <span key={p.id} style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: -60,
            fontSize: p.size,
            lineHeight: 1,
            animation: `kw-confetti ${p.dur}s linear ${p.delay}s infinite`,
            '--drift': `${p.drift}vw`,
            '--rot': `${p.rot}deg`,
            filter: 'drop-shadow(0 3px 6px rgba(200,100,30,0.25))',
          }}>{p.e}</span>
        ))}
      </div>

      {/* 3 stars */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 18, zIndex: 2 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            fontSize: 120, lineHeight: 1,
            animation: `kw-star-spring 0.9s cubic-bezier(.34,1.7,.5,1) ${0.15 + i * 0.18}s both`,
            filter: 'drop-shadow(0 8px 0 rgba(180,80,30,0.4)) drop-shadow(0 12px 24px rgba(180,80,30,0.4))',
          }}>⭐</div>
        ))}
      </div>

      {/* 큰 텍스트 */}
      <div style={{
        fontSize: fontSize + 48, fontWeight: 900, color: '#fff',
        letterSpacing: '-0.04em', lineHeight: 1.05,
        textAlign: 'center',
        textShadow: '0 4px 0 rgba(180,80,30,0.5), 0 8px 24px rgba(180,80,30,0.35)',
        animation: 'kw-celeb-title 0.7s cubic-bezier(.34,1.56,.64,1) 0.6s both',
        marginBottom: 18,
        zIndex: 2,
      }}>🎉 잘했어! 🎉</div>

      {/* 정보 카드 */}
      <div style={{
        background: '#fff',
        borderRadius: 28,
        padding: '18px 30px',
        display: 'flex', alignItems: 'center', gap: 28,
        boxShadow: '0 8px 0 rgba(180,80,30,0.20), 0 14px 28px rgba(180,80,30,0.20)',
        border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
        marginBottom: 26,
        zIndex: 2,
        animation: 'kw-celeb-card 0.6s cubic-bezier(.34,1.56,.64,1) 0.85s both',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: fontSize - 4, color: t.textMuted, fontWeight: 800 }}>오늘 받은 별</div>
          <div style={{
            fontSize: 44, fontWeight: 900, color: t.text,
            display: 'flex', alignItems: 'center', gap: 6,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 38, lineHeight: 1 }}>⭐</span>{sessionStars}
          </div>
        </div>
        <div style={{ width: 2, height: 56, background: 'rgba(0,0,0,0.08)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: fontSize - 4, color: t.textMuted, fontWeight: 800 }}>총 별</div>
          <div style={{
            fontSize: 44, fontWeight: 900, color: t.text,
            display: 'flex', alignItems: 'center', gap: 6,
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 38, lineHeight: 1 }}>🌟</span>{totalStars}
          </div>
        </div>
      </div>

      {/* 큰 버튼 2개 */}
      <div style={{
        display: 'flex', gap: 18, zIndex: 2,
        animation: 'kw-celeb-card 0.5s ease 1.1s both',
      }}>
        <button onClick={onHome}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 140 })}
          style={{
            background: '#fff', color: t.text,
            border: t.outline === 'none' ? `4px solid ${t.text}` : t.outline,
            borderRadius: 40,
            padding: '0 32px', minWidth: 200, height: 80,
            fontSize: fontSize + 8, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 0 rgba(180,80,30,0.30), 0 10px 20px rgba(180,80,30,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
          <span style={{ fontSize: 36 }}>🏠</span>홈으로
        </button>
        <button onClick={onRetry}
          onPointerDown={(e) => e.currentTarget.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.92)' }], { duration: 140 })}
          style={{
            background: t.primary, color: '#fff',
            border: t.outline === 'none' ? 'none' : t.outline,
            borderRadius: 40,
            padding: '0 32px', minWidth: 200, height: 80,
            fontSize: fontSize + 8, fontWeight: 900,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 0 rgba(180,80,30,0.30), 0 10px 20px rgba(180,80,30,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
          <span style={{ fontSize: 36 }}>🔄</span>다시하기
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 미구현 카테고리용 자리표시 화면
function PlaceholderScreen({ tone, cat, fontSize }) {
  const t = tone;
  return (
    <div style={{ padding: '88px 56px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ fontSize: 140 }}>{cat.emoji}</div>
      <div style={{ fontSize: fontSize + 16, fontWeight: 800, color: t.text }}>{cat.name}</div>
      <div style={{ fontSize: fontSize + 2, color: t.textMuted, background: '#fff', padding: '12px 24px', borderRadius: 999, border: t.outline === 'none' ? `3px dashed ${t.cat[cat.id]}` : t.outline }}>
        곧 만나요!
      </div>
    </div>
  );
}

export {
  IPadFrame, Mascot, StarCounter, BackButton, VoiceGuide, BigButton,
  HomeScreen, SubmenuScreen, PlaceholderScreen, ColorMenuScreen, FreeBgScreen, CelebrationScreen, ParentSettings, GalleryScreen,
  SUBMENUS, COLOR_MENU_ITEMS, FREE_BG_TABS,
}
