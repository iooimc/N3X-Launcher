# N3X Launcher

N3X Launcher is an independent third-party **Minecraft: Java Edition launcher for Windows**.

> **Status:** Early alpha / development build. N3X is not ready for general public use yet.

## What N3X does

N3X is being built as a clean Windows launcher for players who already own Minecraft: Java Edition.

Current development goals include:

- Microsoft account sign-in
- Xbox Live and XSTS authentication
- Minecraft Services authentication
- Minecraft Java profile and ownership checks
- Vanilla Minecraft version management
- Automatic Java runtime setup
- Per-instance RAM configuration
- Separate game instances and worlds
- Clear local logs and startup diagnostics

## Microsoft authentication

N3X uses Microsoft's official OAuth 2.0 **public client / device code flow**.

The launcher does **not** ask for or store a user's Microsoft password. Authentication is completed directly through Microsoft. After Microsoft authentication, N3X uses the normal Xbox Live, XSTS and Minecraft Services authentication chain required for Minecraft: Java Edition.

N3X only intends to launch Minecraft for users who already have a valid Minecraft: Java Edition entitlement.

## Current AppID approval status

The N3X Microsoft application registration is currently being submitted for Minecraft AppID approval.

The current authentication implementation successfully reaches Microsoft OAuth, Xbox Live and XSTS. Access to Minecraft Services is pending approval of the N3X application registration.

## Privacy and security

- No Microsoft passwords are collected by N3X.
- No client secret is embedded in the launcher.
- Authentication is performed through Microsoft.
- Account tokens are not exposed to the launcher UI.
- N3X is designed to store persistent authentication data using Windows-provided secure storage where available.

## Platform

- Windows x64
- Minecraft: Java Edition

## Development status

N3X is currently an **alpha project**. Features, UI and internal implementation may change before a public release.

The repository is being prepared as the public project page for N3X while development continues.

## Disclaimer

N3X Launcher is an independent third-party project. It is **not an official Minecraft product**, is not affiliated with Mojang Studios or Microsoft, and is not endorsed by them.

Minecraft is a trademark of Microsoft Corporation.
