use tauri::Manager;
use zip_extensions::*;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn uncompress(uncompress_path: &str, dest: &str) {
    let destn = std::path::Path::new(dest).to_path_buf();
    let fname = std::path::Path::new(uncompress_path).to_path_buf();

    println!("{}", dest);
    println!("{}", uncompress_path);

    let _extraction = zip_extract(&fname, &destn).unwrap();

    println!("worked!");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            let _ = app.get_webview_window("main")
                       .expect("no main window")
                       .set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_prevent_default::debug())
        .invoke_handler(tauri::generate_handler![uncompress])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
