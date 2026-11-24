<script setup lang="ts">
defineProps<{ title: string, reason: string }>()
</script>

<template>
  <section class="briefing-section">
    <header class="briefing-section__head">
      <h2 class="briefing-section__title">
        {{ title }}
      </h2>
      <p class="briefing-section__reason">
        {{ reason }}
      </p>
    </header>
    <div class="briefing-section__grid">
      <slot />
    </div>
  </section>
</template>
