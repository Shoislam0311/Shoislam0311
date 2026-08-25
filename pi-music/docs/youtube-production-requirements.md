# Pi-Music YouTube-Only Production Requirements

## Architecture decision

Pi-Music’s sole planned remote listening path is **YouTube**, using the official YouTube Data API for discovery and user-authorized playlist features and the official visible embedded player for playback. Pi-Music will not describe this as an unofficial YouTube Music client, extract an audio stream, hide the source identity, bypass player behaviour, or download YouTube media.

## Required production controls

| Area | Required implementation | Reason |
| --- | --- | --- |
| Google account connection | Use the system browser, an installed-app redirect, a unique PKCE verifier/challenge, state validation, and the supplied desktop client credentials. Keep the client secret in the native host configuration only. | Google documents installed-app OAuth as an authorization-code flow with PKCE; its token-exchange guide lists the client secret as a token request parameter.[1] |
| User playlists | Request only the minimum YouTube scopes required; use an OAuth access token for private user data or write actions. | YouTube Data API requests require an API key or OAuth token, and private or modifying operations require authorization.[2] |
| Playback | Render the official, visible YouTube player within a compliant room, preserve YouTube controls/identity, and do not place custom controls over player controls. | The IFrame Player API is the authorized programmable playback surface; its player must retain a usable viewport and policy-compliant presentation.[3] [4] |
| Search and browse | Present YouTube search results as returned and label all YouTube actions clearly. | YouTube policies prohibit changing or mixing returned YouTube search results and require user-initiated YouTube actions to be identifiable and distinct.[4] |
| Privacy and consent | Present Pi-Music’s privacy policy and YouTube Terms link before YouTube features become available; explain local storage and how to revoke access. | YouTube policies require a terms link, privacy policy acceptance, transparent data practice disclosure, and a clear deletion/revocation path for authorized data.[4] |
| Tokens | Store granted tokens in native secure storage only, never in source code or listener-visible settings, and delete them on disconnect. | Google’s installed-app flow is designed so users can authorize data access without giving an app their password; YouTube policy forbids collecting login credentials.[1] [4] |

## Authorized discovery and playlist requests

Pi-Music’s Rust host will make authenticated requests and return only compact, listener-safe result data to the React interface. Access tokens, refresh tokens, and client credentials remain in secure native storage or host-only configuration; they never enter the webview state, logs, or UI.

| Listener action | Official endpoint and constrained request | Pi-Music behavior |
| --- | --- | --- |
| Find a video | `GET /youtube/v3/search` with `part=snippet`, an explicit `q`, `type=video`, `videoEmbeddable=true`, `videoSyndicated=true`, and a bounded `maxResults`. | Show the returned YouTube identity, title, channel, and thumbnail as a searchable result. Do not fabricate, merge, or silently substitute a different recording. [5] |
| Open saved playlists | `GET /youtube/v3/playlists` with `part=snippet,contentDetails`, `mine=true`, and an OAuth bearer token. | Show only playlists owned by the connected account; retain YouTube availability/error states. [6] |
| Open a playlist | `GET /youtube/v3/playlistItems` with `part=snippet,contentDetails`, a specific `playlistId`, and bounded pagination. | Show the playlist’s returned video entries and use the selected video ID only for the official visible player. Watch-later and other unsupported lists remain explicitly unavailable. [7] |

> **Production boundary:** Pi-Music will not use these endpoints to scrape, download, re-host, or extract media. Search and playlists lead into the visible official YouTube player only.

## Visible player implementation record

Pi-Music now creates the official IFrame Player only after a listener selects a returned video ID. The embedded surface remains at least 270 pixels high and never has Pi-Music controls layered over the provider controls, exceeding the API’s 200 by 200 pixel minimum. The bridge cues a selected video without autoplay, maps IFrame ready/state/error/autoplay-blocked events into the native listening state, and exposes only play and pause commands through the app’s external receiver control. The page policy permits only the YouTube frame, script, image, and media origins required for this surface. [3] [8]

> **Current evidence boundary:** The player bridge compiles, its lifecycle-code mapping is unit-tested, and the Tauri native process starts. A real installed-app session must still select a returned record and demonstrate ready, cue, play, pause, end, unavailable, and autoplay-blocked behavior before Pi-Music treats visible playback as release-ready.

## What Pi-Music may claim after implementation and testing

Pi-Music may call itself a **YouTube-enabled desktop listening client** only after the desktop OAuth flow, YouTube search/playlist retrieval, visible official player, consent/privacy screens, disconnect path, and cross-platform installation checks work end to end. It may not claim offline YouTube downloads, background audio workarounds, YouTube Music platform parity, or JioSaavn playback.

## References

[1]: [Google OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)

[2]: [YouTube Data API reference](https://developers.google.com/youtube/v3/docs)

[3]: [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)

[4]: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)

[5]: [YouTube Data API: search.list](https://developers.google.com/youtube/v3/docs/search/list)

[6]: [YouTube Data API: playlists.list](https://developers.google.com/youtube/v3/docs/playlists/list)

[7]: [YouTube Data API: playlistItems.list](https://developers.google.com/youtube/v3/docs/playlistItems/list)

[8]: [YouTube embedded players and player parameters](https://developers.google.com/youtube/player_parameters)
