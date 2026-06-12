import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Stamped into the bundle so a console glance settles "which build is this?"
  // (Vercel injects the commit SHA at build time; local builds say "local".)
  // globalThis dance: the app's tsconfig has no node types, and one config
  // line doesn't justify @types/node.
  define: {
    __BUILD_SHA__: JSON.stringify(
      (
        globalThis as { process?: { env?: Record<string, string | undefined> } }
      ).process?.env?.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    ),
  },
  // host: true so the dev server is reachable from outside the container
  server: { host: true },
  // rapier's wasm is base64-inlined into one large chunk; the size is expected
  build: { chunkSizeWarningLimit: 4000 },
});
