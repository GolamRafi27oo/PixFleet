pub mod engine;

use base64::Engine;
use engine::{ExportResult, Preset, Source};
use serde::Serialize;
use std::{
    collections::{HashMap, HashSet},
    fs,
    io::{Read, Write},
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
};
use tauri::{Emitter, Manager, State};

#[derive(Default)]
struct Session {
    sources: Mutex<HashMap<String, Source>>,
    busy: Arc<AtomicBool>,
    cancelled: Arc<AtomicBool>,
}
#[derive(Serialize)]
struct Asset {
    id: String,
    name: String,
    width: u32,
    height: u32,
    bytes: u64,
    thumbnail: String,
}
#[derive(Default, Serialize)]
struct ImportResult {
    images: Vec<Asset>,
    errors: Vec<String>,
}
struct BusyGuard(Arc<AtomicBool>);
impl Drop for BusyGuard {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

fn collect(paths: Vec<PathBuf>) -> (Vec<PathBuf>, Vec<String>) {
    let mut files = Vec::new();
    let mut errors = Vec::new();
    let mut stack = paths;
    let mut visited = 0;
    while let Some(path) = stack.pop() {
        visited += 1;
        if files.len() >= engine::MAX_FILES || visited > 10000 {
            errors.push("Import limit reached (500 files / 10,000 folder entries). Import a smaller folder.".into());
            break;
        }
        let metadata = match fs::symlink_metadata(&path) {
            Ok(m) => m,
            Err(_) => {
                errors.push(format!(
                    "Cannot read {}",
                    path.file_name().unwrap_or_default().to_string_lossy()
                ));
                continue;
            }
        };
        if metadata.file_type().is_symlink() {
            continue;
        }
        if metadata.is_dir() {
            match fs::read_dir(&path) {
                Ok(entries) => {
                    for entry in entries.take(10001_usize.saturating_sub(stack.len())) {
                        match entry {
                            Ok(entry) => stack.push(entry.path()),
                            Err(_) => errors.push("A folder entry could not be read".into()),
                        }
                    }
                }
                Err(_) => errors.push(format!(
                    "Cannot open folder {}",
                    path.file_name().unwrap_or_default().to_string_lossy()
                )),
            }
        } else if path.extension().is_some_and(|s| {
            matches!(
                s.to_string_lossy().to_ascii_lowercase().as_str(),
                "jpg" | "jpeg" | "png" | "webp"
            )
        }) {
            files.push(path);
        }
    }
    files.sort();
    (files, errors)
}

fn import(app: &tauri::AppHandle, paths: Vec<PathBuf>) -> Result<ImportResult, String> {
    let (paths, errors) = collect(paths);
    let state = app.state::<Session>();
    let mut sources = state
        .sources
        .lock()
        .map_err(|_| "Image registry unavailable")?;
    let mut existing: HashSet<PathBuf> = sources.values().map(|s| s.path.clone()).collect();
    let mut result = ImportResult {
        images: Vec::new(),
        errors,
    };
    for path in paths {
        if sources.len() >= engine::MAX_FILES {
            result.errors.push(
                "The workspace holds up to 500 images. Remove some before importing more.".into(),
            );
            break;
        }
        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
        let path = match path.canonicalize() {
            Ok(p) => p,
            Err(_) => {
                result.errors.push(format!("{name}: file is unavailable"));
                continue;
            }
        };
        if !existing.insert(path.clone()) {
            continue;
        }
        match engine::decode(&path) {
            Ok((image, bytes)) => {
                let mut thumbnail = std::io::Cursor::new(Vec::new());
                image
                    .thumbnail(160, 120)
                    .to_rgb8()
                    .write_to(&mut thumbnail, image::ImageFormat::Jpeg)
                    .map_err(|e| e.to_string())?;
                let id = uuid::Uuid::new_v4().to_string();
                result.images.push(Asset {
                    id: id.clone(),
                    name: name.clone(),
                    width: image.width(),
                    height: image.height(),
                    bytes,
                    thumbnail: format!(
                        "data:image/jpeg;base64,{}",
                        base64::engine::general_purpose::STANDARD.encode(thumbnail.into_inner())
                    ),
                });
                sources.insert(id, Source { path, name });
            }
            Err(e) => result.errors.push(format!("{name}: {e}")),
        }
    }
    Ok(result)
}

#[tauri::command]
async fn pick_images(app: tauri::AppHandle, folder: bool) -> Result<ImportResult, String> {
    let dialog = rfd::AsyncFileDialog::new().set_title(if folder {
        "Add an image folder"
    } else {
        "Add images"
    });
    let paths = if folder {
        dialog
            .pick_folder()
            .await
            .map(|f| vec![f.path().to_owned()])
    } else {
        dialog
            .add_filter("Images", &["jpg", "jpeg", "png", "webp"])
            .pick_files()
            .await
            .map(|files| files.into_iter().map(|f| f.path().to_owned()).collect())
    };
    match paths {
        Some(paths) => tauri::async_runtime::spawn_blocking(move || import(&app, paths))
            .await
            .map_err(|e| e.to_string())?,
        None => Ok(ImportResult::default()),
    }
}

#[tauri::command]
async fn import_paths(app: tauri::AppHandle, paths: Vec<String>) -> Result<ImportResult, String> {
    if paths.len() > engine::MAX_FILES {
        return Err("Drop up to 500 files at a time".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        import(&app, paths.into_iter().map(PathBuf::from).collect())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn remove_images(state: State<Session>, ids: Vec<String>) -> Result<(), String> {
    let mut sources = state
        .sources
        .lock()
        .map_err(|_| "Image registry unavailable")?;
    for id in ids {
        sources.remove(&id);
    }
    Ok(())
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("presets-v1.json"))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn load_presets(app: tauri::AppHandle) -> Result<Vec<Preset>, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let mut bytes = Vec::new();
    fs::File::open(&path)
        .map_err(|e| e.to_string())?
        .take(1024 * 1024 + 1)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    if bytes.len() > 1024 * 1024 {
        return Err("Preset file is too large".into());
    }
    let presets: Vec<Preset> = serde_json::from_slice(&bytes).map_err(|e| {
        format!(
            "Saved presets are damaged: {e}. Back up {} before resetting it.",
            path.display()
        )
    })?;
    if presets.len() > 100 {
        return Err("Too many saved presets".into());
    }
    if presets.iter().map(|p| &p.id).collect::<HashSet<_>>().len() != presets.len() {
        return Err(
            "Saved presets contain duplicate IDs. Back up the preset file before repairing it."
                .into(),
        );
    }
    for preset in &presets {
        preset.validate()?;
    }
    Ok(presets)
}

#[tauri::command]
fn save_presets(app: tauri::AppHandle, presets: Vec<Preset>) -> Result<(), String> {
    if presets.len() > 100 {
        return Err("Save up to 100 presets".into());
    }
    if presets.iter().map(|p| &p.id).collect::<HashSet<_>>().len() != presets.len() {
        return Err("Preset IDs must be unique".into());
    }
    for preset in &presets {
        preset.validate()?;
    }
    let path = settings_path(&app)?;
    let parent = path.parent().ok_or("Invalid settings path")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(|e| e.to_string())?;
    temp.write_all(&serde_json::to_vec_pretty(&presets).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    temp.as_file().sync_all().map_err(|e| e.to_string())?;
    temp.persist(path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn export_images(
    app: tauri::AppHandle,
    ids: Vec<String>,
    preset: Preset,
) -> Result<Option<ExportResult>, String> {
    preset.validate()?;
    if ids.is_empty()
        || ids.len() > engine::MAX_FILES
        || ids.iter().collect::<HashSet<_>>().len() != ids.len()
    {
        return Err("Select 1–500 unique images".into());
    }
    let state = app.state::<Session>();
    if state
        .busy
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Err("An export is already running".into());
    }
    let guard = BusyGuard(state.busy.clone());
    state.cancelled.store(false, Ordering::SeqCst);
    let cancelled = state.cancelled.clone();
    let sources: Vec<Source> = {
        let registry = state
            .sources
            .lock()
            .map_err(|_| "Image registry unavailable")?;
        ids.iter()
            .map(|id| {
                registry
                    .get(id)
                    .cloned()
                    .ok_or_else(|| "An image is no longer in the workspace".to_owned())
            })
            .collect::<Result<_, _>>()?
    };
    let folder = rfd::AsyncFileDialog::new()
        .set_title("Choose where to save your assets")
        .pick_folder()
        .await;
    let Some(folder) = folder else {
        return Ok(None);
    };
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = guard;
        engine::export(&sources, &preset, folder.path(), &cancelled, |progress| {
            let _ = app.emit("export-progress", progress);
        })
        .map(Some)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn cancel_export(state: State<Session>) {
    state.cancelled.store(true, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Session::default())
        .invoke_handler(tauri::generate_handler![
            pick_images,
            import_paths,
            remove_images,
            load_presets,
            save_presets,
            export_images,
            cancel_export
        ])
        .run(tauri::generate_context!())
        .expect("PixFleet could not start");
}
