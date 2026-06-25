import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'KidsWeb — 곰곰이의 사계절 마을',
        short_name: 'KidsWeb',
        description: '만 3~5세 유아용 교육 놀이 앱',
        lang: 'ko',
        theme_color: '#FF6B6B',
        background_color: '#1c1b22',
        display: 'fullscreen',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 새 버전 배포 시 새 SW가 즉시 take control → 새로고침 한 번에 적용
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // 음성(작은 mp3)은 프리캐시, BGM(큰 mp3)은 제외하고 런타임 캐싱으로 처리
        globPatterns: ['**/*.{js,css,html,png,woff2,mp3}'],
        globIgnores: ['**/bgm/*.mp3'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/bgm/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'kw-bgm',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  server: { port: 3100, strictPort: true, host: true },
})
