# N3X Launcher

N3X Launcher is an independent third-party **Minecraft: Java Edition launcher for Windows**.

> **Status:** Alpha / active development.

🌐 **Project website / N3X Network:** https://iooimc.github.io/N3X-Launcher/

⬇️ **Downloads / releases:** https://github.com/iooimc/N3X-Launcher/releases

## What N3X does

N3X is being built as a clean Windows launcher for players who already own Minecraft: Java Edition.

Current development includes:

- Microsoft account sign-in
- Xbox Live / XSTS / Minecraft Services authentication
- Minecraft Java profile and ownership checks
- Vanilla, Fabric and Forge instances
- automatic Java runtime setup
- per-instance RAM configuration
- separate instances and worlds
- Style Lab for skins and capes
- owned Minecraft cape display / switching
- N3X custom capes
- launcher diagnostics and logs

## N3X Network

`network/` is the public static data layer used by the N3X website and intended for the launcher / cape mod.

Current endpoints:

- `network/config.json`
- `network/capes/catalog.json`
- `network/users/index.json`
- `network/users/<minecraft-uuid>.json` for published profiles

The first version is **read-only** and works through GitHub Pages / raw GitHub content. This lets clients read public cape/profile data without a private server.

A GitHub write token is intentionally **not** embedded in the launcher or mod. Automatic publishing will later go through an authenticated serverless bridge that verifies the Minecraft identity before writing public profile data.

See [`network/README.md`](network/README.md) for the schema and security model.

## Microsoft authentication

N3X uses Microsoft's OAuth 2.0 public-client flow.

The launcher does **not** ask for or store a user's Microsoft password. Authentication is completed directly through Microsoft. N3X then uses the Xbox Live, XSTS and Minecraft Services chain required for Minecraft: Java Edition.

N3X only intends to launch Minecraft for users who already have a valid Minecraft: Java Edition entitlement.

## Privacy and security

- No Microsoft passwords are collected by N3X.
- No client secret is embedded in the launcher.
- No GitHub write token is embedded in the launcher or mod.
- Authentication is performed through Microsoft.
- Account tokens are not exposed to the launcher UI.
- Persistent authentication data should use Windows-provided secure storage where available.

## Platform

- Windows x64
- Minecraft: Java Edition

## Development status

N3X is an **alpha project**. Features, UI and internal implementation may change before a public release.

## Disclaimer

N3X Launcher is an independent third-party project. It is **not an official Minecraft product**, is not affiliated with Mojang Studios or Microsoft, and is not endorsed by them.

Minecraft is a trademark of Microsoft Corporation.
