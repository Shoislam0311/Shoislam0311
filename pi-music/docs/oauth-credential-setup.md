# Pi-Music Native OAuth Credential Setup

Pi-Music is a **native-only** Tauri application. The providers host their own sign-in and consent screens; Pi-Music never asks for a Spotify or Google password. The app needs public **client IDs**, not client secrets, access tokens, refresh tokens, or API keys.

> **Important:** Native clients are not able to keep a client secret confidential. Never put a Spotify or Google client secret in a `VITE_` variable, app source, chat message, or native bundle.

## What to create

Spotify uses one app registration and one public client ID. Google uses platform-specific OAuth client IDs, because the provider needs to identify the desktop executable, Android application ID/signing certificate, and iOS bundle separately.[1] [2]

| Environment variable | Create in | Purpose | When needed |
| --- | --- | --- | --- |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify for Developers Dashboard | Optional Spotify metadata/library connection on all supported native platforms. | Create now. |
| `VITE_YOUTUBE_DESKTOP_CLIENT_ID` | Google Cloud Console → OAuth client ID → **Desktop app** | YouTube library access on Windows, macOS, and Linux. | Create now. |
| `VITE_YOUTUBE_ANDROID_CLIENT_ID` | Google Cloud Console → OAuth client ID → **Android** | YouTube library access on Android. | Create after Android signing is finalized. |
| `VITE_YOUTUBE_IOS_CLIENT_ID` | Google Cloud Console → OAuth client ID → **iOS** | YouTube library access on iPhone. | Create after the Apple bundle identifier is finalized. |

For the current build, Pi-Music’s Android application ID is **`app.pimusic.player`**. The iPhone bundle identifier should be finalized before the iOS OAuth credential is created; it should be a unique reverse-domain value owned by the project, such as `app.pimusic.player` if available in the Apple Developer account.

## 1. Create the Spotify client ID

Sign in at the [Spotify for Developers Dashboard](https://developer.spotify.com/dashboard), choose **Create app**, and name it **Pi-Music**. Add a clear description such as “local-first native music application; optional library metadata connection.”

Spotify now requires an exact redirect URI. Use HTTPS for a mobile callback, or an explicit loopback IP for desktop development—**not** `localhost`.[1]

| Platform | Register this redirect approach | Why |
| --- | --- | --- |
| Windows, macOS, Linux | `http://127.0.0.1/pi-music/spotify/callback` | Spotify permits an explicit loopback IP and supports a dynamic port only when the registered loopback URI omits the port. |
| Android and iPhone | `https://<YOUR-AUTH-DOMAIN>/pi-music/spotify/callback` | Spotify requires HTTPS for non-loopback redirects. This can be a minimal native-app callback bridge or an associated-link handoff; it is **not** a Pi-Music web product. |

Copy **Client ID** from the Spotify app page and enter only that value as `VITE_SPOTIFY_CLIENT_ID`.

Pi-Music should request the minimum metadata/library scopes: `user-library-read`, `playlist-read-private`, and `playlist-read-collaborative`. It should not request Spotify playback-control scopes because Spotify is not Pi-Music’s selected playback resolver.

## 2. Create the Google / YouTube client IDs

Open [Google Cloud Console](https://console.cloud.google.com/). Create a project named **Pi-Music**, enable **YouTube Data API v3**, then configure the OAuth consent screen. Use a real support email and developer contact. During testing, add your own Google account as a test user if the consent screen is not yet published.

Next, open **APIs & Services → Credentials → Create credentials → OAuth client ID**. Create the following entries:

| Google client type | Pi-Music value to provide | Detail |
| --- | --- | --- |
| **Desktop app** | `VITE_YOUTUBE_DESKTOP_CLIENT_ID` | Use this for Windows, macOS, and Linux. Google recommends loopback IP redirects for these desktop targets.[2] |
| **Android** | `VITE_YOUTUBE_ANDROID_CLIENT_ID` | Enter package name `app.pimusic.player` and the SHA-1 certificate fingerprint from the release signing key. Do not create this from a debug-only fingerprint for production. |
| **iOS** | `VITE_YOUTUBE_IOS_CLIENT_ID` | Enter the finalized iPhone bundle identifier and Apple team details required by the provider console. |

Each generated Google client ID ends in `.apps.googleusercontent.com`. The first scope Pi-Music needs is read-only:

```
https://www.googleapis.com/auth/youtube.readonly
```

Google documents loopback redirects as appropriate for desktop applications, but not for Android and iOS OAuth clients. Mobile sign-in must use the provider-supported Android and iOS native flow associated with the installed app.[2]

## What to enter in Pi-Music

Enter only the values that are available for the platform you are testing. A desktop-first setup can begin with these two lines:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_YOUTUBE_DESKTOP_CLIENT_ID=your_google_desktop_client_id.apps.googleusercontent.com
```

Later, add the mobile IDs after Android release signing and the iPhone bundle identifier are finalized:

```
VITE_YOUTUBE_ANDROID_CLIENT_ID=your_google_android_client_id.apps.googleusercontent.com
VITE_YOUTUBE_IOS_CLIENT_ID=your_google_ios_client_id.apps.googleusercontent.com
```

## Never provide these values

| Do not provide | Reason |
| --- | --- |
| Spotify or Google client secret | A native app cannot protect it; it must never be embedded in the app. |
| Provider password | The provider’s own consent screen handles login. |
| Access token or refresh token | These are per-user authorization credentials, not app configuration values. |
| Android signing keystore | Keep release signing material outside app source and credentials forms. |

## References

[1]: [Spotify: Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)

[2]: [Google: OAuth 2.0 for iOS & Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)