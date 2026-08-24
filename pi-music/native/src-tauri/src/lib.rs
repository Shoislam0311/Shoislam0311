// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppRuntimeInfo {
    app_name: &'static str,
    delivery: &'static str,
    telemetry: bool,
    metadata_authority: &'static str,
    playback_resolver: &'static str,
}

#[tauri::command]
fn app_runtime_info() -> AppRuntimeInfo {
    AppRuntimeInfo {
        app_name: "Pi-Music",
        delivery: "native-only",
        telemetry: false,
        metadata_authority: "MusicBrainz",
        playback_resolver: "JioSaavn adapter (explicitly enabled)",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![app_runtime_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::app_runtime_info;

    #[test]
    fn runtime_contract_is_native_and_telemetry_free() {
        let info = app_runtime_info();
        assert_eq!(info.app_name, "Pi-Music");
        assert_eq!(info.delivery, "native-only");
        assert!(!info.telemetry);
        assert_eq!(info.metadata_authority, "MusicBrainz");
    }
}
