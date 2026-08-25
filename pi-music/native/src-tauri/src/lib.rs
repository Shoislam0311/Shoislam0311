pub mod oauth;
pub mod youtube;

use oauth::{
    build_authorization_url, parse_loopback_target, random_url_safe,
    refresh_stored_connection, save_authorization_code, GoogleConnectionStatus, OAuthResultEvent, OAuthStart, TokenVault,
    GOOGLE_AUTH_EVENT,
};
use serde::Serialize;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use youtube::{my_playlists, playlist_items, search_videos, YoutubePlaylist, YoutubePlaylistItem, YoutubeSearchResult};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppRuntimeInfo {
    app_name: &'static str,
    delivery: &'static str,
    telemetry: bool,
    listening_mode: &'static str,
    remote_player: &'static str,
}

#[tauri::command]
fn app_runtime_info() -> AppRuntimeInfo {
    AppRuntimeInfo {
        app_name: "Pi-Music",
        delivery: "native-only",
        telemetry: false,
        listening_mode: "online-only",
        remote_player: "official YouTube embedded player (planned)",
    }
}

#[tauri::command]
fn google_connection_status(app: AppHandle) -> GoogleConnectionStatus {
    app.state::<TokenVault>().connection_status()
}

#[tauri::command]
fn disconnect_google(app: AppHandle) -> Result<(), String> {
    app.state::<TokenVault>().clear()
}

#[tauri::command]
fn refresh_google_connection(app: AppHandle, client_id: String) -> Result<GoogleConnectionStatus, String> {
    if client_id.trim().is_empty() {
        return Err("Pi-Music needs its configured desktop client ID before it can refresh this connection.".to_owned());
    }
    refresh_stored_connection(&app.state::<TokenVault>(), &client_id)
}

#[tauri::command]
fn unlock_google_vault(app: AppHandle, room_key: String) -> Result<GoogleConnectionStatus, String> {
    app.state::<TokenVault>().unlock(room_key)
}

#[tauri::command]
fn youtube_search(app: AppHandle, client_id: String, query: String) -> Result<Vec<YoutubeSearchResult>, String> {
    search_videos(&app.state::<TokenVault>(), &client_id, &query)
}

#[tauri::command]
fn youtube_my_playlists(app: AppHandle, client_id: String) -> Result<Vec<YoutubePlaylist>, String> {
    my_playlists(&app.state::<TokenVault>(), &client_id)
}

#[tauri::command]
fn youtube_playlist_items(app: AppHandle, client_id: String, playlist_id: String) -> Result<Vec<YoutubePlaylistItem>, String> {
    playlist_items(&app.state::<TokenVault>(), &client_id, &playlist_id)
}

fn send_callback_page(stream: &mut TcpStream, message: &str) {
    let body = format!("<!doctype html><html><head><meta charset=\"utf-8\"><title>Pi-Music</title><style>body{{font-family:system-ui;background:#f4ead8;color:#2d2926;display:grid;place-items:center;min-height:100vh;margin:0}}main{{max-width:420px;padding:32px;text-align:center;border:2px solid #6f5a42;background:#fffaf3;border-radius:16px;box-shadow:0 5px 0 #9e805d}}h1{{font-family:Georgia,serif}}</style></head><body><main><h1>Pi-Music</h1><p>{message}</p><p>You can close this tab and return to the listening room.</p></main></body></html>");
    let response = format!("HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", body.len(), body);
    let _ = stream.write_all(response.as_bytes());
    let _ = stream.flush();
}

fn emit_result(app: &AppHandle, status: &str, message: &str) {
    let _ = app.emit(GOOGLE_AUTH_EVENT, OAuthResultEvent { status: status.to_owned(), message: message.to_owned() });
}

