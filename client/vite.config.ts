import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    /**
     * Чтобы main-bundle не разросся: тяжёлые сторонние либы выносим
     * в отдельные chunk-и — они редко меняются и хорошо кешируются браузером.
     * Бизнес-код остаётся в основном chunk + route-чанках от React.lazy.
     */
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mantine: [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/form',
            '@mantine/notifications',
            '@mantine/modals',
            '@mantine/dates',
            '@mantine/dropzone',
          ],
          query: ['@tanstack/react-query', '@tanstack/react-table'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          i18n: ['i18next', 'react-i18next'],
          vendor: ['axios', 'zod', 'dayjs', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
