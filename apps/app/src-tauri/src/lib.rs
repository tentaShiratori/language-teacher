mod error_log;
mod hantei;
mod hantei_log;
mod kasho;
mod ollama;
mod store;

#[cfg(test)]
mod export_bindings;

use error_log::{error_js_path, error_rust_path, install_panic_hook, log_js_error, ErrorLogPaths};
use hantei::hantei_bun;
use hantei_log::{hantei_log_path, list_hantei_log, HanteiLogPath};
use ollama::{load_settings, ollama_status, save_settings};
use store::{delete_genbun, list_genbun, load_genbun, save_genbun, Store};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            std::fs::create_dir_all(&dir)?;
            let db_path = dir.join("store.sqlite");
            let store = Store::open(&db_path).map_err(|e| e.to_string())?;
            let rust_path = error_rust_path(&dir);
            install_panic_hook(rust_path.clone());
            app.manage(store);
            app.manage(HanteiLogPath(hantei_log_path(&dir)));
            app.manage(ErrorLogPaths {
                rust: rust_path,
                js: error_js_path(&dir),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_genbun,
            list_genbun,
            load_genbun,
            delete_genbun,
            ollama_status,
            load_settings,
            save_settings,
            hantei_bun,
            list_hantei_log,
            log_js_error
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
