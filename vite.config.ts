import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // host: true so the dev server is reachable from outside the container
  server: { host: true },
  // rapier's wasm is base64-inlined into one large chunk; the size is expected
  build: { chunkSizeWarningLimit: 4000 },
});
