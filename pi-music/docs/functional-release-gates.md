# Pi-Music Functional Release Gates

## Purpose

Pi-Music is not a release candidate until each requirement below has working evidence in the installed native app. A visual screen, mocked result, or state label cannot satisfy a functional gate.

## External prerequisites

| Dependency | Required production state | Why it matters |
| --- | --- | --- |
| **Google Cloud project** | The **YouTube Data API v3** is enabled in the project that owns Pi-Music’s desktop OAuth client. | Search and authorized playlist actions require an enabled Google API. [1] |
| **Google OAuth consent screen** | The consent screen is configured for the intended users; while testing, every permitted test account is added. Before public release, any required Google verification is completed. | Desktop apps must obtain user consent through Google’s authorization flow, and public apps using user-data scopes may need verification. [2] |
| **Desktop OAuth client** | The existing Pi-Music desktop client ID remains registered as a desktop application. The client secret is supplied only to the native host at runtime and is never embedded in the UI, repository, logs, or release artifacts. | Google’s desktop OAuth token-exchange guidance lists both the client ID and client secret; the system-browser loopback flow protects the user’s password and consent interaction. [2] |
| **Authorized lyric supplier** | A signed agreement or approved production account provides the right to display lyrics and timecodes in Pi-Music’s territories and use case. | A static lyric screen or scraped text is not a synchronized-lyrics product. [3] |
| **Platform signing and release accounts** | Linux, Windows, and macOS package/signing requirements are documented and available before public distribution. | A package build alone is not equivalent to an installable, trusted release. |

## Functional gates

| Gate | Evidence that must exist before release | Current status |
| --- | --- | --- |
| **Account connection** | System-browser consent, PKCE verifier/state validation, loopback callback, token exchange, restart-safe encrypted credential storage, refresh, reconnect, disconnect, and token redaction tests. | **Partially verified.** A temporary native harness completed user-approved consent, callback, exchange, encrypted-vault commit, fresh-vault reopen, safe status check, and clear. The installed app’s private-room-key flow, a forced live refresh, and Windows/macOS retention checks remain release evidence. |
| **Online discovery** | A connected account obtains real official search results and playlist data; loading, empty, permission, quota, and request-error states are tested. | **Partially implemented and host-verified.** A user-approved temporary connection completed one count-only official search (20 returned entries) and one authorized playlist listing (0 returned entries), with no titles, playlist names, or credentials retained. The native Search and Playlists rooms now invoke the host-only commands and render loading, returned, empty, and listener-safe error states; the installed-app account-flow and recovery-state evidence remains incomplete. |
| **Visible playback** | A real official YouTube player is present in the native app and its ready/cue/play/pause/end/error/autoplay-blocked events update Pi-Music’s player state. | **Implemented but not live-verified.** The native screen creates an official visible IFrame player only for a selected returned video, preserves the provider controls, maps lifecycle events, and starts in the native Tauri process. A real installed-app event record remains required. |
| **Online playlists** | A connected account can read authorized playlists and complete only the officially permitted edits; permissions and failures are visible. | Not implemented. |
| **Synchronized lyrics** | A licensed recording match produces real timed lines that follow real player time; licensing attribution and no-words state are verified. | Not implemented. |
| **Privacy and recovery** | No telemetry is sent by Pi-Music; users can disconnect, clear stored account data, understand failures, and open provider/privacy notices. | **Partially implemented.** The connection room requires a per-session acknowledgement of local protected storage/no Pi-Music telemetry and links to YouTube Terms and Google Privacy before it opens provider sign-in. Disconnect clears the stored connection. A published Pi-Music privacy policy, installed-app recovery test, and cross-platform verification remain incomplete. |
| **Cross-platform release** | Linux, Windows, and macOS artifacts are built; each has an installation and core-flow smoke record. | CI configuration exists; functional packages not verified. |

## OAuth implementation contract

Pi-Music uses the OAuth authorization-code flow for installed applications. A new PKCE verifier, challenge, and CSRF state value are generated for each request. The native application opens the system browser, accepts the response through the configured loopback redirect, verifies state, exchanges the authorization code, and stores only necessary token material in a native encrypted vault. The vault key is derived inside the native host from the listener’s private room key and is never placed in the webview or repository. The supplied desktop client ID is public configuration; the client secret is host-only runtime configuration. Neither belongs in user-facing logs.

> **Current storage finding:** The sandbox Linux Secret Service entry did not survive a fresh process, so Pi-Music no longer relies on it. The replacement native Stronghold vault derives a stable Stronghold key from the private room key, encrypts the stored connection, and passed both an automated fresh-vault reopen test and a user-approved live exchange/reopen/clear check. This is not yet cross-platform release proof: a production claim still requires installed-app retention tests on supported Linux, Windows, and macOS.

Pi-Music will request the narrowest YouTube scopes that implement the confirmed feature. Search and reading user-authorized content can start with a read-only scope; creating or editing playlists requires a separately justified write-capable scope and consent explanation. Installed apps do not support incremental authorization, so the requested scope set must be chosen deliberately before the first public release.[2]

## Stop conditions

Pi-Music must stop short of a streaming claim if the API is not enabled, the consent flow cannot authorize a real account, the embedded player cannot produce documented events, a lyric license is unavailable, or platform package testing fails. None of these conditions may be bypassed with copied extractor code, unofficial stream endpoints, downloaded audio, guessed lyric text, or a mock state.

## References

[1]: [YouTube Data API documentation](https://developers.google.com/youtube/v3)

[2]: [Google OAuth 2.0 for desktop applications](https://developers.google.com/identity/protocols/oauth2/native-app)

[3]: [Pi-Music synchronized lyrics policy](./synchronized-lyrics-policy.md)
