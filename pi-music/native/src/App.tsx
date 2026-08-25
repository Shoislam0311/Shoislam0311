import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  CircleAlert,
  Heart,
  ListMusic,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Sparkles,
  Wifi,
} from "lucide-react";
import {
  ONLINE_ROOMS,
  canPlayOnline,
  collectionState,
  listenerRecoveryMessage,
  normaliseSearchQuery,
  playbackPrompt,
  searchPrompt,
  type OnlineCollectionState,
  type OnlineConnectionState,
  type OnlinePlaybackState,
  type OnlineRoom,
} from "./onlineClient";
import { VisibleYoutubePlayer } from "./VisibleYoutubePlayer";
import "./App.css";

type YoutubeVideo = { videoId: string; title: string; channelTitle: string; thumbnailUrl?: string };
type YoutubePlaylist = { playlistId: string; title: string; itemCount: number; thumbnailUrl?: string };
type YoutubePlaylistItem = { playlistItemId: string; videoId?: string; title: string; channelTitle: string; position: number; thumbnailUrl?: string };
type PlayerController = { play: () => void; pause: () => void };

const roomIcons: Record<OnlineRoom, "deck" | "crate" | "tuner" | "heart" | "switch" | "sleeve"> = {
  Listen: "deck",
  Search: "tuner",
  "Now Playing": "sleeve",
  Playlists: "crate",
  Saved: "heart",
  Settings: "switch",
  Connect: "switch",
};

function PiLoop() {
  return <span className="pi-loop" aria-hidden="true"><i /><b /></span>;
}

function RetroIcon({ kind }: { kind: "deck" | "crate" | "tuner" | "heart" | "switch" | "sleeve" }) {
  return <span className={`retro-icon ${kind}`} aria-hidden="true"><i /><b /><em /></span>;
}

