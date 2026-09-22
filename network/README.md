# N3X Network

N3X Network v1 is the shared public data layer for the N3X Launcher, the N3X cape mods and the GitHub Pages web interface.

## Protocol

Protocol id: `n3x-capes-v1`

Public protocol description:

- `network/v1/manifest.json`
- `network/config.json`
- `network/client.cjs`

The launcher and cape mods read public data without credentials. No GitHub write token is embedded in a launcher or Minecraft mod.

## Cape flow

1. A Minecraft player is identified by the account UUID, not by the current username.
2. The N3X web/admin workflow registers the public player profile.
3. A cape from the N3X catalog is assigned to that UUID.
4. The assigned texture is published as `network/v1/capes/<uuid>.png`.
5. N3X cape mods request that same URL for players they render.
6. Because all N3X clients use the same UUID endpoint, users with the compatible N3X cape mod can see one another's assigned Network capes.

The launcher defaults to this service base:

`https://iooimc.github.io/N3X-Launcher/network`

The existing Fabric and Forge cape clients use the compatible path:

`<service>/v1/capes/<uuid>.png`

## Public endpoints

- `network/v1/manifest.json`
- `network/config.json`
- `network/capes/catalog.json`
- `network/users/index.json`
- `network/users/<minecraft-uuid>.json`
- `network/v1/capes/<minecraft-uuid>.png`

## Web interface

- `/` — public Network overview, cape gallery and profiles
- `/register.html` — player registration and Network status
- `/admin.html` — owner/admin workflow for registrations, cape uploads and assignments

Registration currently starts as a GitHub Issue because GitHub Pages itself has no trusted write backend. The admin workflow can then publish the profile and assigned cape into the repository.

## Player profile format

Profiles are keyed by dashed, lowercase Minecraft UUID. Usernames are display metadata only and may change without breaking cape lookup.

Example:

```json
{
  "schemaVersion": 1,
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "PlayerName",
  "assignedCape": "n3x-core",
  "capeUrl": "https://iooimc.github.io/N3X-Launcher/network/v1/capes/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.png",
  "updatedAt": "2026-09-22T18:00:00Z"
}
```

## Security model

Reading Network data is public. Writing remains separated from launcher clients:

- launcher/mod: public read only
- GitHub Pages: public UI only
- admin page: repository owner supplies a GitHub token at runtime; the token is not committed
- future self-service bridge: may validate Minecraft identity server-side before writing public profile data

This means a public launcher build never needs a GitHub PAT and cannot expose repository write access.

## Current limitation

Automatic self-service cape publishing directly from every launcher is not enabled because a static GitHub Pages site cannot securely hold a repository write credential. Until an authenticated backend bridge is added, public cape assignment is admin-managed through the web interface. Reading and rendering assigned capes is already compatible with the v1 Network layout.
