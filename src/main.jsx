import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
import { loadSettings, saveSettings } from './lib/storage.js'
import './styles.css'

// PWA 자동 업데이트: registerType:'autoUpdate'가 새 SW를 즉시 적용+새로고침한다.
// 단, 새 배포 "감지"는 등록 시점에만 일어나므로, 설치형(항상 켜둔) 앱이 새 버전을
// 놓치지 않도록 주기적으로 + 다시 화면으로 돌아올 때마다 업데이트를 확인한다.
const UPDATE_CHECK_MS = 30 * 60 * 1000 // 30분
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, reg) {
    if (!reg) return
    setInterval(() => { reg.update().catch(() => {}) }, UPDATE_CHECK_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {})
    })
  },
})

const DESIGN_W = 1024
const DESIGN_H = 768

function currentTimeOfDay() {
  const h = new Date().getHours()
  if (h < 11) return 'morning'
  if (h < 17) return 'day'
  return 'evening'
}

function useFitScale() {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}

function RootApp() {
  const scale = useFitScale()
  const [settings, setSettings] = useState(loadSettings)

  const updateSettings = (partial) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        ...partial,
        ...(partial.volume ? { volume: { ...prev.volume, ...partial.volume } } : {}),
      }
      saveSettings(next)
      return next
    })
  }

  const tone = KIDS_TONES[settings.toneId] || KIDS_TONES.C

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      // 4:3 캔버스가 와이드 화면에 남기는 양옆 여백을 검은 띠 대신 테마 배경색으로 채움
      background: tone.bg || tone.surface || '#1c1b22', overflow: 'hidden',
    }}>
      <div style={{
        width: DESIGN_W, height: DESIGN_H,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        position: 'relative', overflow: 'hidden',
        flex: '0 0 auto',
      }}>
        <KidsApp
          tone={tone}
          fontSize={settings.fontSize}
          mascotOn={settings.mascotOn}
          voiceShow={settings.voiceShow}
          timeOfDay={currentTimeOfDay()}
          splashKey={0}
          settings={settings}
          onSettingsChange={updateSettings}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
