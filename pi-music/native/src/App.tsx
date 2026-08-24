import { useEffect, useMemo, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  ArrowRight,
  ChevronRight,
  FolderOpen,
  Heart,
  ListMusic,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";
import "./App.css";

type Track = {
  title: string;
  artist: string;
  duration: string;
  stamp: string;
  palette: "coral" | "moss" | "blue" | "plum";
};

const tracks: Track[] = [
  { title: "Midsummer Circuit", artist: "Mira Sol", duration: "3:41", stamp: "first press", palette: "coral" },
  { title: "Blue Room Echo", artist: "Tidal Forms", duration: "3:17", stamp: "home tape", palette: "blue" },
  { title: "Handmade Frequency", artist: "Aster Vale", duration: "4:06", stamp: "late night", palette: "moss" },
  { title: "Ink Geometry", artist: "Rowan Dial", duration: "3:22", stamp: "small joy", palette: "plum" },
];

const lyrics = [
  "The room is still, but the wires are warm",
  "A small red light keeps time through the dark",
  "We make a home in the sound between",
  "Every note comes back when we are free",
];

function PiLoop() {
  return <span className="pi-loop" aria-hidden="true"><i /><b /></span>;
}

function RetroIcon({ kind }: { kind: "deck" | "crate" | "tuner" | "heart" | "switch" | "sleeve" }) {
  return <span className={`retro-icon ${kind}`} aria-hidden="true"><i /><b /><em /></span>;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [activeIsland, setActiveIsland] = useState("Listen");
  const [localAudio, setLocalAudio] = useState<{ label: string; url: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const track = localAudio ? { title: localAudio.label, artist: "Local file", duration: "on device", stamp: "On this device", palette: "moss" as const } : tracks[activeTrack];
  const activeLyrics = useMemo(() => lyrics.map((line, index) => ({ line, active: index === 1, past: index < 1 })), []);

  const startTrack = (index: number) => {
    setLocalAudio(null);
    setActiveTrack(index);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!localAudio || !audioRef.current) return;
    if (isPlaying) {
      void audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, localAudio]);

  const chooseLocalAudio = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [{ name: "Audio", extensions: ["mp3", "m4a", "wav", "flac", "ogg", "aac"] }],
      });
      if (typeof selected !== "string") return;
      const label = selected.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "Local track";
      setLocalAudio({ label, url: convertFileSrc(selected) });
      setIsPlaying(true);
    } catch {
      // The dialog only exists in the installed native app; preview builds remain intentionally local-only.
    }
  };

  return (
    <main className="pi-native-shell">
      <header className="top-orbitbar">
        <div className="brand-lockup"><PiLoop /><span>Pi<span className="brand-dot">·</span>Music</span><small>native listening club</small></div>
        <audio ref={audioRef} src={localAudio?.url} onEnded={() => setIsPlaying(false)} />
        <div className="receiver-display" aria-label="Hi-fi receiver display"><span>FM 88.3</span><i /><em>stereo</em><b><u /><u /><u /><u /><u /></b></div>
        <div className="top-actions">
          <button className="search-bead" title="Search your library"><Search size={17} /><span>Search your sounds</span></button>
          <button className="file-bead" onClick={chooseLocalAudio} title="Choose a local audio file"><RetroIcon kind="sleeve" /><span>your tapes</span></button>
          <button className="round-icon" title="Open saved tracks"><Heart size={18} /></button>
          <button className="profile-pebble" title="Open profile">M</button>
        </div>
      </header>

      <section className="native-workspace">
        <nav className="listening-islands" aria-label="Pi-Music navigation">
          {[
            { label: "Listen", icon: "deck" as const },
            { label: "Library", icon: "crate" as const },
            { label: "The Deck", icon: "tuner" as const },
            { label: "Saved", icon: "heart" as const },
          ].map(({ label, icon }) => (
            <button key={label} className={activeIsland === label ? "island active" : "island"} onClick={() => setActiveIsland(label)} title={label}>
              <RetroIcon kind={icon} /><span>{label}</span>
            </button>
          ))}
          <button className="island quiet" onClick={() => setActiveIsland("Settings")} title="Settings"><RetroIcon kind="switch" /><span>Settings</span></button>
        </nav>

        {activeIsland === "Listen" && <section className="listening-home">
          <div className="home-welcome">
            <div><span className="micro-label">SIDE A / YOUR LISTENING ROOM / 08</span><h1>tiny tracks,<br /><em>big day.</em></h1></div>
            <p>Keep the little recordings that make your room sound like yours.</p>
          </div>

          <section className="record-of-day" aria-label="Record of the day">
            <div className="paper-pin"><Sparkles size={14} /> record of the day</div>
            <div className="deck-index" aria-hidden="true"><span>PI—70</span><i /><span>33⅓ RPM</span></div>
            <div className="record-copy">
              <span className="micro-label">PLAY NEXT / EVENING TRANSMISSION</span>
              <h2>Midsummer<br />Circuit</h2>
              <p>Mira Sol · Summer Signal</p>
              <div className="record-actions">
                <button className="play-sticker" onClick={() => startTrack(0)} title="Play Midsummer Circuit"><Play size={18} fill="currentColor" /> play this little thing</button>
                <button className="soft-sticker" onClick={chooseLocalAudio} title="Choose a local file"><FolderOpen size={16} /> bring a local file</button>
              </div>
            </div>
            <div className="record-object" aria-hidden="true">
              <div className="cover-sleeve"><span>SUMMER<br />SIGNAL</span><i /></div>
              <div className="vinyl-disc"><span /></div>
              <div className="record-tab">soft loop<br /><b>03:41</b></div>
              <div className="wood-plinth" />
            </div>
          </section>

          <section className="tile-shelf" aria-labelledby="saved-nearby-title">
            <div className="section-label-row"><div><span className="micro-label">SAVED NEARBY</span><h2 id="saved-nearby-title">A few you keep close</h2></div><button className="text-link" onClick={() => setActiveIsland("Library")}>open shelf <ArrowRight size={16} /></button></div>
            <div className="track-tiles">
              {tracks.map((item, index) => <button key={item.title} className={`track-tile ${item.palette} ${index === activeTrack ? "selected" : ""}`} onClick={() => startTrack(index)}>
                <span className="tile-cover"><i /></span>
                <span className="tile-text"><b>{item.title}</b><small>{item.artist}</small></span>
                <span className="tile-stamp">{item.stamp}</span>
                <span className="tile-play"><Play size={14} fill="currentColor" /></span>
              </button>)}
            </div>
          </section>

          <section className="patch-bay-teaser" aria-label="Current music sources">
            <div className="patch-copy"><span className="micro-label">TONIGHT'S SET</span><h2>make the room<br />sound like you.</h2><p>Three little companions for your records, your mood, and the words that follow along.</p><button className="patch-link" onClick={() => setActiveIsland("The Deck")}>visit the deck <ChevronRight size={16} /></button></div>
            <div className="patch-route">
              <div className="patch-socket metadata"><RetroIcon kind="sleeve" /><span>Record notes</span><small>little details</small></div>
              <div className="patch-wire" />
              <div className="patch-socket playback"><RetroIcon kind="deck" /><span>The sound</span><small>your listening</small></div>
              <div className="patch-wire coral-wire" />
              <div className="patch-socket lyrics"><RetroIcon kind="tuner" /><span>The words</span><small>right on cue</small></div>
            </div>
          </section>
        </section>}

        {activeIsland === "Library" && <LibraryRoom activeTrack={activeTrack} onPlay={startTrack} onBack={() => setActiveIsland("Listen")} />}
        {activeIsland === "The Deck" && <SourceRoom onBack={() => setActiveIsland("Listen")} />}
        {activeIsland === "Saved" && <SavedRoom onPlay={startTrack} />}
        {activeIsland === "Settings" && <SettingsRoom onBack={() => setActiveIsland("Listen")} />}

        <aside className="lyric-ribbon" aria-label="Lyrics for current track">
          <div className="ribbon-head"><div><span className="micro-label">LYRIC RIBBON</span><h2>words, right on time.</h2></div><button className="round-icon" title="More lyric options"><MoreHorizontal size={18} /></button></div>
          <div className="ribbon-album coral"><span>SUMMER<br />SIGNAL</span><i /></div>
          <div className="ribbon-track"><b>{track.title}</b><span>{track.artist}</span><small><PiLoop /> SIDE A / SONG NOTES</small></div>
          <div className="lyrics-stack">{activeLyrics.map(({ line, active, past }) => <p key={line} className={active ? "now" : past ? "past" : ""}>{line}</p>)}</div>
          <button className="lyrics-expand"><ListMusic size={16} /> read lyrics big</button>
        </aside>
      </section>

      <section className="orbit-player" aria-label="Now playing controls">
        <div className="orbit-track"><span className={`orbit-cover ${track.palette}`}><i /></span><div><b>{track.title}</b><small>{track.artist} · {track.duration}</small></div><button className="heart-orbit" title="Save current track"><Heart size={17} /></button></div>
        <div className="orbit-control-cluster">
          <button className="orbit-small" onClick={() => startTrack((activeTrack + tracks.length - 1) % tracks.length)} title="Previous track"><SkipBack size={18} fill="currentColor" /></button>
          <div className={isPlaying ? "orbit-core playing" : "orbit-core"}><button onClick={() => setIsPlaying((value) => !value)} title={isPlaying ? "Pause playback" : "Play track"}>{isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button></div>
          <button className="orbit-small" onClick={() => startTrack((activeTrack + 1) % tracks.length)} title="Next track"><SkipForward size={18} fill="currentColor" /></button>
        </div>
        <div className="orbit-route"><span><PiLoop /> library</span><i /> <span>sound</span><i /> <span>words</span><b className="orbit-vu"><u /><u /><u /><u /><u /></b></div>
      </section>
    </main>
  );
}

