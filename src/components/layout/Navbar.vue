<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import Sheet from "@/components/ui/sheet/Sheet.vue";
import SheetClose from "@/components/ui/sheet/SheetClose.vue";
import SheetContent from "@/components/ui/sheet/SheetContent.vue";
import SheetTitle from "@/components/ui/sheet/SheetTitle.vue";
import SheetTrigger from "@/components/ui/sheet/SheetTrigger.vue";
import { waitForUserAuthInit } from "@/helpers/auth-init-waiter";
import { Menu } from "lucide-vue-next";
import { ref } from "vue";
import AccountDropdown from "./AccountDropdown.vue";
import LogoButton from "./LogoButton.vue";

type NavLink = {
  label: string;
  href: string;
};

const navLinkList: NavLink[] = [
  { label: "Live View", href: "/live" },
  { label: "History", href: "/history" },
];

const showAccountDropdown = ref<boolean>(false);

async function checkUserAuth() {
  showAccountDropdown.value = (await waitForUserAuthInit()) !== null;
}

checkUserAuth();
</script>

<template>
  <header
    class="sticky top-0 flex w-full flex-col items-center justify-between border-b border-border bg-background/80 p-2 shadow-md backdrop-blur-lg"
  >
    <div class="flex w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <LogoButton
          :link="navLinkList[0].href"
          image-src="logo.svg"
          image-alt="Beerbrewing Thermometer Logo"
          text="Beerbrewing Thermometer"
        />
        <div class="hidden gap-4 md:flex">
          <RouterLink
            v-for="link in navLinkList"
            :key="`${link.label}D`"
            :to="link.href"
            class="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
      <span class="hidden md:block"
        ><AccountDropdown v-if="showAccountDropdown"
      /></span>
      <span class="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu class="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetTitle class="absolute left-1 top-1"> </SheetTitle>
            <div class="flex h-full flex-col gap-2 pt-6">
              <div
                class="flex flex-grow flex-col items-center justify-center overflow-y-auto"
              >
                <div
                  class="flex w-full flex-col items-center gap-4 overflow-y-auto text-lg"
                >
                  <SheetClose
                    as-child
                    v-for="link in navLinkList"
                    :key="`${link.label}M`"
                    class="text-foreground/60 transition-colors hover:text-foreground/80"
                  >
                    <RouterLink :to="link.href">
                      {{ link.label }}
                    </RouterLink>
                  </SheetClose>
                </div>
              </div>
              <div class="flex justify-center">
                <AccountDropdown v-if="showAccountDropdown" />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </span>
    </div>
  </header>
</template>
