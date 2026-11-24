<script setup lang="ts">
defineProps<{ tone: 'info' | 'empty', message: string }>()
</script>

<template>
  <p
    class="info-notice"
    :class="`info-notice--${tone}`"
    role="status"
  >
    {{ message }}
  </p>
</template>