function RoomHeader({ eyebrow, title, copy, onBack }: { eyebrow: string; title: React.ReactNode; copy: string; onBack?: () => void }) {
  return <header className="room-header"><div><span className="micro-label">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{onBack && <button className="room-back" onClick={onBack}>back to listen <ArrowRight size={16} /></button>}</header>;
}

function LibraryRoom({ activeTrack, onPlay, onBack }: { activeTrack: number; onPlay: (index: number) => void; onBack: () => void }) {
  return <section className="room-view library-room"><RoomHeader eyebrow="YOUR LIBRARY / 16 TRACKS" title={<>found things,<br /><em>kept close.</em></>} copy="A tiny living shelf for local files, source matches, and the songs you have chosen to save." onBack={onBack} /><div className="library-filter-row"><button className="filter-pill active">all nearby <span>16</span></button><button className="filter-pill">local files <span>5</span></button><button className="filter-pill">source matches <span>11</span></button><button className="filter-pill">recently loved <Heart size={13} /></button></div><div className="library-grid">{[...tracks, ...tracks].map((track, index) => { const sourceIndex = index % tracks.length; return <article className={`library-card ${track.palette} ${sourceIndex === activeTrack ? "playing" : ""}`} key={`${track.title}-${index}`}><div className="library-cover"><i /><button onClick={() => onPlay(sourceIndex)} title={`Play ${track.title}`}>{sourceIndex === activeTrack ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button></div><div className="library-card-copy"><span>{String(index + 1).padStart(2, "0")}</span><b>{track.title}</b><small>{track.artist}</small></div><div className="library-card-foot"><span>{track.stamp}</span><small>{track.duration}</small></div></article>; })}</div></section>;
}

function SourceRoom({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState(false);
  return <section className="room-view source-room"><RoomHeader eyebrow="THE DECK / YOUR EVENING SET" title={<>everything set<br /><em>just so.</em></>} copy="A small room for the details that make a listening session feel like your own." onBack={onBack} /><div className="source-map"><div className="source-map-hub"><PiLoop /><b>now playing</b><small>one warm room</small></div><div className="source-route-line line-one" /><div className="source-route-line line-two" /><div className="source-route-line line-three" /><SourceModule tone="metadata" icon={<RetroIcon kind="sleeve" />} title="Sleeve notes" tag="the little details" copy="titles, album names, and the stories tucked inside" action="ready" /><SourceModule tone="playback" icon={<RetroIcon kind="deck" />} title="Turntable" tag="the sound in your room" copy="pick up where you left off, one side at a time" action={enabled ? "spinning" : "warm it up"} onAction={() => setEnabled((value) => !value)} /><SourceModule tone="lyrics" icon={<RetroIcon kind="tuner" />} title="Liner words" tag="sing along if you like" copy="a gentle line appears when the song is ready for it" action="kept nearby" /><SourceModule tone="account" icon={<RetroIcon kind="crate" />} title="Your shelves" tag="bring your favorites" copy="add the music you already care about whenever you want" action="open shelves" /></div><div className="permission-note"><Sparkles size={18} /><div><b>Nothing in your room is here by accident.</b><p>Pi-Music keeps things quiet, simple, and in your hands—just the way a good listening corner should feel.</p></div></div></section>;
}

function SourceModule({ tone, icon, title, tag, copy, action, onAction }: { tone: string; icon: React.ReactNode; title: string; tag: string; copy: string; action: string; onAction?: () => void }) {
  return <article className={`source-module ${tone}`}><div className="module-icon">{icon}</div><span className="module-tag">{tag}</span><h2>{title}</h2><p>{copy}</p><button className={action === "enabled" || action === "selected" ? "module-action on" : "module-action"} onClick={onAction}>{action}<ChevronRight size={14} /></button></article>;
}

function SavedRoom({ onPlay }: { onPlay: (index: number) => void }) {
  return <section className="room-view saved-room"><RoomHeader eyebrow="SAVED / LITTLE JOYS" title={<>the ones<br /><em>you meant to keep.</em></>} copy="Local bookmarks remain on this device until you choose to move them." /><div className="saved-stack">{tracks.slice(0, 3).map((track, index) => <button className={`saved-note ${track.palette}`} key={track.title} onClick={() => onPlay(index)}><span className="saved-art"><i /></span><span><b>{track.title}</b><small>{track.artist} · saved today</small></span><Play size={17} fill="currentColor" /></button>)}</div></section>;
}

function SettingsRoom({ onBack }: { onBack: () => void }) {
  return <section className="room-view settings-room"><RoomHeader eyebrow="YOUR PI-MUSIC" title={<>quiet, cute,<br /><em>and yours.</em></>} copy="Your little listening room, arranged the way you like it." onBack={onBack} /><div className="settings-pebbles"><span><PiLoop /> your room stays yours</span><span><Heart size={16} /> keep your favorites close</span><span><RetroIcon kind="switch" /> choose what comes in</span></div></section>;
}

export default App;
