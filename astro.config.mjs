// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://style-doctor.pages.dev",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()]
  }
});