<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import router from "@/router";
import { auth } from "@/services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, LoaderCircle } from "lucide-vue-next";
import { onMounted, onUnmounted, ref } from "vue";

const isLoading = ref(false);
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const isVideoLoaded = ref(window.innerWidth >= 1024);

function checkScreenSize() {
  if (window.innerWidth >= 1024) {
    isVideoLoaded.value = true;
    window.removeEventListener("resize", checkScreenSize);
  }
}

async function onSubmit(event: Event) {
  event.preventDefault();
  isLoading.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    toast({
      title: "Login successful",
      description: "You have been successfully logged in.",
    });
    router.push({ path: "/" });
  } catch (error) {
    password.value = "";
    toast({
      title: "Login failed",
      description: "Please check your email and password.",
      variant: "destructive",
    });
  }
  isLoading.value = false;
}

onMounted(() => {
  if (!isVideoLoaded.value) {
    window.addEventListener("resize", checkScreenSize);
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<template>
  <div
    class="h-dvh container relative grid flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
  >
    <div
      class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex"
    >
      <div class="absolute inset-0 bg-zinc-900" />

      <video
        v-if="isVideoLoaded"
        class="absolute inset-0 h-full w-full object-cover"
        autoplay
        playsinline
        muted
        loop
      >
        <source src="/splash.mp4" type="video/mp4" />
      </video>
      <div class="relative z-20 flex items-center text-lg font-medium">
        <img src="/logo.svg" alt="Thermometer" class="size-10 mr-2" />
        Beerbrewing Thermometer
      </div>
      <div class="relative z-20 mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">
            A brewing thermometer that displays real-time temperature and
            historical data for perfect brews.
          </p>
        </blockquote>
      </div>
    </div>
    <div class="lg:p-8">
      <div
        class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
      >
        <div class="flex flex-col space-y-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">Login</h1>
          <p class="text-sm text-muted-foreground">
            Enter your email below to login to your account.
          </p>
        </div>
        <div>
          <form @submit="onSubmit" class="grid gap-4">
            <Input
              id="email"
              placeholder="Email"
              type="email"
              auto-capitalize="none"
              auto-complete="email"
              auto-correct="off"
              :disabled="isLoading"
              v-model="email"
            />
            <div class="relative">
              <Input
                :type="showPassword ? 'text' : 'password'"
                placeholder="Password"
                :disabled="isLoading"
                v-model="password"
              />
              <button
                type="button"
                :disabled="isLoading"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-sm leading-5"
                :class="{ 'text-muted-foreground': isLoading }"
              >
                <EyeOff v-if="showPassword" />
                <Eye v-else />
              </button>
            </div>
            <Button :disabled="isLoading">
              <LoaderCircle v-if="isLoading" class="h-4 w-4 animate-spin" />
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
