# Pi-Music Native-Only Architecture

## Product decision

Pi-Music will ship as a **native application only**. Its supported release targets are **Windows, macOS, Linux, Android, and iPhone**. It will not have a public browser, PWA, or hosted web-app release.

The recommended native shell is **Tauri 2**. Tauri supports Windows, macOS, Linux, Android, and iOS from a single product codebase while allowing TypeScript for the interface and Rust for capability-sensitive application logic.[1] The existing Pi-Music interface remains a visual and interaction reference, but the current browser/PWA workspace is not a product delivery target.

## Release architecture

| Layer | Native implementation | Why it belongs there |
| --- | --- | --- |
| Application shell | Tauri 2 for desktop and mobile | Produces installable operating-system applications without publishing a browser build.[1] |
| Listening UI | Shared TypeScript interface rendered inside the native application shell | Preserves Pi-Music’s shared listening flow and visual language on wide desktop and narrow phone screens. |
| Local library, playlists, and preferences | Native application data directory with a local SQLite store | Keeps user state on the device and avoids a cloud profile by default. |
| Audio playback | Native Rust/mobile audio bridge with platform media-session integration | Allows local playback, background controls, and reliable device-level behavior. |
| Downloads and tags | Native file-save action plus a local tag-writing service | Gives the user explicit file destinations and metadata writes without a browser download layer. |
| OAuth tokens | Platform secure credential storage | Keeps user tokens out of the UI bundle and normal local-app preferences. |
| Plugin runtime | Signed, manifest-first native adapters with explicit capability permissions | Prevents automatic execution of arbitrary remote plugin code. |

## Source model

Pi-Music separates the identity of a recording from the service that can play it.

| Responsibility | Default or supported source | Native behavior |
| --- | --- | --- |
| Metadata authority | MusicBrainz plus Cover Art Archive | Resolves canonical recording, release, artist, and ISRC-related metadata through a rate-limited native metadata client.[2] |
| Playback resolver | Reviewed JioSaavn adapter | Remains disabled until the user explicitly enables the adapter and accepts its displayed permissions. |
| Optional enrichment | Spotify | Uses a user-authorized OAuth connection for compatible library and playlist information, never as Pi-Music’s metadata system of record.[3] |
| Optional account source | YouTube | Uses user-authorized Google OAuth and provider-compliant embedded/native playback behavior where supported.[4] |
| Lyrics | Active source-supplied timecodes | Shows synchronized lyrics only when the active source provides timestamps. |

## Native privacy boundary

Pi-Music will have no analytics SDK, advertising identifier, background telemetry queue, or cloud listening-history service. Metadata and playback requests occur only after a user searches, opens, plays, downloads, or enables a source. A source manifest must expose its network, library, download, and account capabilities before it can be activated.

OAuth connection state belongs in secure storage and must be easy to disconnect. The application will not store provider passwords; login takes place on the provider’s own consent surface. Spotify and YouTube client IDs can be configured for the application, but user access and refresh tokens must never be embedded in a frontend bundle or repository.[3] [4]

## Delivery constraints

Native builds require platform toolchains. In particular, iPhone builds and distribution require Xcode on macOS, while each desktop operating system needs its respective native build environment.[5] The Pi-Music source should be developed in a bound native-project folder so desktop artifacts can be created and tested there.

The immediate implementation sequence is to create a Tauri workspace, migrate the Pi-Music design system into the shared native interface, implement the local SQLite and secure-storage services, then add source adapters behind capability prompts. The browser/PWA assets in the current repository are retained only as migration reference until the dedicated native project is initialized.

## References

[1]: [Tauri 2: Cross-platform applications](https://v2.tauri.app/)

[2]: [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API)

[3]: [Spotify: Authorization Code with PKCE Flow](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)

[4]: [Google: Obtaining authorization credentials for YouTube Data API](https://developers.google.com/youtube/registering_an_application)

[5]: [Tauri: Prerequisites](https://v2.tauri.app/start/prerequisites/)