function App() {
  const [activeRoom, setActiveRoom] = useState<OnlineRoom>("Listen");
  const [connection, setConnection] = useState<OnlineConnectionState>("not-connected");
  const [playback, setPlayback] = useState<OnlinePlaybackState>("waiting");
  const [searchValue, setSearchValue] = useState("");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [roomKey, setRoomKey] = useState("");
  const [vaultMessage, setVaultMessage] = useState("");
  const [connectionNoticeAccepted, setConnectionNoticeAccepted] = useState(false);
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([]);
  const [searchState, setSearchState] = useState<OnlineCollectionState>("idle");
  const [searchMessage, setSearchMessage] = useState("");
  const [playlists, setPlaylists] = useState<YoutubePlaylist[]>([]);
  const [playlistState, setPlaylistState] = useState<OnlineCollectionState>("idle");
  const [playlistMessage, setPlaylistMessage] = useState("");
  const [playlistItems, setPlaylistItems] = useState<YoutubePlaylistItem[]>([]);
  const [playlistItemState, setPlaylistItemState] = useState<OnlineCollectionState>("idle");
  const [playlistItemMessage, setPlaylistItemMessage] = useState("");
  const [openPlaylistTitle, setOpenPlaylistTitle] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [playerController, setPlayerController] = useState<PlayerController | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const cleanSearch = useMemo(() => normaliseSearchQuery(searchValue), [searchValue]);
  const connected = connection === "connected";
  const clientId = import.meta.env.VITE_YOUTUBE_DESKTOP_CLIENT_ID?.trim();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        setActiveRoom("Search");
      }
      if (event.key === "Escape") setActiveRoom("Listen");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    let alive = true;
    const statusCommand = invoke<{ connected: boolean; unlocked: boolean }>("google_connection_status");
    void statusCommand
      .then((result) => {
        if (!alive) return;
        setVaultUnlocked(result.unlocked);
        if (result.connected) setConnection("connected");
        if (result.unlocked && clientId) {
          void invoke<{ connected: boolean }>("refresh_google_connection", { clientId })
            .then((refresh) => { if (alive && refresh.connected) setConnection("connected"); });
        }
      })
      .catch(() => { /* The browser preview cannot invoke native commands. */ });
    const unlisten = listen<{ status: "connected" | "problem"; message: string }>("google-oauth-result", (event) => {
      if (!alive) return;
      setConnection(event.payload.status === "connected" ? "connected" : "problem");
      setActiveRoom(event.payload.status === "connected" ? "Listen" : "Connect");
    });
    return () => { alive = false; void unlisten.then((dispose) => dispose()); };
  }, []);

  useEffect(() => {
    if (!connected || activeRoom !== "Playlists" || !clientId) return;
    let alive = true;
    setPlaylistState("loading");
    setPlaylistMessage("");
    void invoke<YoutubePlaylist[]>("youtube_my_playlists", { clientId })
      .then((result) => {
        if (!alive) return;
        setPlaylists(result);
        setPlaylistState(collectionState(result.length));
      })
      .catch((error) => {
        if (!alive) return;
        setPlaylistState("problem");
        setPlaylistMessage(listenerRecoveryMessage(error, "playlist shelf"));
      });
    return () => { alive = false; };
  }, [activeRoom, clientId, connected]);

  const beginConnection = async () => {
    if (!clientId) {
      setConnection("problem");
      setActiveRoom("Connect");
      return;
    }
    if (!vaultUnlocked) {
      setVaultMessage("Open your protected room first. It keeps this connection on your device, not in Pi-Music’s screens.");
      setActiveRoom("Connect");
      return;
    }
    if (!connectionNoticeAccepted) {
      setVaultMessage("Read and acknowledge the connection notice before opening the provider’s sign-in page.");
      setActiveRoom("Connect");
      return;
    }
    try {
      setConnection("needs-consent");
      setActiveRoom("Connect");
      const result = await invoke<{ authorizationUrl: string }>("start_google_connection", { clientId });
      await openUrl(result.authorizationUrl);
    } catch {
      setConnection("problem");
      setActiveRoom("Connect");
    }
  };

  const unlockVault = async () => {
    if (!roomKey.trim()) {
      setVaultMessage("Choose the private room key you want to use on this device.");
      return;
    }
    try {
      const result = await invoke<{ connected: boolean; unlocked: boolean }>("unlock_google_vault", { roomKey });
      setRoomKey("");
      setVaultUnlocked(result.unlocked);
      setVaultMessage(result.connected ? "Your protected room is open and connected." : "Your protected room is ready. You can connect it to YouTube now.");
      if (result.connected) setConnection("connected");
    } catch (error) {
      setVaultMessage(error instanceof Error ? error.message : "Pi-Music could not open that protected room. Try the key again.");
    }
  };

  const openSearch = () => setActiveRoom("Search");

  const runSearch = async () => {
    if (!connected) {
      setActiveRoom("Connect");
      return;
    }
    if (!clientId || !cleanSearch) {
      setSearchState("idle");
      return;
    }
    setSearchState("loading");
    setSearchMessage("");
    try {
      const result = await invoke<YoutubeVideo[]>("youtube_search", { clientId, query: cleanSearch });
      setSearchResults(result);
      setSearchState(collectionState(result.length));
    } catch (error) {
      setSearchState("problem");
      setSearchMessage(listenerRecoveryMessage(error, "search"));
    }
  };

  const openPlaylist = async (playlist: YoutubePlaylist) => {
    if (!clientId) return;
    setOpenPlaylistTitle(playlist.title);
    setPlaylistItemState("loading");
    setPlaylistItemMessage("");
    try {
      const result = await invoke<YoutubePlaylistItem[]>("youtube_playlist_items", { clientId, playlistId: playlist.playlistId });
      setPlaylistItems(result);
      setPlaylistItemState(collectionState(result.length));
    } catch (error) {
      setPlaylistItemState("problem");
      setPlaylistItemMessage(listenerRecoveryMessage(error, "playlist"));
    }
  };

  const chooseVideo = (video: YoutubeVideo) => {
    setSelectedVideo(video);
    setPlayerReady(false);
    setPlayerError("");
    setPlayback("cueing");
    setActiveRoom("Now Playing");
  };

  const askToCue = () => {
    if (!canPlayOnline(connection)) {
      setPlayback("waiting");
      setActiveRoom("Connect");
      return;
    }
    if (!selectedVideo) {
      setPlayback("waiting");
      setActiveRoom("Search");
      return;
    }
    setPlayback("cueing");
    setActiveRoom("Now Playing");
  };

  const toggleVisiblePlayback = () => {
    if (!selectedVideo) {
      askToCue();
      return;
    }
    if (!playerController) {
      setPlayback("cueing");
      setActiveRoom("Now Playing");
      return;
    }
    if (playback === "playing") playerController.pause();
    else playerController.play();
  };

  useEffect(() => {
    const handlePlaybackShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== "Space" || !selectedVideo || !playerController || target?.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      event.preventDefault();
      if (playback === "playing") playerController.pause();
      else playerController.play();
    };
    window.addEventListener("keydown", handlePlaybackShortcut);
    return () => window.removeEventListener("keydown", handlePlaybackShortcut);
  }, [playback, playerController, selectedVideo]);

  const disconnect = async () => {
    try { await invoke("disconnect_google"); } catch { /* Preview mode has no native credential store. */ }
    setConnection("not-connected");
    setSearchResults([]); setSearchState("idle"); setPlaylists([]); setPlaylistState("idle");
    setPlaylistItems([]); setPlaylistItemState("idle"); setOpenPlaylistTitle(""); setSelectedVideo(null); setPlayerReady(false); setPlayerError(""); setPlayback("waiting");
    setActiveRoom("Settings");
  };

  return (
    <main className="pi-native-shell online-shell">
      <header className="top-orbitbar">
        <button className="brand-lockup brand-button" onClick={() => setActiveRoom("Listen")} title="Return to Pi-Music listening room"><PiLoop /><span>Pi<span className="brand-dot">·</span>Music</span><small>online listening club</small></button>
        <div className="receiver-display" aria-label="Online player status"><span>{connected ? "ROOM ONLINE" : "ROOM IDLE"}</span><i /><em>{connection === "connected" ? "ready" : "waiting"}</em><b><u /><u /><u /><u /><u /></b></div>
        <div className="top-actions">
          <button className="search-bead" onClick={openSearch} title="Open search"><Search size={17} /><span>find a sound</span></button>
          <button className="file-bead" onClick={beginConnection} title="Connect your YouTube account"><Wifi size={16} /><span>{connected ? "connected" : "connect"}</span></button>
          <button className="round-icon" onClick={() => setActiveRoom("Saved")} title="Open saved music"><Heart size={18} /></button>
          <button className="profile-pebble" onClick={() => setActiveRoom("Settings")} title="Open settings">P</button>
        </div>
      </header>

      <section className="native-workspace online-workspace">
        <nav className="listening-islands" aria-label="Pi-Music navigation">
          {ONLINE_ROOMS.map((room) => (
            <button key={room} className={activeRoom === room ? "island active" : "island"} onClick={() => setActiveRoom(room)} title={room}>
              <RetroIcon kind={roomIcons[room]} /><span>{room === "Now Playing" ? "Playing" : room}</span>
            </button>
          ))}
        </nav>

        {activeRoom === "Listen" && <ListenRoom connected={connected} onConnect={beginConnection} onSearch={openSearch} onCue={askToCue} onPlaylists={() => setActiveRoom("Playlists")} />}
        {activeRoom === "Search" && <SearchRoom connection={connection} value={searchValue} cleanValue={cleanSearch} searchState={searchState} searchMessage={searchMessage} results={searchResults} onChange={setSearchValue} onConnect={beginConnection} onSearch={runSearch} onSelect={chooseVideo} />}
        {activeRoom === "Now Playing" && <NowPlayingRoom playback={playback} selectedVideo={selectedVideo} playerReady={playerReady} playerError={playerError} onConnect={beginConnection} onSearch={openSearch} onPlaybackState={setPlayback} onPlayerReady={setPlayerReady} onPlayerError={setPlayerError} onControllerReady={setPlayerController} />}
        {activeRoom === "Playlists" && <PlaylistsRoom connection={connection} playlists={playlists} playlistState={playlistState} playlistMessage={playlistMessage} openPlaylistTitle={openPlaylistTitle} playlistItems={playlistItems} playlistItemState={playlistItemState} playlistItemMessage={playlistItemMessage} onConnect={beginConnection} onOpenPlaylist={openPlaylist} onSelectVideo={chooseVideo} />}
        {activeRoom === "Saved" && <SavedRoom connection={connection} onConnect={beginConnection} />}
        {activeRoom === "Settings" && <SettingsRoom connection={connection} onConnect={beginConnection} onDisconnect={disconnect} />}
        {activeRoom === "Connect" && <ConnectRoom state={connection} vaultUnlocked={vaultUnlocked} roomKey={roomKey} vaultMessage={vaultMessage} connectionNoticeAccepted={connectionNoticeAccepted} onRoomKeyChange={setRoomKey} onNoticeChange={setConnectionNoticeAccepted} onUnlock={unlockVault} onBack={() => setActiveRoom("Listen")} onConnect={beginConnection} />}

        <WordsRibbon onOpen={() => setActiveRoom("Now Playing")} />
      </section>

      <section className="orbit-player online-orbit" aria-label="Online player controls">
        <div className="orbit-track"><span className="orbit-cover coral"><i /></span><div><b>{selectedVideo?.title ?? "nothing is selected yet"}</b><small>{selectedVideo ? selectedVideo.channelTitle : "connect your room, then choose something to hear"}</small><span className={`playback-state ${playback}`}>{playbackPrompt(playback)}</span>{playerReady && <span className="player-ready-indicator" role="status">VISIBLE PLAYER READY</span>}</div><button className="heart-orbit" disabled title="Saved music will arrive only after an official account capability is designed"><Heart size={17} /></button></div>
        <div className="orbit-control-cluster">
          <button className="orbit-small" disabled title="Previous becomes available with a real queue"><SkipBack size={18} fill="currentColor" /></button>
          <div className={`orbit-core ${playback === "playing" ? "playing" : ""}`}><button onClick={toggleVisiblePlayback} title={selectedVideo ? "Play or pause the visible player" : "Choose a result to prepare the visible player"}>{playback === "playing" ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button></div>
          <button className="orbit-small" disabled title="Next becomes available with a real queue"><SkipForward size={18} fill="currentColor" /></button>
        </div>
        <div className="orbit-route"><span><PiLoop /> online room</span><i /> <span>visible player</span><i /> <span>words</span><b className="orbit-vu"><u /><u /><u /><u /><u /></b></div>
        <div className="orbit-timing online-timing"><span>—:—</span><div className="empty-progress" aria-hidden="true"><i /></div><span>—:—</span></div>
      </section>
    </main>
  );
}

