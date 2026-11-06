use chrono::Local;
use serde_json::Value;
use std::env;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime, UNIX_EPOCH};
use website_token_stats::{collect, parse_day};

fn write_snapshot(path: &Path, snapshot: &Value) -> io::Result<bool> {
    let text = format!("{}\n", serde_json::to_string_pretty(snapshot)?);
    match fs::read(path) {
        Ok(old) if String::from_utf8_lossy(&old).replace("\r\n", "\n") == text => return Ok(false),
        Ok(_) => {}
        Err(error) if error.kind() == io::ErrorKind::NotFound => {}
        Err(error) => return Err(error),
    }
    let parent = path
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    fs::create_dir_all(parent)?;
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let temporary = parent.join(format!(".token-stats-{}-{nonce}.tmp", std::process::id()));
    // Create our own sibling file, then atomically replace the public snapshot.
    // A read/decode/serialization failure never truncates the previous snapshot.
    let mut created = false;
    let result = (|| {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        created = true;
        file.write_all(text.as_bytes())?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporary, path)
    })();
    if result.is_err() && created {
        let _ = fs::remove_file(&temporary);
    }
    result.map(|()| true)
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let started = Instant::now();
    let home = env::var_os("HOME")
        .or_else(|| env::var_os("USERPROFILE"))
        .map(PathBuf::from);
    let mut claude = home.as_ref().map(|p| p.join(".claude/projects"));
    let mut codex = home.as_ref().map(|p| p.join(".codex/sessions"));
    let mut archive = home.as_ref().map(|p| p.join(".codex/archived_sessions"));
    let mut today = Local::now().format("%Y-%m-%d").to_string();
    let mut output: Option<PathBuf> = None;
    let mut json_output = false;
    let mut args = env::args().skip(1);
    while let Some(flag) = args.next() {
        match flag.as_str() {
            "--help" | "-h" => {
                println!(
                    "website-token-stats [--claude-dir PATH] [--codex-dir PATH] [--codex-archive-dir PATH]\n  [--today YYYY-MM-DD] [--output PATH] [--json]\n\nStreams local plain/Zstandard logs. Defaults to the current user's log roots and\ndata/token-stats.json. --json prints diagnostic {{snapshot,unpriced}} without\nwriting a file unless --output is explicit. It does not contact any service."
                );
                return Ok(());
            }
            "--version" | "-V" => {
                println!("website-token-stats {}", env!("CARGO_PKG_VERSION"));
                return Ok(());
            }
            "--json" => json_output = true,
            "--claude-dir" | "--codex-dir" | "--codex-archive-dir" | "--today" | "--output" => {
                let value = args.next().ok_or_else(|| format!("{flag} needs a value"))?;
                if value.starts_with("--") {
                    return Err(format!("{flag} needs a value before {value}").into());
                }
                match flag.as_str() {
                    "--claude-dir" => claude = Some(value.into()),
                    "--codex-dir" => codex = Some(value.into()),
                    "--codex-archive-dir" => archive = Some(value.into()),
                    "--today" => today = value,
                    "--output" => output = Some(value.into()),
                    _ => unreachable!(),
                }
            }
            _ => return Err(format!("unknown argument {flag}; use --help").into()),
        }
    }
    let date = parse_day(&today)?;
    let claude = claude.ok_or("set --claude-dir when no user home is available")?;
    let codex = codex.ok_or("set --codex-dir when no user home is available")?;
    let archive = archive.unwrap_or_default();
    let result = collect(&claude, &codex, &archive, date)?;
    let output = output.or_else(|| (!json_output).then(|| PathBuf::from("data/token-stats.json")));
    if let Some(path) = output {
        let changed = write_snapshot(&path, &result["snapshot"])?;
        if !json_output {
            println!(
                "{} {}: {} tokens, ${:.2} API-equivalent, in {:.1} s.",
                if changed { "Wrote" } else { "Unchanged" },
                path.display(),
                result["snapshot"]["lifetime"]["tokens"]["total"],
                result["snapshot"]["lifetime"]["costUsd"].as_f64().unwrap(),
                started.elapsed().as_secs_f64()
            );
        }
    }
    if json_output {
        println!("{}", serde_json::to_string(&result)?);
    } else if !result["unpriced"].as_array().unwrap().is_empty() {
        eprintln!(
            "Some models have no dated list price: their tokens are counted and their cost is excluded."
        );
    }
    Ok(())
}

fn main() {
    if let Err(error) = run() {
        eprintln!("Token export failed: {error}");
        std::process::exit(1);
    }
}
