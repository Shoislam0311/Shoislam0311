# Pi-Music Native Workspace

This directory is the **native-only Pi-Music application**. It is a Tauri 2 and React TypeScript workspace rather than a browser product. Its user interface is shared across desktop and mobile targets, while the Tauri host provides local device capabilities.

| Area | Location | Current state |
| --- | --- | --- |
| Native interface | `src/App.tsx`, `src/App.css` | Listening Islands, Record of the Day, Track Tiles, Orbit Player, Lyric Ribbon, Library, Source Room, Saved, and Settings. |
| Local file playback | `src/App.tsx` | A user-triggered native dialog accepts supported audio files and loads the selected path only for the active listening session. |
| Native runtime | `src-tauri/src/lib.rs` | Local-first runtime descriptor and dialog plugin registration. |
| Desktop packaging | `src-tauri/tauri.conf.json` | Tauri application configuration for Windows, macOS, and Linux. |
| Android | `src-tauri/gen/android/` | Generated Tauri Android project structure and Rust targets. |
| iPhone | Tauri mobile target | The shared code is ready; Apple signing and iOS compilation must be performed on macOS with Xcode. |

## Local commands

```bash
pnpm install
pnpm build
pnpm tauri dev
pnpm tauri build --bundles deb
```

For Android development, install the Android SDK, NDK, and JDK, then initialize and build through Tauri:

```bash
pnpm tauri android init
pnpm tauri android build --debug
```

The environment used for this workspace created the Android project successfully. The full Gradle APK build is still dependent on available sandbox memory; this is not a product-code limitation. iOS packaging cannot be created on Linux because Apple’s Xcode toolchain is macOS-only.

## Privacy and source model

The native app does not discover files in the background or auto-connect accounts. A listener selects a local file deliberately, and the Patch Bay shows the distinct roles of MusicBrainz metadata, the reviewed JioSaavn playback adapter, timed lyrics, and optional Spotify/YouTube accounts. Live account consent requires the application-specific client IDs described in [`../docs/oauth-credential-setup.md`](../docs/oauth-credential-setup.md).
