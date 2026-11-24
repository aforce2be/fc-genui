import { defineConfig } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    { name: 'pc', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mo', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    // E2E는 항상 목업 LLM 모드로 돌린다 (API 키 불필요, 결과 고정).
    command: `pnpm build && pnpm preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: { NUXT_GENUI_MODE: 'mock', PORT: String(PORT) },
  },
})
