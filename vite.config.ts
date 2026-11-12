import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), {
      name: 'reject-private-assessment-content',
      generateBundle(_options, bundle) {
        for (const chunk of Object.values(bundle)) if (chunk.type === 'chunk') {
          for (const id of Object.keys(chunk.modules)) {
            if (/\/(?:server\/|src\/data\/(?:exams|examQuestionPools|assessmentContent)\.)/.test(id)) {
              throw new Error(`Private assessment source reached frontend bundle: ${id}`);
            }
          }
        }
      },
    }],
    build: { manifest: true },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      fs: { deny: ['**/.env*', '**/.git/**', '**/*.{crt,pem}', '**/server/**', '**/server-build/**', '**/.vercel/**', '**/runner/**', '**/server.ts'] },
      // HMR can be disabled via DISABLE_HMR.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
