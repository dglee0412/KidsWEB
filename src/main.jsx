import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
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
          tone={KIDS_TONES.C}
          fontSize={26}
          mascotOn={true}
          voiceShow={true}
          timeOfDay="day"
          splashKey={0}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
