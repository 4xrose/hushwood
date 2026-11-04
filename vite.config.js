import { defineConfig } from 'vite';

export default defineConfig({
  // Relative URLs let the same dist/ run from a web root, a sub-path, or the
  // Capacitor local server without rebuilding.
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/@dimforge')) return 'rapier';
          if (id.includes('node_modules/howler')) return 'howler';
          return undefined;
        },
      },
    },
  },
});
