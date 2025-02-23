<script setup lang="ts">
import Navbar from "@/components/layout/Navbar.vue";
import Toaster from "@/components/ui/toast/Toaster.vue";
import router from "@/router";
import { useColorMode } from "@vueuse/core";
const { store } = useColorMode({ disableTransition: false });
store.value = "auto";
</script>

<template>
  <Toaster />
  <Navbar class="z-40" v-if="router.currentRoute.value.path !== '/login'" />
  <router-view></router-view>
</template>
