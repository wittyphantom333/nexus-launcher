# Architecture

Reference for how Nexus Launcher is wired together. See [AGENTS.md](../AGENTS.md) for the day-to-day rules and [README.md](../README.md) for end-user docs.

## Processes

| Process  | Entry                                            | Responsibility |
| -------- | ------------------------------------------------ | -------------- |
| Main     | [src/main/index.ts](../src/main/index.ts)        | Window lifecycle, IPC handlers, services, persistent settings, auto-update |
| Preload  | [src/preload/index.ts](../src/preload/index.ts)  | `contextBridge` exposing the typed `window.electron` API |
| Renderer | [src/renderer/src/main.tsx](../src/renderer/src/main.tsx) | React + React Router SPA, Zustand store |

The window is created in [src/main/index.ts](../src/main/index.ts): `1380×800` (min `1150×667`), `frame: false`, `transparent: true`. Because it is frameless/transparent, drag regions, window controls, and resize handles are all implemented in the renderer.

## IPC

All main↔renderer traffic flows through a single chain. Channels are named `domain:action`.

```
renderer  window.electron.method(args)
  → preload  ipcRenderer.invoke('domain:action', args)
    → main   ipcMain.handle('domain:action', handler)
```

Request/response uses `invoke`/`handle`. One-way main→renderer events (e.g. patch progress) are emitted from services and forwarded to `mainWindow.webContents.send(...)`, then subscribed to in the renderer.

Channel domains: `settings:`, `servers:`, `patcher:`, `launcher:`, `news:`, `discord:`, `update:`, `window:`, `dialog:`.

To add one, follow the four steps in [AGENTS.md](../AGENTS.md#adding-an-ipc-channel-follow-the-full-chain).

## State / settings

Two stores hold the same `Settings` shape and are kept in sync:

- **Main** — [src/main/store/settings.ts](../src/main/store/settings.ts): electron-store with a validation `schema`, persisted to `%APPDATA%/nexus-launcher/settings.json`. A key missing from `schema` is silently dropped on write.
- **Renderer** — [src/renderer/src/store/index.ts](../src/renderer/src/store/index.ts): Zustand (`subscribeWithSelector`). `loadSettings()` pulls from main on boot; `updateSettings(patch)` round-trips through main and recomputes `activeServer` from `activeServerId`.

`Settings` and `ServerProfile` types are **duplicated** between main and [src/renderer/src/types/index.ts](../src/renderer/src/types/index.ts) (preload re-exports the main copy). Adding a field touches five spots: renderer type, renderer store default, main type, main `defaultSettings`, main `schema`.

## Services (main process)

Instantiated once in [src/main/index.ts](../src/main/index.ts):

- **DiscordService** ([…/DiscordService.ts](../src/main/services/DiscordService.ts)) — discord-rpc presence; fails gracefully if Discord isn't running.
- **PatcherService** ([…/PatcherService.ts](../src/main/services/PatcherService.ts)) — extends `EventEmitter`; `check()` compares a remote manifest against local files, `start()` downloads/verifies, emitting `progress`/`complete`/`error`.
- **LauncherService** ([…/LauncherService.ts](../src/main/services/LauncherService.ts)) — copies the connector files into the game folder, then spawns `NexusForever.ClientConnector.exe`; also game-path detection/validation.
- **ServerStatusService** ([…/ServerStatusService.ts](../src/main/services/ServerStatusService.ts)) — cached status checks (HTTP with TCP-ping fallback).

## Build

[electron.vite.config.ts](../electron.vite.config.ts) defines three build targets. Main/preload use `externalizeDepsPlugin()`; renderer uses React + Tailwind/PostCSS and the `@` / `@renderer` aliases → `src/renderer/src`.

TypeScript is split: [tsconfig.node.json](../tsconfig.node.json) covers `src/main` + `src/preload`; [tsconfig.web.json](../tsconfig.web.json) covers `src/renderer`. `npm run typecheck` runs both.

Output:

```
out/
  main/index.js
  preload/index.js
  renderer/index.html + assets/
```

## UI layout

The frameless window is filled by one chrome PNG (`launcher-bg.png`) at `z:20`. Page content renders underneath; the opaque parts of the PNG mask content spillover, and its transparent interior reveals the active page. Everything is positioned in `vh`/`vw` (no breakpoints) so it tracks the stretched PNG.

Z-index stack (top → bottom):

| z      | Layer |
| ------ | ----- |
| 9999   | ResizeHandles (8 invisible edge/corner zones) |
| 40     | Window control buttons (minimize/close) |
| 30     | PlayButton, NEWS card, UpdateBanner, active nav underline |
| 20     | Frame PNG chrome |
| 0–15   | Page content (Home/Servers/PatchNotes/Settings) |
| -1     | BackgroundLayer slideshow (clipped to interior) |

Key constraints (see [AGENTS.md](../AGENTS.md#ui-layout-system-important)):

- The page-content wrapper must have **no `z-index`** — setting one creates a stacking context that traps `z:30` overlays behind the frame PNG. Overlays paint above the frame purely via DOM order (frame `<img>` comes after content in [Layout.tsx](../src/renderer/src/components/Layout.tsx)).
- Modals/backdrops use `absolute` inside the chrome interior, never `fixed inset-0`, to avoid bleeding into the transparent window margins.
- The PLAY button is global (mounted in [Layout.tsx](../src/renderer/src/components/Layout.tsx) via [PlayButton.tsx](../src/renderer/src/components/PlayButton.tsx)) so launch works on every route.

## Routing

HashRouter SPA. Routes in [src/renderer/src/App.tsx](../src/renderer/src/App.tsx): `/` (Home), `/servers`, `/patch-notes`, `/settings`.
