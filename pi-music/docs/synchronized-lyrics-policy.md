# Pi-Music Synchronized Lyrics Policy

## Product requirement

Pi-Music will treat **synchronized lyrics** as a core online-listening feature, not as decorative static copy. Each displayed lyric line must be licensed for the intended desktop use and mapped to playback timing from a supported source. Until both conditions are met, the listening room must show an honest “words are not available for this recording” state rather than a fake synced display.

## Production sourcing decision

| Candidate | Published capability | Pi-Music decision |
| --- | --- | --- |
| **Musixmatch Business** | Presents real-time lyrics through API, feeds, or custom implementations and states that it has sync and translation display rights.[1] | Preferred commercial conversation for synced-lyrics coverage. Contact and contract required before implementation. |
| **LyricFind** | Offers licensed and verified lyric display products, including synchronization-related products.[2] | Alternative commercial conversation. Contract and delivery specification required before implementation. |
| **Genius** | States that commercial use of its API is not allowed without a license.[3] | Not a fallback or scraper source. Consider only with a written commercial license appropriate to Pi-Music’s use. |
| **YouTube captions** | YouTube Data API describes caption-track resources, but does not grant Pi-Music a blanket right to retrieve or display lyrics for third-party music videos.[4] | Do not convert captions into a general lyrics service. Use only within an expressly authorized workflow. |

## Implementation rules

Pi-Music must keep a lyric record’s source, license scope, language, timing granularity, content identifier, and availability state separate from its visual presentation. The player may advance a highlighted line only when an authorized timing record exists for the currently playing recording. It must gracefully handle instrumental tracks, translations, unavailable lyrics, explicit material labels, delayed data, and conflicts between a YouTube video and a lyric-source match.

Pi-Music will not scrape lyric websites, use unofficial lyric endpoints, reuse community dumps without rights, or display lyrics merely because a user searched for a matching song title. A provider contract should also define attribution, caching, deletion, territory, and reporting obligations before a public launch.

## Release evidence

A streaming release needs an executed lyric license or provider agreement, a documented matching approach, real player-clock synchronization tests, source attribution where required, and a no-lyrics state verified on a track without licensed timing data. No production screen may use generic lyric text to imply the feature is operational.

## References

[1]: [Musixmatch Business Solutions](https://about.musixmatch.com/business/overview)

[2]: [LyricFind Products](https://www.lyricfind.com/products)

[3]: [Genius API documentation](https://docs.genius.com/)

[4]: [YouTube Data API reference](https://developers.google.com/youtube/v3/docs)
