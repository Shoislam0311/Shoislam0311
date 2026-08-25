# Pi-Music Online Production Blueprint

## Product definition

Pi-Music is an **original native desktop online music-streaming client** for Linux, Windows, and macOS. Its remote listening path is limited to the official visible YouTube embedded player. It does not host music, proxy media, scrape YouTube Music, extract streams, run source plugins, import local audio, or present a generic multi-provider catalogue.

The application’s personality is a hand-polished late-1970s listening room: walnut cabinet surfaces, paper sleeve cards, amber receiver displays, quiet lyric sheets, and tactile control language. That visual identity must remain Pi-Music’s own; it is not a re-skin of any reviewed client.

## Real application rooms

| Room | User outcome | Required real state |
| --- | --- | --- |
| **Listen** | See the current session and an honest next step. | Disconnected, connecting, ready, player loading, autoplay blocked, unavailable, and error. |
| **Search** | Search YouTube after the account/feature prerequisites are met. | Empty query, typing, loading, results, no results, connection required, and request error. |
| **Results** | Inspect a video or playlist before cueing it. | Result metadata, source acknowledgement, playable/not playable, and queue action outcome. |
| **Now Playing** | Control the visible official player. | Cued, playing, paused, buffering, ended, unavailable, and player API error. |
| **Words** | Read synchronized lyrics only when legitimately available. | Licensed timing ready, unsynced text (if licensed), no licensed words, match uncertain, and provider failure. |
| **Playlists** | Browse and manage authorized YouTube playlists. | Sign-in required, loading, list/detail, empty, permission denied, and save/update error. |
| **Settings & Privacy** | Control connection, appearance, keyboard behavior, and data. | Connected account summary, disconnect confirmation, accessibility/media-key status, privacy statement, and dependency notices. |

Every room must be implemented as a real native screen before it is shown as a product screenshot. A screen may use clearly labeled preview data during UI construction, but it cannot label that data as YouTube results, playlists, playback, or synchronized lyrics until the corresponding official integration is live.

## Core application model

Pi-Music should separate presenter state from provider state. This prevents the UI from falsely treating a card selection as playback, and it makes error recovery testable.

| Domain record | Essential fields | Lifecycle purpose |
| --- | --- | --- |
| `AccountConnection` | `status`, `accountLabel`, `scopes`, `connectedAt`, `lastError` | Explicit connect, reconnect, disconnect, and consent feedback. |
| `OnlineItem` | `youtubeId`, `kind`, `title`, `channel`, `thumbnail`, `duration`, `availability` | Search result, queue entry, and playlist item identity. |
| `PlaybackSession` | `itemId`, `state`, `positionSeconds`, `durationSeconds`, `volume`, `lastPlayerError` | UI control state driven by player events, never guessed from a selected card. |
| `OnlinePlaylist` | `id`, `title`, `owner`, `itemCount`, `canEdit`, `items` | Browse and manipulate authorized YouTube playlist data. |
| `LyricsAsset` | `recordingKey`, `source`, `licenseState`, `language`, `timedLines`, `availability` | Ensures liner-note display is tied to a licensed source and an actual recording match. |
| `PrivacyPreference` | `telemetryEnabled`, `mediaKeysEnabled`, `motionReduced`, `theme` | Keeps privacy defaults and accessibility choices local and visible. |

## Desktop architecture

The existing Tauri/Rust/React foundation remains appropriate because it can produce native packages without adopting Electron’s larger runtime. The native shell should expose only small, audited capabilities: secure credential storage, app-window/media-control integration, and intentional external-link opening. Network access and account logic should be isolated behind explicit first-party modules, with no generic “source” or “plugin” runtime.

```text
React rooms and playback state
        │
        ├── Official YouTube IFrame Player component
        │       └── documented player events → PlaybackSession
        │
        ├── First-party YouTube account and discovery module
        │       └── PKCE, state validation, secure local tokens
        │
        ├── Licensed lyrics module
        │       └── recording match + timing feed → LyricsAsset
        │
        └── Small native Tauri capabilities
                └── secure store, media keys, window and link controls
```

The official IFrame API supports the basic player controls and state/error events Pi-Music needs, but it does not grant a music-catalogue, background-download, YouTube Music, or blanket lyric right.[1] The YouTube player therefore remains visible in the Now Playing room, and the lyrical layer remains independently licensed.[2] [3]

## Delivery order

| Milestone | Deliverable | Acceptance evidence |
| --- | --- | --- |
| **A. Online UI reset** | Remove local-file words, controls, storage, and screen paths. Implement all named online screen states using preview-only data. | Native app build, real app screenshots, and UI-state unit tests. |
| **B. Account foundation** | Desktop OAuth with PKCE, loopback callback, state verification, secure storage, reconnect, and disconnect. | Account state tests; manual consent and disconnect check without revealing tokens. |
| **C. Discovery and playlists** | Official YouTube search and authorized playlist read/write flows with rate/error handling. | Contract tests, account-gated screen tests, and a real authorized smoke check. |
| **D. Visible player** | IFrame player container and event-driven player lifecycle, including autoplay blocked and unavailable states. | End-to-end player event checks and a manual visual verification of visible controls. |
| **E. Licensed words** | A contracted provider, matching policy, timed-line model, attribution, no-words state, and player-clock sync. | Provider agreement record, timing tests, and a real playback/lyrics check. |
| **F. Desktop refinement** | Keyboard/media controls, focus behavior, responsive desktop layouts, empty/error copy, privacy surfaces, dependency notices. | Keyboard/accessibility tests and screenshots from each real room. |
| **G. Release evidence** | Linux, Windows, and macOS artifacts plus installation smoke checks and a public limitations statement. | CI artifacts, install records, test report, SBOM/license notices, and a release-readiness review. |

## Open-source dependency policy

Pi-Music will use maintained open-source frameworks and libraries as **building blocks**, not as unreviewed product code. The current foundation is Tauri, Rust, React, TypeScript, Vite, Vitest, and official Tauri plugins. Each release candidate must generate a dependency inventory and retain all required notices. A dependency is rejected if it introduces a downloader, direct-stream extractor, undocumented YouTube client, third-party source runtime, or a license obligation incompatible with Pi-Music’s chosen distribution policy.

## Honest production gates

Pi-Music cannot be called an online streaming client until the account connection, official visible playback, failure states, and authorized search/playlist flow work together in the installed desktop application. It cannot advertise synchronized lyrics until a licensed provider delivers real timing data that tracks the running player. It cannot be released as production-ready until packages exist and are tested on Linux, Windows, and macOS.

## References

[1]: [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)

[2]: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)

[3]: [Pi-Music Synchronized Lyrics Policy](./synchronized-lyrics-policy.md)
