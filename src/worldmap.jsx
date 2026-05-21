// kidsweb-worldmap.jsx
// 홈 화면 = 가로 스크롤 월드맵 "곰곰이의 사계절 마을"
// 봄 → 여름 → 가을 3구역, 10개 장소를 곰곰이가 걸어다니며 탐험.
// WorldMapHome: app.jsx 에서 홈 화면으로 사용.

import React from 'react'
import { KIDS_CATEGORIES } from './themes.jsx'

const { useState: useStateMap, useEffect: useEffectMap, useRef: useRefMap, useMemo: useMemoMap, useCallback: useCallbackMap } = React;

// ─────────────────────────────────────────────────────────────
// 상수: 맵 크기 & 장소 데이터
// ─────────────────────────────────────────────────────────────
const MAP_WIDTH = 2880;       // 가로 파노라마 폭 (≈ 화면 3개분)
const MAP_HEIGHT = 704;       // 768(전체) - 64(상단바)
const HORIZON_Y = 420;        // 지면 시작 (하늘/땅 경계)
const GROUND_Y  = 560;        // 곰곰이가 서있는 길의 평균 y

const HOUSE_X = 160;
const BEAR_SPEED = 280;     // 곰곰이 걷기 속도 (px/s) — 거리와 무관하게 일정
const BEAR_WALK_MIN = 0.6;  // 최소 걷기 시간 (s)
const BEAR_WALK_MAX = 2.8;  // 최대 걷기 시간 (s)

// 계절 페이지 (스냅 스크롤용)
// 각 페이지의 snapX 는 해당 시즌 장소들이 뷰포트(1024px) 내에 완전히 들어오도록 계산됨다.
const SEASON_PAGES = [
  { id: 'spring', name: '봄 동산',  emoji: '🌸', snapX: 0    },
  { id: 'summer', name: '여름 바다', emoji: '☀️', snapX: 928  },
  { id: 'fall',   name: '가을 숲',   emoji: '🍂', snapX: 1856 },
];

// 10개 장소 — 카테고리 매핑 + 지도상의 x좌표
const WORLD_PLACES = [
  // 🌸 봄 동산 (0–960)
  { id: 'p-color',  catId: 'color',    name: '색칠 언덕',     emoji: '🎨', x: 470,  season: 'spring', kind: 'hill' },
  { id: 'p-shape',  catId: 'shape',    name: '모양 꽃밭',     emoji: '🔷', x: 680,  season: 'spring', kind: 'flowers' },
  { id: 'p-music',  catId: 'music',    name: '노래 폭포',     emoji: '🎵', x: 880,  season: 'spring', kind: 'waterfall' },
  // ☀️ 여름 바다 (960–1920)
  { id: 'p-hangul', catId: 'hangul',   name: '글자나무 숲',   emoji: '📚', x: 1110, season: 'summer', kind: 'forest' },
  { id: 'p-english',catId: 'english',  name: 'ABC 모래사장',  emoji: '🔤', x: 1370, season: 'summer', kind: 'beach' },
  { id: 'p-math',   catId: 'math',     name: '숫자 산',       emoji: '🔢', x: 1640, season: 'summer', kind: 'mountain' },
  // 🍂 가을 숲 (1920–2880)
  { id: 'p-code',   catId: 'code',     name: '로봇 공장',     emoji: '🤖', x: 1990, season: 'fall',   kind: 'factory' },
  { id: 'p-brain',  catId: 'brain',    name: '수수께끼 동굴', emoji: '🧩', x: 2210, season: 'fall',   kind: 'cave' },
  { id: 'p-comp',   catId: 'computer', name: '반짝 등대',     emoji: '💻', x: 2460, season: 'fall',   kind: 'lighthouse' },
  { id: 'p-social', catId: 'social',   name: '친구 광장',     emoji: '💬', x: 2700, season: 'fall',   kind: 'plaza' },
];

// 데모 진행도(별 갯수) — localStorage 가 비어있을 때 보여주는 4단계 미리보기.
// 흐림(0)/또렷(1~4)/꽃(5~14)/반짝(15+)
const DEMO_STARS = {
  'p-color':   18, // ✨반짝
  'p-shape':    3, // 또렷
  'p-music':    7, // 🌸꽃
  'p-hangul':   1, // 또렷
  'p-english':  0, // 흐림
  'p-math':     8, // 🌸꽃
  'p-code':     2, // 또렷
  'p-brain':    0, // 흐림
  'p-comp':     0, // 흐림
  'p-social':   0, // 흐림
};

// ─────────────────────────────────────────────────────────────
// 시즌 팔레트 — 톤(A/B/C) × 시즌(봄/여름/가을)
// ─────────────────────────────────────────────────────────────
function seasonPalette(toneId, season) {
  if (toneId === 'A') {
    if (season === 'spring') return { sky:'#FFDFEB', skyTop:'#FFB7D2', ground:'#A8DDB0', groundDark:'#86CD92', far:'#C2E6CC', mid:'#8FD49E', accent:'#FF8AB5' };
    if (season === 'summer') return { sky:'#B9E4F5', skyTop:'#7FCEEC', ground:'#FFE19E', groundDark:'#F2C674', far:'#A2D9EE', mid:'#5BB9DC', accent:'#4ECDC4' };
    return                          { sky:'#FFCFA5', skyTop:'#FFB078', ground:'#F0B080', groundDark:'#D88C5C', far:'#E4A572', mid:'#C68150', accent:'#C2614F' };
  }
  if (toneId === 'B') {
    if (season === 'spring') return { sky:'#FFE8F0', skyTop:'#FFD0E0', ground:'#D9F0DC', groundDark:'#BFE2C6', far:'#E5F0E2', mid:'#C8E0CB', accent:'#F9B8CB' };
    if (season === 'summer') return { sky:'#DBF0F8', skyTop:'#C0E2EE', ground:'#F2EAC8', groundDark:'#E5D8AC', far:'#D5EAF0', mid:'#B5D6E0', accent:'#BAE1E0' };
    return                          { sky:'#FFE5D5', skyTop:'#FFCEB0', ground:'#F5CBB0', groundDark:'#E5AC92', far:'#F5D5C0', mid:'#E0B79A', accent:'#E5B289' };
  }
  // C — 지브리 수채화
  if (season === 'spring') return { sky:'#E8D2D8', skyTop:'#D8B5BE', ground:'#B5C9A0', groundDark:'#92AD82', far:'#C8D2BD', mid:'#9DB892', accent:'#C28098' };
  if (season === 'summer') return { sky:'#B8D5DD', skyTop:'#9DC1CE', ground:'#C8C08C', groundDark:'#A89870', far:'#B5C8C8', mid:'#94ADAE', accent:'#5C947B' };
  return                          { sky:'#E5BFA0', skyTop:'#D5A07C', ground:'#C99878', groundDark:'#A87958', far:'#D2A985', mid:'#B08862', accent:'#C2614F' };
}

// 시간대 오버레이 (sky 전체에 multiply blend)
function timeOverlay(when) {
  if (when === 'morning') return 'linear-gradient(180deg, rgba(255,205,150,0.28) 0%, rgba(255,225,180,0.10) 55%, rgba(255,255,255,0) 100%)';
  if (when === 'evening') return 'linear-gradient(180deg, rgba(180,130,170,0.36) 0%, rgba(160,120,170,0.22) 50%, rgba(110,90,130,0.12) 100%)';
  return 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 50%)';
}

// 진행도 → 단계
function tierFromStars(stars) {
  if (stars >= 15) return 3;  // ✨ 반짝
  if (stars >= 5)  return 2;  // 🌸 꽃
  if (stars >= 1)  return 1;  // 또렷
  return 0;                    // 흐림
}

