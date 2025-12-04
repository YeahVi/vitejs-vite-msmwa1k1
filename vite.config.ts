import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'LoveSync',
        short_name: 'LoveSync',
        description: 'Espace privé Vivien & Anaïs',
        theme_color: '#fff1f2',
        background_color: '#fff1f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/192x192/2764.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/512x512/2764.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/512x512/2764.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})