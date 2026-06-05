# Nexus Launcher

> A modern, feature-rich launcher for the [NexusForever](https://github.com/NexusForever) WildStar private server emulator.

Built with **Electron + React + TypeScript + Vite** for a polished, game-grade experience.

## Features

- **Auto-Patcher** — File integrity checking and delta patching with real-time progress
- **Multi-Server Profiles** — Save and switch between multiple NexusForever servers
- **Server Status** — Live online/offline indicator with player count
- **News & Announcements** — Pulls latest news from each server's configured feed
- **Patch Notes Viewer** — Rendered Markdown changelog pulled from GitHub Releases
- **Discord Rich Presence** — Shows your current server in Discord
- **Theming** — Custom background image/video, accent color picker
- **Settings** — Game path, language/architecture, all configurable
- **Auto-Updates** — Launcher updates itself via GitHub Releases

## Development

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
# All platforms (CI)
npm run build

# Platform-specific
npm run build:win
npm run build:mac
npm run build:linux
```

### Release

Push an annotated tag to trigger the release workflow:

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

GitHub Actions will build installers for all three platforms and publish them to the GitHub Release automatically.

## Icons

Place platform icons in the `build/` directory:

| File | Platform | Size |
|------|----------|------|
| `build/icon.ico` | Windows | 256×256 |
| `build/icon.icns` | macOS | 512×512 |
| `build/icon.png` | Linux | 512×512 |

## Configuration

Server configurations are stored in the user data directory:

- **Windows:** `%APPDATA%\nexus-launcher\`
- **macOS:** `~/Library/Application Support/nexus-launcher/`
- **Linux:** `~/.config/nexus-launcher/`

## License

AGPL-3.0 — see [LICENSE](LICENSE)
