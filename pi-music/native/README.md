# Pi-Music Native Desktop Client

This directory contains the **native-only Pi-Music desktop application**: a Tauri 2 host with a React and TypeScript listener interface. Pi-Music is being built for **Linux, Windows, and macOS**. It is not a browser/PWA product, and the previous local-file, Spotify, JioSaavn, Android, and iPhone directions are superseded.

Pi-Music’s only intended remote listening route is **YouTube**, using official Google OAuth and the YouTube Data API for discovery and authorized playlist reading, together with a **visible official YouTube IFrame Player** for playback. It does not extract audio URLs, download media, hide the provider player, scrape YouTube Music, or load community source plugins.[1] [2]

## What is currently implemented

| Area | Native implementation | Evidence status |
| --- | --- | --- |
| Protected connection room | Native Stronghold encrypted vault, unlocked with a listener-selected private room key; OAuth tokens remain in the native host. | Automated fresh-vault reopen test and a user-approved temporary live exchange/reopen/clear check passed. |
| Google connection | System-browser OAuth authorization-code flow with PKCE S256, randomized state, loopback callback validation, host-only token exchange, refresh path, and disconnect command. | Live callback/code exchange was proved in a temporary native harness. Installed-app refresh/reconnect/disconnect evidence remains open. |
| Discovery and playlists | Host-only authenticated `search.list`, `playlists.list`, and `playlistItems.list` commands with bounded, embeddable, syndicated video search. | Count-only live search and playlist smoke checks passed; Search and Playlists rooms render loading, returned, empty, selection, and safe failure states. |
| Visible player | Official IFrame Player bridge; provider controls remain visible and unobscured. Pi-Music reflects ready, cue, play, pause, end, unavailable, and autoplay-blocked states. | Lifecycle mapping is unit-tested and the native window starts. A connected installed-app playback event record remains open. |
| Connection transparency | A per-session acknowledgement explains local protected storage and no Pi-Music telemetry before sign-in; direct links open YouTube Terms and Google Privacy notices. | Built and frontend-tested. A published Pi-Music privacy policy remains open. |
| Desktop CI | Source validation plus non-release Linux, Windows, and macOS package jobs. | The current GitHub Actions runs completed successfully. Installation and core-flow smoke evidence is still required. |

## Listener-facing boundaries

Pi-Music does not claim to be a YouTube Music client or to offer offline YouTube downloads. It does not show static text as synchronized lyrics. Timed lyrics will stay unavailable until a commercial license and a real timecoded feed are in place.

> **Honesty gate:** This is not a shippable streaming release yet. The remaining blockers are actual installed-app account lifecycle/playback proof, licensed synchronized lyrics, package installation smoke tests, and cross-platform connected-account validation.

## Development commands

```bash
pnpm install
pnpm test
pnpm build
pnpm tauri dev
```

The development command opens a native desktop window. `pnpm tauri build` is reserved for validation builds; no release or tag should be created until every gate in [`../docs/functional-release-gates.md`](../docs/functional-release-gates.md) is evidenced.

## Project map

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Listener rooms, protected connection flow, host command wiring, and visible-player placement. |
| `src/VisibleYoutubePlayer.tsx` | Official IFrame Player bridge and lifecycle callbacks. |
| `src/onlineClient.ts` | Pure listener-safe online state helpers. |
| `src-tauri/src/oauth.rs` | PKCE, loopback callback, host-only token lifecycle, and encrypted vault. |
| `src-tauri/src/youtube.rs` | Typed official YouTube discovery and playlist data client. |
| `src-tauri/tauri.conf.json` | Desktop window, bundle, and narrowly scoped player/Google content policy. |
| `../docs/functional-release-gates.md` | The authoritative evidence record and open delivery gates. |

## References

[1]: [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)

[2]: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)
