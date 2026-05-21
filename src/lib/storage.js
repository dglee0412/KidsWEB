// KidsWeb localStorage 영속화 헬퍼

const SETTINGS_KEY = 'kw-settings'

export const DEFAULT_SETTINGS = {
  toneId: 'C',        // 'A' | 'B' | 'C'
  fontSize: 26,
  mascotOn: true,
  voiceShow: true,
  timeLimit: 0,       // 분, 0 = 무제한
  volume: { bgm: 70, sfx: 90, voice: 100 },
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
    if (raw && typeof raw === 'object') {
      return { ...DEFAULT_SETTINGS, ...raw, volume: { ...DEFAULT_SETTINGS.volume, ...(raw.volume || {}) } }
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {}
}

export function loadStars() {
  const n = Number(localStorage.getItem('kw-stars'))
  return Number.isFinite(n) ? n : 0
}

export function saveStars(n) {
  try { localStorage.setItem('kw-stars', String(n)) } catch {}
}
