use notify::{Config as NotifyConfig, RecommendedWatcher, RecursiveMode, Watcher};
use pulldown_cmark::{html, Options, Parser};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub opened_at: String,
}

pub struct AppState {
    pub recent_files: Mutex<Vec<RecentFile>>,
    pub watchers: Mutex<HashMap<String, RecommendedWatcher>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            recent_files: Mutex::new(Vec::new()),
            watchers: Mutex::new(HashMap::new()),
        }
    }
}

mod commands {
    use super::*;

    #[tauri::command]
    pub fn read_file(path: String, state: State<AppState>) -> Result<String, String> {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

        let file_name = Path::new(&path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&path)
            .to_string();

        let now = chrono::Utc::now().to_rfc3339();
        let recent = RecentFile {
            path: path.clone(),
            name: file_name,
            opened_at: now,
        };

        let mut recents = state.recent_files.lock().unwrap();
        recents.retain(|r| r.path != path);
        recents.insert(0, recent);
        if recents.len() > 20 {
            recents.truncate(20);
        }

        Ok(content)
    }

    #[tauri::command]
    pub fn write_file(path: String, content: String) -> Result<(), String> {
        if let Some(parent) = Path::new(&path).parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&path, content).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
        let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

        let mut result: Vec<FileEntry> = entries
            .filter_map(|entry| {
                let entry = entry.ok()?;
                let metadata = entry.metadata().ok()?;
                let name = entry.file_name().to_string_lossy().to_string();

                if name.starts_with('.') || name == "_templates" {
                    return None;
                }

                Some(FileEntry {
                    name,
                    path: entry.path().to_string_lossy().to_string(),
                    is_dir: metadata.is_dir(),
                    children: None,
                })
            })
            .collect();

        result.sort_by(|a, b| match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        Ok(result)
    }

    #[tauri::command]
    pub fn parse_markdown(content: String) -> String {
        let options = Options::ENABLE_STRIKETHROUGH
            | Options::ENABLE_TABLES
            | Options::ENABLE_FOOTNOTES
            | Options::ENABLE_TASKLISTS
            | Options::ENABLE_SMART_PUNCTUATION;

        let parser = Parser::new_ext(&content, options);
        let mut html_output = String::with_capacity(content.len() * 2);
        html::push_html(&mut html_output, parser);
        html_output
    }

    #[tauri::command]
    pub fn watch_file(
        path: String,
        app: AppHandle,
        state: State<AppState>,
    ) -> Result<(), String> {
        let app_clone = app.clone();

        let mut watcher = RecommendedWatcher::new(
            move |result: notify::Result<notify::Event>| {
                if let Ok(event) = result {
                    for p in event.paths {
                        let path_str = p.to_string_lossy().to_string();
                        let _ = app_clone.emit("file-changed", path_str);
                    }
                }
            },
            NotifyConfig::default().with_poll_interval(Duration::from_millis(500)),
        )
        .map_err(|e| e.to_string())?;

        watcher
            .watch(Path::new(&path), RecursiveMode::NonRecursive)
            .map_err(|e| e.to_string())?;

        let mut watchers = state.watchers.lock().unwrap();
        watchers.insert(path, watcher);

        Ok(())
    }

    #[tauri::command]
    pub fn unwatch_file(path: String, state: State<AppState>) -> Result<(), String> {
        let mut watchers = state.watchers.lock().unwrap();
        watchers.remove(&path);
        Ok(())
    }

    #[tauri::command]
    pub fn get_recent_files(state: State<AppState>) -> Vec<RecentFile> {
        state.recent_files.lock().unwrap().clone()
    }

    #[tauri::command]
    pub async fn open_file_dialog(app: AppHandle) -> Option<String> {
        use tauri_plugin_dialog::DialogExt;

        app.dialog()
            .file()
            .add_filter("Markdown", &["md", "markdown", "txt"])
            .blocking_pick_file()
            .map(|p| p.to_string())
    }

    #[tauri::command]
    pub async fn open_directory_dialog(app: AppHandle) -> Option<String> {
        use tauri_plugin_dialog::DialogExt;

        app.dialog()
            .file()
            .blocking_pick_folder()
            .map(|p| p.to_string())
    }