function ListenRoom({ connected, onConnect, onSearch, onCue, onPlaylists }: { connected: boolean; onConnect: () => void; onSearch: () => void; onCue: () => void; onPlaylists: () => void }) {
  return <section className="listening-home online-home">
    <div className="home-welcome"><div><span className="micro-label">SIDE A / ONLINE LISTENING ROOM</span><h1>the room is<br /><em>ready for sound.</em></h1></div><p>Connect once, then let Pi-Music keep the listening part calm, clear, and close at hand.</p></div>
    <section className="record-of-day online-record" aria-label="Start listening">
      <div className="paper-pin"><Sparkles size={14} /> your first session</div><div className="deck-index" aria-hidden="true"><span>PI—ONLINE</span><i /><span>VISIBLE PLAYER</span></div>
      <div className="record-copy"><span className="micro-label">YOUR ROOM / WAITING TO CONNECT</span><h2>let’s make<br />some <em>noise.</em></h2><p>Pi-Music is online-only. Your account connection comes first, then the search, playlists, player, and words can come alive together.</p><div className="record-actions"><button className="play-sticker" onClick={onConnect}><Wifi size={17} /> connect your room</button><button className="soft-sticker" onClick={onSearch}><Search size={16} /> visit search</button></div></div>
      <div className="record-object" aria-hidden="true"><div className="cover-sleeve"><span>ONLINE<br />SIGNAL</span><i /></div><div className="vinyl-disc"><span /></div><div className="record-tab">SET ONE<br /><b>waiting</b></div><div className="wood-plinth" /></div>
    </section>
    <section className="patch-bay-teaser listening-route-note" aria-label="Open a real listening room"><div className="patch-copy"><span className="micro-label">THE NEXT REAL THING</span><h2>{connected ? <>choose a<br /><em>real room.</em></> : <>connect, then<br /><em>begin gently.</em></>}</h2><p>{connected ? "Search and playlists call your connected room. The player stays empty until you choose a returned record." : "Pi-Music will not invent a shelf before your account returns something real."}</p><div className="record-actions"><button className="soft-sticker" onClick={connected ? onSearch : onConnect}>{connected ? "open search" : "connect first"}</button><button className="soft-sticker" onClick={onPlaylists}>open playlists</button><button className="soft-sticker" onClick={onCue}>open player</button></div></div><div className="patch-route"><div className="patch-socket metadata"><RetroIcon kind="tuner" /><span>Find</span><small>returned search</small></div><div className="patch-wire" /><div className="patch-socket playback"><RetroIcon kind="deck" /><span>Hear</span><small>visible player</small></div><div className="patch-wire coral-wire" /><div className="patch-socket lyrics"><RetroIcon kind="sleeve" /><span>Read</span><small>licensed later</small></div></div></section>
    <section className="patch-bay-teaser" aria-label="How the online room is arranged"><div className="patch-copy"><span className="micro-label">ONE QUIET PATH</span><h2>find it,<br />hear it,<br />read along.</h2><p>Search, visible playback, and liner words each have a proper place in the room.</p><button className="patch-link" onClick={onSearch}>see the search room <ChevronRight size={16} /></button></div><div className="patch-route"><div className="patch-socket metadata"><RetroIcon kind="tuner" /><span>Find</span><small>search & playlists</small></div><div className="patch-wire" /><div className="patch-socket playback"><RetroIcon kind="deck" /><span>Hear</span><small>visible player</small></div><div className="patch-wire coral-wire" /><div className="patch-socket lyrics"><RetroIcon kind="sleeve" /><span>Read</span><small>timed words</small></div></div></section>
  </section>;
}

