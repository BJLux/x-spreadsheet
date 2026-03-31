import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'x-data-spreadsheet/dist/xspreadsheet.js': path.resolve(__dirname, 'node_modules/x-data-spreadsheet/dist/xspreadsheet.js'),
      'x-data-spreadsheet/dist/xspreadsheet.css': path.resolve(__dirname, 'node_modules/x-data-spreadsheet/dist/xspreadsheet.css'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true as unknown as string[],
  },
});
