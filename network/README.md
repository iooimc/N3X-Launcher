# N3X Network

N3X Network v1 is a public, static read layer hosted directly in this repository and exposed through GitHub Pages / raw GitHub content.

## Why this exists

The N3X Launcher and the N3X cape mod need one shared public source for:

- the public N3X cape catalog
- public player style profiles
- network configuration
- later: mirrored cape textures and launcher metadata

No GitHub write token is embedded in the launcher or mod.

## Public endpoints

- `network/config.json`
- `network/capes/catalog.json`
- `network/users/index.json`
- `network/users/<minecraft-uuid>.json` (when a profile is published)

The same files are readable from GitHub Pages and `raw.githubusercontent.com`.

## Player profile format

Public profiles are keyed by Minecraft UUID, not by username, so name changes do not break cape lookup.

Example:

```json
{
  "schemaVersion": 1,
  "uuid": "minecraft-uuid-without-dashes",
  "name": "PlayerName",
  "cape": "purple-heart",
  "updatedAt": "2026-09-18T10:03:00Z"
}
```

## Cape format

`network/capes/catalog.json` describes known N3X capes. `textureUrl` will point to the public texture once a texture has been mirrored into the network.

## Security model

Clients may read public files without credentials. They must never contain a GitHub write token. Publishing / changing a player's public cape will later use a small authenticated serverless bridge which validates the player's Minecraft identity before changing GitHub-backed network data.

## Current limitation

This first version is intentionally read-only. The website, launcher and mod can use it as a common source, but automatic public profile writes are not enabled until the authenticated bridge exists.
