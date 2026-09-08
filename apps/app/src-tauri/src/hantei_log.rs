use crate::error_log::{log_rust_err, ErrorLogPaths};
use crate::hantei::Hantei;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

#[derive(Debug, Clone)]
pub struct HanteiLogPath(pub PathBuf);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HanteiLogLine {
    pub at: String,
    pub model: String,
    pub system_prompt: String,
    pub user_prompt: String,
    pub message_content: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hantei: Option<Hantei>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub fn hantei_log_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("hantei.jsonl")
}

pub fn now_iso() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let total_secs = duration.as_secs() as i64;
    let millis = duration.subsec_millis();
    let days = total_secs.div_euclid(86_400);
    let tod = total_secs.rem_euclid(86_400) as u32;
    let (year, month, day) = civil_from_days(days);
    let hour = tod / 3600;
    let minute = (tod % 3600) / 60;
    let second = tod % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}.{millis:03}Z")
}

/// Howard Hinnant's civil-from-days (UTC calendar date from days since Unix epoch).
fn civil_from_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 }.div_euclid(146_097);
    let doe = (z - era * 146_097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y as i32, m, d)
}

pub fn append_hantei_log(path: &Path, line: &HanteiLogLine) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| e.to_string())?;
    let mut json = serde_json::to_string(line).map_err(|e| e.to_string())?;
    json.push('\n');
    file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn write_attempt(
    path: &Path,
    at: String,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    message_content: Option<&str>,
    outcome: Result<&Hantei, &str>,
) -> Result<(), String> {
    let line = HanteiLogLine {
        at,
        model: model.to_string(),
        system_prompt: system_prompt.to_string(),
        user_prompt: user_prompt.to_string(),
        message_content: message_content.map(str::to_string),
        hantei: outcome.as_ref().ok().map(|h| (*h).clone()),
        error: outcome.err().map(str::to_string),
    };
    append_hantei_log(path, &line)
}

/// ログファイルを読み、新しい行を先にする。無い・空なら空配列。
pub fn list_lines(path: &Path) -> Result<Vec<HanteiLogLine>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }
    let body = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut lines = Vec::new();
    for line in body.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parsed: HanteiLogLine = serde_json::from_str(trimmed).map_err(|e| e.to_string())?;
        lines.push(parsed);
    }
    lines.reverse();
    Ok(lines)
}

