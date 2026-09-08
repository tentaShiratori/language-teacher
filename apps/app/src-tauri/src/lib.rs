mod store;

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
            app.manage(store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_genbun,
            list_genbun,
            load_genbun,
            delete_genbun
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
