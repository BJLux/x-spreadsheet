import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: /^x-data-spreadsheet$/,
        replacement: path.resolve(__dirname, 'node_modules/x-data-spreadsheet/dist/xspreadsheet.js'),
      },
    ],
  },
  optimizeDeps: {
    include: ['x-data-spreadsheet'],
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true as unknown as string[],
  },
});
