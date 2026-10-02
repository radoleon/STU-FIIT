import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FAs Management Tool',
        short_name: 'FAs Management Tool',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          {
            src: '/pwa-icon-256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/pwa-icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
