import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import autoprefixer from "autoprefixer";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [autoprefixer()],
    },
  },
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
