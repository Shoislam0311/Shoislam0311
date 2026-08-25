# Pi-Music Built-In Source Architecture

## Product decision

Pi-Music uses a **built-in, first-party online listening room** rather than a runtime marketplace or executable third-party extensions. Pi-Music owns the visual experience, permission prompts, error handling, and playback state. No unreviewed source code will run inside the desktop application.

Pi-Music’s only planned remote listening path is **YouTube**. The application will use YouTube’s official discovery and account interfaces where authorized and a visible official embedded player for remote playback. It will not use a stream extractor, a downloader, an audio-only workaround, a hidden source switch, or any unsupported “YouTube Music” interface.

## Listening rooms

| Listening room | Information shown | Sound played | Release status |
| --- | --- | --- | --- |
| **YouTube room** | YouTube-supplied video, title, channel, and playlist context | Official visible YouTube embedded player | Production requirements recorded; consent and native proof remain |

## YouTube-only implementation boundary

Pi-Music will use the YouTube Data API only for functions authorized by a user or public discovery rules. Private lists and changes to a user’s YouTube data require OAuth authorization.[1] The Google installed-app flow uses a system browser, an exact redirect, a per-request PKCE verifier and challenge, and state protection; Pi-Music will use that path without putting secrets in the desktop binary.[2]

Remote playback must stay in the official IFrame Player surface. The player will be visible, recognizably YouTube, and large enough for its controls. Pi-Music will not cover YouTube controls, modify returned YouTube search results, or disguise YouTube actions as a local Pi-Music action.[3] [4]

JioSaavn is outside Pi-Music’s product path. Its current public API policy also restricts access to JioSaavn and licensed affiliates and prohibits the third-party interactive streaming path Pi-Music would need.[5]

## Non-negotiable release gates

| Gate | Evidence required before release |
| --- | --- |
| YouTube account | System-browser consent, PKCE and state validation, secure native token storage, disconnect, and deletion/revocation guidance. |
| YouTube discovery | Policy-compliant video and playlist search, source-preserving result presentation, clear availability and error states. |
| YouTube playback | A visible embedded-player proof in Tauri, intact YouTube controls/identity, and tested play/pause/seek/error behaviour. |
| YouTube policy surfaces | Terms and privacy consent, YouTube terms link, Google privacy link, and transparent explanation of local/token data handling. |
| User safety | No credentials in source code, no extracted streams, no download workarounds, no hidden source switching, and no Pi-Music telemetry. |

## Visual direction

Pi-Music will compete on **original craft**, not by copying another music client. The visual system will use a warm late-1970s listening-room language: walnut surfaces, amber receiver glass, tactile controls, paper liner notes, record sleeves, cassette-like labels, and clear source-status moments. The listener should feel as if they are choosing a room and putting on a record—not configuring software.

## References

[1]: [YouTube Data API reference](https://developers.google.com/youtube/v3/docs)

[2]: [Google OAuth 2.0 for installed applications](https://developers.google.com/identity/protocols/oauth2/native-app)

[3]: [YouTube IFrame Player API Reference](https://developers.google.com/youtube/iframe_api_reference)

[4]: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)

[5]: [JioSaavn API Policy](https://www.jiosaavn.com/corporate/api-policy)
