export type OnlineRoom = "Listen" | "Search" | "Now Playing" | "Playlists" | "Saved" | "Settings" | "Connect";

export type OnlineConnectionState = "not-connected" | "needs-consent" | "connected" | "problem";

export type OnlinePlaybackState = "waiting" | "cueing" | "playing" | "paused" | "ended" | "blocked" | "unavailable";

export type OnlineCollectionState = "idle" | "loading" | "ready" | "empty" | "problem";

export const ONLINE_ROOMS: OnlineRoom[] = ["Listen", "Search", "Now Playing", "Playlists", "Saved", "Settings"];

export function normaliseSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function searchPrompt(connection: OnlineConnectionState, query: string) {
  const cleanQuery = normaliseSearchQuery(query);
  if (connection !== "connected") return "Connect your account to look for a song, artist, or playlist.";
  if (!cleanQuery) return "Tell Pi-Music what you would like to hear.";
  return `Ready to look for “${cleanQuery}”.`;
}

export function playbackPrompt(state: OnlinePlaybackState) {
  const copy: Record<OnlinePlaybackState, string> = {
    waiting: "Choose something from your connected listening room to begin.",
    cueing: "Getting the player ready.",
    playing: "The room is sounding lovely.",
    paused: "Paused right where you left it.",
    ended: "That record reached the end.",
    blocked: "Your computer paused this start. Press play in the visible player to continue.",
    unavailable: "This item cannot be played in Pi-Music right now.",
  };
  return copy[state];
}

export function canPlayOnline(connection: OnlineConnectionState) {
  return connection === "connected";
}

export function collectionState(itemCount: number): OnlineCollectionState {
  return itemCount > 0 ? "ready" : "empty";
}

export function collectionPrompt(state: OnlineCollectionState, noun: string) {
  const copy: Record<OnlineCollectionState, string> = {
    idle: `Choose ${noun} when you are ready.`,
    loading: `Looking for ${noun}…`,
    ready: `${noun} are ready to browse.`,
    empty: `No ${noun} came back this time.`,
    problem: `Pi-Music could not bring in ${noun} right now.`,
  };
  return copy[state];
}

export function youtubePlayerState(stateCode: number): OnlinePlaybackState {
  if (stateCode === 1) return "playing";
  if (stateCode === 2) return "paused";
  if (stateCode === 0) return "ended";
  if (stateCode === 3 || stateCode === 5) return "cueing";
  return "waiting";
}
