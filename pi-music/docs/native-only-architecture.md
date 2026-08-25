# Pi-Music Native Desktop Architecture

## Product decision

Pi-Music is a **native desktop-only** application for **Linux, Windows, and macOS**. It does not ship a browser/PWA product, Android client, iPhone client, local-audio library, multi-provider source runtime, downloader, or background media resolver. Tauri 2 provides the desktop host, React and TypeScript render the listener interface, and Rust owns capability-sensitive work. [1]

## Current YouTube-only path

| Layer | Current role | Boundary |
| --- | --- | --- |
| Desktop shell | Tauri 2 app window and native command host. | No public web delivery and no mobile target. |
| Listener UI | Original late-1970s hi-fi rooms for Connect, Search, Now Playing, Playlists, Saved, Settings, and Words. | The webview never receives OAuth or refresh tokens. |
| Protected connection room | Native Stronghold encrypted vault, unlocked with a listener-selected private room key. | The private key is not retained in UI state or source; disconnect clears connection material. |
| Account authorization | System-browser Google OAuth authorization-code flow with PKCE, loopback callback, randomized state, and host-only token exchange. | The app never requests a Google password. [2] |
| Discovery and collections | Rust calls official YouTube Data API `search.list`, `playlists.list`, and `playlistItems.list`, returning compact listener-safe records. | Video search is restricted to embeddable and syndicated results. [3] |
| Playback | Official visible YouTube IFrame Player, created only after a selected returned video ID. | Provider player controls and identity remain visible; Pi-Music never extracts a media URL. [4] |
| Lyrics | No lyric feed is enabled. | Timed lyrics require a separately licensed provider and real timecodes. |

## Privacy boundary

Pi-Music has no product telemetry, advertising identifier, background collection queue, cloud listening profile, scraper, downloader, or plugin runtime. The connection room requires a per-session acknowledgement of this local-storage model and links to YouTube Terms and Google Privacy before system-browser sign-in. The listener can disconnect through Settings.

> **Evidence boundary:** Automated vault persistence, user-approved temporary OAuth exchange, count-only YouTube data checks, frontend tests, and non-release desktop CI artifacts are verified. Installed-app connection retention, forced refresh, disconnect/reconnect, visible playback events, package installation, and cross-platform connected-account checks remain open.

## Delivery constraints

Desktop artifacts are built in non-release GitHub Actions jobs for Linux, Windows, and macOS. No tag or public release is authorized until the functional gates in [`functional-release-gates.md`](./functional-release-gates.md) are completed and each package has an installation/core-flow smoke record.

## References

[1]: [Tauri 2 documentation](https://v2.tauri.app/)

[2]: [Google OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)

[3]: [YouTube Data API reference](https://developers.google.com/youtube/v3/docs)

[4]: [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)
