<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
const props = defineProps<{
  link: string;
  imageSrc: string;
  imageAlt: string;
  text: string;
}>();
</script>

<template>
  <RouterLink :to="props.link">
    <Button variant="ghost">
      <div className="flex items-center gap-2">
        <img :src="props.imageSrc" :alt="props.imageAlt" className="h-6 w-6" />
        <h1 className="font-semibold">{{ props.text }}</h1>
      </div>
    </Button>
  </RouterLink>
</template>