    #[tauri::command]
    pub async fn save_file_dialog(
        app: AppHandle,
        _current_path: Option<String>,
    ) -> Option<String> {
        use tauri_plugin_dialog::DialogExt;

        app.dialog()
            .file()
            .add_filter("Markdown", &["md", "markdown"])
            .blocking_save_file()
            .map(|p| p.to_string())
    }

    #[tauri::command]
    pub async fn set_vibrancy(app: AppHandle, blur: bool) -> Result<(), String> {
        let app2 = app.clone();
        app.run_on_main_thread(move || {
            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
                if let Some(window) = app2.get_webview_window("main") {
                    if blur {
                        let _ = apply_vibrancy(
                            &window,
                            NSVisualEffectMaterial::UnderWindowBackground,
                            Some(NSVisualEffectState::Active),
                            None,
                        );
                    } else {
                        let _ = clear_vibrancy(&window);
                    }
                }
            }
        }).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn create_file(path: String) -> Result<(), String> {
        if let Some(parent) = Path::new(&path).parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&path, "").map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn create_directory(path: String) -> Result<(), String> {
        fs::create_dir_all(&path).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
        fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn delete_path(path: String, is_dir: bool) -> Result<(), String> {
        if is_dir {
            fs::remove_dir_all(&path).map_err(|e| e.to_string())
        } else {
            fs::remove_file(&path).map_err(|e| e.to_string())
        }
    }

    #[tauri::command]
    pub fn write_binary(path: String, data: Vec<u8>) -> Result<(), String> {
        if let Some(parent) = Path::new(&path).parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&path, data).map_err(|e| e.to_string())
    }

    #[derive(Serialize)]
    pub struct SearchResult {
        pub path: String,
        pub name: String,
        pub line: usize,
        pub preview: String,
    }

