import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev API port (see "dev:api" in package.json). Override with API_PORT if 4000 is taken.
const api = `http://localhost:${process.env.API_PORT || 4000}`;

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': api,
      '/uploads': api,
    },
  },
});
