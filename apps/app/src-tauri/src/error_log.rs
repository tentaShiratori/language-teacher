use crate::hantei_log::now_iso;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use tauri::State;
use ts_rs::TS;

#[derive(Debug, Clone)]
pub struct ErrorLogPaths {
    pub rust: PathBuf,
    pub js: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[serde(rename_all = "camelCase")]
pub struct ErrorLogLine {
    pub at: String,
    pub message: String,
    pub stack: Option<String>,
}

pub fn error_rust_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("error_rust.jsonl")
}

pub fn error_js_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("error_js.jsonl")
}

pub fn append_error_log(path: &Path, line: &ErrorLogLine) -> Result<(), String> {
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

pub fn write_error(path: &Path, message: &str, stack: Option<&str>) -> Result<(), String> {
    let line = ErrorLogLine {
        at: now_iso(),
        message: message.to_string(),
        stack: stack.map(str::to_string),
    };
    append_error_log(path, &line)
}

pub fn log_rust_err<T>(path: &Path, result: Result<T, String>) -> Result<T, String> {
    if let Err(message) = &result {
        let _ = write_error(path, message, None);
    }
    result
}

static PANIC_LOG_PATH: OnceLock<PathBuf> = OnceLock::new();

pub fn install_panic_hook(rust_path: PathBuf) {
    let _ = PANIC_LOG_PATH.set(rust_path);
    let previous = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        if let Some(path) = PANIC_LOG_PATH.get() {
            let message = panic_message(info);
            let stack = info
                .location()
                .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()));
            let _ = write_error(path, &message, stack.as_deref());
        }
        previous(info);
    }));
}

fn panic_message(info: &std::panic::PanicHookInfo<'_>) -> String {
    if let Some(s) = info.payload().downcast_ref::<&str>() {
        return (*s).to_string();
    }
    if let Some(s) = info.payload().downcast_ref::<String>() {
        return s.clone();
    }
    "panic".to_string()
}

#[tauri::command]
pub fn log_js_error(paths: State<'_, ErrorLogPaths>, line: ErrorLogLine) -> Result<(), String> {
    append_error_log(&paths.js, &line)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_path(tag: &str) -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("language_teacher_error_log_{tag}_{nanos}.jsonl"))
    }

    #[test]
    fn line_serializes_same_camel_case_keys() {
        let line = ErrorLogLine {
            at: "2026-09-08T00:00:00.000Z".into(),
            message: "boom".into(),
            stack: Some("at foo".into()),
        };
        let value = serde_json::to_value(&line).unwrap();
        assert_eq!(value["at"], "2026-09-08T00:00:00.000Z");
        assert_eq!(value["message"], "boom");
        assert_eq!(value["stack"], "at foo");
        assert!(value.get("at").is_some());
        assert!(value.get("message").is_some());
        assert!(value.get("stack").is_some());
    }

    #[test]
    fn null_stack_is_serialized() {
        let line = ErrorLogLine {
            at: "2026-09-08T00:00:00.000Z".into(),
            message: "no stack".into(),
            stack: None,
        };
        let value = serde_json::to_value(&line).unwrap();
        assert!(value["stack"].is_null());
    }

    #[test]
    fn append_adds_one_line_per_error() {
        let path = temp_path("append");
        append_error_log(
            &path,
            &ErrorLogLine {
                at: "2026-09-08T00:00:00.000Z".into(),
                message: "first".into(),
                stack: None,
            },
        )
        .unwrap();
        append_error_log(
            &path,
            &ErrorLogLine {
                at: "2026-09-08T00:00:01.000Z".into(),
                message: "second".into(),
                stack: Some("trace".into()),
            },
        )
        .unwrap();

        let body = fs::read_to_string(&path).unwrap();
        let lines: Vec<_> = body.lines().filter(|l| !l.is_empty()).collect();
        assert_eq!(lines.len(), 2);
        let first: serde_json::Value = serde_json::from_str(lines[0]).unwrap();
        let second: serde_json::Value = serde_json::from_str(lines[1]).unwrap();
        assert_eq!(first["message"], "first");
        assert_eq!(second["message"], "second");
        assert_eq!(second["stack"], "trace");
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn rust_and_js_paths_do_not_mix() {
        let dir = PathBuf::from("/tmp/app-data");
        assert_eq!(
            error_rust_path(&dir),
            PathBuf::from("/tmp/app-data/error_rust.jsonl")
        );
        assert_eq!(
            error_js_path(&dir),
            PathBuf::from("/tmp/app-data/error_js.jsonl")
        );
        assert_ne!(error_rust_path(&dir), error_js_path(&dir));
    }

    #[test]
    fn write_to_separate_files_stays_isolated() {
        let rust = temp_path("rust");
        let js = temp_path("js");
        write_error(&rust, "from rust", None).unwrap();
        append_error_log(
            &js,
            &ErrorLogLine {
                at: "2026-09-08T00:00:00.000Z".into(),
                message: "from js".into(),
                stack: None,
            },
        )
        .unwrap();

        let rust_body = fs::read_to_string(&rust).unwrap();
        let js_body = fs::read_to_string(&js).unwrap();
        assert!(rust_body.contains("from rust"));
        assert!(!rust_body.contains("from js"));
        assert!(js_body.contains("from js"));
        assert!(!js_body.contains("from rust"));
        let _ = fs::remove_file(&rust);
        let _ = fs::remove_file(&js);
    }

    #[test]
    fn log_rust_err_writes_on_err_and_passes_through() {
        let path = temp_path("cmd_err");
        let err = log_rust_err::<()>(&path, Err("command failed".into()));
        assert_eq!(err.unwrap_err(), "command failed");
        let body = fs::read_to_string(&path).unwrap();
        let line: serde_json::Value = serde_json::from_str(body.trim()).unwrap();
        assert_eq!(line["message"], "command failed");
        assert!(line["stack"].is_null());

        let ok = log_rust_err(&path, Ok(42));
        assert_eq!(ok.unwrap(), 42);
        let body_after = fs::read_to_string(&path).unwrap();
        assert_eq!(body_after.lines().filter(|l| !l.is_empty()).count(), 1);
        let _ = fs::remove_file(&path);
    }
}
