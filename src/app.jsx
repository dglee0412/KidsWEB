// kidsweb-app.jsx
// 메인 앱: 라우터(home/submenu/activity), 별 카운터, Tweaks 패널
// 톤은 prop으로 전달; design_canvas의 각 artboard가 다른 톤을 마운트.

import React from 'react'
import { KIDS_CATEGORIES, timeOfDayBg, toneTexture } from './themes.jsx'
import { BackButton, StarCounter, SubmenuScreen, PlaceholderScreen, ColorMenuScreen, FreeBgScreen, CelebrationScreen, ParentSettings, GalleryScreen } from './shell.jsx'
import { WorldMapHome } from './worldmap.jsx'
import { Activity } from './activities.jsx'
import { loadStars, saveStars } from './lib/storage.js'

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

function KidsApp({ tone, fontSize, mascotOn, voiceShow, timeOfDay, splashKey, settings, onSettingsChange }) {
  const [route, setRoute] = useStateApp({ screen: 'home' });
  const [stars, setStars] = useStateApp(loadStars);
  const [sessionStars, setSessionStars] = useStateApp(0);
  const [popKey, setPopKey] = useStateApp(0);
  const [reward, setReward] = useStateApp(null); // {n} 일시적 별 획득 오버레이

  // 스플래시: splashKey가 바뀔 때마다 1.5s 표시 → 300ms 페이드아웃
  const [splashPhase, setSplashPhase] = useStateApp('show'); // 'show' | 'fade' | 'done'
  useEffectApp(() => {
    setSplashPhase('show');
    const t1 = setTimeout(() => setSplashPhase('fade'), 1500);
    const t2 = setTimeout(() => setSplashPhase('done'), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [splashKey]);

  const pickCategory = (cat) => {
    setSessionStars(0);
    if (cat.id === 'color') setRoute({ screen: 'color-menu', cat });
    else if (cat.hasSub) setRoute({ screen: 'submenu', cat });
    else setRoute({ screen: 'activity', cat, sub: null });
  };
  const pickColorMenu = (item) => {
    setSessionStars(0);
    if (item.id === 'fill') setRoute((r) => ({ screen: 'activity', cat: r.cat, sub: { id: 'cat' } })); // 영역 색칠 → 바로 활동 (첫 도안)
    else if (item.id === 'free') setRoute((r) => ({ screen: 'free-bg', cat: r.cat }));
    else if (item.id === 'gallery') setRoute((r) => ({ screen: 'gallery', cat: r.cat }));
    else if (item.id === 'locked') setRoute((r) => ({ screen: 'locked', cat: r.cat }));
  };
  const pickFreeBg = (sel) => { setSessionStars(0); setRoute((r) => ({ screen: 'activity', cat: r.cat, sub: { id: 'free', ...sel } })); };
  const pickSub = (sub) => { setSessionStars(0); setRoute((r) => ({ screen: 'activity', cat: r.cat, sub })); };
  const back = () => {
    if (route.screen === 'activity') {
      if (route.cat.id === 'color') {
        // 자유색칠 → 배경 선택, 영역색칠(템플릿 sub) → 색칠 메뉴
        setRoute({ screen: route.sub && route.sub.id === 'free' ? 'free-bg' : 'color-menu', cat: route.cat });
      } else {
        setRoute(route.cat.hasSub ? { screen: 'submenu', cat: route.cat } : { screen: 'home' });
      }
    }
    else if (route.screen === 'submenu') setRoute({ screen: 'home' });
    else if (route.screen === 'color-menu') setRoute({ screen: 'home' });
    else if (route.screen === 'free-bg') setRoute({ screen: 'color-menu', cat: route.cat });
    else if (route.screen === 'gallery' || route.screen === 'locked') setRoute({ screen: 'color-menu', cat: route.cat });
  };

  const onActivityReward = (n) => {
    setStars((s) => { const next = s + n; saveStars(next); return next; });
    setSessionStars((s) => s + n);
    setPopKey((k) => k + 1);
    setReward({ n, key: Date.now() });
    setTimeout(() => setReward(null), 1100);
  };
  const onActivityFinish = () => {
    // 1.2초 텀을 두고 칭찬 화면으로 (활동 자체 토스트/애니메이션 끝난 뒤)
    setTimeout(() => {
      setRoute((r) => r.screen === 'activity' ? { ...r, screen: 'celebration' } : r);
    }, 1200);
  };
  const goHomeFromCeleb = () => { setSessionStars(0); setRoute({ screen: 'home' }); };
  const retryFromCeleb = () => {
    setSessionStars(0);
    setRoute((r) => ({ screen: 'activity', cat: r.cat, sub: r.sub, replayKey: (r.replayKey || 0) + 1 }));
  };

  // 배경
  const bgGradient = timeOfDayBg(tone, timeOfDay);
  const tex = toneTexture(tone);

  // 화면 내용
  let content = null;
  if (route.screen === 'home') {
    content = <WorldMapHome tone={tone} fontSize={fontSize} mascotOn={mascotOn} onPick={pickCategory} stars={stars} timeOfDay={timeOfDay} onSettings={() => setRoute({ screen: 'settings' })} />;
  } else if (route.screen === 'settings') {
    content = <ParentSettings tone={tone} settings={settings} onSettingsChange={onSettingsChange} onClose={() => setRoute({ screen: 'home' })} />;
  } else if (route.screen === 'color-menu') {
    content = <ColorMenuScreen tone={tone} fontSize={fontSize} mascotOn={mascotOn} onPick={pickColorMenu} />;
  } else if (route.screen === 'free-bg') {
    content = <FreeBgScreen tone={tone} fontSize={fontSize} mascotOn={mascotOn} onPick={pickFreeBg} />;
  } else if (route.screen === 'submenu') {
    content = <SubmenuScreen tone={tone} cat={route.cat} fontSize={fontSize} mascotOn={mascotOn} onPick={pickSub} />;
  } else if (route.screen === 'activity') {
    content = <Activity key={`${route.cat?.id}-${route.sub?.id}-${route.replayKey || 0}`} tone={tone} cat={route.cat} sub={route.sub} fontSize={fontSize} voiceShow={voiceShow} onComplete={onActivityReward} onFinish={onActivityFinish} />;
  } else if (route.screen === 'celebration') {
    content = <CelebrationScreen tone={tone} fontSize={fontSize} sessionStars={sessionStars} totalStars={stars} onHome={goHomeFromCeleb} onRetry={retryFromCeleb} />;
  } else if (route.screen === 'gallery') {
    content = <GalleryScreen tone={tone} fontSize={fontSize} onPickColor={() => setRoute({ screen: 'color-menu', cat: KIDS_CATEGORIES.find((c) => c.id === 'color') })} />;
  } else if (route.screen === 'locked') {
    content = <PlaceholderScreen tone={tone} cat={{ emoji: '🔒', name: '부모님 잠금', id: 'color' }} fontSize={fontSize} />;
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bgGradient,
      position: 'relative',
      fontFamily: '"Gaegu", "Comic Sans MS", system-ui, sans-serif',
      color: tone.text,
      overflow: 'hidden',
    }}>
      {tex && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...tex }} />}

      {/* 화면 본문 */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {content}
      </div>

      {/* chrome — 뒤로 + 별 (홈/칭찬/설정 화면에서는 자체 UI) */}
      {route.screen !== 'home' && route.screen !== 'celebration' && route.screen !== 'settings' && <BackButton tone={tone} onClick={back} />}
      {route.screen !== 'home' && route.screen !== 'celebration' && route.screen !== 'settings' && <StarCounter tone={tone} stars={stars} fontSize={fontSize - 2} popKey={popKey} />}

      {/* 별 획득 플로팅 */}
      {reward && (
        <div key={reward.key} style={{
          position: 'absolute',
          top: '38%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: 160, lineHeight: 1,
          pointerEvents: 'none',
          animation: 'kw-star-pop 1.1s cubic-bezier(.34,1.56,.64,1) forwards',
          zIndex: 30,
          filter: `drop-shadow(0 8px 20px rgba(0,0,0,0.25))`,
        }}>
          ⭐
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 56, fontWeight: 900, color: tone.text,
            textShadow: '0 2px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff',
          }}>+{reward.n}</div>
        </div>
      )}

      {/* 스플래시 — 1.5s 표시 후 페이드아웃 */}
      {splashPhase !== 'done' && (
        <SplashScreen tone={tone} fading={splashPhase === 'fade'} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 스플래시 화면
// 중앙: 🌈 + "KidsWeb"  /  하단: 빙글빙글 ⭐  /  하늘색→연보라 그라데이션
// ─────────────────────────────────────────────────────────────
function SplashScreen({ tone, fading }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(180deg, #A8D8EA 0%, #C9BEE8 60%, #DDA0DD 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      opacity: fading ? 0 : 1,
      transition: 'opacity 300ms ease',
      pointerEvents: fading ? 'none' : 'auto',
    }}>
      {/* 떠다니는 거품 */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[
          { l: '12%', t: '18%', s: 36, d: '0s' },
          { l: '82%', t: '24%', s: 28, d: '0.4s' },
          { l: '20%', t: '70%', s: 44, d: '0.2s' },
          { l: '74%', t: '76%', s: 32, d: '0.6s' },
          { l: '50%', t: '12%', s: 24, d: '0.8s' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', left: b.l, top: b.t,
            width: b.s, height: b.s, borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            animation: `kw-float 2.4s ease-in-out ${b.d} infinite`,
          }} />
        ))}
      </div>

      <div style={{
        fontSize: 200, lineHeight: 1, marginBottom: 18,
        animation: 'kw-splash-rainbow 1.4s cubic-bezier(.34,1.56,.64,1) both',
        filter: 'drop-shadow(0 10px 20px rgba(86,60,140,0.25))',
      }}>🌈</div>

      <div style={{
        fontSize: 110, fontWeight: 900,
        color: '#fff',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        textShadow: '0 4px 0 rgba(86,60,140,0.35), 0 10px 28px rgba(86,60,140,0.4)',
        animation: 'kw-splash-title 1.4s cubic-bezier(.34,1.56,.64,1) both',
      }}>KidsWeb</div>

      <div style={{
        marginTop: 14,
        fontSize: 26, fontWeight: 700,
        color: '#fff',
        opacity: 0.95,
        letterSpacing: '0.02em',
        animation: 'kw-splash-sub 1.6s ease 0.2s both',
      }}>놀면서 배워요!</div>

      {/* 하단 빙글빙글 별 */}
      <div style={{
        position: 'absolute', bottom: 56,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          fontSize: 64, lineHeight: 1,
          animation: 'kw-spin 1.2s linear infinite',
          filter: 'drop-shadow(0 4px 10px rgba(86,60,140,0.4))',
        }}>⭐</div>
        <div style={{ fontSize: 18, color: '#fff', opacity: 0.85, fontWeight: 700 }}>준비중...</div>
      </div>
    </div>
  );
}

export { KidsApp, SplashScreen }
