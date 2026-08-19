<script setup lang="ts">
import { computed, type Component } from 'vue';
import * as Icons from '@vicons/ionicons5';

const props = withDefaults(
  defineProps<{
    name: string;
  }>(),
  { name: '' },
);

const iconComponent = computed(() => {
  return (Icons as Record<string, Component | unknown>)[props.name] || null;
});
</script>
<template>
  <component :is="iconComponent" v-if="iconComponent" />
</template>
