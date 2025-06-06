// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ✅ Enables @ to point to /src
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // ✅ Proxy API calls to backend
    },
  },
});
