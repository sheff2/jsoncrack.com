### Quick context

This repository is the frontend for JSON Crack — a Next.js (v14) React application focused on visualizing and transforming JSON and other data formats (YAML, XML, CSV). Most runtime work happens entirely in the browser.

Keep guidance short and actionable. Refer to specific files below for patterns and conventions.

### Build / dev / test commands

- Use pnpm (packageManager is `pnpm@9.1.4`). Common scripts in `package.json`:
  - `pnpm dev` — start Next.js in development (http://localhost:3000)
  - `pnpm build` — production build (runs `next build`)
  - `pnpm start` — serve a production build
  - `pnpm lint` / `pnpm lint:fix` — TypeScript + ESLint + Prettier checks
  - `ANALYZE=true pnpm build` — build with bundle analyzer

### High-level architecture & important files

- Framework: Next.js (app is in `src/` with pages under `src/pages`). Client-heavy — much logic runs in browser components.
- UI: Mantine + styled-components. Theme & global styles live in `src/constants/globalStyle.ts` and `src/constants/theme.ts`.
- Editor & visualization: `src/features/editor/` (notably `LiveEditor.tsx`, `views/GraphView.tsx`, `views/TreeView.tsx`). Graph rendering uses `reaflow` (see `src/features/*/views`).
- File/content adapters: `src/lib/utils/jsonAdapter.ts` — central place to parse/convert JSON, YAML, XML, CSV using dynamic imports (jsonc-parser, js-yaml, fast-xml-parser, json-2-csv).
- Utilities & generators: `src/lib/utils/generateType.ts`, `json2go.js` — used for generating TypeScript/Golang types.
- App entry: `src/pages/_app.tsx` — sets up Mantine provider, theme manager (`smartColorSchemeManager`), SEO and analytics.
- Config: `next.config.js` uses Sentry and bundle analyzer when specific env vars are present. Note WebAssembly experiment flags for `json_typegen_wasm`.

### Conventions & patterns to follow

- Dynamic imports are commonly used for heavy parsing libraries (see `jsonAdapter.ts`). Prefer dynamic imports when introducing new, large optional dependencies.
- Global theming: prefer Mantine's color scheme manager `smartColorSchemeManager` (see `src/pages/_app.tsx` and `src/lib/utils/mantineColorScheme.ts`). Components expect theme values from both Mantine and `styled-components` theme.
- Storage: small UI state uses Mantine hooks/session storage (examples in `LiveEditor.tsx` using `useSessionStorage`). App-wide state often uses `zustand` stores under `src/store/` (see `useJson.ts`, `useModal.ts`).
- Avoid server-side filesystem usage — `next.config.js` sets `fs: false` fallback. Most features assume client-only processing of uploaded content.

### Integration points & external services

- Sentry: configured in `next.config.js` but only enabled for the original repo (`GITHUB_REPOSITORY` check). If you change Sentry config, update that file.
- Analytics: `nextjs-google-analytics` is toggled by `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env`.
- WebAssembly: `json_typegen_wasm` is included as a dependency and `next.config.js` enables async WebAssembly—watch builds for wasm output under `static/wasm/`.

### Typical changes & examples

- If adding a new file format parser, follow the `jsonAdapter` pattern: use dynamic import, return Promise, and handle errors consistently (reject with string message). Example: `contentToJson` and `jsonToContent`.
- To add a new editor tool or modal, add a folder in `src/features/modals/` and register it via `src/features/modals/index.ts` or `ModalController.tsx`.
- When updating UI components, prefer using Mantine components and `styled-components` with existing theme tokens (search for `GRID_BG_COLOR`, `lightTheme` in `src/constants/theme.ts`).

### Debugging & build gotchas

- Node version: >=18.x. pnpm is the recommended package manager. The repo uses pnpm lockfile — honours `packageManager` in `package.json`.
- Linting runs `tsc` first; type errors will fail `pnpm lint`.
- If adding native modules or wasm, ensure `next.config.js` webpack experiments are preserved (asyncWebAssembly). Unexpected SSR usage of wasm can fail — prefer client-only dynamic imports.

### Where to look for more context

- Visual editor flow: `src/features/editor/*` and `src/features/editor/views/*`
- Data conversions/parsers: `src/lib/utils/jsonAdapter.ts`, `src/lib/utils/json2go.js`, `src/lib/utils/generateType.ts`
- State & stores: `src/store/*` (e.g., `useJson.ts`, `useModal.ts`)
- App-level config and initialization: `src/pages/_app.tsx`, `next.config.js`, `package.json`, `README.md`

If anything here is unclear or you'd like more detail about a specific area (build pipeline, wasm, Sentry, or editor internals), tell me which area and I'll expand this file accordingly.
