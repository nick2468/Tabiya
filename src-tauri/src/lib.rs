//! The Tauri shell around the Repertoire Trainer web app.
//!
//! It does almost nothing on purpose. The app is the same web build that runs
//! in a browser; the only reason for the wrapper is a real window on Windows
//! and a place to keep progress that survives clearing browser data.
//!
//! The one thing it does do is choose where the window keeps its WebView2
//! profile. Tauri's default is a folder named after the bundle identifier,
//! which on this machine meant `%LOCALAPPDATA%\com.nick.london-trainer` for an
//! app called Repertoire Trainer. The identifier itself deliberately does not
//! change: NSIS keys the install on the product name, nobody ever sees the
//! identifier, and changing it would buy nothing while adding a third
//! generation of folder for the frontend's migration to carry a trainee out
//! of. (This comment said until phase 47 that changing the identifier had
//! already put a second app beside the first. It had not: the identifier has
//! never changed. The second app came from the PRODUCT NAME change at phase
//! 15. The matching correction is in `src/storage/paths.ts`.) So the folder is
//! pointed somewhere sensible instead. Sensible is NOT
//! `%LOCALAPPDATA%\Repertoire Trainer`: that is the install folder itself.
//!
//! That is why the window is built here rather than left to `tauri.conf.json`.
//! Every setting still lives in the config: the window is declared there with
//! `"create": false`, and `WebviewWindowBuilder::from_config` reads that same
//! declaration back. Nothing is copied by hand, so nothing can drift.

use tauri::{Manager, WebviewWindowBuilder};

/// The app's own folder under the user's local data folder.
///
/// NOT `Tabiya`, which is the INSTALL folder, and the ` Data` on the end is
/// what keeps the two apart. The NSIS installer's `InstallLocation` is
/// `%LOCALAPPDATA%\<product name>`, verified in the registry at phase 16 when
/// the product was called something else. Putting the profile there would mean
/// an uninstall wiping it, and the frontend keeps its second copy of the
/// progress file in this same folder, where an uninstall must not reach. The
/// frontend has the same literal in `src/storage/paths.ts`, and
/// `installer-hooks.nsh` has it a third time.
const LOCAL_FOLDER: &str = "Tabiya Data";

/// The browser profile inside it: cache, cookies and local storage.
const WEBVIEW_FOLDER: &str = "WebView2";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Cloned so the borrow of the config ends here: the builder below
            // wants the app handle, and holding both at once would not compile.
            let window = app
                .config()
                .app
                .windows
                .first()
                .cloned()
                .expect("tauri.conf.json declares the main window");

            let mut builder = WebviewWindowBuilder::from_config(app.handle(), &window)?;
            // A machine that cannot say where its local data folder is falls
            // back to Tauri's own choice, which is the behaviour this app had
            // before. Failing to open a window over a folder name would be a
            // worse trade than an untidy folder.
            if let Ok(local) = app.path().local_data_dir() {
                builder = builder.data_directory(local.join(LOCAL_FOLDER).join(WEBVIEW_FOLDER));
            }
            builder.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the Repertoire Trainer window");
}
