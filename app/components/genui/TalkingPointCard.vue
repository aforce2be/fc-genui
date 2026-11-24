<script setup lang="ts">
defineProps<{ topic: string, points: string[], reason: string }>()
</script>

<template>
  <GenuiCard
    :title="topic"
    badge="설명 포인트"
    :reason="reason"
    ai-draft
  >
    <ul class="point-list">
      <li
        v-for="(p, i) in points"
        :key="i"
        class="point-list__item"
      >
        {{ p }}
      </li>
    </ul>
  </GenuiCard>
</template>
