import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // (Or vue, svelte, etc. depending on your project)
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
});