// ─────────────────────────────────────────────────────────────
// 메인: WorldMapHome
// ─────────────────────────────────────────────────────────────
function WorldMapHome({ tone, fontSize, mascotOn, onPick, stars, onSettings, timeOfDay }) {
  const scrollRef = useRefMap(null);

  // 곰곰이 위치 (지도 x 좌표)
  const [bearX, setBearX] = useStateMap(HOUSE_X + 80);
  const [walking, setWalking] = useStateMap(null);
  const [bubbleHidden, setBubbleHidden] = useStateMap(false);
  const [walkDur, setWalkDur] = useStateMap(BEAR_WALK_MIN);

  // 현재 보고 있는 계절 페이지 (스크롤 위치 → 0/1/2)
  const [currentPage, setCurrentPage] = useStateMap(0);
  const [pageBadgeKey, setPageBadgeKey] = useStateMap(0);

  // 장소별 별 갯수 (localStorage > demo)
  const placeStars = useMemoMap(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('kw-place-stars') || 'null');
      if (raw && typeof raw === 'object') return { ...DEMO_STARS, ...raw };
    } catch {}
    return DEMO_STARS;
  }, [walking]);

  // 추천: 미방문 장소 중 첫 번째, 없으면 가장 별이 적은 곳
  const recommended = useMemoMap(() => {
    const unvisited = WORLD_PLACES.find((p) => (placeStars[p.id] || 0) === 0);
    if (unvisited) return unvisited.id;
    const sorted = [...WORLD_PLACES].sort((a, b) => (placeStars[a.id] || 0) - (placeStars[b.id] || 0));
    return sorted[0].id;
  }, [placeStars]);

  // 진입 시 시작점이 살짝 보이게 초기 스크롤 0
  useEffectMap(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, []);

  // 스크롤 위치 → 현재 페이지 갱신 (raf 디바운스)
  useEffectMap(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = null;
    const onScroll = () => {
      if (raf != null) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const x = el.scrollLeft;
        let best = 0;
        let bestDist = Infinity;
        SEASON_PAGES.forEach((p, i) => {
          const d = Math.abs(x - p.snapX);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setCurrentPage(best);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // 페이지 변경 시 배지 애니메이션 트리거
  useEffectMap(() => {
    setPageBadgeKey((k) => k + 1);
  }, [currentPage]);

  const goToPage = (i) => {
    const target = SEASON_PAGES[Math.max(0, Math.min(SEASON_PAGES.length - 1, i))];
    scrollRef.current?.scrollTo({ left: target.snapX, behavior: 'smooth' });
  };

  // 미니맵에서 장소 점을 누르면 그 장소가 화면 가운데 오도록 스크롤
  const scrollToPlace = (place) => {
    const target = Math.max(0, Math.min(MAP_WIDTH - 1024, place.x - 512));
    scrollRef.current?.scrollTo({ left: target, behavior: 'smooth' });
  };

  // 장소 터치 → 곰곰이 걷기 → 카테고리 진입
  const pickPlace = (place) => {
    if (walking) return;
    setBubbleHidden(true);
    // 곰곰이가 장소 왼편으로 걸어감
    const targetX = place.x - 70;
    // 이동 거리에 비례한 시간 → 거리와 무관하게 항상 같은 속도
    const dist = Math.abs(targetX - bearX);
    const dur = Math.min(BEAR_WALK_MAX, Math.max(BEAR_WALK_MIN, dist / BEAR_SPEED));
    setWalkDur(dur);
    setWalking(place);
    setBearX(targetX);
    // 맵 자동 스크롤 — 선택한 장소가 화면 가운데 오도록
    if (scrollRef.current) {
      const target = Math.max(0, Math.min(MAP_WIDTH - 1024, place.x - 512));
      scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
    // 곰곰이 도착 후 카테고리로 진입
    setTimeout(() => {
      const cat = KIDS_CATEGORIES.find((c) => c.id === place.catId);
      if (cat) onPick(cat);
    }, dur * 1000 + 130);
  };

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      {/* ─── 상단바 ─── */}
      <WorldTopBar tone={tone} stars={stars} onSettings={onSettings} />

      {/* ─── 맵 뷰포트 (가로 스크롤 + 계절 스냅) ─── */}
      <div ref={scrollRef}
        className="kw-worldmap-scroll"
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
        {/* 인너 맵 */}
        <div style={{ width: MAP_WIDTH, height: '100%', position: 'relative', minHeight: MAP_HEIGHT }}>
          {/* 1) 배경 + 지형 SVG */}
          <MapBackground tone={tone} />

          {/* 2) 시간대 오버레이 */}
          <div aria-hidden style={{
            position:'absolute', inset: 0,
            background: timeOverlay(timeOfDay),
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }} />

          {/* 3) 시즌 라벨 (옅게 떠다님) */}
          <SeasonLabels tone={tone} />

          {/* 4) 길 SVG (지형 위에 얹음) */}
          <PathOverlay tone={tone} />

          {/* 5) 곰곰이집 */}
          <BearHouse x={HOUSE_X} tone={tone} />

          {/* 6) 장소 10개 */}
          {WORLD_PLACES.map((p) => (
            <Place key={p.id} place={p} tone={tone}
              tier={tierFromStars(placeStars[p.id] || 0)}
              stars={placeStars[p.id] || 0}
              recommended={p.id === recommended && !walking && !bubbleHidden}
              walking={walking?.id === p.id}
              onPick={() => pickPlace(p)} />
          ))}

          {/* 7) 곰곰이 캐릭터 (걸어다님) */}
          <BearWalker x={bearX} tone={tone} walking={!!walking} mascotOn={mascotOn} walkDur={walkDur} />
        </div>
      </div>

      {/* 현재 계절 배지 — 페이지 바뀔 때마다 통통 */}
      <SeasonBadge key={pageBadgeKey} tone={tone} page={SEASON_PAGES[currentPage]} index={currentPage} />

      {/* ─── 하단 미니맵 / 진행도 ─── */}
      <MiniMap tone={tone} bearX={bearX} placeStars={placeStars}
        currentPage={currentPage} walkDur={walkDur}
        onPageJump={(i) => goToPage(i)}
        onPlaceJump={scrollToPlace} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 상단바: 제목 + 별 카운터 + 설정 (홈 전용 chrome)
// ─────────────────────────────────────────────────────────────
function WorldTopBar({ tone, stars, onSettings }) {
  const t = tone;
  const accentBorder = t.outline === 'none' ? `3px solid ${t.accent}` : t.outline;
  return (
    <div style={{
      height: 64, flex: '0 0 auto',
      padding: '0 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: t.outline === 'none' ? `2px solid rgba(0,0,0,0.06)` : `1px solid rgba(0,0,0,0.10)`,
      zIndex: 10, position: 'relative',
    }}>
      {/* 좌 — 작은 곰곰이 마크 + 제목 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 22,
          background: t.cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, lineHeight: 1, boxShadow: t.shadowSm,
          border: t.outline === 'none' ? 'none' : t.outline,
        }}>🐻</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.textMuted, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>KIDSWEB</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: t.text, letterSpacing: '-0.02em', marginTop: 2, whiteSpace: 'nowrap' }}>곰곰이의 사계절 마을</span>
        </div>
      </div>

      {/* 우 — 별 + 설정 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 999,
          padding: '8px 16px 8px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 22, fontWeight: 900, color: t.text,
          border: accentBorder, boxShadow: t.shadowSm,
          fontVariantNumeric: 'tabular-nums', minWidth: 70,
        }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>⭐</span>{stars}
        </div>
        <button onClick={onSettings} aria-label="부모 설정"
          onPointerDown={(e) => e.currentTarget.animate([{ transform:'scale(1)' }, { transform:'scale(0.92)' }], { duration: 130 })}
          style={{
            width: 48, height: 48, borderRadius: 24,
            background: '#fff', border: accentBorder,
            cursor: 'pointer', fontSize: 24, lineHeight: 1,
            boxShadow: t.shadowSm,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', color: t.text,
          }}>⚙</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 배경 SVG — 하늘 + 시즌 그라데이션 + 먼 산 + 중간 언덕 + 지면
// ─────────────────────────────────────────────────────────────
function MapBackground({ tone }) {
  const sp = seasonPalette(tone.id, 'spring');
  const su = seasonPalette(tone.id, 'summer');
  const fa = seasonPalette(tone.id, 'fall');

  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width={MAP_WIDTH} height={MAP_HEIGHT}
      style={{ position:'absolute', inset: 0, display:'block' }} preserveAspectRatio="none">
      <defs>
        {/* 하늘 가로 시즌 그라데이션 (블렌딩 구간 넓게) */}
        <linearGradient id="bg-sky" x1="0" y1="0" x2={MAP_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor={sp.skyTop}/>
          <stop offset="22%" stopColor={sp.sky}/>
          <stop offset="38%" stopColor={su.sky}/>
          <stop offset="58%" stopColor={su.skyTop}/>
          <stop offset="72%" stopColor={fa.sky}/>
          <stop offset="100%" stopColor={fa.skyTop}/>
        </linearGradient>
        {/* 하늘 세로 — 위쪽 더 진하게 */}
        <linearGradient id="bg-sky-v" x1="0" y1="0" x2="0" y2={HORIZON_Y} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#000" stopOpacity="0.06"/>
          <stop offset="60%"  stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#fff" stopOpacity="0.3"/>
        </linearGradient>
        {/* 먼 산 — 옅은 시즌색 */}
        <linearGradient id="bg-far" x1="0" y1="0" x2={MAP_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor={sp.far}/>
          <stop offset="33%" stopColor={sp.far}/>
          <stop offset="50%" stopColor={su.far}/>
          <stop offset="66%" stopColor={su.far}/>
          <stop offset="83%" stopColor={fa.far}/>
          <stop offset="100%" stopColor={fa.far}/>
        </linearGradient>
        {/* 중간 언덕 */}
        <linearGradient id="bg-mid" x1="0" y1="0" x2={MAP_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor={sp.mid}/>
          <stop offset="33%" stopColor={sp.mid}/>
          <stop offset="50%" stopColor={su.mid}/>
          <stop offset="66%" stopColor={su.mid}/>
          <stop offset="83%" stopColor={fa.mid}/>
          <stop offset="100%" stopColor={fa.mid}/>
        </linearGradient>
        {/* 지면 */}
        <linearGradient id="bg-ground" x1="0" y1="0" x2={MAP_WIDTH} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"  stopColor={sp.ground}/>
          <stop offset="33%" stopColor={sp.ground}/>
          <stop offset="50%" stopColor={su.ground}/>
          <stop offset="66%" stopColor={su.ground}/>
          <stop offset="83%" stopColor={fa.ground}/>
          <stop offset="100%" stopColor={fa.ground}/>
        </linearGradient>
        <linearGradient id="bg-ground-v" x1="0" y1={HORIZON_Y} x2="0" y2={MAP_HEIGHT} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#000" stopOpacity="0"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0.18"/>
        </linearGradient>
      </defs>

      {/* 하늘 */}
      <rect x="0" y="0" width={MAP_WIDTH} height={HORIZON_Y + 20} fill="url(#bg-sky)"/>
      <rect x="0" y="0" width={MAP_WIDTH} height={HORIZON_Y} fill="url(#bg-sky-v)"/>

      {/* 먼 산 — 부드러운 곡선 */}
      <path d={farMountainsPath()} fill="url(#bg-far)" opacity="0.85"/>
      {/* 중간 언덕 */}
      <path d={midHillsPath()} fill="url(#bg-mid)"/>

      {/* 지면 */}
      <rect x="0" y={HORIZON_Y} width={MAP_WIDTH} height={MAP_HEIGHT - HORIZON_Y} fill="url(#bg-ground)"/>
      <rect x="0" y={HORIZON_Y} width={MAP_WIDTH} height={MAP_HEIGHT - HORIZON_Y} fill="url(#bg-ground-v)"/>

      {/* 여름 바다 + 돛단배 */}
      <SummerSea tone={tone} />
      {/* 가을 단풍나무 */}
      <FallTrees tone={tone} />

      {/* 시즌 경계 위 더 부드럽게 — 가벼운 라이트빔 */}
      <SeasonBoundaries />

      {/* 멀리 떠다니는 자연물 (벚꽃잎, 갈매기, 낙엽) */}
      <DistantAccents tone={tone}/>
    </svg>
  );
}

// 먼 산 — 시즌별 모양: 봄(낮은 둥근 산), 여름(돛같은 뾰족산), 가을(우뚝 솟은 능선)
function farMountainsPath() {
  // 0..960 (spring) — gentle rolling
  // 960..1920 (summer) — taller, jagged
  // 1920..2880 (fall)  — bigger, layered
  const baseY = HORIZON_Y - 0;
  let d = `M 0 ${baseY}`;
  // Spring rolling hills
  d += ` L 0 ${baseY - 30}`;
  d += ` Q 120 ${baseY - 90} 240 ${baseY - 50}`;
  d += ` Q 360 ${baseY - 110} 480 ${baseY - 70}`;
  d += ` Q 600 ${baseY - 130} 760 ${baseY - 80}`;
  d += ` Q 880 ${baseY - 100} 960 ${baseY - 85}`;
  // Summer mountains
  d += ` L 1040 ${baseY - 150}`;
  d += ` L 1140 ${baseY - 90}`;
  d += ` L 1240 ${baseY - 180}`;
  d += ` L 1360 ${baseY - 110}`;
  d += ` L 1480 ${baseY - 200}`;
  d += ` L 1600 ${baseY - 130}`;
  d += ` L 1720 ${baseY - 170}`;
  d += ` L 1840 ${baseY - 110}`;
  d += ` L 1920 ${baseY - 140}`;
  // Fall mountains
  d += ` Q 2040 ${baseY - 220} 2160 ${baseY - 140}`;
  d += ` Q 2280 ${baseY - 240} 2440 ${baseY - 130}`;
  d += ` Q 2580 ${baseY - 200} 2720 ${baseY - 120}`;
  d += ` Q 2820 ${baseY - 160} ${MAP_WIDTH} ${baseY - 100}`;
  d += ` L ${MAP_WIDTH} ${baseY} Z`;
  return d;
}

// 중간 언덕 — 더 가깝고 진함
function midHillsPath() {
  const baseY = HORIZON_Y + 10;
  let d = `M 0 ${baseY + 30}`;
  d += ` L 0 ${baseY - 10}`;
  d += ` Q 160 ${baseY - 60} 320 ${baseY - 20}`;
  d += ` Q 480 ${baseY - 50} 640 ${baseY - 25}`;
  d += ` Q 800 ${baseY - 55} 960 ${baseY - 20}`;
  d += ` Q 1120 ${baseY - 80} 1280 ${baseY - 35}`;
  d += ` Q 1440 ${baseY - 90} 1600 ${baseY - 40}`;
  d += ` Q 1760 ${baseY - 100} 1920 ${baseY - 30}`;
  d += ` Q 2120 ${baseY - 80} 2320 ${baseY - 40}`;
  d += ` Q 2520 ${baseY - 70} 2720 ${baseY - 30}`;
  d += ` Q 2820 ${baseY - 50} ${MAP_WIDTH} ${baseY - 20}`;
  d += ` L ${MAP_WIDTH} ${baseY + 30} Z`;
  return d;
}

// 시즌 경계 — 옅은 라이트빔
function SeasonBoundaries() {
  return (
    <g opacity="0.35">
      <rect x="930" y="0" width="60" height={HORIZON_Y + 20} fill="url(#bg-sky)" />
      <rect x="1890" y="0" width="60" height={HORIZON_Y + 20} fill="url(#bg-sky)" />
    </g>
  );
}

// 물결치는 선 — 바다 윗변 / 물결 줄무늬 / 거품 공용
function wavyLine(x0, x1, y, amp, step) {
  let d = `M ${x0} ${y}`;
  let up = true;
  for (let x = x0; x < x1; x += step) {
    const nx = Math.min(x + step, x1);
    d += ` Q ${((x + nx) / 2).toFixed(1)} ${y + (up ? -amp : amp)} ${nx.toFixed(1)} ${y}`;
    up = !up;
  }
  return d;
}

// ─────────────────────────────────────────────────────────────
// 여름 바다 — 물결 + 돛단배 (여름 구간 x 950~1930)
// ─────────────────────────────────────────────────────────────
function SummerSea({ tone }) {
  const t = tone;
  const sea  = t.id === 'C' ? '#7BA8B0' : t.id === 'B' ? '#A6D6E2' : '#5BBEDB';
  const seaD = t.id === 'C' ? '#5E8C95' : t.id === 'B' ? '#86BFD0' : '#3E9FC2';
  const X0 = 950, X1 = 1930, SEA_TOP = 428, SEA_BOT = 514;

  const seaPath = `${wavyLine(X0, X1, SEA_TOP, 6, 80)} L ${X1} ${SEA_BOT} L ${X0} ${SEA_BOT} Z`;

  const boats = [
    { x: 1130, y: 488, s: 0.95, sail: t.id === 'C' ? '#C2614F' : '#FF8AB5', flag: t.id === 'C' ? '#C2614F' : '#FF6B6B', d: '0s'   },
    { x: 1440, y: 466, s: 1.18, sail: t.id === 'C' ? '#E8C547' : '#FFE66D', flag: t.id === 'C' ? '#5C947B' : '#4ECDC4', d: '0.7s' },
    { x: 1760, y: 492, s: 0.86, sail: t.id === 'C' ? '#5C947B' : '#4ECDC4', flag: t.id === 'C' ? '#E8C547' : '#FFD93B', d: '1.4s' },
  ];

  return (
    <g>
      {/* 바다 */}
      <path d={seaPath} fill={sea}/>
      {/* 물결 줄무늬 */}
      {[450, 472, 496].map((y, i) => (
        <path key={i} d={wavyLine(X0 + 50, X1 - 50, y, 5, 90)}
          fill="none" stroke={seaD} strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      ))}
      {/* 해안선 거품 */}
      <path d={wavyLine(X0, X1, SEA_BOT, 7, 110)}
        fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.85"/>

      {/* 돛단배 */}
      {boats.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
          <g style={{ animation: `kw-boat-bob ${3 + i * 0.7}s ease-in-out ${b.d} infinite` }}>
            <line x1="0" y1="-46" x2="0" y2="6" stroke="#7A5A3A" strokeWidth="3" strokeLinecap="round"/>
            <path d="M 0 -44 L 14 -40 L 0 -36 Z" fill={b.flag}/>
            <path d="M 3 -42 Q 30 -20 5 2 Z" fill={b.sail} stroke="#fff" strokeWidth="2"/>
            <path d="M -3 -36 Q -22 -18 -5 0 Z" fill={b.sail} opacity="0.65" stroke="#fff" strokeWidth="1.5"/>
            <path d="M -27 2 L 27 2 L 19 17 L -19 17 Z"
              fill={t.id === 'C' ? '#9A6B45' : '#C77B4A'} stroke="#6E4A2C" strokeWidth="2.5" strokeLinejoin="round"/>
          </g>
        </g>
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// 가을 단풍나무 — 가을 구간 배경 장식 (장소 뒤)
// ─────────────────────────────────────────────────────────────
function FallTrees({ tone }) {
  const t = tone;
  const trunk = t.id === 'C' ? '#6E4A30' : '#8A5A38';
  const foliage = t.id === 'C'
    ? ['#C2614F', '#B0824A', '#9A6B45']
    : t.id === 'B'
      ? ['#F2A8A0', '#F5C49A', '#EAD89A']
      : ['#E8543C', '#FF8A3C', '#FFC23C'];
  const trees = [
    { x: 1965, baseY: 556, s: 1.05, c: 0 },
    { x: 2095, baseY: 574, s: 0.78, c: 1 },
    { x: 2335, baseY: 560, s: 1.16, c: 2 },
    { x: 2525, baseY: 576, s: 0.84, c: 0 },
    { x: 2645, baseY: 556, s: 1.0,  c: 1 },
    { x: 2810, baseY: 568, s: 0.9,  c: 2 },
  ];

  return (
    <g>
      {trees.map((tr, i) => {
        const f = foliage[tr.c];
        const fD = foliage[(tr.c + 1) % 3];
        return (
          <g key={i} transform={`translate(${tr.x} ${tr.baseY}) scale(${tr.s})`} opacity="0.94">
            <ellipse cx="0" cy="2" rx="34" ry="7" fill="#000" opacity="0.12"/>
            <path d="M -6 0 Q -8 -34 -3 -60 L 3 -60 Q 8 -34 6 0 Z" fill={trunk}/>
            <line x1="-1" y1="-26" x2="-15" y2="-42" stroke={trunk} strokeWidth="5" strokeLinecap="round"/>
            <line x1="2" y1="-34" x2="16" y2="-52" stroke={trunk} strokeWidth="5" strokeLinecap="round"/>
            <circle cx="0"   cy="-78" r="34" fill={f}/>
            <circle cx="-26" cy="-62" r="26" fill={fD}/>
            <circle cx="26"  cy="-64" r="28" fill={fD}/>
            <circle cx="-10" cy="-94" r="22" fill={fD}/>
            <circle cx="15"  cy="-90" r="20" fill={f}/>
          </g>
        );
      })}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// 길 — 곰곰이가 따라 걷는 흙길 (지면 위에 얹힘)
// ─────────────────────────────────────────────────────────────
function PathOverlay({ tone }) {
  const t = tone;
  const pathColor = t.id === 'C' ? '#C4A380' : t.id === 'B' ? '#F0DCC0' : '#E8C998';
  const pathStroke = t.id === 'C' ? '#A07F5C' : t.id === 'B' ? '#D6C0A0' : '#C29A6B';
  // 굽이지는 흙길 — bear 가 걸어다닐 라인
  const d = `M ${HOUSE_X + 70} ${GROUND_Y}
             Q 360 ${GROUND_Y + 30} 500 ${GROUND_Y - 10}
             Q 640 ${GROUND_Y + 40} 760 ${GROUND_Y}
             Q 920 ${GROUND_Y + 30} 1080 ${GROUND_Y - 10}
             Q 1240 ${GROUND_Y + 35} 1400 ${GROUND_Y}
             Q 1560 ${GROUND_Y + 30} 1680 ${GROUND_Y - 5}
             Q 1840 ${GROUND_Y + 35} 1980 ${GROUND_Y}
             Q 2140 ${GROUND_Y + 30} 2280 ${GROUND_Y - 5}
             Q 2440 ${GROUND_Y + 35} 2580 ${GROUND_Y}
             Q 2720 ${GROUND_Y + 30} 2820 ${GROUND_Y - 5}`;
  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} width={MAP_WIDTH} height={MAP_HEIGHT}
      style={{ position:'absolute', inset: 0, pointerEvents:'none', display:'block' }} preserveAspectRatio="none">
      {/* 길 그림자 */}
      <path d={d} fill="none" stroke={pathStroke} strokeWidth="62" strokeLinecap="round" opacity="0.45"/>
      <path d={d} fill="none" stroke={pathColor}  strokeWidth="48" strokeLinecap="round"/>
      {/* 길 위 점선 */}
      <path d={d} fill="none" stroke={pathStroke} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 22" opacity="0.55"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// 멀리 떠다니는 자연물 (구름, 꽃잎, 갈매기, 낙엽)
// ─────────────────────────────────────────────────────────────
function DistantAccents({ tone }) {
  const t = tone;
  // 구름 — 전 구간, 크기·높이 다양하게 (하늘을 풍성하게)
  const clouds = [
    { x: 110, y: 58, s: 1.35 }, { x: 300, y: 138, s: 0.7 }, { x: 470, y: 46, s: 1.0 },
    { x: 660, y: 116, s: 1.15 }, { x: 860, y: 64, s: 0.8 },
    { x: 1050, y: 128, s: 1.05 }, { x: 1250, y: 52, s: 0.9 }, { x: 1560, y: 112, s: 1.3 },
    { x: 1730, y: 58, s: 0.78 }, { x: 1900, y: 132, s: 1.05 },
    { x: 2070, y: 54, s: 1.2 }, { x: 2280, y: 130, s: 0.82 }, { x: 2470, y: 62, s: 1.05 },
    { x: 2680, y: 120, s: 0.95 }, { x: 2830, y: 56, s: 0.78 },
  ];
  const petalColor = t.id === 'C' ? '#D8A0B0' : t.id === 'B' ? '#F9C6D6' : '#FFAFCB';
  const leafColors = t.id === 'C'
    ? ['#C2614F', '#B0824A', '#9A6B45']
    : t.id === 'B'
      ? ['#E5B289', '#EAC59A', '#E8B0A0']
      : ['#FF8A5C', '#F2A65A', '#E8543C'];
  const gullColor = t.id === 'C' ? '#5C7888' : '#4A6A78';
  const gooseColor = t.id === 'C' ? '#6A5848' : '#5A5048';
  const sunColor = t.id === 'C' ? '#E8C547' : t.id === 'B' ? '#FBE39A' : '#FFD93B';
  const sunX = 1380, sunY = 100;

  return (
    <g>
      {/* 🌈 무지개 — 봄 하늘 위로 (구름보다 뒤) */}
      <g opacity="0.42">
        {['#FF6B6B', '#FF9F5C', '#FFE66D', '#95E1D3', '#6BB5FF', '#C99BE8'].map((c, i) => {
          const r = 232 - i * 17;
          return (
            <path key={`rb-${i}`}
              d={`M ${560 - r} 412 A ${r} ${r} 0 0 1 ${560 + r} 412`}
              fill="none" stroke={c} strokeWidth="13" strokeLinecap="round"/>
          );
        })}
      </g>

      {/* 🎈 열기구 — 여름 하늘 */}
      <g transform="translate(1700 88)">
        <g style={{ animation: 'kw-cloud-drift 8s ease-in-out infinite' }}>
          <line x1="-16" y1="12" x2="-9" y2="30" stroke="#8A6A4A" strokeWidth="2"/>
          <line x1="16" y1="12" x2="9" y2="30" stroke="#8A6A4A" strokeWidth="2"/>
          <path d="M 0 -46 C 31 -46 39 -14 28 13 L -28 13 C -39 -14 -31 -46 0 -46 Z"
            fill={t.id === 'C' ? '#C2614F' : t.id === 'B' ? '#F9B8CB' : '#FF8AB5'}
            stroke="#fff" strokeWidth="2.5"/>
          <path d="M 0 -46 C 11 -41 13 -12 8 13 L -8 13 C -13 -12 -11 -41 0 -46 Z"
            fill={t.id === 'C' ? '#E8C547' : '#FFE66D'} opacity="0.92"/>
          <rect x="-11" y="30" width="22" height="15" rx="3"
            fill={t.id === 'C' ? '#A07F5C' : '#C99A6B'} stroke="#8A6A4A" strokeWidth="2"/>
        </g>
      </g>

      {/* 🪁 연 — 가을 하늘 */}
      <g transform="translate(2150 96)">
        <g style={{ animation: 'kw-petal-fall 6s ease-in-out infinite' }}>
          <polygon points="0,-34 26,0 0,40 -26,0"
            fill={t.id === 'C' ? '#5C947B' : '#4ECDC4'} stroke="#fff" strokeWidth="2.5"/>
          <line x1="0" y1="-34" x2="0" y2="40" stroke="#fff" strokeWidth="1.5" opacity="0.7"/>
          <line x1="-26" y1="0" x2="26" y2="0" stroke="#fff" strokeWidth="1.5" opacity="0.7"/>
          <path d="M 0 40 q 12 16 -4 26 q -16 10 0 26 q 14 12 0 28"
            fill="none" stroke={t.id === 'C' ? '#C2614F' : '#FF8AB5'} strokeWidth="3" strokeLinecap="round"/>
        </g>
      </g>

      {/* 구름 — 위치(바깥 g) + 둥실 드리프트(안쪽 g) */}
      {clouds.map((c, i) => (
        <g key={`cl-${i}`} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <g opacity="0.92" style={{ animation: `kw-cloud-drift ${7 + (i % 5)}s ease-in-out ${(i * 0.35).toFixed(2)}s infinite` }}>
            <ellipse cx="0" cy="0" rx="46" ry="16" fill="#fff"/>
            <ellipse cx="-27" cy="-6" rx="26" ry="17" fill="#fff"/>
            <ellipse cx="25" cy="-3" rx="30" ry="19" fill="#fff"/>
            <ellipse cx="3" cy="-13" rx="20" ry="15" fill="#fff"/>
          </g>
        </g>
      ))}

      {/* 햇님 — 여름 하늘 */}
      <g transform={`translate(${sunX} ${sunY})`}>
        <g style={{ animation: 'kw-cloud-drift 9s ease-in-out infinite' }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line key={i}
                x1={(Math.cos(a) * 40).toFixed(1)} y1={(Math.sin(a) * 40).toFixed(1)}
                x2={(Math.cos(a) * 56).toFixed(1)} y2={(Math.sin(a) * 56).toFixed(1)}
                stroke={sunColor} strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
            );
          })}
          <circle r="33" fill={sunColor} opacity="0.95"/>
          <circle r="33" fill="none" stroke="#fff" strokeWidth="3" opacity="0.45"/>
        </g>
      </g>

      {/* 봄 — 벚꽃잎 (큼직하게, 살랑살랑) */}
      {[{x:220,y:210},{x:360,y:300},{x:500,y:175},{x:600,y:330},{x:720,y:240},{x:860,y:200},{x:910,y:320}].map((p,i)=>(
        <g key={`sp-${i}`} transform={`translate(${p.x} ${p.y}) rotate(${i * 40})`}>
          <g opacity="0.9" style={{ animation: `kw-petal-fall ${5 + (i % 3)}s ease-in-out ${(i * 0.5).toFixed(2)}s infinite` }}>
            <ellipse cx="0" cy="0" rx="7" ry="4.5" fill={petalColor}/>
            <ellipse cx="0" cy="0" rx="7" ry="4.5" fill={petalColor} transform="rotate(60)"/>
            <ellipse cx="0" cy="0" rx="7" ry="4.5" fill={petalColor} transform="rotate(120)"/>
          </g>
        </g>
      ))}

      {/* 여름 — 갈매기 */}
      {[{x:1150,y:205},{x:1300,y:265},{x:1470,y:185},{x:1600,y:245},{x:1760,y:200}].map((p,i)=>(
        <path key={`su-${i}`} d={`M ${p.x-14} ${p.y} q 14 -11 28 0 m 0 0 q 14 -11 28 0`}
          stroke={gullColor} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.75"/>
      ))}

      {/* 가을 — 바람에 휘날리며 떨어지는 낙엽 */}
      {[
        { x: 1960, y: 90,  r: -20, c: 0, dur: 7,   d: 0   },
        { x: 2060, y: 150, r: 25,  c: 1, dur: 9,   d: 1.2 },
        { x: 2180, y: 70,  r: -10, c: 2, dur: 8,   d: 0.5 },
        { x: 2270, y: 170, r: 40,  c: 0, dur: 10,  d: 2.4 },
        { x: 2370, y: 100, r: -30, c: 1, dur: 7.5, d: 1.8 },
        { x: 2470, y: 140, r: 15,  c: 2, dur: 9.5, d: 0.8 },
        { x: 2560, y: 80,  r: -15, c: 0, dur: 8.5, d: 3   },
        { x: 2660, y: 160, r: 30,  c: 1, dur: 7,   d: 1.5 },
        { x: 2760, y: 110, r: -25, c: 2, dur: 10,  d: 2.2 },
        { x: 2840, y: 180, r: 20,  c: 0, dur: 8,   d: 0.3 },
      ].map((p, i) => (
        <g key={`fa-${i}`} transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
          <g style={{ animation: `kw-leaf-fall ${p.dur}s linear ${p.d}s infinite` }}>
            <ellipse cx="0" cy="0" rx="9" ry="5.5" fill={leafColors[p.c]}/>
            <line x1="-9" y1="0" x2="-15" y2="2" stroke={t.id === 'C' ? '#7A4A38' : '#A05030'} strokeWidth="2"/>
          </g>
        </g>
      ))}

      {/* 가을 — 기러기 떼 (V 대형) */}
      <g opacity="0.6" style={{ animation: 'kw-cloud-drift 11s ease-in-out infinite' }}>
        {[{dx:0,dy:0},{dx:-24,dy:15},{dx:24,dy:15},{dx:-48,dy:30},{dx:48,dy:30}].map((g,i)=>(
          <path key={`goose-${i}`} d={`M ${2320+g.dx-11} ${112+g.dy} q 11 -9 22 0 m 0 0 q 11 -9 22 0`}
            stroke={gooseColor} strokeWidth="3" fill="none" strokeLinecap="round"/>
        ))}
      </g>
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// 시즌 라벨 — 옅게 떠있는 큰 텍스트
// ─────────────────────────────────────────────────────────────
function SeasonLabels({ tone }) {
  const t = tone;
  const dim = t.id === 'C' ? 'rgba(61,46,31,0.22)' : 'rgba(255,255,255,0.55)';
  const seasons = [
    { x: 240,  label: '🌸  봄 동산',  sub: 'SPRING' },
    { x: 1200, label: '☀️  여름 바다', sub: 'SUMMER' },
    { x: 2180, label: '🍂  가을 숲',   sub: 'AUTUMN' },
  ];
  return (
    <div aria-hidden style={{ position:'absolute', inset: 0, pointerEvents:'none' }}>
      {seasons.map((s) => (
        <div key={s.sub} style={{
          position:'absolute', left: s.x, top: 24,
          color: dim,
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}>
          <div style={{ fontSize: 16, opacity: 0.9 }}>{s.sub}</div>
          <div style={{ fontSize: 48, lineHeight: 1.1, marginTop: 4, letterSpacing: '-0.02em' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 곰곰이집 🏡 — 시작점
// ─────────────────────────────────────────────────────────────
function BearHouse({ x, tone }) {
  const t = tone;
  const roof = t.id === 'C' ? '#B65848' : t.id === 'B' ? '#F0A8B4' : '#FF6B6B';
  const wall = t.id === 'C' ? '#EBD9B2' : t.id === 'B' ? '#FFF5E5' : '#FFF4CE';
  const stroke = t.id === 'C' ? '#3D2E1F' : '#2C2A4A';
  return (
    <div style={{
      position:'absolute', left: x - 70, top: GROUND_Y - 175,
      width: 140, height: 175,
      pointerEvents: 'none',
    }}>
      <svg viewBox="0 0 140 175" width={140} height={175}>
        {/* 굴뚝 */}
        <rect x="92" y="22" width="16" height="22" fill={wall} stroke={stroke} strokeWidth="2.5" rx="2"/>
        {/* 연기 */}
        <g opacity="0.85" style={{ animation: 'kw-float 3s ease-in-out infinite' }}>
          <circle cx="100" cy="14" r="5" fill="#fff"/>
          <circle cx="106" cy="6"  r="4" fill="#fff"/>
        </g>
        {/* 지붕 */}
        <path d="M 12 70 L 70 24 L 128 70 Z" fill={roof} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        {/* 벽 */}
        <rect x="22" y="68" width="96" height="78" fill={wall} stroke={stroke} strokeWidth="2.5" rx="4"/>
        {/* 문 */}
        <rect x="56" y="98" width="28" height="48" fill={t.cat.color} stroke={stroke} strokeWidth="2.5" rx="14"/>
        <circle cx="78" cy="122" r="2" fill={stroke}/>
        {/* 창 */}
        <rect x="30" y="82" width="20" height="20" fill="#A8D8EA" stroke={stroke} strokeWidth="2" rx="2"/>
        <rect x="90" y="82" width="20" height="20" fill="#A8D8EA" stroke={stroke} strokeWidth="2" rx="2"/>
        <line x1="40" y1="82" x2="40" y2="102" stroke={stroke} strokeWidth="1.5"/>
        <line x1="30" y1="92" x2="50" y2="92" stroke={stroke} strokeWidth="1.5"/>
        <line x1="100" y1="82" x2="100" y2="102" stroke={stroke} strokeWidth="1.5"/>
        <line x1="90" y1="92" x2="110" y2="92" stroke={stroke} strokeWidth="1.5"/>
        {/* 하트 마크 */}
        <text x="70" y="60" textAnchor="middle" fontSize="14">🐻</text>
        {/* 잔디 */}
        <ellipse cx="70" cy="156" rx="64" ry="6" fill="#000" opacity="0.10"/>
      </svg>
      <div style={{
        position:'absolute', bottom: -28, left:'50%', transform:'translateX(-50%)',
        fontSize: 18, fontWeight: 900, color: t.text,
        background: '#fff',
        padding: '4px 12px', borderRadius: 12,
        border: t.outline === 'none' ? `2px solid ${t.text}22` : t.outline,
        whiteSpace: 'nowrap',
        boxShadow: t.shadowSm,
      }}>🏡 곰곰이집</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 장소(Place) — 일러스트(건물/자연물) + 라벨 + 진행도 표시
// ─────────────────────────────────────────────────────────────
function Place({ place, tone, tier, stars, recommended, walking, onPick }) {
  const t = tone;
  const color = t.cat[place.catId];
  const labelBg = '#fff';

  // 진행도에 따른 시각화
  const dim = tier === 0;
  const flowered = tier >= 2;
  const sparkly = tier >= 3;

  // 추천 받는 장소는 통통 튐
  const bouncing = recommended;

  return (
    <div onClick={onPick} style={{
      position: 'absolute',
      left: place.x - 90, top: GROUND_Y - 220,
      width: 180,
      pointerEvents: 'auto',
      cursor: 'pointer',
      animation: bouncing ? 'kw-place-bounce 1.4s ease-in-out infinite' : (walking ? 'kw-place-greet 0.6s ease-out' : 'none'),
      transformOrigin: 'bottom center',
    }}>
      {/* 일러스트(건물/자연물) */}
      <div style={{
        position: 'relative',
        width: '100%', height: 170,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        filter: dim ? 'grayscale(0.65) brightness(0.92)' : 'none',
        opacity: dim ? 0.62 : 1,
        transition: 'filter 0.4s, opacity 0.4s',
      }}>
        <PlaceIllustration kind={place.kind} tone={tone} color={color} />

        {/* 메인 이모지 글리프 (탭 버튼) */}
        <button
          aria-label={place.name}
          onClick={(e) => { e.stopPropagation(); onPick(); }}
          onPointerDown={(e) => e.currentTarget.animate([{ transform:'scale(1)' }, { transform:'scale(0.92)' }], { duration: 140 })}
          style={{
            position: 'absolute',
            top: 8, left: '50%', transform: 'translateX(-50%)',
            width: 80, height: 80, borderRadius: 40,
            background: dim ? 'rgba(255,255,255,0.85)' : color,
            border: t.outline === 'none' ? `4px solid #fff` : t.outline,
            boxShadow: sparkly
              ? `0 0 0 4px #FFE66D88, 0 0 24px ${color}, 0 6px 14px rgba(0,0,0,0.18)`
              : t.shadow,
            cursor: 'pointer', fontSize: 40, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', padding: 0,
          }}>{place.emoji}</button>

        {/* 단계별 데코 — 🌸 꽃 (tier 2) */}
        {flowered && !sparkly && (
          <>
            <span style={{ position:'absolute', left: 32, top: -4, fontSize: 22, transform: 'rotate(-15deg)' }}>🌸</span>
            <span style={{ position:'absolute', right: 28, top: 4, fontSize: 18, transform: 'rotate(15deg)' }}>🌸</span>
          </>
        )}
        {/* ✨ 반짝 (tier 3) */}
        {sparkly && (
          <>
            <span style={{ position:'absolute', left: 18, top: -6, fontSize: 24, animation: 'kw-twinkle 1.6s ease-in-out infinite' }}>✨</span>
            <span style={{ position:'absolute', right: 12, top: 8, fontSize: 20, animation: 'kw-twinkle 1.6s ease-in-out 0.4s infinite' }}>✨</span>
            <span style={{ position:'absolute', left: '50%', top: -16, transform: 'translateX(-50%)', fontSize: 18, animation: 'kw-twinkle 1.6s ease-in-out 0.8s infinite' }}>✨</span>
          </>
        )}
      </div>

      {/* 라벨 */}
      <div style={{
        marginTop: 6, padding: '6px 12px',
        background: labelBg,
        borderRadius: 18,
        border: t.outline === 'none' ? `3px solid ${dim ? 'rgba(0,0,0,0.15)' : color}` : t.outline,
        fontSize: 18, fontWeight: 900,
        color: dim ? t.textMuted : t.text,
        boxShadow: dim ? 'none' : t.shadowSm,
        textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        whiteSpace: 'nowrap',
      }}>
        {place.name}
        {stars > 0 && (
          <span style={{
            fontSize: 13, fontWeight: 800, color: t.textMuted,
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: 8,
          }}>⭐{stars}</span>
        )}
      </div>

      {/* 추천 말풍선 */}
      {recommended && (
        <div style={{
          position: 'absolute', left: '50%', top: -64,
          transform: 'translateX(-50%)',
          background: '#fff',
          padding: '8px 16px',
          borderRadius: 20,
          border: `3px solid ${color}`,
          fontSize: 18, fontWeight: 900, color: t.text,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
          animation: 'kw-bubble-pop 0.6s cubic-bezier(.34,1.56,.64,1) both',
          zIndex: 5,
        }}>
          오늘은 {place.name} 어때?
          <div style={{
            position:'absolute', left: '50%', bottom: -10, transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: `12px solid ${color}`,
          }} />
          <div style={{
            position:'absolute', left: '50%', bottom: -6, transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid #fff',
          }} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 장소별 일러스트 (건물/자연물) — SVG
// ─────────────────────────────────────────────────────────────
function PlaceIllustration({ kind, tone, color }) {
  const t = tone;
  const stroke = t.id === 'C' ? '#3D2E1F' : '#2C2A4A';
  const W = 180, H = 170;

  // 공통 풀 (잔디) 베이스
  const grass = (
    <ellipse cx={W/2} cy={H - 8} rx="72" ry="8" fill="#000" opacity="0.10"/>
  );

  if (kind === 'hill') {
    // 색칠 언덕 — 부드러운 둥근 언덕 + 이젤
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <ellipse cx="90" cy="140" rx="80" ry="34" fill={color} stroke={stroke} strokeWidth="2"/>
        <ellipse cx="90" cy="138" rx="74" ry="28" fill="#fff" opacity="0.20"/>
        {/* 이젤 다리 */}
        <line x1="60" y1="160" x2="48" y2="100" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
        <line x1="120" y1="160" x2="132" y2="100" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
        <line x1="90" y1="162" x2="90" y2="108" stroke={stroke} strokeWidth="3" strokeLinecap="round"/>
        {/* 캔버스 */}
        <rect x="58" y="78" width="64" height="44" fill="#fff" stroke={stroke} strokeWidth="2.5" rx="3"/>
        <circle cx="74" cy="96" r="4" fill="#FF6B6B"/>
        <circle cx="92" cy="100" r="4" fill="#FCF876"/>
        <circle cx="108" cy="92" r="4" fill="#4ECDC4"/>
        {grass}
      </svg>
    );
  }

  if (kind === 'flowers') {
    // 모양 꽃밭 — 도형 꽃들이 자라난 꽃밭
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 잔디 패치 */}
        <ellipse cx="90" cy="148" rx="84" ry="22" fill={color} stroke={stroke} strokeWidth="2"/>
        {/* 꽃 줄기들 */}
        {[{x:46,sh:'tri'},{x:74,sh:'sq'},{x:108,sh:'circ'},{x:138,sh:'dia'}].map((f,i)=>(
          <g key={i}>
            <line x1={f.x} y1="148" x2={f.x} y2={108} stroke="#6BBA6B" strokeWidth="3" strokeLinecap="round"/>
            <ellipse cx={f.x - 4} cy="130" rx="4" ry="2" fill="#6BBA6B"/>
            {f.sh === 'tri' && <polygon points={`${f.x},92 ${f.x-12},112 ${f.x+12},112`} fill="#F38181" stroke={stroke} strokeWidth="2"/>}
            {f.sh === 'sq'  && <rect x={f.x-12} y="96" width="24" height="24" fill="#FCF876" stroke={stroke} strokeWidth="2" rx="3" transform={`rotate(15 ${f.x} 108)`}/>}
            {f.sh === 'circ'&& <circle cx={f.x} cy="106" r="14" fill="#A8D8EA" stroke={stroke} strokeWidth="2"/>}
            {f.sh === 'dia' && <polygon points={`${f.x},92 ${f.x+14},108 ${f.x},124 ${f.x-14},108`} fill="#AA96DA" stroke={stroke} strokeWidth="2"/>}
          </g>
        ))}
        {grass}
      </svg>
    );
  }

  if (kind === 'waterfall') {
    // 노래 폭포 — 바위 + 떨어지는 물 + 음표
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 바위 */}
        <path d="M 30 152 L 50 92 L 90 78 L 130 92 L 150 152 Z" fill={t.id === 'C' ? '#9CA89E' : '#B5C8C5'} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        {/* 폭포 물 */}
        <path d="M 76 86 Q 70 120 78 152 L 102 152 Q 110 120 104 86 Z" fill="#A8D8EA" stroke={stroke} strokeWidth="2"/>
        <path d="M 80 92 Q 78 120 82 148" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/>
        <path d="M 100 92 Q 102 120 98 148" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/>
        {/* 물보라 */}
        <ellipse cx="90" cy="155" rx="32" ry="6" fill="#A8D8EA" opacity="0.7"/>
        <ellipse cx="68" cy="158" rx="6" ry="3" fill="#fff" opacity="0.85"/>
        <ellipse cx="110" cy="160" rx="5" ry="2.5" fill="#fff" opacity="0.85"/>
        {/* 음표 */}
        <text x="32" y="74" fontSize="22" opacity="0.8">♪</text>
        <text x="146" y="80" fontSize="18" opacity="0.7">♫</text>
        {grass}
      </svg>
    );
  }

  if (kind === 'forest') {
    // 글자나무 숲 — 큰 나무에 ㄱㄴㄷ 글자 열매
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 작은 나무 (뒤) */}
        <rect x="36" y="120" width="10" height="34" fill="#8B6B4A" stroke={stroke} strokeWidth="2" rx="2"/>
        <circle cx="41" cy="116" r="22" fill={t.id === 'C' ? '#92AD82' : '#98D6A6'} stroke={stroke} strokeWidth="2"/>
        {/* 큰 나무 */}
        <rect x="84" y="106" width="14" height="50" fill="#8B6B4A" stroke={stroke} strokeWidth="2.5" rx="3"/>
        <circle cx="91" cy="92" r="38" fill={color} stroke={stroke} strokeWidth="2.5"/>
        <text x="78" y="86" fontSize="16" fontWeight="900" fill={stroke}>가</text>
        <text x="98" y="96" fontSize="16" fontWeight="900" fill={stroke}>나</text>
        <text x="84" y="108" fontSize="16" fontWeight="900" fill={stroke}>다</text>
        {/* 오른쪽 나무 */}
        <rect x="138" y="118" width="10" height="36" fill="#8B6B4A" stroke={stroke} strokeWidth="2" rx="2"/>
        <circle cx="143" cy="114" r="24" fill={t.id === 'C' ? '#92AD82' : '#98D6A6'} stroke={stroke} strokeWidth="2"/>
        <text x="136" y="118" fontSize="14" fontWeight="900" fill={stroke}>라</text>
        {grass}
      </svg>
    );
  }

  if (kind === 'beach') {
    // ABC 모래사장 — 모래언덕, 파라솔, 모래성
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 바다 (뒤) */}
        <rect x="0" y="100" width={W} height="30" fill="#7FCEEC" opacity="0.6"/>
        <path d="M 0 110 Q 30 104 60 110 T 120 110 T 180 110 V 130 H 0 Z" fill="#A8D8EA" opacity="0.5"/>
        {/* 모래언덕 */}
        <ellipse cx="90" cy="140" rx="82" ry="28" fill={color} stroke={stroke} strokeWidth="2"/>
        {/* 모래성 */}
        <rect x="42" y="118" width="14" height="20" fill="#F2CE7E" stroke={stroke} strokeWidth="2"/>
        <polygon points="42,118 56,118 49,108" fill="#F2CE7E" stroke={stroke} strokeWidth="2"/>
        {/* 파라솔 */}
        <line x1="138" y1="148" x2="138" y2="100" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 110 102 Q 138 80 166 102 Z" fill="#FF6B6B" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M 110 102 Q 138 90 138 102" fill="#fff" opacity="0.4"/>
        {/* ABC 적힌 모래 */}
        <text x="76" y="142" fontSize="14" fontWeight="900" fill="#7A6648">A</text>
        <text x="90" y="142" fontSize="14" fontWeight="900" fill="#7A6648">B</text>
        <text x="104" y="142" fontSize="14" fontWeight="900" fill="#7A6648">C</text>
        {grass}
      </svg>
    );
  }

  if (kind === 'mountain') {
    // 숫자 산 — 뾰족산 + 1·2·3 표지판
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <polygon points="20,154 90,40 160,154" fill={color} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <polygon points="90,40 70,72 90,88 110,72" fill="#fff" opacity="0.7"/>
        <text x="62"  y="120" fontSize="22" fontWeight="900" fill={stroke}>1</text>
        <text x="82"  y="138" fontSize="22" fontWeight="900" fill={stroke}>2</text>
        <text x="106" y="120" fontSize="22" fontWeight="900" fill={stroke}>3</text>
        {/* 뒤 작은 산 */}
        <polygon points="0,154 36,108 70,154" fill={t.id === 'C' ? '#94ADAE' : '#5BB9DC'} stroke={stroke} strokeWidth="2" opacity="0.65"/>
        {grass}
      </svg>
    );
  }

  if (kind === 'factory') {
    // 로봇 공장 — 굴뚝 + 톱니바퀴
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 본체 */}
        <rect x="40" y="80" width="100" height="74" fill={color} stroke={stroke} strokeWidth="2.5" rx="4"/>
        {/* 굴뚝들 */}
        <rect x="56" y="50" width="18" height="34" fill={t.id === 'C' ? '#A87958' : '#6B7280'} stroke={stroke} strokeWidth="2.5"/>
        <rect x="86" y="38" width="18" height="46" fill={t.id === 'C' ? '#A87958' : '#6B7280'} stroke={stroke} strokeWidth="2.5"/>
        {/* 연기 */}
        <circle cx="65" cy="42" r="6" fill="#fff" opacity="0.8"/>
        <circle cx="95" cy="30" r="7" fill="#fff" opacity="0.8"/>
        <circle cx="102" cy="22" r="5" fill="#fff" opacity="0.7"/>
        {/* 톱니바퀴 */}
        <g transform="translate(116 116)" style={{ transformOrigin:'116px 116px' }}>
          <g style={{ animation:'kw-spin 5s linear infinite', transformOrigin: 'center' }}>
            <circle r="14" fill="#fff" stroke={stroke} strokeWidth="2"/>
            <circle r="5" fill={stroke}/>
            {[0,60,120,180,240,300].map(a => (
              <rect key={a} x="-3" y="-19" width="6" height="8" fill="#fff" stroke={stroke} strokeWidth="1.5" transform={`rotate(${a})`}/>
            ))}
          </g>
        </g>
        {/* 창문 */}
        <rect x="50" y="98" width="18" height="18" fill="#FFE66D" stroke={stroke} strokeWidth="2"/>
        <rect x="74" y="98" width="18" height="18" fill="#FFE66D" stroke={stroke} strokeWidth="2"/>
        {grass}
      </svg>
    );
  }

  if (kind === 'cave') {
    // 수수께끼 동굴 — 바위에 동굴 입구 + ?
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 바위 더미 */}
        <path d="M 16 156 L 30 80 L 90 50 L 150 80 L 164 156 Z" fill={t.id === 'C' ? '#B08862' : color} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M 16 156 L 30 80 L 90 50 L 150 80 L 164 156 Z" fill="#000" opacity="0.10"/>
        {/* 동굴 입구 */}
        <path d="M 70 156 Q 70 100 90 96 Q 110 100 110 156 Z" fill="#1f1530" stroke={stroke} strokeWidth="2.5"/>
        {/* ? */}
        <text x="90" y="138" textAnchor="middle" fontSize="32" fontWeight="900" fill={t.cat.code}>?</text>
        {/* 반딧불 */}
        <circle cx="56" cy="120" r="3" fill="#FFE66D" opacity="0.9"/>
        <circle cx="132" cy="108" r="2.5" fill="#FFE66D" opacity="0.9"/>
        {grass}
      </svg>
    );
  }

  if (kind === 'lighthouse') {
    // 반짝 등대 — 등대 + 컴퓨터 화면 빛
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 바위 받침 */}
        <ellipse cx="90" cy="148" rx="60" ry="14" fill={t.id === 'C' ? '#A87958' : '#A8B5C8'} stroke={stroke} strokeWidth="2"/>
        {/* 본체 — 빨강/흰 줄무늬 */}
        <path d="M 76 140 L 80 36 L 100 36 L 104 140 Z" fill="#fff" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round"/>
        <rect x="78" y="64"  width="24" height="16" fill={color} stroke={stroke} strokeWidth="2"/>
        <rect x="78" y="100" width="24" height="16" fill={color} stroke={stroke} strokeWidth="2"/>
        {/* 머리 (랜턴 룸) */}
        <rect x="72" y="22" width="36" height="18" fill="#FFE66D" stroke={stroke} strokeWidth="2.5" rx="2"/>
        <polygon points="68,22 90,8 112,22" fill={stroke}/>
        {/* 빛줄기 */}
        <path d="M 90 30 L 30 12 L 30 48 Z" fill="#FFE66D" opacity="0.45"/>
        <path d="M 90 30 L 152 14 L 154 50 Z" fill="#FFE66D" opacity="0.45"/>
        {grass}
      </svg>
    );
  }

  if (kind === 'plaza') {
    // 친구 광장 — 둥근 광장 + 벤치 + 두 그루
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 광장 (둥근 타일) */}
        <ellipse cx="90" cy="142" rx="74" ry="22" fill={color} stroke={stroke} strokeWidth="2.5"/>
        <ellipse cx="90" cy="140" rx="66" ry="16" fill="#fff" opacity="0.45"/>
        {/* 벤치 */}
        <rect x="56" y="124" width="68" height="6" fill={t.id === 'C' ? '#8B6B4A' : '#6B7280'} stroke={stroke} strokeWidth="2" rx="1"/>
        <rect x="60" y="130" width="4" height="12" fill={t.id === 'C' ? '#8B6B4A' : '#6B7280'} stroke={stroke} strokeWidth="1.5"/>
        <rect x="116" y="130" width="4" height="12" fill={t.id === 'C' ? '#8B6B4A' : '#6B7280'} stroke={stroke} strokeWidth="1.5"/>
        {/* 나무 좌 */}
        <rect x="22" y="98" width="8" height="30" fill="#8B6B4A" stroke={stroke} strokeWidth="2" rx="2"/>
        <circle cx="26" cy="92" r="18" fill={t.id === 'C' ? '#C2614F' : '#FF8A5C'} stroke={stroke} strokeWidth="2"/>
        {/* 나무 우 */}
        <rect x="150" y="100" width="8" height="28" fill="#8B6B4A" stroke={stroke} strokeWidth="2" rx="2"/>
        <circle cx="154" cy="94" r="16" fill={t.id === 'C' ? '#E5B289' : '#FFDAC1'} stroke={stroke} strokeWidth="2"/>
        {/* 풍선 (친구!) */}
        <line x1="86" y1="92" x2="86" y2="124" stroke={stroke} strokeWidth="1.5"/>
        <ellipse cx="86" cy="86" rx="9" ry="11" fill="#FF6B6B" stroke={stroke} strokeWidth="2"/>
        {grass}
      </svg>
    );
  }

  return <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>{grass}</svg>;
}

// ─────────────────────────────────────────────────────────────
// 곰곰이 캐릭터 — 걸어다님
// ─────────────────────────────────────────────────────────────
function BearWalker({ x, tone, walking, mascotOn, walkDur }) {
  if (!mascotOn) return null;
  const t = tone;
  const fur = t.id === 'C' ? '#C89968' : t.id === 'B' ? '#FFD5B0' : '#F5B97B';
  const earIn = t.id === 'C' ? '#A07549' : t.id === 'B' ? '#FFB890' : '#E8965A';
  const cheek = t.id === 'B' ? '#FFA8C8' : '#FF7F7F';
  const stroke = t.id === 'C' ? '#3D2E1F' : '#3A2A1F';
  // 멜빵바지
  const overall = t.id === 'C' ? '#5C947B' : '#4ECDC4';

  return (
    <div style={{
      position: 'absolute',
      left: x - 56, top: GROUND_Y - 110,
      width: 112, height: 130,
      transition: `left ${walkDur}s cubic-bezier(.4,.0,.4,1)`,
      pointerEvents: 'none',
      zIndex: 4,
    }}>
      <div style={{
        width: '100%', height: '100%',
        animation: walking ? 'kw-bear-walk 0.42s ease-in-out infinite' : 'kw-bear-idle 2.4s ease-in-out infinite',
        transformOrigin: 'bottom center',
      }}>
        <svg viewBox="0 0 120 130" width={112} height={130}>
          {/* 그림자 */}
          <ellipse cx="60" cy="124" rx="28" ry="4" fill="#000" opacity="0.18"/>
          {/* 다리 */}
          <g style={{ animation: walking ? 'kw-bear-leg-l 0.42s ease-in-out infinite' : 'none', transformOrigin: '46px 108px' }}>
            <ellipse cx="46" cy="116" rx="10" ry="8" fill={stroke}/>
            <rect x="40" y="92" width="12" height="22" fill={overall} stroke={stroke} strokeWidth="2" rx="3"/>
          </g>
          <g style={{ animation: walking ? 'kw-bear-leg-r 0.42s ease-in-out infinite' : 'none', transformOrigin: '74px 108px' }}>
            <ellipse cx="74" cy="116" rx="10" ry="8" fill={stroke}/>
            <rect x="68" y="92" width="12" height="22" fill={overall} stroke={stroke} strokeWidth="2" rx="3"/>
          </g>
          {/* 몸 (멜빵바지) */}
          <rect x="34" y="68" width="52" height="40" fill={overall} stroke={stroke} strokeWidth="2.5" rx="8"/>
          {/* 멜빵 */}
          <rect x="40" y="60" width="6" height="14" fill={overall} stroke={stroke} strokeWidth="2"/>
          <rect x="74" y="60" width="6" height="14" fill={overall} stroke={stroke} strokeWidth="2"/>
          <circle cx="43" cy="76" r="2" fill="#FFE66D"/>
          <circle cx="77" cy="76" r="2" fill="#FFE66D"/>
          {/* 팔 */}
          <ellipse cx="28" cy="78" rx="8" ry="12" fill={fur} stroke={stroke} strokeWidth="2"
            style={{ animation: walking ? 'kw-bear-arm-l 0.42s ease-in-out infinite' : 'none', transformOrigin: '28px 68px' }}/>
          <ellipse cx="92" cy="78" rx="8" ry="12" fill={fur} stroke={stroke} strokeWidth="2"
            style={{ animation: walking ? 'kw-bear-arm-r 0.42s ease-in-out infinite' : 'none', transformOrigin: '92px 68px' }}/>
          {/* 머리 */}
          <circle cx="26" cy="32" r="10" fill={fur} stroke={stroke} strokeWidth="2"/>
          <circle cx="94" cy="32" r="10" fill={fur} stroke={stroke} strokeWidth="2"/>
          <circle cx="26" cy="32" r="5" fill={earIn}/>
          <circle cx="94" cy="32" r="5" fill={earIn}/>
          <circle cx="60" cy="42" r="26" fill={fur} stroke={stroke} strokeWidth="2.5"/>
          <ellipse cx="60" cy="50" rx="14" ry="10" fill="#FFF1DC" stroke={stroke} strokeWidth="2"/>
          <ellipse cx="60" cy="46" rx="3" ry="2.5" fill={stroke}/>
          <path d="M 56 54 q 4 3 8 0" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* 눈 — 걷는 중엔 ^^ */}
          {walking
            ? <><path d="M 48 38 q 4 -4 8 0" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 64 38 q 4 -4 8 0" stroke={stroke} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>
            : <><circle cx="52" cy="40" r="2.5" fill={stroke}/><circle cx="68" cy="40" r="2.5" fill={stroke}/></>
          }
          <circle cx="42" cy="48" r="4" fill={cheek} opacity="0.7"/>
          <circle cx="78" cy="48" r="4" fill={cheek} opacity="0.7"/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 미니맵 — 하단 진행도 표시
// ─────────────────────────────────────────────────────────────
function MiniMap({ tone, bearX, placeStars, onPlaceJump, currentPage, onPageJump, walkDur }) {
  const t = tone;
  return (
    <div style={{
      flex: '0 0 auto',
      height: 60,
      padding: '6px 18px 8px',
      background: 'rgba(255,255,255,0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      position: 'relative', zIndex: 8,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: t.textMuted, letterSpacing:'0.04em', flex: '0 0 auto', whiteSpace: 'nowrap' }}>지도</span>
      <div style={{
        flex: 1, height: 44,
        position: 'relative',
        background: `linear-gradient(90deg, ${seasonPalette(t.id,'spring').sky} 0%, ${seasonPalette(t.id,'spring').sky} 30%, ${seasonPalette(t.id,'summer').sky} 36%, ${seasonPalette(t.id,'summer').sky} 60%, ${seasonPalette(t.id,'fall').sky} 66%, ${seasonPalette(t.id,'fall').sky} 100%)`,
        borderRadius: 12,
        border: '1.5px solid rgba(0,0,0,0.10)',
        overflow: 'hidden',
      }}>
        {/* 시즌 구분선 */}
        <div style={{ position:'absolute', left:'33.3%', top:0, bottom:0, width:1, background:'rgba(0,0,0,0.10)' }}/>
        <div style={{ position:'absolute', left:'66.6%', top:0, bottom:0, width:1, background:'rgba(0,0,0,0.10)' }}/>

        {/* 시즌 페이지 버튼 (클릭시 스냅 이동) + 현재 페이지 하이라이트 */}
        {SEASON_PAGES.map((p, i) => {
          const active = currentPage === i;
          const left = (i / 3) * 100;
          return (
            <button key={p.id} onClick={() => onPageJump(i)}
              aria-label={`${p.emoji} ${p.name}\uc73c\ub85c \uc774\ub3d9`}
              aria-current={active ? 'page' : undefined}
              style={{
                position: 'absolute',
                left: `${left}%`, top: 0, bottom: 0,
                width: 'calc(33.33% + 1px)',
                background: active ? 'rgba(255,255,255,0.55)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                outline: 'none',
                transition: 'background 0.25s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6,
                color: t.text,
              }}>
              <span style={{ fontSize: 18, opacity: active ? 1 : 0.65, lineHeight: 1 }}>{p.emoji}</span>
              <span style={{
                fontSize: 12, fontWeight: 900, letterSpacing: '-0.01em',
                opacity: active ? 0.95 : 0.55,
                whiteSpace: 'nowrap',
              }}>{p.name}</span>
            </button>
          );
        })}

        {/* 장소 점 */}
        {WORLD_PLACES.map((p) => {
          const sCount = placeStars[p.id] || 0;
          const tier = tierFromStars(sCount);
          const color = t.cat[p.catId];
          return (
            <button key={p.id} onClick={() => onPlaceJump(p)}
              aria-label={p.name}
              style={{
                position: 'absolute',
                left: `${(p.x / MAP_WIDTH) * 100}%`,
                bottom: 5,
                transform: 'translateX(-50%)',
                width: 10, height: 10, borderRadius: 5,
                background: tier === 0 ? 'rgba(255,255,255,0.7)' : color,
                border: tier >= 3 ? '2px solid #FFE66D' : '1.5px solid rgba(0,0,0,0.35)',
                cursor: 'pointer', padding: 0,
                fontFamily: 'inherit',
                boxShadow: tier >= 2 ? `0 0 0 2px ${color}33` : 'none',
              }}/>
          );
        })}
        {/* 곰곰이 위치 */}
        <div style={{
          position: 'absolute',
          left: `${(bearX / MAP_WIDTH) * 100}%`,
          top: 4,
          transform: 'translateX(-50%)',
          fontSize: 20, lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))',
          transition: `left ${walkDur}s cubic-bezier(.4,.0,.4,1)`,
          pointerEvents: 'none',
        }}>🐻</div>
      </div>
      {/* 페이지 도트 인디케이터 */}
      <div style={{ display:'flex', alignItems:'center', gap: 6, flex:'0 0 auto' }}>
        {SEASON_PAGES.map((p, i) => (
          <button key={p.id} onClick={() => onPageJump(i)}
            aria-label={`${p.name}\uc73c\ub85c \uc774\ub3d9`}
            aria-current={currentPage === i ? 'page' : undefined}
            style={{
              width: currentPage === i ? 22 : 10, height: 10,
              borderRadius: 5,
              background: currentPage === i ? t.cat.color : 'rgba(0,0,0,0.18)',
              border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'inherit',
              transition: 'width 0.25s ease, background 0.25s ease',
            }}/>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 시즌 바뀜 때 잠시 표시되는 퍼 배지 (상단바 아래)
// ────────────────────────────────────────────────────────────
function SeasonBadge({ tone, page, index }) {
  const t = tone;
  return (
    <div aria-live="polite" style={{
      position: 'absolute',
      top: 76, left: '50%', transform: 'translateX(-50%)',
      background: '#fff',
      padding: '8px 18px',
      borderRadius: 999,
      border: t.outline === 'none' ? `3px solid ${t.cat.color}` : t.outline,
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 20, fontWeight: 900, color: t.text,
      boxShadow: t.shadow,
      whiteSpace: 'nowrap',
      animation: 'kw-season-badge 1.6s cubic-bezier(.34,1.56,.64,1) both',
      pointerEvents: 'none',
      zIndex: 11,
    }}>
      <span style={{ fontSize: 24, lineHeight: 1 }}>{page.emoji}</span>
      <span>{page.name}</span>
      <span style={{
        fontSize: 12, fontWeight: 800, color: t.textMuted,
        marginLeft: 4, background: 'rgba(0,0,0,0.06)',
        padding: '2px 8px', borderRadius: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>{index + 1} / {SEASON_PAGES.length}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 키프레임 (월드맵 전용) — <style> 주입
// ─────────────────────────────────────────────────────────────
(function injectWorldMapKeyframes() {
  if (document.getElementById('kw-worldmap-keyframes')) return;
  const s = document.createElement('style');
  s.id = 'kw-worldmap-keyframes';
  s.textContent = `
    @keyframes kw-place-bounce {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-10px); }
    }
    @keyframes kw-place-greet {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    @keyframes kw-bubble-pop {
      0%   { transform: translateX(-50%) scale(0.4); opacity: 0; }
      70%  { transform: translateX(-50%) scale(1.06); opacity: 1; }
      100% { transform: translateX(-50%) scale(1); opacity: 1; }
    }
    @keyframes kw-twinkle {
      0%, 100% { transform: scale(0.7); opacity: 0.7; }
      50%      { transform: scale(1.15); opacity: 1; }
    }
    @keyframes kw-bear-walk {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes kw-bear-idle {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-2px); }
    }
    @keyframes kw-bear-leg-l {
      0%, 100% { transform: rotate(0); }
      50%      { transform: rotate(18deg); }
    }
    @keyframes kw-bear-leg-r {
      0%, 100% { transform: rotate(0); }
      50%      { transform: rotate(-18deg); }
    }
    @keyframes kw-bear-arm-l {
      0%, 100% { transform: rotate(0); }
      50%      { transform: rotate(-16deg); }
    }
    @keyframes kw-bear-arm-r {
      0%, 100% { transform: rotate(0); }
      50%      { transform: rotate(16deg); }
    }
    @keyframes kw-season-badge {
      0%   { transform: translate(-50%, -16px) scale(0.7); opacity: 0; }
      18%  { transform: translate(-50%, 0) scale(1.08); opacity: 1; }
      34%  { transform: translate(-50%, 0) scale(1); opacity: 1; }
      80%  { transform: translate(-50%, 0) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -8px) scale(0.96); opacity: 0; }
    }
    /* 하늘 자연물 — 구름/햇님 둥실 */
    @keyframes kw-cloud-drift {
      0%, 100% { transform: translateX(0); }
      50%      { transform: translateX(18px); }
    }
    /* 하늘 자연물 — 벚꽃잎 살랑 */
    @keyframes kw-petal-fall {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50%      { transform: translate(7px, 12px) rotate(22deg); }
    }
    /* 가을 낙엽 — 바람에 휘날리며 떨어짐 */
    @keyframes kw-leaf-fall {
      0%   { transform: translate(0, 0) rotate(0deg);        opacity: 0; }
      12%  { opacity: 0.95; }
      85%  { opacity: 0.95; }
      100% { transform: translate(46px, 230px) rotate(260deg); opacity: 0; }
    }
    /* 돛단배 — 물결에 흔들흔들 */
    @keyframes kw-boat-bob {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50%      { transform: translateY(-5px) rotate(2deg); }
    }
    /* 월드맵 스크롤바 숨김 (WebKit) */
    .kw-worldmap-scroll::-webkit-scrollbar { display: none; height: 0; }
  `;
  document.head.appendChild(s);
})();

export { WorldMapHome }
