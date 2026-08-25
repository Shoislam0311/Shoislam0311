import { expect, test } from "vitest";

test("the secure Google desktop client configuration is accepted by Google", async () => {
  const clientId = process.env.VITE_YOUTUBE_DESKTOP_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_DESKTOP_CLIENT_SECRET;

  expect(clientId, "desktop client ID must be configured").toBeTruthy();
  expect(clientSecret, "desktop client secret must be configured").toBeTruthy();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code: "pi-music-configuration-check-not-an-authorization-code",
      code_verifier: "pi-music-configuration-check-verifier-which-is-long-enough-to-be-valid-1234567890",
      grant_type: "authorization_code",
      redirect_uri: "http://127.0.0.1:1/oauth/callback",
    }),
  });

  const payload = (await response.json()) as { error?: string };
  expect(response.status).toBe(400);
  expect(payload.error, "Google must recognize the configured desktop client before rejecting the deliberately invalid one-time code").toBe("invalid_grant");
});
