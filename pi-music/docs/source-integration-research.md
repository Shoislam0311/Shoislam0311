# Pi-Music Source Integration Research

## User-specified JioSaavn playback plugin

The referenced repository describes itself as a **JioSaavn audio source plugin for Spotube**. Its manifest identifies `JiosaavnAudioSourcePlugin` as the entry point, requests local-storage access, declares the `audio-source` ability, and targets **Spotube plugin API version 2.0.0**.[1] The project is a Spotube-native plugin, not a browser package or Pi-Music-compatible API. Pi-Music must therefore model it as an explicitly enabled external playback resolver and cannot load or execute its entry point directly in the browser without a separately reviewed, compatible adapter.

## Account integration boundary

The current task configuration has no Spotify or JioSaavn integration available. The only YouTube-related listing is an unrelated, disabled creator-intelligence connector; it cannot serve as a music-account authorization or playback integration. Pi-Music must use user-authorized provider integrations or provider-approved APIs rather than treating a current account session as automatically available.

## Design implication

The upgraded interface should distinguish **metadata**, **playback**, and **account connection** in visible source labels. The initial product experience can truthfully present Spotify as the preferred metadata source, the reviewed JioSaavn plugin as a selected playback resolver, and YouTube/Spotify as account connections that require consent. It must not imply that a source is connected, licensed, or playable until authorization and compatibility are established.

## Metadata provider comparison

MusicBrainz is designed for media players, taggers, and other metadata-consuming applications. It offers REST lookups and search for artists, recordings, releases, release groups, and non-MBID identifiers such as ISRC, while requiring a meaningful User-Agent and a maximum of one request per second per client. The public web service is free for non-commercial use; commercial use requires the appropriate arrangement.[2]

Discogs provides artist, release, and label information with a strong physical-release and collection orientation. Its API limits requests by source IP to 60 per minute when authenticated and 25 per minute without authentication. It is valuable as an optional release-credit enrichment source, but it is not the best default for high-frequency track resolution.[3]

### Selected default: MusicBrainz + Cover Art Archive

Pi-Music should use **MusicBrainz** as its default metadata authority and **Cover Art Archive** for eligible release art. This selection best fits the app’s open-source, local-first goals because it does not require a listener account for basic metadata, supports canonical recording and release identifiers that are useful for resolving separate playback sources, and avoids depending on a commercial streaming catalog for core library identity. A typed, cached resolver is required to honour the service’s rate limit. Spotify should become an opt-in enrichment and library connection, rather than the metadata system of record.

## Spotube Spotify plugin review

The requested Spotube reference is an **unofficial** Spotify metadata plugin, written in Kotlin and packaged for Spotube’s native plugin environment. The repository describes itself as not associated with Spotube or Spotify and is licensed under **AGPL-3.0-or-later**.[4] Its source tree includes a `spotify_gql_client`, and recent maintenance notes refer to updating GraphQL operation hashes. This is not a documented, browser-ready Spotify Web API client.

Pi-Music should **not** directly embed or port this code to bypass provider limits, account controls, or undocumented endpoint behavior. Doing so would create technical fragility, potential provider-terms risk, and an AGPL licensing obligation for a network-deployed derivative. The compatible product pattern is: use MusicBrainz as the default catalog, keep Spotify as a user-authorized enrichment connection through its documented OAuth/API flow, and provide a clearly labeled compatibility-adapter slot only if the external plugin owner publishes an authorized, browser-compatible contract.

## References

[1]: https://github.com/KRTirtho/spotube-plugin-jiosaavn-audio "KRTirtho/spotube-plugin-jiosaavn-audio"
[2]: https://musicbrainz.org/doc/MusicBrainz_API "MusicBrainz API"
[3]: https://www.discogs.com/developers "Discogs API Documentation"
[4]: https://github.com/sonic-liberation/spotube-plugin-spotify "sonic-liberation/spotube-plugin-spotify"
