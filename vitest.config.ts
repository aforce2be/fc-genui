import { defineConfig } from 'vitest/config'

// 검증 규칙(validate.ts)은 순수 함수라 Nuxt 런타임 없이 node 환경에서 테스트한다.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
