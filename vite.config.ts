import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['x-data-spreadsheet'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true as unknown as string[],
  },
});
