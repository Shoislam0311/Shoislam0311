# Pi-Music Google Desktop OAuth Configuration

Pi-Music is a **desktop-only YouTube-enabled client** for Linux, Windows, and macOS. Spotify, Android, iPhone, JioSaavn, local-file playback, and provider plugins are not part of the current product path.

The listener signs in only on Google’s own system-browser consent page. Pi-Music does not ask for a Google password, show an access or refresh token, or place token material in the webview.[1]

## Required application configuration

| Configuration | Where it belongs | Current status |
| --- | --- | --- |
| Desktop OAuth client ID | Desktop build configuration used to begin the consent flow. | Configured. This identifier is public application configuration, not a listener credential. |
| Desktop OAuth client secret | Secure host runtime configuration, never in `VITE_` variables, UI state, source, repository, or logs. | Securely provisioned for the current native host. |
| YouTube Data API v3 | Google Cloud project used by the desktop OAuth client. | Confirmed by the live authorized count-only data check. |
| Scope | `https://www.googleapis.com/auth/youtube.readonly` | The minimum current scope for search and private playlist reading. |

The installed-app authorization code flow uses a newly generated PKCE verifier/challenge and CSRF state for every request, a loopback callback on `127.0.0.1`, and a host-only exchange at Google’s token endpoint. [1]

> **No additional secret is required now.** A future licensed timed-lyrics supplier may require a separate commercial agreement and credentials, but Pi-Music will not request those until a provider has been selected through legitimate terms.

## What must never be entered into Pi-Music

| Do not provide | Reason |
| --- | --- |
| Google password | Google’s own consent screen handles authentication. |
| Access token or refresh token | These are per-listener authorization credentials held only in Pi-Music’s native encrypted vault. |
| Client secret in a UI field, `VITE_` variable, or repository | The configured secret is native-host runtime material; exposing it would defeat the credential boundary. |
| Android/iPhone OAuth values or signing credentials | Those platforms are outside the current desktop-only scope. |
| Spotify or JioSaavn credentials | Those services are not enabled in Pi-Music’s current product path. |

## Evidence and remaining verification

The configured desktop client completed live system-browser consent and code exchange in temporary native validation, then completed count-only official YouTube discovery and playlist checks. The remaining work is to prove the same flow in the installed Pi-Music window with a listener-selected private room key, including restart, refresh, reconnect, and disconnect behavior. See [`functional-release-gates.md`](./functional-release-gates.md) for the authoritative status.

## Reference

[1]: [Google OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)
