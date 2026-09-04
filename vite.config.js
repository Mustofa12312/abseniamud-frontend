import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Presensi IAIMU',
        short_name: 'Presensi IAIMU',
        description: 'Sistem Presensi Geofencing IAIMU',
        theme_color: '#0ea5e9', /* Brand 500 */
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/vite.svg', /* Since we dont have real icons yet, use vite */
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
})
