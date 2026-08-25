# Pi-Music Documentation Scope Audit

**Audit date:** 2026-08-25
**Current product scope:** Original native desktop client for **Linux, Windows, and macOS**, using official YouTube authorization, data interfaces, and a visible IFrame Player. Pi-Music does not currently include mobile applications, local audio playback, Spotify, JioSaavn, a source-plugin runtime, download flows, or unlicensed lyrics.

| Document | Classification | Scope treatment |
| --- | --- | --- |
| `native/README.md` | Current | Defines the native desktop-only YouTube implementation, tested evidence, and open release gates. |
| `native-only-architecture.md` | Current | Defines the authoritative native desktop layers and explicitly excludes superseded platforms/providers. |
| `oauth-credential-setup.md` | Current | Defines desktop Google configuration only and rejects irrelevant credentials. |
| `functional-release-gates.md` | Current | Records verified evidence and open installed-app, lyrics, and installation requirements. |
| `youtube-production-requirements.md` | Current | Defines official YouTube requirements and prohibited playback workarounds. |
| `synchronized-lyrics-policy.md` | Current | Requires a licensed timecoded lyric feed before timed words are enabled. |
| `pi-music-online-production-blueprint.md` | Current | Describes the online-only product architecture and delivery order. |
| `built-in-source-architecture.md` | Current | Defines the one first-party YouTube room and records JioSaavn only as an excluded policy boundary. |
| `comparable-client-research.md` | Historical research | Explicitly labeled comparison evidence; it does not specify features for the current build. |
| `native-design-direction.md` | Historical visual reference | Explicitly labeled; only its hand-crafted visual principles remain relevant. |
| `release-readiness-assessment.md` | Historical readiness record | Explicitly labeled; the current release evidence is in `functional-release-gates.md`. |
| `source-integration-research.md` | Historical research | Explicitly labeled; records why early provider/plugin options were rejected. |
| `spotube-reference-review.md` | Historical research | Explicitly labeled; records the non-copying, no-extractor decision. |
| `native-ui-verification.md` | Historical verification | Retains prior visual test provenance and is not a current functional claim. |

> **Reading rule:** A historical document may discuss mobile targets, local files, Spotify, JioSaavn, MusicBrainz, or source plugins only to preserve research provenance. It cannot change the current product scope or satisfy a release gate.

The repository audit searched all current documentation for those superseded terms. Remaining instances appear only as explicit exclusions, cited policy boundaries, or within the records identified above as historical research. The current product/OAuth/release documents contain no instruction to configure or ship those retired paths.
