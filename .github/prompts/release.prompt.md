---
mode: agent
description: Cut a new Nexus Launcher release — bump the version, commit, tag, and push to trigger the GitHub Actions release build.
---

# Release Nexus Launcher

Cut a new release. The GitHub Actions [release workflow](../workflows/release.yml) triggers on `v*.*.*` tag pushes and builds + publishes the Windows installers, so the tag is what ships the release.

Default to a `patch` bump unless the user specifies `minor` or `major`.

## Preflight (verify before changing anything)

1. Confirm the working tree is clean except for intended release changes: `git status`.
2. Confirm we're on `main` and up to date: `git rev-parse --abbrev-ref HEAD` and `git pull --ff-only`.
3. Run `npm run typecheck`. Do NOT proceed if it fails.
4. Read the current version: `(Get-Content package.json | ConvertFrom-Json).version`.

## Release steps

1. Commit any pending intended changes first (so the version-bump commit is clean).
2. Bump the version without tagging:
   ```pwsh
   npm version <patch|minor|major> --no-git-tag-version
   ```
3. **Verify the bump took** — re-read `package.json` version and confirm it incremented from the preflight value. Dependabot merges can roll the version back, so never assume.
4. Commit the bump:
   ```pwsh
   git add package.json package-lock.json
   git commit -m "chore: release vX.Y.Z"
   ```
5. Push `main`: `git push origin main`.
6. Tag and push the tag (this triggers the release build):
   ```pwsh
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```
   The tag MUST exactly match the new `package.json` version, prefixed with `v`.

## After pushing

- Report the new version and tag.
- Remind the user the GitHub Actions release build is now running and that the published release will appear at https://github.com/wittyphantom333/nexus-launcher/releases.

## Guardrails

- Never `git push --force` or retag an existing version. If a tag already exists and a rebuild is needed, ask the user how to proceed.
- If `npm run typecheck` or the build fails, stop and surface the error — do not tag a broken build.
- Do not edit application code as part of this prompt unless the user explicitly asks; this is a release-only workflow.
