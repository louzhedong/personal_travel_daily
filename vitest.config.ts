import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}', 'server/**/*.{ts,mts,tsx}'],
      exclude: [
        '**/__tests__/**',
        '**/*.{spec,test}.{ts,tsx,mts}',
        'src/test/**',
        'server/prisma/**',
        'server/**/migrations/**',
        'vite.config.ts',
        'vitest.config.ts',
        'server/appApi/serializers/bootstrapSerializer.ts',
        'server/appApi/serializers/bootstrap/index.ts',
      ],
      thresholds: {
        statements: 73,
        branches: 78,
        functions: 70,
        lines: 73,
      },
    },
  },
});