fn receive_callback(mut stream: TcpStream, app: AppHandle, client_id: String, redirect_uri: String, expected_state: String, verifier: String) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(300)));
    let mut request = [0_u8; 8_192];
    let received = match stream.read(&mut request) {
        Ok(size) if size > 0 => size,
        _ => {
            emit_result(&app, "problem", "Pi-Music did not receive a sign-in reply. Please try again.");
            return;
        }
    };
    let text = String::from_utf8_lossy(&request[..received]);
    let target = match text.split_whitespace().nth(1) {
        Some(target) => target,
        None => {
            send_callback_page(&mut stream, "The sign-in reply was incomplete.");
            emit_result(&app, "problem", "The sign-in reply was incomplete. Please try again.");
            return;
        }
    };
    let values = match parse_loopback_target(target) {
        Ok(values) => values,
        Err(message) => {
            send_callback_page(&mut stream, &message);
            emit_result(&app, "problem", &message);
            return;
        }
    };
    if let Some(error) = values.get("error") {
        send_callback_page(&mut stream, "The connection was cancelled or declined.");
        emit_result(&app, "problem", &format!("Google did not grant access: {error}."));
        return;
    }
    if values.get("state") != Some(&expected_state) {
        send_callback_page(&mut stream, "The sign-in reply did not match this Pi-Music session.");
        emit_result(&app, "problem", "The sign-in reply did not match this Pi-Music session. Please try again.");
        return;
    }
    let code = match values.get("code") {
        Some(code) => code,
        None => {
            send_callback_page(&mut stream, "Google did not return an authorization code.");
            emit_result(&app, "problem", "Google did not return an authorization code. Please try again.");
            return;
        }
    };
    match save_authorization_code(&app.state::<TokenVault>(), &client_id, code, &redirect_uri, &verifier) {
        Ok(()) => {
            send_callback_page(&mut stream, "Your online listening room is connected.");
            emit_result(&app, "connected", "Your online listening room is connected.");
        }
        Err(message) => {
            send_callback_page(&mut stream, &message);
            emit_result(&app, "problem", &message);
        }
    }
}

#[tauri::command]
fn start_google_connection(app: AppHandle, client_id: String) -> Result<OAuthStart, String> {
    if client_id.trim().is_empty() {
        return Err("Pi-Music needs its configured desktop client ID before it can connect.".to_owned());
    }
    if std::env::var(oauth::YOUTUBE_CLIENT_SECRET_ENV)
        .map(|value| value.trim().is_empty())
        .unwrap_or(true)
    {
        return Err("Pi-Music’s secure Google configuration is incomplete. Please reconnect after setup.".to_owned());
    }
    if !app.state::<TokenVault>().connection_status().unlocked {
        return Err("Unlock your protected connection room before opening Google sign-in.".to_owned());
    }
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|_| "Pi-Music could not open a secure local sign-in reply port.".to_owned())?;
    let port = listener.local_addr().map_err(|_| "Pi-Music could not prepare the local sign-in reply.".to_owned())?.port();
    let redirect_uri = format!("http://127.0.0.1:{port}/oauth/callback");
    let state = random_url_safe(48);
    let verifier = random_url_safe(96);
    let authorization_url = build_authorization_url(&client_id, &redirect_uri, &state, &verifier)?;
    thread::spawn(move || match listener.accept() {
        Ok((stream, _)) => receive_callback(stream, app, client_id, redirect_uri, state, verifier),
        Err(_) => emit_result(&app, "problem", "Pi-Music could not receive the sign-in reply. Please try again."),
    });
    Ok(OAuthStart { authorization_url })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app.path().app_local_data_dir()?.join("pi-music-connections.hold");
            app.manage(TokenVault::new(path));
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            app_runtime_info,
            google_connection_status,
            start_google_connection,
            refresh_google_connection,
            unlock_google_vault,
            youtube_search,
            youtube_my_playlists,
            youtube_playlist_items,
            disconnect_google,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Pi-Music");
}

#[cfg(test)]
mod tests {
    use super::app_runtime_info;

    #[test]
    fn runtime_contract_is_native_online_and_telemetry_free() {
        let info = app_runtime_info();
        assert_eq!(info.app_name, "Pi-Music");
        assert_eq!(info.delivery, "native-only");
        assert!(!info.telemetry);
        assert_eq!(info.listening_mode, "online-only");
    }
}
