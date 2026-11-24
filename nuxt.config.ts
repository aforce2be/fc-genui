// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/test-utils/module'],
  css: ['~/assets/scss/main.scss'],
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: 'FC 브리핑',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  runtimeConfig: {
    // 서버 전용. .env의 NUXT_GENUI_MODE / NUXT_GENUI_MODEL / NUXT_ANTHROPIC_API_KEY 로 덮어쓴다.
    genuiMode: 'mock', // 'mock' = tests/fixtures 고정 명세, 'live' = LLM 호출
    genuiModel: 'claude-opus-5-5',
    anthropicApiKey: '',
  },
})