function RoomHeader({ eyebrow, title, copy, onBack }: { eyebrow: string; title: React.ReactNode; copy: string; onBack?: () => void }) {
  return <header className="room-header"><div><span className="micro-label">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{onBack && <button className="room-back" onClick={onBack}>back to listen <ArrowRight size={16} /></button>}</header>;
}

function SearchRoom({ connection, value, cleanValue, searchState, searchMessage, results, onChange, onConnect, onSearch, onSelect }: { connection: OnlineConnectionState; value: string; cleanValue: string; searchState: OnlineCollectionState; searchMessage: string; results: YoutubeVideo[]; onChange: (value: string) => void; onConnect: () => void; onSearch: () => void; onSelect: (video: YoutubeVideo) => void }) {
  const ready = connection === "connected";
  return <section className="room-view online-room"><RoomHeader eyebrow="SEARCH / YOUR NEXT SOUND" title={<>find a small<br /><em>new favorite.</em></>} copy="Only returned YouTube results appear on this shelf. Empty and unavailable moments remain clear rather than turning into decorative cards." />
    <form className="search-station" onSubmit={(event) => { event.preventDefault(); onSearch(); }}><Search size={20} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="song or artist" aria-label="Search music" /><kbd>/</kbd><button className="station-submit" type="submit" disabled={!ready || !cleanValue || searchState === "loading"}>{searchState === "loading" ? "looking" : "find"}</button></form>
    {searchState === "ready" ? <section className="live-result-section" aria-label="Search results"><div className="section-label-row"><div><span className="micro-label">FOUND IN YOUR CONNECTED ROOM</span><h2>{results.length} returned {results.length === 1 ? "record" : "records"}</h2></div><span className="source-stamp">YouTube</span></div><div className="live-result-grid">{results.map((video) => <button key={video.videoId} className="track-tile live-result" onClick={() => onSelect(video)}><span className="tile-cover coral live-thumb">{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" /> : <i />}</span><span className="tile-text"><b>{video.title}</b><small>{video.channelTitle}</small></span><span className="tile-stamp">YouTube / visible player ready</span><span className="tile-play"><Play size={12} fill="currentColor" /></span></button>)}</div></section> : <div className="online-empty"><RetroIcon kind="tuner" /><div><span className="micro-label">SEARCH STATUS</span><b>{searchState === "loading" ? "Pi-Music is looking for it." : searchState === "problem" ? "That search needs another try." : searchPrompt(connection, value)}</b><p>{searchState === "problem" ? searchMessage : ready && cleanValue ? "Press find to ask your connected room for real results." : "Your words stay here while you choose the next step."}</p></div><button className="soft-sticker" onClick={ready ? onSearch : onConnect}>{ready ? "find it" : "connect first"}</button></div>}
    <div className="online-notes"><span><CircleAlert size={15} /> no hidden audio path</span><span><Wifi size={15} /> one connected room</span><span><ListMusic size={15} /> playlists appear here</span></div>
  </section>;
}

function NowPlayingRoom({ playback, selectedVideo, playerReady, playerError, onConnect, onSearch, onPlaybackState, onPlayerReady, onPlayerError, onControllerReady }: { playback: OnlinePlaybackState; selectedVideo: YoutubeVideo | null; playerReady: boolean; playerError: string; onConnect: () => void; onSearch: () => void; onPlaybackState: (state: OnlinePlaybackState) => void; onPlayerReady: (ready: boolean) => void; onPlayerError: (message: string) => void; onControllerReady: (controller: PlayerController | null) => void }) {
  const hasSelection = Boolean(selectedVideo);
  return <section className="room-view online-room now-playing-room"><RoomHeader eyebrow="NOW PLAYING / VISIBLE BY DESIGN" title={hasSelection ? <>a record is<br /><em>waiting at the deck.</em></> : <>the turntable is<br /><em>waiting for a record.</em></>} copy="Pi-Music will keep the official player visible here. Until the authorized player is connected, the controls stay honest and the room stays quiet." />
    <div className="visible-player-shell"><div className="player-glass">{hasSelection && selectedVideo ? <VisibleYoutubePlayer videoId={selectedVideo.videoId} onPlaybackState={onPlaybackState} onPlayerReady={onPlayerReady} onPlayerError={onPlayerError} onControllerReady={onControllerReady} /> : <div className="player-screen"><PiLoop /><b>NO ITEM SELECTED</b><small>{playbackPrompt(playback)}</small><button className="play-sticker" onClick={onConnect}><Wifi size={17} /> connect to begin</button></div>}</div><div className="player-side-note"><span className="micro-label">OFFICIAL PLAYER / VISIBLE BY DESIGN</span><p>{hasSelection ? "The full YouTube player is visible here with its own controls. Pi-Music can cue, play, pause, and reflect its real lifecycle without substituting another audio path." : "Choose a returned search result, then this room will prepare the visible player."}</p>{hasSelection && <small className={playerReady ? "player-ready-note ready" : "player-ready-note"}>{playerReady ? "Player ready — press play here or on the receiver below." : playback === "unavailable" ? playerError || playbackPrompt(playback) : "Preparing the visible player…"}</small>}<button className="text-link" onClick={onSearch}>go to search <ArrowRight size={16} /></button></div></div>
  </section>;
}

function PlaylistsRoom({ connection, playlists, playlistState, playlistMessage, openPlaylistTitle, playlistItems, playlistItemState, playlistItemMessage, onConnect, onOpenPlaylist, onSelectVideo }: { connection: OnlineConnectionState; playlists: YoutubePlaylist[]; playlistState: OnlineCollectionState; playlistMessage: string; openPlaylistTitle: string; playlistItems: YoutubePlaylistItem[]; playlistItemState: OnlineCollectionState; playlistItemMessage: string; onConnect: () => void; onOpenPlaylist: (playlist: YoutubePlaylist) => void; onSelectVideo: (video: YoutubeVideo) => void }) {
  const ready = connection === "connected";
  return <section className="room-view online-room"><RoomHeader eyebrow="PLAYLISTS / LITTLE COLLECTIONS" title={<>all your good<br /><em>ideas in a row.</em></>} copy="This shelf lists only playlists returned for your connected account. Pi-Music reads them first and will ask clearly before it ever needs broader account permission." />
    {playlistState === "ready" ? <div className="playlist-columns live-playlists">{playlists.map((playlist, index) => <button className={`playlist-pile pile-${index % 3}`} key={playlist.playlistId} onClick={() => onOpenPlaylist(playlist)}><RetroIcon kind="crate" /><span className="micro-label">YOU TUBE PLAYLIST</span><b>{playlist.title}</b><small>{playlist.itemCount} {playlist.itemCount === 1 ? "record" : "records"} / open collection</small></button>)}</div> : <div className="online-empty"><RetroIcon kind="crate" /><div><span className="micro-label">PLAYLIST STATUS</span><b>{playlistState === "loading" ? "Pi-Music is opening your shelf." : playlistState === "problem" ? "Your shelf needs another try." : ready ? "No playlists came back this time." : "Connect to see your playlists."}</b><p>{playlistState === "problem" ? playlistMessage : ready ? "Nothing is copied into Pi-Music; this room shows what your connected account returns." : "Connection stays voluntary and reversible."}</p></div>{!ready && <button className="soft-sticker" onClick={onConnect}>connect first</button>}</div>}
    {openPlaylistTitle && <section className="playlist-detail" aria-label={`${openPlaylistTitle} tracks`}><div className="section-label-row"><div><span className="micro-label">OPEN COLLECTION</span><h2>{openPlaylistTitle}</h2></div><span className="source-stamp">YouTube</span></div>{playlistItemState === "ready" ? <div className="live-result-grid">{playlistItems.filter((item) => item.videoId).map((item) => <button key={item.playlistItemId} className="track-tile live-result" onClick={() => item.videoId && onSelectVideo({ videoId: item.videoId, title: item.title, channelTitle: item.channelTitle, thumbnailUrl: item.thumbnailUrl })}><span className="tile-cover moss live-thumb">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" /> : <i />}</span><span className="tile-text"><b>{item.title}</b><small>{item.channelTitle}</small></span><span className="tile-stamp">track {item.position + 1} / choose for visible player</span><span className="tile-play"><Play size={12} fill="currentColor" /></span></button>)}</div> : <div className="online-empty compact-empty"><RetroIcon kind="deck" /><div><span className="micro-label">COLLECTION STATUS</span><b>{playlistItemState === "loading" ? "Opening the records…" : playlistItemState === "problem" ? "That collection needs another try." : "No playable records came back."}</b><p>{playlistItemState === "problem" ? playlistItemMessage : "Pi-Music keeps unavailable entries separate from records the visible player can prepare."}</p></div></div>}</section>}
  </section>;
}

function SavedRoom({ connection, onConnect }: { connection: OnlineConnectionState; onConnect: () => void }) {
  return <section className="room-view online-room"><RoomHeader eyebrow="SAVED / KEEP THESE CLOSE" title={<>the ones you<br /><em>mean to return to.</em></>} copy="Pi-Music will not pretend a temporary counter is a saved collection. This room stays quiet until an officially permitted saved-music capability is ready." />
    <div className="saved-counter"><Heart size={23} /><div><span className="micro-label">SAVED STATUS</span><b>not available yet</b><small>{connection === "connected" ? "Your connection is ready, but Pi-Music has not asked for a save permission or created a shadow library." : "Connect when you are ready; it still will not create a saved list."}</small></div>{connection !== "connected" && <button className="soft-sticker" onClick={onConnect}>connect first</button>}</div>
  </section>;
}

function SettingsRoom({ connection, onConnect, onDisconnect }: { connection: OnlineConnectionState; onConnect: () => void; onDisconnect: () => void }) {
  return <section className="room-view online-room"><RoomHeader eyebrow="YOUR PI-MUSIC / QUIET BY DEFAULT" title={<>made for listening,<br /><em>not watching you.</em></>} copy="The listening room stays local to your desktop. Connection is voluntary, reversible, and separate from the way Pi-Music looks and feels." />
    <div className="settings-grid"><article><RetroIcon kind="switch" /><b>account connection</b><p>{connection === "connected" ? "Connected and ready to manage." : "Not connected. No remote listening request is being made."}</p><button className="module-action" onClick={connection === "connected" ? onDisconnect : onConnect}>{connection === "connected" ? "disconnect" : "connect"}<ChevronRight size={14} /></button></article><article><RetroIcon kind="tuner" /><b>words</b><p>Timed words remain off until a licensed match can move with the real player.</p><button className="module-action" disabled>waiting for words <ChevronRight size={14} /></button></article><article><RetroIcon kind="deck" /><b>your room</b><p>No Pi-Music telemetry or background collection. This app will show its listening status plainly.</p><button className="module-action" disabled>quiet by default <ChevronRight size={14} /></button></article></div>
  </section>;
}

function ConnectRoom({ state, vaultUnlocked, roomKey, vaultMessage, connectionNoticeAccepted, onRoomKeyChange, onNoticeChange, onUnlock, onBack, onConnect }: { state: OnlineConnectionState; vaultUnlocked: boolean; roomKey: string; vaultMessage: string; connectionNoticeAccepted: boolean; onRoomKeyChange: (value: string) => void; onNoticeChange: (value: boolean) => void; onUnlock: () => void; onBack: () => void; onConnect: () => void }) {
  const heading = state === "needs-consent" ? "your secure browser sign-in is open." : state === "problem" ? "that connection needs another try." : "one account, one clear choice.";
  const copy = state === "needs-consent" ? "Finish the consent choice in your browser. Pi-Music will return here only after it verifies the reply and protects the connection in your private room." : state === "problem" ? "Pi-Music could not complete the connection. Check that the YouTube Data API and consent screen are enabled for this desktop client, then try again." : "Pi-Music will open the provider’s own consent page. It never asks for your Google password in this window and never shows your token in the room.";
  const openNotice = (url: string) => { void openUrl(url); };
  return <section className="room-view online-room connect-room"><RoomHeader eyebrow="CONNECT / ONE CLEAR DOOR" title={<>bring your online room<br /><em>in gently.</em></>} copy="Connection is explicit, reversible, and handled through the system browser." onBack={onBack} />
    <div className="connect-panel"><div className="connect-dial"><Wifi size={34} /><i /><span>PI / ONLINE</span></div><div><span className="micro-label">CONNECTION STATUS</span><h2>{heading}</h2><p>{copy}</p>{vaultUnlocked ? <div className="connection-notice"><label><input type="checkbox" checked={connectionNoticeAccepted} onChange={(event) => onNoticeChange(event.target.checked)} /> <span>I understand that connecting opens YouTube in my browser, keeps the protected connection on this device, and does not enable Pi-Music telemetry.</span></label><p><button type="button" onClick={() => openNotice("https://www.youtube.com/t/terms")}>YouTube Terms</button><i /> <button type="button" onClick={() => openNotice("https://policies.google.com/privacy")}>Google Privacy</button></p><button className="play-sticker" onClick={onConnect} disabled={!connectionNoticeAccepted}>{state === "needs-consent" ? "open sign-in again" : "open secure sign-in"}</button>{vaultMessage && <p className="vault-message" role="status">{vaultMessage}</p>}</div> : <div className="vault-unlock"><label htmlFor="room-key">private room key <small>used only to unlock this device’s protected connection room</small></label><input id="room-key" type="password" autoComplete="new-password" value={roomKey} onChange={(event) => onRoomKeyChange(event.target.value)} placeholder="at least 12 characters" /><button className="play-sticker" onClick={onUnlock}>open protected room</button>{vaultMessage && <p className="vault-message" role="status">{vaultMessage}</p>}</div>}</div></div>
  </section>;
}

function WordsRibbon({ onOpen }: { onOpen: () => void }) {
  return <aside className="lyric-ribbon online-words" aria-label="Words for the current track"><div className="ribbon-head"><div><span className="micro-label">LINER WORDS</span><h2>words, when they’re real.</h2></div><button className="round-icon" title="Word options"><MoreHorizontal size={18} /></button></div><div className="ribbon-album coral"><span>WORDS<br />WAITING</span><i /></div><div className="ribbon-track"><b>nothing selected</b><span>the right words will follow the right recording</span><small><PiLoop /> TIMING / NOT READY</small></div><div className="words-empty"><ListMusic size={24} /><p>Pi-Music won’t fill this page with guessed lines. Licensed words and real timing will arrive together.</p></div><button className="lyrics-expand" onClick={onOpen}><ListMusic size={16} /> see the player room</button></aside>;
}

export default App;
