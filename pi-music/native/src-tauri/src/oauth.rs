use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use iota_stronghold::{Client, KeyProvider, SnapshotPath, Store, Stronghold};
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use url::Url;
use zeroize::Zeroizing;

pub const GOOGLE_AUTH_EVENT: &str = "google-oauth-result";
pub const YOUTUBE_READ_SCOPE: &str = "https://www.googleapis.com/auth/youtube.readonly";
pub const YOUTUBE_CLIENT_SECRET_ENV: &str = "YOUTUBE_DESKTOP_CLIENT_SECRET";
const VAULT_CLIENT_ID: &[u8] = b"pi-music";
const VAULT_TOKEN_KEY: &[u8] = b"google-oauth";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoogleConnectionStatus {
    pub connected: bool,
    pub unlocked: bool,
    pub scopes: Vec<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthStart {
    pub authorization_url: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthResultEvent {
    pub status: String,
    pub message: String,
}

#[derive(Clone, Deserialize, Serialize)]
struct StoredGoogleTokens {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<u64>,
    #[serde(default)]
    expires_at_epoch_seconds: Option<u64>,
    scope: Option<String>,
    token_type: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: Option<u64>,
    scope: Option<String>,
    token_type: Option<String>,
}

#[derive(Deserialize)]
struct TokenErrorResponse {
    error: Option<String>,
    error_description: Option<String>,
}

#[derive(Clone)]
pub struct TokenVault {
    snapshot_path: PathBuf,
    inner: Arc<Mutex<Option<ActiveVault>>>,
}

struct ActiveVault {
    stronghold: Stronghold,
    snapshot_path: SnapshotPath,
    key_provider: KeyProvider,
}

impl TokenVault {
    pub fn new(snapshot_path: PathBuf) -> Self {
        Self { snapshot_path, inner: Arc::new(Mutex::new(None)) }
    }

    pub fn unlock(&self, passphrase: String) -> Result<GoogleConnectionStatus, String> {
        if passphrase.chars().count() < 12 {
            return Err("Choose a private room key with at least 12 characters before connecting.".to_owned());
        }
        if let Some(parent) = self.snapshot_path.parent() {
            std::fs::create_dir_all(parent).map_err(|_| "Pi-Music could not prepare its protected connection room.".to_owned())?;
        }
        let passphrase = Zeroizing::new(passphrase.into_bytes());
        let key_provider = KeyProvider::with_passphrase_hashed_blake2b(passphrase)
            .map_err(|_| "Pi-Music could not prepare that protected room. Try a different private room key.".to_owned())?;
        let snapshot_path = SnapshotPath::from_path(&self.snapshot_path);
        let stronghold = Stronghold::default();
        if snapshot_path.exists() {
            stronghold
                .load_snapshot(&key_provider, &snapshot_path)
                .map_err(|_| "Pi-Music could not open that protected room. Check the private room key and try again.".to_owned())?;
        }
        let mut guard = self.inner.lock().map_err(|_| "Pi-Music could not open its protected connection room.".to_owned())?;
        *guard = Some(ActiveVault { stronghold, snapshot_path, key_provider });
        drop(guard);
        Ok(self.connection_status())
    }

    fn with_vault<T>(&self, action: impl FnOnce(&ActiveVault) -> Result<T, String>) -> Result<T, String> {
        let guard = self.inner.lock().map_err(|_| "Pi-Music could not access its protected connection room.".to_owned())?;
        let vault = guard.as_ref().ok_or_else(|| "Unlock your protected connection room before continuing.".to_owned())?;
        action(vault)
    }

    fn client(vault: &ActiveVault) -> Result<Client, String> {
        vault.stronghold
            .get_client(VAULT_CLIENT_ID)
            .or_else(|_| vault.stronghold.load_client(VAULT_CLIENT_ID))
            .or_else(|_| vault.stronghold.create_client(VAULT_CLIENT_ID))
            .map_err(|_| "Pi-Music could not prepare its protected connection room.".to_owned())
    }

    fn token_store(vault: &ActiveVault) -> Result<Store, String> {
        Ok(Self::client(vault)?.store())
    }

    fn read_tokens(&self) -> Result<StoredGoogleTokens, String> {
        self.with_vault(|vault| {
            let encoded = Self::token_store(vault)?
                .get(VAULT_TOKEN_KEY)
                .map_err(|_| "Pi-Music could not read the protected connection. Please reconnect.".to_owned())?
                .ok_or_else(|| "Pi-Music has no connected room yet.".to_owned())?;
            serde_json::from_slice::<StoredGoogleTokens>(&encoded)
                .map_err(|_| "Pi-Music could not read the protected connection. Please reconnect.".to_owned())
        })
    }

    fn write_tokens(&self, tokens: &StoredGoogleTokens) -> Result<(), String> {
        let encoded = serde_json::to_vec(tokens).map_err(|_| "Pi-Music could not protect this connection.".to_owned())?;
        self.with_vault(|vault| {
            Self::token_store(vault)?
                .insert(VAULT_TOKEN_KEY.to_vec(), encoded, None)
                .map_err(|_| "Pi-Music could not save this protected connection.".to_owned())?;
            vault.stronghold
                .commit_with_keyprovider(&vault.snapshot_path, &vault.key_provider)
                .map_err(|_| "Pi-Music could not save this protected connection.".to_owned())
        })
    }

    pub fn clear(&self) -> Result<(), String> {
        self.with_vault(|vault| {
            Self::token_store(vault)?
                .delete(VAULT_TOKEN_KEY)
                .map_err(|_| "Pi-Music could not remove this protected connection.".to_owned())?;
            vault.stronghold
                .commit_with_keyprovider(&vault.snapshot_path, &vault.key_provider)
                .map_err(|_| "Pi-Music could not remove this protected connection.".to_owned())
        })
    }

    pub fn connection_status(&self) -> GoogleConnectionStatus {
        let unlocked = self.inner.lock().map(|guard| guard.is_some()).unwrap_or(false);
        let scopes: Vec<String> = self
            .read_tokens()
            .ok()
            .and_then(|tokens| tokens.scope)
            .map(|scope| scope.split_whitespace().map(ToOwned::to_owned).collect())
            .unwrap_or_default();
        GoogleConnectionStatus { connected: !scopes.is_empty(), unlocked, scopes }
    }

    pub fn access_token(&self) -> Result<String, String> {
        Ok(self.read_tokens()?.access_token)
    }
}

pub fn random_url_safe(length: usize) -> String {
    rand::thread_rng().sample_iter(&Alphanumeric).take(length).map(char::from).collect()
}

pub fn pkce_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

pub fn build_authorization_url(client_id: &str, redirect_uri: &str, state: &str, verifier: &str) -> Result<String, String> {
    let mut url = Url::parse("https://accounts.google.com/o/oauth2/v2/auth").map_err(|error| error.to_string())?;
    url.query_pairs_mut()
        .append_pair("client_id", client_id)
        .append_pair("redirect_uri", redirect_uri)
        .append_pair("response_type", "code")
        .append_pair("scope", YOUTUBE_READ_SCOPE)
        .append_pair("state", state)
        .append_pair("code_challenge", &pkce_challenge(verifier))
        .append_pair("code_challenge_method", "S256")
        .append_pair("access_type", "offline")
        .append_pair("prompt", "consent");
    Ok(url.into())
}

pub fn parse_loopback_target(target: &str) -> Result<HashMap<String, String>, String> {
    let callback = Url::parse(&format!("http://127.0.0.1{target}")).map_err(|_| "The sign-in reply could not be read.".to_owned())?;
    Ok(callback.query_pairs().into_owned().collect())
}

fn epoch_seconds() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs()
}

fn expires_at(expires_in: Option<u64>, now: u64) -> Option<u64> {
    expires_in.map(|duration| now.saturating_add(duration))
}

fn should_refresh(expires_at_epoch_seconds: Option<u64>, now: u64) -> bool {
    expires_at_epoch_seconds.map(|expires_at| expires_at <= now.saturating_add(60)).unwrap_or(true)
}

fn exchange_code(client_id: &str, code: &str, redirect_uri: &str, verifier: &str) -> Result<StoredGoogleTokens, String> {
    let client_secret = std::env::var(YOUTUBE_CLIENT_SECRET_ENV)
        .map_err(|_| "Pi-Music’s secure Google configuration is incomplete. Please reconnect after setup.".to_owned())?;
    let response = ureq::post("https://oauth2.googleapis.com/token")
        .config().http_status_as_error(false).build()
        .send_form([
            ("client_id", client_id), ("client_secret", client_secret.as_str()), ("code", code),
            ("code_verifier", verifier), ("grant_type", "authorization_code"), ("redirect_uri", redirect_uri),
        ])
        .map_err(|_| "Pi-Music could not reach Google to finish this sign-in. Please try again.".to_owned())?;
    if !response.status().is_success() {
        let status = response.status();
        let response_error = response.into_body().read_json::<TokenErrorResponse>().ok();
        let category = response_error.map(|body| match (body.error, body.error_description) {
            (Some(error), Some(description)) => format!("{error}: {description}"),
            (Some(error), None) => error,
            (None, Some(description)) => description,
            (None, None) => "unreadable token reply".to_owned(),
        }).unwrap_or_else(|| "unreadable token reply".to_owned());
        return Err(format!("Google rejected the sign-in reply ({status}: {category})."));
    }
    let tokens: TokenResponse = response.into_body().read_json().map_err(|_| "Google returned an unreadable sign-in reply.".to_owned())?;
    Ok(StoredGoogleTokens {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        expires_at_epoch_seconds: expires_at(tokens.expires_in, epoch_seconds()),
        scope: tokens.scope,
        token_type: tokens.token_type,
    })
}

pub fn save_authorization_code(vault: &TokenVault, client_id: &str, code: &str, redirect_uri: &str, verifier: &str) -> Result<(), String> {
    vault.write_tokens(&exchange_code(client_id, code, redirect_uri, verifier)?)
}

pub fn refresh_stored_connection(vault: &TokenVault, client_id: &str) -> Result<GoogleConnectionStatus, String> {
    let existing = vault.read_tokens()?;
    if !should_refresh(existing.expires_at_epoch_seconds, epoch_seconds()) {
        return Ok(vault.connection_status());
    }
    let refresh_token = existing.refresh_token.clone().ok_or_else(|| "Pi-Music needs you to reconnect before it can refresh this account.".to_owned())?;
    let client_secret = std::env::var(YOUTUBE_CLIENT_SECRET_ENV)
        .map_err(|_| "Pi-Music’s secure Google configuration is incomplete. Please reconnect after setup.".to_owned())?;
    let response = ureq::post("https://oauth2.googleapis.com/token")
        .config().http_status_as_error(false).build()
        .send_form([
            ("client_id", client_id), ("client_secret", client_secret.as_str()),
            ("refresh_token", refresh_token.as_str()), ("grant_type", "refresh_token"),
        ])
        .map_err(|_| "Pi-Music could not reach Google to refresh this connection. Please try again.".to_owned())?;
    if !response.status().is_success() {
        vault.clear()?;
        return Err("Google could not refresh this connection. Pi-Music has disconnected it; please connect again.".to_owned());
    }
    let refreshed: TokenResponse = response.into_body().read_json().map_err(|_| "Google returned an unreadable refresh reply. Please reconnect.".to_owned())?;
    let tokens = StoredGoogleTokens {
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token.or(existing.refresh_token),
        expires_in: refreshed.expires_in,
        expires_at_epoch_seconds: expires_at(refreshed.expires_in, epoch_seconds()),
        scope: refreshed.scope.or(existing.scope),
        token_type: refreshed.token_type.or(existing.token_type),
    };
    vault.write_tokens(&tokens)?;
    Ok(vault.connection_status())
}

#[cfg(test)]
mod tests {
    use super::{build_authorization_url, expires_at, parse_loopback_target, pkce_challenge, should_refresh, StoredGoogleTokens, TokenVault};

    #[test]
    fn pkce_challenge_is_url_safe_and_stable() {
        assert_eq!(pkce_challenge("a"), "ypeBEsobvcr6wjGzmiPcTaeG7_gUfE5yuYB3ha_uSLs");
    }

    #[test]
    fn authorization_url_contains_pkce_and_state_without_secret() {
        let url = build_authorization_url("desktop-client", "http://127.0.0.1:43123/oauth/callback", "csrf", "verifier").unwrap();
        assert!(url.contains("code_challenge_method=S256"));
        assert!(url.contains("state=csrf"));
        assert!(!url.contains("client_secret"));
    }

    #[test]
    fn callback_query_is_decoded() {
        let values = parse_loopback_target("/oauth/callback?code=abc&state=csrf").unwrap();
        assert_eq!(values.get("code"), Some(&"abc".to_owned()));
        assert_eq!(values.get("state"), Some(&"csrf".to_owned()));
    }

    #[test]
    fn token_lifecycle_refreshes_missing_or_nearly_expired_credentials() {
        assert_eq!(expires_at(Some(120), 1_000), Some(1_120));
        assert!(should_refresh(None, 1_000));
        assert!(should_refresh(Some(1_060), 1_000));
        assert!(!should_refresh(Some(1_061), 1_000));
    }

    #[test]
    fn encrypted_vault_survives_a_fresh_native_vault_instance() {
        let path = std::env::temp_dir().join(format!("pi-music-oauth-vault-{}.hold", super::random_url_safe(16)));
        let first = TokenVault::new(path.clone());
        first.unlock("test private room key".to_owned()).unwrap();
        first.write_tokens(&StoredGoogleTokens {
            access_token: "test-access-token".to_owned(),
            refresh_token: Some("test-refresh-token".to_owned()),
            expires_in: Some(3_600),
            expires_at_epoch_seconds: Some(super::epoch_seconds() + 3_600),
            scope: Some("https://www.googleapis.com/auth/youtube.readonly".to_owned()),
            token_type: Some("Bearer".to_owned()),
        }).unwrap();
        drop(first);

        let reopened = TokenVault::new(path.clone());
        let status = reopened.unlock("test private room key".to_owned()).unwrap();
        assert!(status.connected);
        assert_eq!(reopened.access_token().unwrap(), "test-access-token");
        let _ = std::fs::remove_file(path);
    }
}
