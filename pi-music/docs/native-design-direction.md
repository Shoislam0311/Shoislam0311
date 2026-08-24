# Pi-Music Native Design Direction

## Creative premise

Pi-Music should feel like a **small music room built with care**, not a generic streaming dashboard. The native desktop and mobile applications will combine the existing editorial listening-desk clarity with a softer, more playful material language: rounded record sleeves, friendly source badges, tiny playback pulses, and surfaces that feel like warm paper rather than flat software panels.

The goal is **cute without being childish**. Every decorative moment must reinforce an action, a source, a track, or the feeling of listening. Controls remain legible, hit targets remain generous, and the playback path stays visually dominant.

## Core visual grammar

| Element | Native expression |
| --- | --- |
| Canvas | Warm oat background with quiet grain and deep ink navigation surfaces. |
| Accent | Signal coral for active playback, plus soft moss and cornflower notes for source identity. |
| Album art | Slightly oversized rounded sleeves, layered sparingly to create depth without visual noise. |
| Typography | Bold, compact display lettering for track or playlist moments; calm sans-serif utility text; mono labels for source provenance. |
| Playback state | A tiny coral pulse, gentle equalizer bars, and clear track progress—not ornamental animation. |
| Source states | Tangible stamped labels: **metadata**, **playback**, **connected**, and **needs permission**. |
| Friendly detail | A Pi-loop mark appears as a small listening companion in active playback, saved playlists, and permission confirmations. |

## Platform translation

| Surface | Desktop | Mobile |
| --- | --- | --- |
| Navigation | A calm left-side music rail with artwork and source-room access. | A low, thumb-reachable four-item dock with the active listening state visible. |
| Now playing | A persistent lower player with transport, queue, source provenance, and volume. | A compact mini-player above the dock that expands into a full listening sheet. |
| Lyrics | An optional companion panel that follows the active line. | A full-height lyric sheet with a strong current-line marker. |
| Sources | An inspectable source-room ledger with capability stamps. | A stacked source-card flow with simple enable and permission actions. |

## Component redesign: replacing the current elements

The existing prototype’s theme remains useful, but its individual elements will **not** be migrated as-is. The desktop rail, rectangular hero panel, dense track table, fixed utility bar, and generic source cards will be replaced by this native component system.

| Existing element to retire | Native Pi-Music replacement | Character and behavior |
| --- | --- | --- |
| Dark left navigation rail | **Listening Islands** | A small cluster of rounded, illustrated destinations that settles into a compact edge dock on desktop and a thumb dock on mobile. |
| Large rectangular feature panel | **Record of the Day** | A soft rounded record sleeve that can tilt slightly with touch or pointer movement, with the play action attached as a clear circular control. |
| Spreadsheet-like track rows | **Track Tiles** | Compact, tactile tiles with cover art, source stamp, saved state, and a single immediate play affordance. Secondary actions live in an intentional overflow sheet. |
| Fixed three-column player bar | **Orbit Player** | An expandable circular transport hub around album art. On desktop it rests above the bottom edge; on mobile it collapses to a friendly mini-player and opens as a full sheet. |
| Generic provider cards | **Patch Bay** | Source connectors shown as labeled sockets joined by visible routes—metadata, playback, lyrics, and account permission—so users understand each service’s exact job. |
| Right-side lyric column | **Lyric Ribbon** | A focused, vertically flowing lyric strip that makes the active line feel like a highlighted note, with an easy full-screen mode on mobile. |
| Standard modal dialogs | **Listening Sheets** | Bottom or side sheets with album-colored headers, large action rows, and clearly stated permissions rather than small generic forms. |

## Native screen composition

The primary desktop screen will use one generous central listening surface instead of a full dashboard grid. The top area holds the **Record of the Day** and a small search bead. The center becomes a masonry-like set of **Track Tiles** grouped by mood, source, or recency. The **Orbit Player** floats at the bottom with album art at its center. The **Patch Bay** opens as a separate workspace so source permissions never compete with music discovery.

On mobile, the home view starts with the current album art and a concise greeting, then shows two horizontal shelves: **play next** and **saved nearby**. The mini-player remains above the rounded bottom dock. A tap transforms it into a full listening sheet where the Orbit Player, lyrics, queue, and source provenance feel like one continuous object.

## Motion and interaction

Primary taps should respond with a restrained 0.97 scale and, on supported mobile devices, a light haptic confirmation. Playback starts, saved tracks, and successful source connections may use a 160–240 ms opacity or position transition. There will be no looping decorative motion, bounce effects, or attention-seeking animation that interferes with music controls.

Every icon-only control will have an accessible label and at least a 44-point touch target on mobile. Color will never be the only indicator of a connected source, playback state, or permission requirement.

## Native start screens

The first native implementation will include three polished entry states: a listening desk with a featured record, a compact source route showing **MusicBrainz → JioSaavn adapter → timed lyrics**, and a friendly account drawer that makes Spotify and YouTube explicitly optional. No account screen will be presented as mandatory for local playback.
