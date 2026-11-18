import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");
  const serverPort = env.SERVER_PORT || "2500";
  const clientPort = Number(env.CLIENT_PORT || 2000);

  return {
    plugins: [react(), tailwindcss()],
    envDir: rootDir,
    server: {
      port: clientPort,
      strictPort: true,
      proxy: {
        "/api": `http://localhost:${serverPort}`,
      },
    },
    preview: {
      port: clientPort,
      strictPort: true,
    },
  };
});
