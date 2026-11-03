import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['chess-icon.svg'],
      manifest: {
        name: 'Royal Chess Championship',
        short_name: 'RoyalChess',
        description: 'Complete Hybrid Offline + Online Chess Tournament Hosting Platform',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/chess-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Admin Dashboard',
            url: '/admin/dashboard',
            description: 'Manage tournaments',
          },
          {
            name: 'Participant View',
            url: '/participant',
            description: 'View your board and pairings',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
})
