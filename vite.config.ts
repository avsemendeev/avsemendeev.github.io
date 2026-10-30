// ============= Full file contents =============
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Static build for GitHub Pages: enabled only when NITRO_PRESET=static is set
// (see .github/workflows/deploy-pages.yml). Lovable builds are unaffected.
const staticBuild = process.env.NITRO_PRESET === "static";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(staticBuild ? { prerender: { enabled: true } } : {}),
  },
  ...(staticBuild
    ? {
        nitro: { preset: "static" as const },
        vite: { base: process.env.VITE_BASE_PATH || "/" },
      }
    : {}),
});
