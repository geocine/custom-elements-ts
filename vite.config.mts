import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
        target: 'es2017',
      },
    },
  },
  resolve: {
    alias: {
      'custom-elements-ts': '/src/index.ts',
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html']
    },
  },
});

