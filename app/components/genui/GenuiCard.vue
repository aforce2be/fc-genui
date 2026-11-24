<script setup lang="ts">
/**
 * 모든 카드의 공통 틀. 카탈로그 컴포넌트가 아니라 디자인 시스템 부품이다.
 * - reason(근거)을 항상 노출한다.
 * - aiDraft가 true면 'AI 초안 · 약관 확인 필요' 라벨을 고정 노출한다 (끌 수 없음).
 */
defineProps<{
  title: string
  reason: string
  aiDraft?: boolean
  badge?: string
  tone?: 'default' | 'warning'
}>()
</script>

<template>
  <article
    class="genui-card"
    :class="{ 'genui-card--warning': tone === 'warning', 'genui-card--ai': aiDraft }"
  >
    <header class="genui-card__head">
      <span
        v-if="badge"
        class="genui-card__badge"
      >{{ badge }}</span>
      <h3 class="genui-card__title">
        {{ title }}
      </h3>
    </header>
    <p
      v-if="aiDraft"
      class="genui-card__ai-label"
    >
      AI 초안 · 약관 확인 필요
    </p>
    <div class="genui-card__body">
      <slot />
    </div>
    <p class="genui-card__reason">
      <span class="genui-card__reason-label">근거</span>
      {{ reason }}
    </p>
    <footer
      v-if="$slots.actions"
      class="genui-card__actions"
    >
      <slot name="actions" />
    </footer>
  </article>
</template>
