import { describe, expect, it } from "vitest";
import { canPlayOnline, collectionPrompt, collectionState, listenerRecoveryMessage, normaliseSearchQuery, playbackPrompt, searchPrompt, youtubePlayerErrorMessage, youtubePlayerState } from "./onlineClient";

describe("online listening state", () => {
  it("normalises a search without changing the listener’s words", () => {
    expect(normaliseSearchQuery("  small   signals  ")).toBe("small signals");
  });

  it("keeps discovery account-gated until a real connection exists", () => {
    expect(searchPrompt("not-connected", "miles")).toContain("Connect your account");
    expect(canPlayOnline("needs-consent")).toBe(false);
    expect(canPlayOnline("connected")).toBe(true);
  });

  it("uses clear player recovery copy for blocked playback", () => {
    expect(playbackPrompt("blocked")).toContain("visible player");
  });

  it("separates returned, empty, loading, and recovery collection states", () => {
    expect(collectionState(2)).toBe("ready");
    expect(collectionState(0)).toBe("empty");
    expect(collectionPrompt("loading", "results")).toContain("Looking");
    expect(collectionPrompt("problem", "playlists")).not.toContain("API");
    expect(listenerRecoveryMessage(new Error("401 unauthorized"), "search")).toContain("opened again");
    expect(listenerRecoveryMessage(new Error("429 quota"), "playlist")).toContain("quiet moment");
    expect(listenerRecoveryMessage(new Error("403 forbidden"), "search")).not.toContain("403");
  });

  it("maps official player lifecycle codes without treating an unknown player state as playback", () => {
    expect(youtubePlayerState(5)).toBe("cueing");
    expect(youtubePlayerState(1)).toBe("playing");
    expect(youtubePlayerState(2)).toBe("paused");
    expect(youtubePlayerState(0)).toBe("ended");
    expect(youtubePlayerState(-1)).toBe("waiting");
    expect(playbackPrompt("ready")).toContain("visible player");
    expect(youtubePlayerErrorMessage(100)).toContain("no longer available");
    expect(youtubePlayerErrorMessage(101)).toContain("cannot be shown");
    expect(youtubePlayerErrorMessage(5)).toContain("visible player");
  });
});
