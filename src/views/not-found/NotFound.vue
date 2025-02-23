<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
</script>

<template>
  <div
    class="flex h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center gap-2"
  >
    <h1 class="text-5xl font-bold">404</h1>
    <p class="text-muted-foreground">This page wasn't found</p>
    <RouterLink to="/">
      <Button>Go back home</Button>
    </RouterLink>
  </div>
</template>