    #[tauri::command]
    pub fn search_files(root: String, query: String) -> Vec<SearchResult> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        fn walk(dir: &Path, query: &str, results: &mut Vec<SearchResult>) {
            let Ok(entries) = fs::read_dir(dir) else { return };
            for entry in entries.flatten() {
                let path = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') { continue; }
                if path.is_dir() {
                    walk(&path, query, results);
                } else if name.ends_with(".md") || name.ends_with(".markdown") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        for (i, line) in content.lines().enumerate() {
                            if line.to_lowercase().contains(query) {
                                results.push(SearchResult {
                                    path: path.to_string_lossy().to_string(),
                                    name: name.clone(),
                                    line: i + 1,
                                    preview: line.trim().chars().take(120).collect(),
                                });
                                if results.len() >= 200 { return; }
                            }
                        }
                    }
                }
            }
        }

        walk(Path::new(&root), &query_lower, &mut results);
        results
    }

    #[derive(Serialize)]
    pub struct FileTags {
        pub path: String,
        pub name: String,
        pub tags: Vec<String>,
        pub created: Option<String>,
    }

    #[tauri::command]
    pub fn scan_tags(root: String) -> Vec<FileTags> {
        let mut results = Vec::new();

        fn extract_tags(content: &str) -> (Vec<String>, Option<String>) {
            let content = content.trim_start();
            if !content.starts_with("---") { return (vec![], None); }
            let rest = &content[3..];
            let end = match rest.find("\n---") {
                Some(i) => i,
                None => return (vec![], None),
            };
            let yaml = &rest[..end];
            let mut in_tags = false;
            let mut tags = Vec::new();
            let mut created: Option<String> = None;
            for line in yaml.lines() {
                let line = line.trim();
                if line.starts_with("created:") {
                    let val = line[8..].trim().trim_matches('"').trim_matches('\'');
                    if !val.is_empty() { created = Some(val.to_string()); }
                }
                if line.starts_with("tags:") {
                    let inline = line[5..].trim();
                    if inline.starts_with('[') {
                        tags = inline.trim_matches(|c| c == '[' || c == ']')
                            .split(',')
                            .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
                            .filter(|s| !s.is_empty())
                            .collect();
                        in_tags = false;
                    } else {
                        in_tags = true;
                    }
                } else if in_tags && line.starts_with("- ") {
                    tags.push(line[2..].trim().trim_matches('"').trim_matches('\'').to_string());
                } else if in_tags && !line.starts_with('-') {
                    in_tags = false;
                }
            }
            (tags, created)
        }

        fn walk(dir: &Path, results: &mut Vec<FileTags>) {
            let Ok(entries) = fs::read_dir(dir) else { return };
            for entry in entries.flatten() {
                let path = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with('.') { continue; }
                if path.is_dir() {
                    walk(&path, results);
                } else if name.ends_with(".md") || name.ends_with(".markdown") {
                    if let Ok(content) = fs::read_to_string(&path) {
                        let (tags, created) = extract_tags(&content);
                        if !tags.is_empty() || created.is_some() {
                            results.push(FileTags {
                                path: path.to_string_lossy().to_string(),
                                name: name.clone(),
                                tags,
                                created,
                            });
                        }
                    }
                }
            }
        }

        walk(Path::new(&root), &mut results);
        results
    }

    #[derive(Serialize)]
    pub struct Template {
        pub path: String,
        pub name: String,
        pub content: String,
    }

    #[tauri::command]
    pub fn list_templates(root: String) -> Vec<Template> {
        let dir = Path::new(&root).join("_templates");
        let Ok(entries) = fs::read_dir(&dir) else { return vec![] };
        entries.flatten().filter_map(|entry| {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            if !name.ends_with(".md") { return None; }
            let content = fs::read_to_string(&path).unwrap_or_default();
            Some(Template {
                path: path.to_string_lossy().to_string(),
                name: name.trim_end_matches(".md").to_string(),
                content,
            })
        }).collect()
    }

    #[tauri::command]
    pub fn ensure_templates_dir(root: String) -> Result<(), String> {
        let dir = Path::new(&root).join("_templates");
        if !dir.exists() {
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let example = dir.join("Meeting Notes.md");
            fs::write(&example, "---\ntitle: Meeting Notes\ntype: source\ntags: [meeting]\ncreated: {{date}}\n---\n\n# Meeting Notes — {{date}}\n\n## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Notes\n\n\n\n## Action items\n\n- [ ] \n").map_err(|e| e.to_string())?;
            let daily = dir.join("Daily Note.md");
            fs::write(&daily, "---\ntitle: {{date}}\ntype: concept\ntags: [daily]\ncreated: {{date}}\n---\n\n# {{date}}\n\n## Today's focus\n\n\n\n## Notes\n\n\n\n## Done\n\n- [ ] \n").map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub fn save_as_template(root: String, name: String, content: String) -> Result<String, String> {
        let dir = Path::new(&root).join("_templates");
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        let safe_name = name.trim().replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
        let file_name = if safe_name.ends_with(".md") { safe_name } else { format!("{}.md", safe_name) };
        let path = dir.join(&file_name);
        fs::write(&path, &content).map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    }

    #[tauri::command]
    pub fn delete_template(path: String) -> Result<(), String> {
        fs::remove_file(&path).map_err(|e| e.to_string())
    }

    #[tauri::command]
    pub fn write_temp_html(html: String) -> Result<String, String> {
        let tmp = std::env::temp_dir().join(format!("md-editor-print-{}.html", chrono::Utc::now().timestamp_millis()));
        fs::write(&tmp, html).map_err(|e| e.to_string())?;
        Ok(tmp.to_string_lossy().to_string())
    }

    #[tauri::command]
    pub fn export_html(content: String, title: String) -> String {
        let options = Options::ENABLE_STRIKETHROUGH
            | Options::ENABLE_TABLES
            | Options::ENABLE_FOOTNOTES
            | Options::ENABLE_TASKLISTS
            | Options::ENABLE_SMART_PUNCTUATION;
        let parser = Parser::new_ext(&content, options);
        let mut body = String::new();
        html::push_html(&mut body, parser);

        format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }}
  pre {{ background: #f5f5f5; border-radius: 6px; padding: 16px; overflow-x: auto; }}
  code {{ font-family: 'JetBrains Mono', monospace; font-size: 0.875em; }}
  blockquote {{ border-left: 3px solid #4a9eff; padding-left: 1rem; margin: 0; color: #666; }}
  table {{ border-collapse: collapse; width: 100%; }} th, td {{ border: 1px solid #ddd; padding: 8px 12px; }} th {{ background: #f9f9f9; }}
  img {{ max-width: 100%; }}
  a {{ color: #4a9eff; }}
</style>
</head>
<body>
{body}
</body>
</html>"#)
    }
}

#[cfg(test)]
mod tests {
    use std::fs;
    use tempfile::TempDir;

    fn tempdir() -> TempDir {
        tempfile::tempdir().expect("tempdir")
    }

    mod parse_markdown_tests {
        use super::super::commands::parse_markdown;

        #[test]
        fn renders_heading() {
            let html = parse_markdown("# Hello".to_string());
            assert!(html.contains("<h1>Hello</h1>"));
        }

        #[test]
        fn renders_bold() {
            let html = parse_markdown("**bold**".to_string());
            assert!(html.contains("<strong>bold</strong>"));
        }

        #[test]
        fn renders_italic() {
            let html = parse_markdown("*italic*".to_string());
            assert!(html.contains("<em>italic</em>"));
        }

        #[test]
        fn renders_strikethrough() {
            let html = parse_markdown("~~strike~~".to_string());
            assert!(html.contains("<del>strike</del>"));
        }

        #[test]
        fn renders_table() {
            let html = parse_markdown("| A | B |\n|---|---|\n| 1 | 2 |".to_string());
            assert!(html.contains("<table>"));
            assert!(html.contains("<td>1</td>"));
        }

        #[test]
        fn renders_task_list() {
            let html = parse_markdown("- [x] done\n- [ ] todo".to_string());
            assert!(html.contains("checked"));
        }

        #[test]
        fn renders_code_block() {
            let html = parse_markdown("```rust\nfn main() {}\n```".to_string());
            assert!(html.contains("<code"));
        }

        #[test]
        fn renders_link() {
            let html = parse_markdown("[text](https://example.com)".to_string());
            assert!(html.contains(r#"href="https://example.com""#));
        }

        #[test]
        fn empty_input_returns_empty() {
            let html = parse_markdown("".to_string());
            assert_eq!(html.trim(), "");
        }

        #[test]
        fn blockquote() {
            let html = parse_markdown("> quote".to_string());
            assert!(html.contains("<blockquote>"));
        }
    }

    mod file_ops_tests {
        use super::super::commands::{write_file, list_directory};
        use super::*;

        #[test]
        fn write_and_read_roundtrip() {
            let dir = tempdir();
            let path = dir.path().join("test.md").to_string_lossy().to_string();
            write_file(path.clone(), "hello world".to_string()).unwrap();
            let content = fs::read_to_string(&path).unwrap();
            assert_eq!(content, "hello world");
        }

        #[test]
        fn write_creates_parent_dirs() {
            let dir = tempdir();
            let path = dir.path().join("a/b/c/test.md").to_string_lossy().to_string();
            write_file(path.clone(), "nested".to_string()).unwrap();
            assert!(fs::read_to_string(&path).is_ok());
        }

        #[test]
        fn list_directory_returns_entries() {
            let dir = tempdir();
            fs::write(dir.path().join("a.md"), "").unwrap();
            fs::write(dir.path().join("b.md"), "").unwrap();
            fs::create_dir(dir.path().join("subdir")).unwrap();
            let entries = list_directory(dir.path().to_string_lossy().to_string()).unwrap();
            assert_eq!(entries.len(), 3);
        }

        #[test]
        fn list_directory_sorts_dirs_first() {
            let dir = tempdir();
            fs::write(dir.path().join("z.md"), "").unwrap();
            fs::create_dir(dir.path().join("adir")).unwrap();
            let entries = list_directory(dir.path().to_string_lossy().to_string()).unwrap();
            assert!(entries[0].is_dir);
        }

        #[test]
        fn list_directory_hides_dotfiles() {
            let dir = tempdir();
            fs::write(dir.path().join(".hidden"), "").unwrap();
            fs::write(dir.path().join("visible.md"), "").unwrap();
            let entries = list_directory(dir.path().to_string_lossy().to_string()).unwrap();
            assert_eq!(entries.len(), 1);
            assert_eq!(entries[0].name, "visible.md");
        }

        #[test]
        fn list_directory_hides_templates_dir() {
            let dir = tempdir();
            fs::create_dir(dir.path().join("_templates")).unwrap();
            fs::write(dir.path().join("visible.md"), "").unwrap();
            let entries = list_directory(dir.path().to_string_lossy().to_string()).unwrap();
            assert_eq!(entries.len(), 1);
        }

        #[test]
        fn list_directory_nonexistent_returns_err() {
            let result = list_directory("/nonexistent/path/xyz".to_string());
            assert!(result.is_err());
        }
    }

    mod search_files_tests {
        use super::super::commands::search_files;
        use super::*;

        #[test]
        fn finds_matching_line() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"), "hello world\nfoo bar\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "hello".to_string());
            assert_eq!(results.len(), 1);
            assert_eq!(results[0].line, 1);
        }

        #[test]
        fn search_case_insensitive() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"), "Hello World\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "hello".to_string());
            assert_eq!(results.len(), 1);
        }

        #[test]
        fn no_match_returns_empty() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"), "nothing here\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "xyz123".to_string());
            assert!(results.is_empty());
        }

        #[test]
        fn skips_non_markdown() {
            let dir = tempdir();
            fs::write(dir.path().join("file.txt"), "searchterm\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "searchterm".to_string());
            assert!(results.is_empty());
        }

        #[test]
        fn searches_recursively() {
            let dir = tempdir();
            let sub = dir.path().join("sub");
            fs::create_dir(&sub).unwrap();
            fs::write(sub.join("deep.md"), "deep content\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "deep".to_string());
            assert_eq!(results.len(), 1);
        }

        #[test]
        fn skips_hidden_dirs() {
            let dir = tempdir();
            let hidden = dir.path().join(".hidden");
            fs::create_dir(&hidden).unwrap();
            fs::write(hidden.join("note.md"), "secret\n").unwrap();
            let results = search_files(dir.path().to_string_lossy().to_string(), "secret".to_string());
            assert!(results.is_empty());
        }
    }

    mod scan_tags_tests {
        use super::super::commands::scan_tags;
        use super::*;

        #[test]
        fn extracts_inline_tags() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"),
                "---\ntitle: Test\ntags: [rust, programming]\ncreated: 2024-01-01\n---\n\nbody").unwrap();
            let results = scan_tags(dir.path().to_string_lossy().to_string());
            assert_eq!(results.len(), 1);
            assert!(results[0].tags.contains(&"rust".to_string()));
            assert!(results[0].tags.contains(&"programming".to_string()));
        }

        #[test]
        fn extracts_block_tags() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"),
                "---\ntags:\n  - alpha\n  - beta\n---\n\nbody").unwrap();
            let results = scan_tags(dir.path().to_string_lossy().to_string());
            assert_eq!(results.len(), 1);
            assert!(results[0].tags.contains(&"alpha".to_string()));
        }

        #[test]
        fn extracts_created_date() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"),
                "---\ntags: [test]\ncreated: 2024-06-15\n---\n\nbody").unwrap();
            let results = scan_tags(dir.path().to_string_lossy().to_string());
            assert_eq!(results[0].created, Some("2024-06-15".to_string()));
        }

        #[test]
        fn skips_files_without_frontmatter() {
            let dir = tempdir();
            fs::write(dir.path().join("plain.md"), "just text").unwrap();
            let results = scan_tags(dir.path().to_string_lossy().to_string());
            assert!(results.is_empty());
        }

        #[test]
        fn skips_frontmatter_without_tags() {
            let dir = tempdir();
            fs::write(dir.path().join("note.md"),
                "---\ntitle: No tags here\n---\n\nbody").unwrap();
            let results = scan_tags(dir.path().to_string_lossy().to_string());
            assert!(results.is_empty());
        }
    }

    mod export_html_tests {
        use super::super::commands::export_html;

        #[test]
        fn produces_valid_html_skeleton() {
            let html = export_html("# Title\n\nbody".to_string(), "My Doc".to_string());
            assert!(html.contains("<!DOCTYPE html>"));
            assert!(html.contains("<title>My Doc</title>"));
            assert!(html.contains("<h1>Title</h1>"));
            assert!(html.contains("<p>body</p>"));
        }

        #[test]
        fn escapes_title_in_head() {
            let html = export_html("body".to_string(), "Test Title".to_string());
            assert!(html.contains("<title>Test Title</title>"));
        }

        #[test]
        fn renders_markdown_in_body() {
            let html = export_html("**bold** text".to_string(), "t".to_string());
            assert!(html.contains("<strong>bold</strong>"));
        }
    }

    mod template_tests {
        use super::super::commands::{save_as_template, list_templates, ensure_templates_dir, delete_template};
        use super::*;

        #[test]
        fn save_and_list_template() {
            let dir = tempdir();
            let root = dir.path().to_string_lossy().to_string();
            save_as_template(root.clone(), "My Template".to_string(), "# Content".to_string()).unwrap();
            let templates = list_templates(root);
            assert_eq!(templates.len(), 1);
            assert_eq!(templates[0].name, "My Template");
            assert_eq!(templates[0].content, "# Content");
        }

        #[test]
        fn save_template_sanitizes_name() {
            let dir = tempdir();
            let root = dir.path().to_string_lossy().to_string();
            save_as_template(root.clone(), "bad/name:test".to_string(), "content".to_string()).unwrap();
            let templates = list_templates(root);
            assert_eq!(templates.len(), 1);
            assert!(!templates[0].name.contains('/'));
            assert!(!templates[0].name.contains(':'));
        }

        #[test]
        fn ensure_templates_dir_creates_examples() {
            let dir = tempdir();
            let root = dir.path().to_string_lossy().to_string();
            ensure_templates_dir(root.clone()).unwrap();
            let templates = list_templates(root);
            assert!(templates.len() >= 2);
        }

        #[test]
        fn delete_template_removes_file() {
            let dir = tempdir();
            let root = dir.path().to_string_lossy().to_string();
            let path = save_as_template(root.clone(), "ToDelete".to_string(), "x".to_string()).unwrap();
            delete_template(path.clone()).unwrap();
            assert!(!std::path::Path::new(&path).exists());
        }

        #[test]
        fn list_templates_empty_when_no_dir() {
            let dir = tempdir();
            let root = dir.path().to_string_lossy().to_string();
            let templates = list_templates(root);
            assert!(templates.is_empty());
        }
    }

    mod path_ops_tests {
        use super::super::commands::{create_file, create_directory, rename_path, delete_path};
        use super::*;

        #[test]
        fn create_file_creates_empty_file() {
            let dir = tempdir();
            let path = dir.path().join("new.md").to_string_lossy().to_string();
            create_file(path.clone()).unwrap();
            assert!(std::path::Path::new(&path).exists());
            assert_eq!(fs::read_to_string(&path).unwrap(), "");
        }

        #[test]
        fn create_directory_creates_nested() {
            let dir = tempdir();
            let path = dir.path().join("a/b/c").to_string_lossy().to_string();
            create_directory(path.clone()).unwrap();
            assert!(std::path::Path::new(&path).is_dir());
        }

        #[test]
        fn rename_path_renames_file() {
            let dir = tempdir();
            let old = dir.path().join("old.md").to_string_lossy().to_string();
            let new = dir.path().join("new.md").to_string_lossy().to_string();
            fs::write(&old, "content").unwrap();
            rename_path(old.clone(), new.clone()).unwrap();
            assert!(!std::path::Path::new(&old).exists());
            assert!(std::path::Path::new(&new).exists());
        }

        #[test]
        fn delete_path_removes_file() {
            let dir = tempdir();
            let path = dir.path().join("del.md").to_string_lossy().to_string();
            fs::write(&path, "").unwrap();
            delete_path(path.clone(), false).unwrap();
            assert!(!std::path::Path::new(&path).exists());
        }

        #[test]
        fn delete_path_removes_dir_recursively() {
            let dir = tempdir();
            let sub = dir.path().join("subdir");
            fs::create_dir(&sub).unwrap();
            fs::write(sub.join("file.md"), "").unwrap();
            delete_path(sub.to_string_lossy().to_string(), true).unwrap();
            assert!(!sub.exists());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::parse_markdown,
            commands::list_directory,
            commands::watch_file,
            commands::unwatch_file,
            commands::get_recent_files,
            commands::open_file_dialog,
            commands::open_directory_dialog,
            commands::save_file_dialog,
            commands::set_vibrancy,
            commands::create_file,
            commands::create_directory,
            commands::rename_path,
            commands::delete_path,
            commands::write_binary,
            commands::search_files,
            commands::scan_tags,
            commands::list_templates,
            commands::ensure_templates_dir,
            commands::save_as_template,
            commands::delete_template,
            commands::export_html,
            commands::write_temp_html,
        ])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
