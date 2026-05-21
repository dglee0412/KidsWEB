import React from 'react'
import { createRoot } from 'react-dom/client'
import { KidsApp } from './app.jsx'
import { KIDS_TONES } from './themes.jsx'
import './styles.css'

function RootApp() {
  return (
    <div style={{ width: 1024, height: 768, position: 'relative', overflow: 'hidden' }}>
      <KidsApp
        tone={KIDS_TONES.C}
        fontSize={26}
        mascotOn={true}
        voiceShow={true}
        timeOfDay="day"
        splashKey={0}
      />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<RootApp />)
