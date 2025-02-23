<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Button from "@/components/ui/button/Button.vue";
import { DropdownMenuPortal } from "@/components/ui/dropdown-menu";
import DropdownMenu from "@/components/ui/dropdown-menu/DropdownMenu.vue";
import DropdownMenuContent from "@/components/ui/dropdown-menu/DropdownMenuContent.vue";
import DropdownMenuItem from "@/components/ui/dropdown-menu/DropdownMenuItem.vue";
import DropdownMenuLabel from "@/components/ui/dropdown-menu/DropdownMenuLabel.vue";
import DropdownMenuSeparator from "@/components/ui/dropdown-menu/DropdownMenuSeparator.vue";
import DropdownMenuSub from "@/components/ui/dropdown-menu/DropdownMenuSub.vue";
import DropdownMenuSubContent from "@/components/ui/dropdown-menu/DropdownMenuSubContent.vue";
import DropdownMenuSubTrigger from "@/components/ui/dropdown-menu/DropdownMenuSubTrigger.vue";
import DropdownMenuTrigger from "@/components/ui/dropdown-menu/DropdownMenuTrigger.vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { waitForUserAuthInit } from "@/helpers/auth-init-waiter";
import router from "@/router";
import { auth, db } from "@/services/firebase";
import { useColorMode } from "@vueuse/core";
import { signOut } from "firebase/auth";
import { ref as dbRef, remove } from "firebase/database";
import { MonitorCog, Moon, Sun, UserRound } from "lucide-vue-next";
import { ref } from "vue";
import AlertDialogContent from "../ui/alert-dialog/AlertDialogContent.vue";

const { toast } = useToast();
const { store } = useColorMode({ disableTransition: false });

const username = ref<string | null>(null);

async function setUsername() {
  const user = await waitForUserAuthInit();
  if (user) {
    username.value = user.email;
  }
}
setUsername();

const isDialogOpen = ref(false);
function openDialog() {
  isDialogOpen.value = true;
}

async function logout() {
  toast({
    title: "Logging you out...",
  });
  await signOut(auth);
  router.push({ path: "/login" });
  toast({
    title: "Logout successful",
    description: "You have been successfully logged out.",
  });
}

async function deleteNode(nodeName: string) {
  const readingsRef = dbRef(db, nodeName);
  await remove(readingsRef);
}

async function deleteAllData() {
  isDialogOpen.value = false;

  toast({
    title: "Deleting all data...",
    duration: 99999999,
  });

  await deleteNode("readings");

  toast({
    title: "Data deleted",
    description: "All your data has been successfully deleted.",
  });
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost">
        <UserRound class="h-4 w-4" />
        Account
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-56">
      <DropdownMenuLabel>{{ username }}</DropdownMenuLabel>
      <DropdownMenuItem @click="openDialog()">Delete all data</DropdownMenuItem>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              :class="{ 'bg-accent': store === 'light' }"
              @click="store = 'light'"
            >
              <Sun class="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem
              :class="{ 'bg-accent': store === 'dark' }"
              @click="store = 'dark'"
            >
              <Moon class="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              :class="{ 'bg-accent': store === 'auto' }"
              @click="store = 'auto'"
            >
              <MonitorCog class="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="logout">Logout</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <AlertDialog :open="isDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
        <AlertDialogDescription>
          This action cannot be undone. This brewing day will be permanently
          from the database.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="isDialogOpen = false"
          >Cancel</AlertDialogCancel
        >
        <AlertDialogAction @click="deleteAllData()">Continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
