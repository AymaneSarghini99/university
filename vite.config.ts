import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { universityMediaScaffoldPlugin, universityMediaStaticPlugin } from "./vite.plugins";

export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    ...(command === "serve"
      ? [universityMediaStaticPlugin(), universityMediaScaffoldPlugin()]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
