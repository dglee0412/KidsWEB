import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
import { loadSettings, saveSettings } from './lib/storage.js'
import './styles.css'

const DESIGN_W = 1024
const DESIGN_H = 768

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
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }

  const tone = KIDS_TONES[settings.toneId] || KIDS_TONES.C

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1c1b22', overflow: 'hidden',
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
          timeOfDay="day"
          splashKey={0}
          settings={settings}
          onSettingsChange={updateSettings}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
