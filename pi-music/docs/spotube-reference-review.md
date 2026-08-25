# Spotube Reference Review for Pi-Music

> **Historical research record — superseded in product scope.** This review remains the evidence for not copying or porting Spotube and for excluding extractors, stream resolution, downloaders, and plugin runtimes. Its earlier local-library and multi-provider implementation suggestions are not current Pi-Music requirements. See [`native-only-architecture.md`](./native-only-architecture.md).

## Review scope

This review inspected a shallow, read-only clone of Spotube at commit `69a310c`. No Spotube code, scripts, builds, provider modules, extractors, or downloaded executables were run. The purpose is to understand product structure and release maturity—not to transplant its implementation into Pi-Music.

## License finding

Spotube declares a **BSD-4-Clause** license.[1] It permits redistribution and modification, but a derived distribution would need to retain its copyright and disclaimer; reproduce those notices in binary-distribution materials; include the required acknowledgement in advertising materials; and avoid using the Spotube project or contributor names as endorsement.[1]

| Question | Finding | Pi-Music decision |
| --- | --- | --- |
| Can Pi-Music clone Spotube for study? | Yes. The repository is public and its BSD-4-Clause license permits source and binary redistribution subject to listed conditions.[1] | **Completed as read-only review.** |
| Should Pi-Music become a modified Spotube fork? | Technically possible under the license, but it would inherit license notices and is a poor fit for the existing Tauri/React/Rust product, visual direction, and first-party source decision. | **No.** Pi-Music remains an original Tauri desktop application. |
| May Pi-Music reuse Spotube provider/extractor logic? | The source license alone does not create provider, music, stream, or DRM rights. JioSaavn’s current policy expressly disallows the planned third-party streaming use, and Spotify/YouTube each retain their own platform rules.[2] [3] [4] | **No.** No copied or ported resolver, scraper, direct-stream, downloader, or plugin runtime. |

## How Spotube is structured

Spotube’s public overview describes a Flutter-based, plugin-powered application that separates music information, playlists, and audio sources; it also lists local control, downloads, lyrics, native packaging, and privacy as product features.[5] Its repository structure reflects a mature multi-platform product, with dedicated application modules, services, relational schema, platform folders, integration tests, and desktop packaging configuration.

| Subsystem observed | Spotube approach | Safe Pi-Music lesson | Pi-Music implementation direction |
| --- | --- | --- | --- |
| Local data | Database schema plus source-match caching. | A durable local library needs normalized tracks, playlists, preferences, and cached matches. | Local-only persistent library with explicit file imports and no background scanning. |
| Player | A playback service with queues, progress, platform-specific audio services, and player controls. | Playback should be modeled as a real lifecycle, not as visual state. | Tauri player state, audio lifecycle/error feedback, queue, seek, and native media controls. |
| Catalogue details | A metadata-service layer. | Keep catalogue data separate from playback state. | Spotify-authorized information within the Spotify room; MusicBrainz/CAA for neutral/local enrichment. |
| Audio selection | Plugin-selected source matching and direct stream-manifest resolution. | A user needs clear availability, source identity, and fallback states. | First-party service cards with explicit source rules; no runtime plugin execution or hidden source switching. |
| Lyrics | A distinct synced-lyrics module. | Timecodes must bind to the actual audio clock. | Build only after a licensed lyric source and real playback progress exist. |
| Desktop delivery | Platform-specific packaging and release automation. | A desktop player needs reproducible builds and installation checks. | Tauri packages validated on Linux, Windows, and macOS through CI. |

## Important source-resolution boundary

Spotube’s `SourcedTrack` service demonstrates a metadata-to-audio matching pattern: it asks an audio-source plugin for matches, ranks candidates by title/artist/“official” indicators, caches the selected match, obtains stream manifests, and probes direct stream URLs before playback. That is an engineering pattern for a plugin-powered client, but it is **not a valid Pi-Music playback blueprint**. It would conflict with Pi-Music’s first-party-source requirement and could violate current provider policies if used to access unapproved streams.[2] [3] [4]

The Spotube README also lists dependencies and services including alternative front ends, extractors, and download tooling.[5] Pi-Music will not adopt those methods. A repository’s open-source license does not grant copyright, streaming, or API authorization for the underlying music services.

> **Pi-Music will borrow the product discipline—not the source-extraction path.** Its architecture will keep listener-visible source identity, official provider rules, consent, and playback state together in a first-party desktop experience.

## What Pi-Music should build independently

Pi-Music should independently implement a persistent local library, playlist store, queue, player lifecycle, user-facing unavailable/error states, keyboard/media controls, cache boundaries, and cross-platform packaging. These are broadly useful music-client capabilities and can be designed from first principles in the existing Tauri/Rust/React stack.

For remote listening, Pi-Music’s approved directions remain constrained by provider authorization: a Spotify room for Spotify-authorized catalogue and playback features, a YouTube room based on the visible official embedded player, and a JioSaavn room unavailable until a partner agreement grants the required rights. No Spotube source code is required for any of these directions.

## References

[1]: [Spotube license at reviewed repository snapshot](https://github.com/KRTirtho/spotube/blob/master/LICENSE)

[2]: [Spotify Developer Policy](https://developer.spotify.com/policy)

[3]: [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies)

[4]: [JioSaavn API Policy](https://www.jiosaavn.com/corporate/api-policy)

[5]: [Spotube repository README](https://github.com/KRTirtho/spotube)
