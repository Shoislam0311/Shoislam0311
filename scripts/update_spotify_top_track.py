from __future__ import annotations

import base64
import html
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "spotify" / "top-track.svg"


def request_json(url: str, data: bytes | None = None, headers: dict[str, str] | None = None) -> dict:
    request = urllib.request.Request(url, data=data, headers=headers or {})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def placeholder(message: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280" role="img" aria-labelledby="title desc">
<title id="title">Spotify top track</title><desc id="desc">{esc(message)}</desc>
<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#ffffff" opacity=".035"/></pattern></defs>
<rect width="1000" height="280" rx="18" fill="#100c18"/>
<rect x="14" y="14" width="972" height="252" rx="12" fill="#18111f" stroke="#d58cff" stroke-width="2"/>
<rect x="14" y="14" width="972" height="252" rx="12" fill="url(#scan)"/>
<text x="48" y="68" fill="#f3d7ff" font-family="monospace" font-size="24" font-weight="700">RETRO FM // SPOTIFY</text>
<text x="48" y="124" fill="#d58cff" font-family="monospace" font-size="20">TOP TRACK SIGNAL</text>
<text x="48" y="174" fill="#ffffff" font-family="monospace" font-size="18">{esc(message)}</text>
<text x="48" y="220" fill="#8b6f9e" font-family="monospace" font-size="14">THE CARD UPDATES AUTOMATICALLY FROM SPOTIFY</text>
<circle cx="920" cy="72" r="16" fill="#d58cff"/><circle cx="920" cy="72" r="6" fill="#18111f"/>
</svg>'''


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    client_id = os.environ.get("SPOTIFY_CLIENT_ID")
    client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")
    refresh_token = os.environ.get("SPOTIFY_REFRESH_TOKEN")

    if not all((client_id, client_secret, refresh_token)):
        OUTPUT.write_text(placeholder("ADD SPOTIFY API SECRETS TO ENABLE TOP TRACK"), encoding="utf-8")
        return

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    token_payload = urllib.parse.urlencode({"grant_type": "refresh_token", "refresh_token": refresh_token}).encode()
    token = request_json(
        "https://accounts.spotify.com/api/token",
        data=token_payload,
        headers={"Authorization": f"Basic {basic}", "Content-Type": "application/x-www-form-urlencoded"},
    )
    access_token = token["access_token"]
    top = request_json(
        "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=1",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    items = top.get("items", [])
    if not items:
        OUTPUT.write_text(placeholder("NO TOP TRACK DATA AVAILABLE YET"), encoding="utf-8")
        return

    track = items[0]
    name = track.get("name", "Unknown track")
    artists = ", ".join(artist.get("name", "Unknown artist") for artist in track.get("artists", []))
    album = track.get("album", {})
    image_url = (album.get("images") or [{}])[0].get("url")
    spotify_url = track.get("external_urls", {}).get("spotify", "https://open.spotify.com/")

    cover = ""
    if image_url:
        with urllib.request.urlopen(image_url, timeout=30) as response:
            cover = base64.b64encode(response.read()).decode()

    title = esc(name[:42])
    artist = esc(artists[:52])
    album_name = esc(album.get("name", "Spotify")[:46])
    cover_tag = f'<image href="data:image/jpeg;base64,{cover}" x="48" y="60" width="180" height="180" preserveAspectRatio="xMidYMid slice"/>' if cover else '<rect x="48" y="60" width="180" height="180" fill="#392749"/>'

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 280" role="img" aria-labelledby="title desc">
<title id="title">Top Spotify track: {title}</title><desc id="desc">{title} by {artist}</desc>
<defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#ffffff" opacity=".035"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect width="1000" height="280" rx="18" fill="#100c18"/>
<rect x="14" y="14" width="972" height="252" rx="12" fill="#18111f" stroke="#d58cff" stroke-width="2"/>
<rect x="14" y="14" width="972" height="252" rx="12" fill="url(#scan)"/>
<rect x="48" y="60" width="180" height="180" rx="8" fill="#392749" stroke="#f3d7ff" stroke-width="3"/>{cover_tag}
<rect x="48" y="60" width="180" height="180" rx="8" fill="none" stroke="#ffffff" opacity=".25"/>
<text x="266" y="64" fill="#d58cff" font-family="monospace" font-size="17" font-weight="700">RETRO FM // TOP TRACK</text>
<text x="266" y="112" fill="#ffffff" font-family="monospace" font-size="27" font-weight="700">{title}</text>
<text x="266" y="148" fill="#f3d7ff" font-family="monospace" font-size="19">{artist}</text>
<text x="266" y="184" fill="#8b6f9e" font-family="monospace" font-size="15">ALBUM // {album_name}</text>
<text x="266" y="224" fill="#d58cff" font-family="monospace" font-size="16" filter="url(#glow)">[ PLAYING IN THE MEMORY BANK ]</text>
<circle cx="920" cy="72" r="16" fill="#d58cff"/><circle cx="920" cy="72" r="6" fill="#18111f"/>
<path d="M870 230h82" stroke="#d58cff" stroke-width="4" stroke-dasharray="3 8"/>
</svg>'''
    OUTPUT.write_text(svg, encoding="utf-8")
    (OUTPUT.parent / "top-track.url").write_text(spotify_url + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
