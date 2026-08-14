import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { universityMediaScaffoldPlugin, universityMediaStaticPlugin } from "./vite.plugins";

const repoRoot = path.resolve(__dirname, "../..");
const reactPath = path.join(repoRoot, "node_modules/react");
const reactDomPath = path.join(repoRoot, "node_modules/react-dom");

export default defineConfig(({ command }) => ({
  server: {
    host: "::",
    port: 8081,
    strictPort: true,
  },
  plugins: [
    react(),
    ...(command === "serve"
      ? [universityMediaStaticPlugin(), universityMediaScaffoldPlugin()]
      : []),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: reactPath,
      "react/jsx-runtime": path.join(reactPath, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactPath, "jsx-dev-runtime.js"),
      "react-dom": reactDomPath,
      "react-dom/client": path.join(reactDomPath, "client.js"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
    ],
    esbuildOptions: {
      alias: {
        react: reactPath,
        "react-dom": reactDomPath,
      },
    },
  },
}));
