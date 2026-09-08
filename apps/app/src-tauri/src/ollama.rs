use crate::store::{Settings, Store};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum OllamaStatus {
    Ok,
    Unreachable,
    ModelMissing { model: String },
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Vec<TagModel>,
}

#[derive(Debug, Deserialize)]
struct TagModel {
    name: String,
}

pub fn tags_url(base_url: &str) -> String {
    format!("{}/api/tags", base_url.trim_end_matches('/'))
}

pub fn status_from_model_names(model: &str, names: &[String]) -> OllamaStatus {
    if names.iter().any(|name| name == model) {
        OllamaStatus::Ok
    } else {
        OllamaStatus::ModelMissing {
            model: model.to_string(),
        }
    }
}

pub fn fetch_ollama_status(base_url: &str, model: &str) -> OllamaStatus {
    let url = tags_url(base_url);
    let response = match ureq::get(&url).call() {
        Ok(response) => response,
        Err(_) => return OllamaStatus::Unreachable,
    };
    if !(200..300).contains(&response.status()) {
        return OllamaStatus::Unreachable;
    }
    let tags: TagsResponse = match response.into_json() {
        Ok(tags) => tags,
        Err(_) => return OllamaStatus::Unreachable,
    };
    let names: Vec<String> = tags.models.into_iter().map(|m| m.name).collect();
    status_from_model_names(model, &names)
}

#[tauri::command]
pub fn ollama_status(store: State<'_, Store>) -> Result<OllamaStatus, String> {
    let settings = store.load_settings()?;
    Ok(fetch_ollama_status(
        &settings.ollama_base_url,
        &settings.ollama_model,
    ))
}

#[tauri::command]
pub fn load_settings(store: State<'_, Store>) -> Result<Settings, String> {
    store.load_settings()
}

#[tauri::command]
pub fn save_settings(store: State<'_, Store>, settings: Settings) -> Result<OllamaStatus, String> {
    store.save_settings(settings)?;
    let saved = store.load_settings()?;
    Ok(fetch_ollama_status(
        &saved.ollama_base_url,
        &saved.ollama_model,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tags_url_trims_trailing_slash() {
        assert_eq!(
            tags_url("http://127.0.0.1:11434/"),
            "http://127.0.0.1:11434/api/tags"
        );
        assert_eq!(
            tags_url("http://127.0.0.1:11434"),
            "http://127.0.0.1:11434/api/tags"
        );
    }

    #[test]
    fn status_ok_when_model_listed() {
        let names = vec!["qwen3:8b".to_string(), "qwen3:14b".to_string()];
        assert_eq!(
            status_from_model_names("qwen3:8b", &names),
            OllamaStatus::Ok
        );
    }

    #[test]
    fn status_model_missing_when_absent() {
        let names = vec!["llama3:8b".to_string()];
        assert_eq!(
            status_from_model_names("qwen3:8b", &names),
            OllamaStatus::ModelMissing {
                model: "qwen3:8b".to_string()
            }
        );
    }

    #[test]
    fn status_model_missing_on_empty_list() {
        assert_eq!(
            status_from_model_names("qwen3:8b", &[]),
            OllamaStatus::ModelMissing {
                model: "qwen3:8b".to_string()
            }
        );
    }

    #[test]
    fn status_requires_exact_name() {
        let names = vec!["qwen3:8b-q4".to_string()];
        assert_eq!(
            status_from_model_names("qwen3:8b", &names),
            OllamaStatus::ModelMissing {
                model: "qwen3:8b".to_string()
            }
        );
    }

    #[test]
    fn unreachable_when_host_down() {
        let status = fetch_ollama_status("http://127.0.0.1:1", "qwen3:8b");
        assert_eq!(status, OllamaStatus::Unreachable);
    }
}
