export type OnlineRoom = "Listen" | "Search" | "Now Playing" | "Playlists" | "Saved" | "Settings" | "Connect";

export type OnlineConnectionState = "not-connected" | "needs-consent" | "connected" | "problem";

export type OnlinePlaybackState = "waiting" | "ready" | "cueing" | "playing" | "paused" | "ended" | "blocked" | "unavailable";

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
    ready: "The visible player is ready when you are.",
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

export function youtubePlayerErrorMessage(errorCode: number) {
  if (errorCode === 100) return "This video is no longer available. Choose another returned record.";
  if (errorCode === 101 || errorCode === 150) return "This video cannot be shown inside Pi-Music. Choose another returned record.";
  if (errorCode === 2) return "This selected record could not be prepared. Choose another returned record.";
  if (errorCode === 5) return "This video cannot open in the visible player right now. Try another returned record.";
  return "This item cannot be played in Pi-Music right now. Choose another returned record.";
}

export function listenerRecoveryMessage(error: unknown, subject: string) {
  const detail = error instanceof Error ? error.message.toLowerCase() : "";
  if (detail.includes("401") || detail.includes("unauthorized")) return "Your connected room needs to be opened again before Pi-Music can continue.";
  if (detail.includes("403") || detail.includes("forbidden")) return `This ${subject} is not available in your room right now.`;
  if (detail.includes("429") || detail.includes("quota") || detail.includes("rate")) return "Your room needs a quiet moment before trying again.";
  if (detail.includes("404") || detail.includes("not found")) return `That ${subject} is no longer available. Choose another one.`;
  return `Pi-Music could not bring in this ${subject} right now. Try again in a moment.`;
}
