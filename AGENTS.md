# AGENTS.md — Nexus Launcher

Electron + React + TypeScript launcher for the NexusForever WildStar emulator. See [README.md](README.md) for the feature list and end-user setup.

## Commands

```bash
npm run dev          # electron-vite dev with HMR
npm run typecheck    # tsc on BOTH tsconfig.node.json + tsconfig.web.json
npm run build        # typecheck + electron-vite build (always run before release)
npm run build:win    # build + electron-builder (.exe, unsigned, --publish=never)
npm run lint         # eslint
npm run format       # prettier --write .
```

Always run `npm run typecheck` after editing. The renderer and main/preload are checked by **separate** tsconfigs — a change can pass one and fail the other.

## Release workflow

Releases are tag-driven. The GitHub Actions [release workflow](.github/workflows/release.yml) builds + publishes installers when a `v*` tag is pushed.

```bash
npm version patch --no-git-tag-version   # bump package.json
git add -A && git commit -m "…"
git push origin main
git tag -a v1.0.X -m "v1.0.X" && git push origin v1.0.X
```

- **Keep `package.json` version and the tag in sync.** Merging dependabot PRs can silently roll the version back — verify with `(Get-Content package.json | ConvertFrom-Json).version` before tagging.
- Auto-updates ship via `electron-updater` from GitHub Releases.

## Architecture

Three-process Electron model with strict isolation. Detailed map: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

- **Main** ([src/main/index.ts](src/main/index.ts)) — window lifecycle, IPC handlers ([src/main/ipc.ts](src/main/ipc.ts)), services, persistent settings.
- **Preload** ([src/preload/index.ts](src/preload/index.ts)) — `contextBridge` exposing the typed `window.electron` API.
- **Renderer** ([src/renderer/src](src/renderer/src)) — React + React Router SPA, Zustand store.

### Adding an IPC channel (follow the full chain)

1. Handler in [src/main/ipc.ts](src/main/ipc.ts): `ipcMain.handle('domain:action', …)` — channels are named `domain:action`.
2. Bridge in [src/preload/index.ts](src/preload/index.ts): `methodName: (...args) => ipcRenderer.invoke('domain:action', ...args)`.
3. Types in [src/renderer/src/types/index.ts](src/renderer/src/types/index.ts) (renderer) — note types are **duplicated**, not shared, between renderer and [src/main/store/settings.ts](src/main/store/settings.ts). Update both when changing `Settings` or `ServerProfile`.
4. Call via `window.electron.methodName(...)`.

### Settings persistence

`Settings` (incl. the server list) lives in two places that must stay in sync:
- Main: electron-store with a schema in [src/main/store/settings.ts](src/main/store/settings.ts). **New settings keys must be added to the `schema` block** or writes are silently dropped.
- Renderer: Zustand store ([src/renderer/src/store/index.ts](src/renderer/src/store/index.ts)). `updateSettings(patch)` round-trips through main and recomputes `activeServer`.

When adding a setting, update: renderer type, renderer store default, main type, main `defaultSettings`, main `schema`.

## UI layout system (important)

The window is frameless + transparent. A single PNG (`launcher-bg.png`) is the chrome, drawn at `z:20` over page content. All positioning is **viewport-relative (`vh`/`vw`)**, not pixels — there are no breakpoints. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#ui-layout) for the pixel map and z-index stack.

Pitfalls learned the hard way:
- **Stacking contexts**: giving the page-content wrapper a `z-index` traps children in a new stacking context, so `z:30` overlays (PLAY button, NEWS card) render *behind* the frame PNG. Keep the content wrapper z-index unset; rely on DOM paint order (frame `<img>` comes after content).
- **PLAY button** lives in [src/renderer/src/components/PlayButton.tsx](src/renderer/src/components/PlayButton.tsx) and is mounted globally in [Layout.tsx](src/renderer/src/components/Layout.tsx) so it works on every route. A `<button>` needs explicit `display:flex` to center its label.
- **Modal/backdrop overlays** must be `absolute` within the chrome interior, NOT `fixed inset-0` — the transparent window edges otherwise show the dark backdrop bleeding outside the frame.
- **Slideshow/background** is clipped to the visible interior ([BackgroundLayer.tsx](src/renderer/src/components/BackgroundLayer.tsx)); overshooting the clip bleeds past the chrome.

## Conventions

- **Styling**: Tailwind with `nexus-*` theme colors + component classes (`nexus-card`, `btn-primary`, `btn-ghost`, `nexus-input`) defined in [src/renderer/src/assets/globals.css](src/renderer/src/assets/globals.css).
- **Branding fonts**: `Russo One` / `Orbitron` loaded via Google Fonts in [src/renderer/index.html](src/renderer/index.html). Any new external font/host must be added to the CSP `<meta>` (`style-src`/`font-src`/`connect-src`) in that file.
- **Files**: PascalCase components & services; kebab-case directories.
- **Server URL fields** (website/news/status/patch manifest): see [server-examples/README.md](server-examples/README.md) for the JSON shapes each expects.

## Packaging notes (electron-builder 26)

- `signAndEditExecutable` and `sign` were removed from the `win` schema — do not re-add them; unsigned is the default when no credentials are present.
- The working NSIS config is `oneClick: false`, `perMachine: false`, `allowToChangeInstallationDirectory: true` (a wizard installer). The silent `oneClick: true` variant triggered UAC/Smart App Control problems — avoid it unless the build is code-signed.
