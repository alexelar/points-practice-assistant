import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from "vite-plugin-static-copy";

const buildTime = new Date().toISOString().slice(8, 16).replace('T', ':');

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime)
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
          dest: "./assets/vad/",
        },
        {
          src: "node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx",
          dest: "./assets/vad/",
        },
        {
          src: "node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx",
          dest: "./assets/vad/",
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "./assets/vad/",
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.mjs",
          dest: "./assets/vad/",
        },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 50000000,
        globPatterns: ['**/*.{js,css,html,png,ico,svg,wasm,onnx,mp3,mjs}'],
        cleanupOutdatedCaches: true
      },      
      manifest: {
        "name": "Ассистент для упражнений с точками",
        "short_name": "Точки",
        "description": "Голосовой ассистент для упражнений с точками тела",
        "lang": "ru",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#6b57ff",
        "theme_color": "#6b57ff",
        "icons": [
          { "src": "./android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
          { "src": "./android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
        ]
      }
    }),
  ],
});
