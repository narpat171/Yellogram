import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    tailwindcss(), 
  ],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // 🔥 'require-corp' को हटाकर 'credentialless' कर दिया है!
      // इससे FFmpeg भी चलेगा और बाहरी इमेजेज (Dicebear/Supabase) भी ब्लॉक नहीं होंगी।
      "Cross-Origin-Embedder-Policy": "credentialless", 
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
})