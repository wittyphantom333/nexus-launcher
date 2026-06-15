# Server Setup Examples

Sample files for the URL fields when adding a server to Nexus Launcher.
All files are served via GitHub raw URLs — point your server's URL fields here
to test, then replace with your own hosted versions.

## Raw URLs (use these in the launcher)

| Field | URL |
|---|---|
| **News JSON URL** | `https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/server-examples/news.json` |
| **Status API URL** | `https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/server-examples/status.json` |
| **Patch Manifest URL** | `https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/server-examples/manifest.json` |
| **Website URL** | Any normal URL (e.g. `https://github.com/wittyphantom333/nexus-launcher`) |

## File reference

- **news.json** — array of news items shown in the NEWS card (per-server, not yet
  wired to UI as of v1.0.22 — uses repo-root `news.json` globally for now).
- **status.json** — JSON response the launcher expects from a status endpoint;
  drives the green/red dot, player count, latency, version on the Servers page.
- **manifest.json** — patch manifest the launcher fetches before PLAY;
  describes files to verify/download with SHA-256 hashes.

## Hosting your own

You can host these files anywhere that returns the correct `Content-Type: application/json`:
- GitHub raw (this repo, your own repo, or a Gist)
- Your own web server / CDN
- An S3 bucket with CORS
- A small Express/Flask endpoint that generates them dynamically (best for
  status.json so player counts are live)

Just update the URL in **Add Server** → save → the launcher fetches from your
new location on next refresh.
