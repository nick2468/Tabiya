//! The Tauri shell around the London Trainer web app.
//!
//! It does almost nothing on purpose. The app is the same web build that runs
//! in a browser; the only reason for the wrapper is a real window on Windows
//! and a place to keep progress that survives clearing browser data.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running the London Trainer window");
}
