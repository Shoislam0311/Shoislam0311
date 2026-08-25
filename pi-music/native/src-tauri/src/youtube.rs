use crate::oauth::{refresh_stored_connection, TokenVault};
use serde::{Deserialize, Serialize};
use url::Url;

const YOUTUBE_API_ROOT: &str = "https://www.googleapis.com/youtube/v3";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YoutubeSearchResult {
    pub video_id: String,
    pub title: String,
    pub channel_title: String,
    pub thumbnail_url: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YoutubePlaylist {
    pub playlist_id: String,
    pub title: String,
    pub item_count: u64,
    pub thumbnail_url: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YoutubePlaylistItem {
    pub playlist_item_id: String,
    pub video_id: Option<String>,
    pub title: String,
    pub channel_title: String,
    pub position: u64,
    pub thumbnail_url: Option<String>,
}

#[derive(Deserialize)]
struct SearchResponse {
    items: Vec<SearchResource>,
}

#[derive(Deserialize)]
struct SearchResource {
    id: SearchId,
    snippet: Snippet,
}

#[derive(Deserialize)]
struct SearchId {
    #[serde(rename = "videoId")]
    video_id: Option<String>,
}

#[derive(Deserialize)]
struct PlaylistResponse {
    items: Vec<PlaylistResource>,
}

#[derive(Deserialize)]
struct PlaylistResource {
    id: String,
    snippet: Snippet,
    #[serde(rename = "contentDetails")]
    content_details: Option<ContentDetails>,
}

#[derive(Deserialize)]
struct PlaylistItemsResponse {
    items: Vec<PlaylistItemResource>,
}

#[derive(Deserialize)]
struct PlaylistItemResource {
    id: String,
    snippet: PlaylistItemSnippet,
}

#[derive(Deserialize)]
struct PlaylistItemSnippet {
    title: String,
    #[serde(rename = "channelTitle")]
    channel_title: String,
    position: u64,
    #[serde(rename = "resourceId")]
    resource_id: PlaylistResourceId,
    thumbnails: Option<Thumbnails>,
}

#[derive(Deserialize)]
struct PlaylistResourceId {
    #[serde(rename = "videoId")]
    video_id: Option<String>,
}

#[derive(Deserialize)]
struct Snippet {
    title: String,
    #[serde(rename = "channelTitle")]
    channel_title: String,
    thumbnails: Option<Thumbnails>,
}

#[derive(Deserialize)]
struct ContentDetails {
    #[serde(rename = "itemCount")]
    item_count: Option<u64>,
}

#[derive(Deserialize)]
struct Thumbnails {
    medium: Option<Thumbnail>,
    high: Option<Thumbnail>,
    default: Option<Thumbnail>,
}

#[derive(Deserialize)]
struct Thumbnail {
    url: String,
}

fn thumbnail_url(thumbnails: Option<Thumbnails>) -> Option<String> {
    let thumbnails = thumbnails?;
    thumbnails
        .high
        .or(thumbnails.medium)
        .or(thumbnails.default)
        .map(|thumbnail| thumbnail.url)
}

fn safe_query(value: &str, limit: usize) -> Result<String, String> {
    let query = value.trim();
    if query.is_empty() {
        return Err("Tell Pi-Music what you would like to find first.".to_owned());
    }
    if query.chars().count() > limit {
        return Err("That search is a little too long. Try a shorter title, artist, or playlist name.".to_owned());
    }
    Ok(query.to_owned())
}

fn youtube_error(status: u16) -> String {
    match status {
        401 => "Your connection needs another sign-in. Please reconnect your room.".to_owned(),
        403 => "YouTube could not make that item available to Pi-Music right now.".to_owned(),
        404 => "That YouTube item is no longer available.".to_owned(),
        429 => "YouTube asked Pi-Music to slow down. Please try again in a moment.".to_owned(),
        _ => "YouTube could not complete that request right now. Please try again.".to_owned(),
    }
}

fn authorized_get(vault: &TokenVault, client_id: &str, path: &str, parameters: &[(&str, &str)]) -> Result<ureq::http::Response<ureq::Body>, String> {
    refresh_stored_connection(vault, client_id)?;
    let access_token = vault.access_token()?;
    let mut url = Url::parse(&format!("{YOUTUBE_API_ROOT}/{path}")).map_err(|_| "Pi-Music could not prepare that YouTube request.".to_owned())?;
    url.query_pairs_mut().extend_pairs(parameters.iter().copied());
    let response = ureq::get(url.as_str())
        .header("Authorization", &format!("Bearer {access_token}"))
        .config()
        .http_status_as_error(false)
        .build()
        .call()
        .map_err(|_| "Pi-Music could not reach YouTube right now. Please try again.".to_owned())?;
    if !response.status().is_success() {
        return Err(youtube_error(response.status().as_u16()));
    }
    Ok(response)
}

pub fn search_videos(vault: &TokenVault, client_id: &str, value: &str) -> Result<Vec<YoutubeSearchResult>, String> {
    let query = safe_query(value, 120)?;
    let response = authorized_get(
        vault,
        client_id,
        "search",
        &[
            ("part", "snippet"),
            ("q", query.as_str()),
            ("type", "video"),
            ("videoEmbeddable", "true"),
            ("videoSyndicated", "true"),
            ("maxResults", "20"),
        ],
    )?;
    let payload: SearchResponse = response.into_body().read_json().map_err(|_| "YouTube returned results Pi-Music could not read.".to_owned())?;
    Ok(payload
        .items
        .into_iter()
        .filter_map(|item| {
            item.id.video_id.map(|video_id| YoutubeSearchResult {
                video_id,
                title: item.snippet.title,
                channel_title: item.snippet.channel_title,
                thumbnail_url: thumbnail_url(item.snippet.thumbnails),
            })
        })
        .collect())
}

pub fn my_playlists(vault: &TokenVault, client_id: &str) -> Result<Vec<YoutubePlaylist>, String> {
    let response = authorized_get(
        vault,
        client_id,
        "playlists",
        &[("part", "snippet,contentDetails"), ("mine", "true"), ("maxResults", "50")],
    )?;
    let payload: PlaylistResponse = response.into_body().read_json().map_err(|_| "YouTube returned playlists Pi-Music could not read.".to_owned())?;
    Ok(payload
        .items
        .into_iter()
        .map(|item| YoutubePlaylist {
            playlist_id: item.id,
            title: item.snippet.title,
            item_count: item.content_details.and_then(|details| details.item_count).unwrap_or(0),
            thumbnail_url: thumbnail_url(item.snippet.thumbnails),
        })
        .collect())
}

pub fn playlist_items(vault: &TokenVault, client_id: &str, value: &str) -> Result<Vec<YoutubePlaylistItem>, String> {
    let playlist_id = safe_query(value, 160)?;
    let response = authorized_get(
        vault,
        client_id,
        "playlistItems",
        &[("part", "snippet"), ("playlistId", playlist_id.as_str()), ("maxResults", "50")],
    )?;
    let payload: PlaylistItemsResponse = response.into_body().read_json().map_err(|_| "YouTube returned playlist entries Pi-Music could not read.".to_owned())?;
    Ok(payload
        .items
        .into_iter()
        .map(|item| YoutubePlaylistItem {
            playlist_item_id: item.id,
            video_id: item.snippet.resource_id.video_id,
            title: item.snippet.title,
            channel_title: item.snippet.channel_title,
            position: item.snippet.position,
            thumbnail_url: thumbnail_url(item.snippet.thumbnails),
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::{safe_query, youtube_error};

    #[test]
    fn discovery_input_is_bounded_without_rewriting_listener_words() {
        assert_eq!(safe_query("  moon river  ", 120).unwrap(), "moon river");
        assert!(safe_query("", 120).is_err());
        assert!(safe_query(&"a".repeat(121), 120).is_err());
    }

    #[test]
    fn provider_errors_become_listener_safe_recovery_copy() {
        assert!(youtube_error(401).contains("sign-in"));
        assert!(youtube_error(429).contains("slow down"));
        assert!(!youtube_error(500).contains("500"));
    }
}
