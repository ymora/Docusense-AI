import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // OPTIMISATION: Configuration de build pour de meilleures performances
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting optimisé
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@heroicons/react', 'lucide-react'],
          utils: ['clsx', 'date-fns', 'tailwind-merge'],
          stores: ['zustand'],
          services: ['axios'],
        },
        // Optimisation des noms de fichiers
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Optimisation de la taille
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // OPTIMISATION: Configuration de développement
  server: {
    port: 3000,
    host: '0.0.0.0', // Permet l'accès depuis le réseau
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // Utilise l'IP locale pour le proxy
        changeOrigin: true,
        // OPTIMISATION: Configuration du proxy pour de meilleures performances
        timeout: 30000,
        proxyTimeout: 30000,
      },
    },
    // OPTIMISATION: Hot reload optimisé
    hmr: {
      overlay: false,
    },
  },

  // OPTIMISATION: Préchargement et optimisation des modules
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      '@heroicons/react',
      'lucide-react',
      'clsx',
      'date-fns',
      'tailwind-merge',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  // OPTIMISATION: Résolution des modules
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
    },
  },

  // OPTIMISATION: Configuration CSS - CORRECTION: Suppression de require()
  css: {
    // Optimisation du CSS
    devSourcemap: false,
  },

  // OPTIMISATION: Configuration des assets
  assetsInclude: ['**/*.pdf', '**/*.docx', '**/*.xlsx'],

  // OPTIMISATION: Configuration de preview
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },
});