# Pi-Music Desktop Release-Readiness Assessment

## Executive conclusion

**Pi-Music is not yet at the functional standard of Spotube and must not be presented as a finished streaming client or released as one.** The current native desktop app has a distinctive, polished listening interface, explicit user-selected local-file playback, a native Tauri shell, and cross-platform GitHub Actions workflows. It does **not** yet implement a working remote audio-source plugin runtime, authenticated Spotify/YouTube account flow, remote-stream resolution, downloads with final tags, durable playlists, or true time-synchronized lyrics.

> Pi-Music can currently play a supported audio file that the user explicitly chooses on their own device. It cannot currently discover, resolve, or stream a remote track from Spotify, YouTube, JioSaavn, or a community plugin.

## Benchmark against Spotube

Spotube publicly describes a mature plugin-driven music platform with community source plugins, local playback, playlist handling, tagged downloads, source-independent synced lyrics, native distribution, and no telemetry.[1] Its project repository repeats these capabilities and shows an established release history, active codebase, integrations, and platform-specific project structure.[2]

| Capability | Spotube public capability | Pi-Music current implementation | Honest status |
| --- | --- | --- | --- |
| Native desktop application | Distributed builds for Windows, macOS, and multiple Linux formats.[1] | Tauri 2 source exists; Linux packaging was verified locally; Windows/macOS builds are queued through GitHub Actions. | **In progress** |
| Local playback | Playback is controlled locally.[1] | User selects MP3, M4A, WAV, FLAC, OGG, or AAC through the native dialog; Pi-Music loads that selected path into its local player. | **Works for explicitly selected local files** |
| Remote music streaming | Plugin-driven metadata and audio sources can stream through the app.[1] [2] | No remote stream resolver, no executed plugin runtime, and no production source connector exist yet. | **Not implemented** |
| Spotify / YouTube connections | Mature source ecosystem and account-facing features.[1] | Public desktop client IDs are configured; consent callbacks and token storage have not been implemented. | **Not implemented** |
| JioSaavn playback | Community audio-source plugins are part of Spotube’s stated plugin model.[1] [2] | The requested plugin was reviewed as a reference; Pi-Music does not execute or ship it. | **Not implemented** |
| Search and browse | Mature catalog, search, album, artist, and playlist experience. | Curated UI fixtures and local-file chooser only; no live catalog search. | **Not implemented** |
| Downloads and metadata tags | Tagged track downloads are a documented product feature.[1] [2] | No working remote download pipeline or native tag-writing flow. | **Not implemented** |
| Synced lyrics | Time-synced lyrics independent of plugin support.[1] [2] | A polished lyric presentation exists, but it is illustrative and not synchronized to an audio clock. | **Not implemented** |
| Playlist persistence | Local and imported playlist handling.[1] | Visual Library and Saved views exist; durable native playlist storage is not present. | **Not implemented** |
| Privacy | No telemetry or user data collection is declared.[1] [2] | The native source has no telemetry integration; local file selection is explicit. | **Implemented in current scope** |

## What Pi-Music can truthfully do today

The current application can be truthfully described as a **native desktop music-listening shell with a polished local-file player**. It has a functioning local-file selection path, native UI navigation, a persistent player interface, an original late-1970s hi-fi visual identity, and release automation for the three desktop target families.

The visual controls should not be mistaken for completed music-service integrations. The provider-area screens are intentionally listener-facing and do not expose API mechanics, but their underlying remote account, search, stream, download, and lyric features remain to be built.

## Required work before a streaming release

| Priority | Deliverable | Release gate |
| --- | --- | --- |
| 1 | A first-party desktop source layer that keeps catalogue, playback, attribution, consent, and error handling within Pi-Music. | Required before enabling any remote listening path. |
| 2 | A compliant remote stream resolver for one authorized playback source, with a real playable test track and failure handling. | Required before claiming streaming. |
| 3 | Desktop PKCE OAuth callback, secure per-user token storage, disconnect flow, and provider-consent states. | Required before claiming Spotify or YouTube account connection. |
| 4 | Native library database for local tracks, playlists, favorites, recent playback, and source preferences. | Required before claiming a complete personal library. |
| 5 | Real duration/progress tracking, seek controls, queue behavior, media-session integration, and timed-lyric clock binding. | Required before claiming synchronized lyrics. |
| 6 | Legal review for each enabled source and download behavior, then end-to-end streaming/download tests. | Required before public streaming release. |
| 7 | Successful signed GitHub Actions artifacts for Windows, macOS, and Linux plus install testing. | Required before a desktop release announcement. |

## Release decision

**Do not create a public Pi-Music streaming release yet.** A private “interface preview” or “local-file player preview” label would be accurate after the desktop workflows pass. The product should only be called a streaming app once priority items 1–6 have been completed and tested with legitimate, authorized source integrations.

## References

[1]: [Spotube product site](https://spotube.cc/)

[2]: [Spotube repository](https://github.com/KRTirtho/spotube)
