// vitest.config.unit.ts

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/test.ts']
  },
  resolve: {
    alias: {
      jobs: '/src/jobs',
      data: '/src/data'
    }
  }
})