#[tauri::command]
pub fn list_hantei_log(
    log_path: State<'_, HanteiLogPath>,
    error_log: State<'_, ErrorLogPaths>,
) -> Result<Vec<HanteiLogLine>, String> {
    log_rust_err(&error_log.rust, list_lines(&log_path.0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_log_path(tag: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("language_teacher_hantei_log_{tag}_{nanos}.jsonl"))
    }

    fn sample_hantei() -> Hantei {
        Hantei {
            tekisetsu: true,
            imi: true,
            bunpo: true,
            shiteki: Some("もう少し自然に".into()),
            hinto: None,
            kasho: vec![],
        }
    }

    #[test]
    fn success_line_writes_normalized_hantei() {
        let path = temp_log_path("ok");
        let hantei = sample_hantei();
        write_attempt(
            &path,
            "2026-09-08T00:00:00.000Z".into(),
            "qwen3:8b",
            "system",
            "user",
            Some(r#"{"tekisetsu":true,"imi":true,"bunpo":true,"shiteki":"もう少し自然に","hinto":null}"#),
            Ok(&hantei),
        )
        .unwrap();

        let body = fs::read_to_string(&path).unwrap();
        let line: serde_json::Value = serde_json::from_str(body.trim()).unwrap();
        assert_eq!(line["at"], "2026-09-08T00:00:00.000Z");
        assert_eq!(line["model"], "qwen3:8b");
        assert_eq!(line["systemPrompt"], "system");
        assert_eq!(line["userPrompt"], "user");
        assert!(line["messageContent"]
            .as_str()
            .unwrap()
            .contains("tekisetsu"));
        assert_eq!(line["hantei"]["tekisetsu"], true);
        assert_eq!(line["hantei"]["shiteki"], "もう少し自然に");
        assert!(line.get("error").is_none());
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn parse_failure_line_keeps_content_and_error() {
        let path = temp_log_path("parse");
        write_attempt(
            &path,
            "2026-09-08T00:00:01.000Z".into(),
            "qwen3:8b",
            "system",
            "user",
            Some("not json"),
            Err("JSON オブジェクトが無い"),
        )
        .unwrap();

        let body = fs::read_to_string(&path).unwrap();
        let line: serde_json::Value = serde_json::from_str(body.trim()).unwrap();
        assert_eq!(line["messageContent"], "not json");
        assert!(line.get("hantei").is_none());
        assert_eq!(line["error"], "JSON オブジェクトが無い");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn append_adds_one_line_per_attempt() {
        let path = temp_log_path("append");
        let hantei = sample_hantei();
        write_attempt(
            &path,
            "2026-09-08T00:00:00.000Z".into(),
            "qwen3:8b",
            "s",
            "u",
            Some("bad"),
            Err("JSON オブジェクトが無い"),
        )
        .unwrap();
        write_attempt(
            &path,
            "2026-09-08T00:00:01.000Z".into(),
            "qwen3:8b",
            "s",
            "u",
            Some(r#"{"tekisetsu":true,"imi":true,"bunpo":true,"shiteki":null,"hinto":null}"#),
            Ok(&hantei),
        )
        .unwrap();

        let body = fs::read_to_string(&path).unwrap();
        let lines: Vec<_> = body.lines().filter(|l| !l.is_empty()).collect();
        assert_eq!(lines.len(), 2);
        let first: serde_json::Value = serde_json::from_str(lines[0]).unwrap();
        let second: serde_json::Value = serde_json::from_str(lines[1]).unwrap();
        assert_eq!(first["error"], "JSON オブジェクトが無い");
        assert_eq!(second["hantei"]["tekisetsu"], true);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn http_failure_line_has_no_message_content() {
        let path = temp_log_path("http");
        write_attempt(
            &path,
            "2026-09-08T00:00:02.000Z".into(),
            "qwen3:8b",
            "s",
            "u",
            None,
            Err("chat completions HTTP 500"),
        )
        .unwrap();

        let body = fs::read_to_string(&path).unwrap();
        let line: serde_json::Value = serde_json::from_str(body.trim()).unwrap();
        assert!(line["messageContent"].is_null());
        assert_eq!(line["error"], "chat completions HTTP 500");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn log_path_is_under_app_data_dir() {
        let dir = PathBuf::from("/tmp/app-data");
        assert_eq!(
            hantei_log_path(&dir),
            PathBuf::from("/tmp/app-data/hantei.jsonl")
        );
    }

    #[test]
    fn list_lines_returns_newest_first() {
        let path = temp_log_path("list");
        let hantei = sample_hantei();
        write_attempt(
            &path,
            "2026-09-08T00:00:00.000Z".into(),
            "qwen3:8b",
            "s1",
            "u1",
            Some("old"),
            Err("古い失敗"),
        )
        .unwrap();
        write_attempt(
            &path,
            "2026-09-08T00:00:01.000Z".into(),
            "qwen3:8b",
            "s2",
            "u2",
            Some(r#"{"tekisetsu":true,"imi":true,"bunpo":true,"shiteki":null,"hinto":null}"#),
            Ok(&hantei),
        )
        .unwrap();

        let lines = list_lines(&path).unwrap();
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].at, "2026-09-08T00:00:01.000Z");
        assert!(lines[0].hantei.as_ref().unwrap().tekisetsu);
        assert_eq!(lines[1].error.as_deref(), Some("古い失敗"));
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn list_lines_missing_file_is_empty() {
        let path = temp_log_path("missing");
        let _ = fs::remove_file(&path);
        let lines = list_lines(&path).unwrap();
        assert!(lines.is_empty());
    }
}
