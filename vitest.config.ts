import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('test'),
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/ageGroups.ts',
        'src/utils/compliance.ts',
        'src/utils/projections.ts',
        'src/lib/eligibility.ts',
        'src/lib/elfa.ts',
        'src/lib/vacancyTtl.ts',
        'src/lib/randomOrder.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 95,
        lines: 90,
      },
    },
  },
})
