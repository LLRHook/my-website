//! Streaming local usage export. Only aggregate counts and allowlisted model
//! labels reach the public snapshot. Raw records are discarded after accounting;
//! private diagnostics may retain unpriced model identifiers locally.
use chrono::{DateTime, Days, Local, NaiveDate, Timelike, Utc};
use memchr::memmem;
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

static PRICES: LazyLock<Value> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../../scripts/token-prices.json"))
        .expect("the embedded dated price table must be valid JSON")
});
const MAX_SAFE: f64 = 9_007_199_254_740_991.0;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Counts {
    pub input: u64,
    pub output: u64,
    pub cache_write: u64,
    pub cache_read: u64,
    pub total: u64,
}

impl Counts {
    fn json(self) -> Value {
        json!({"input": self.input, "output": self.output, "cacheWrite": self.cache_write,
            "cacheRead": self.cache_read, "total": self.total})
    }
    fn add(&mut self, rhs: Self) -> bool {
        let sums = [
            self.input.checked_add(rhs.input),
            self.output.checked_add(rhs.output),
            self.cache_write.checked_add(rhs.cache_write),
            self.cache_read.checked_add(rhs.cache_read),
            self.total.checked_add(rhs.total),
        ];
        if !sums
            .iter()
            .all(|sum| sum.is_some_and(|value| value <= MAX_SAFE as u64))
        {
            return false;
        }
        [
            self.input,
            self.output,
            self.cache_write,
            self.cache_read,
            self.total,
        ] = sums.map(Option::unwrap);
        true
    }
}

#[derive(Clone, Copy, Debug, Default)]
struct Usage {
    tokens: Counts,
    cost: Option<f64>,
}

#[derive(Clone, Copy, Default)]
struct Aggregate {
    tokens: Counts,
    cost: f64,
}

impl Aggregate {
    fn add(&mut self, value: Usage) -> bool {
        let valid = self.tokens.add(value.tokens);
        self.cost += value.cost.unwrap_or(0.0);
        valid && self.cost.is_finite()
    }
    fn json(self) -> Value {
        json!({"tokens": self.tokens.json(), "costUsd": cents(self.cost)})
    }
}

fn cents(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

fn count(value: &Value) -> u64 {
    value
        .as_f64()
        .filter(|n| n.is_finite() && *n > 0.0 && *n <= MAX_SAFE && n.fract() == 0.0)
        .unwrap_or(0.0) as u64
}

fn js_string(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::String(value) => value.clone(),
        Value::Object(_) => "[object Object]".into(),
        Value::Array(values) => values.iter().map(js_string).collect::<Vec<_>>().join(","),
        Value::Number(value) if value.as_f64().is_some_and(|n| n == 0.0) => "0".into(),
        Value::Number(value)
            if value
                .as_f64()
                .is_some_and(|n| n.fract() == 0.0 && n.abs() < 1e21) =>
        {
            format!("{:.0}", value.as_f64().unwrap())
        }
        other => other.to_string(),
    }
}

pub fn normalize_model(model: &Value) -> String {
    let mut model = js_string(model).to_lowercase();
    if model.ends_with(']') {
        let before = &model[..model.len() - 1];
        let after_close = before.rfind(']').map_or(0, |i| i + 1);
        if let Some(start) = model[after_close..].find('[') {
            model.truncate(after_close + start);
        }
    }
    if model.len() >= 9 {
        let suffix = &model.as_bytes()[model.len() - 9..];
        if suffix[0] == b'-' && suffix[1..].iter().all(u8::is_ascii_digit) {
            model.truncate(model.len() - 9);
        }
    }
    model
}

fn title(word: &str) -> String {
    let mut chars = word.chars();
    chars.next().map_or_else(String::new, |first| {
        first.to_uppercase().collect::<String>() + chars.as_str()
    })
}

fn model_label(model: &str) -> Option<String> {
    if PRICES["claude"].get(model).is_none() && PRICES["openai"].get(model).is_none() {
        return None;
    }
    if let Some(rest) = model.strip_prefix("claude-") {
        let parts: Vec<_> = rest.split('-').collect();
        return Some(format!(
            "Claude {} {}",
            title(parts[0]),
            parts[1..].join(".")
        ));
    }
    let parts: Vec<_> = model.strip_prefix("gpt-")?.split('-').collect();
    Some(format!(
        "GPT-{} {}",
        parts[0],
        parts[1..]
            .iter()
            .map(|part| title(part))
            .collect::<Vec<_>>()
            .join(" ")
    ))
}

fn claude_usage(model: &str, usage: &Value) -> Usage {
    let input = count(&usage["input_tokens"]);
    let output = count(&usage["output_tokens"]);
    let cache_write = count(&usage["cache_creation_input_tokens"]);
    let cache_read = count(&usage["cache_read_input_tokens"]);
    let one_hour = count(&usage["cache_creation"]["ephemeral_1h_input_tokens"]).min(cache_write);
    let tokens = Counts {
        input,
        output,
        cache_write,
        cache_read,
        total: input + output + cache_write + cache_read,
    };
    let cost = PRICES["claude"].get(model).map(|base| {
        let price = if base["long"]["over"]
            .as_u64()
            .is_some_and(|over| input + cache_write + cache_read > over)
        {
            &base["long"]
        } else {
            base
        };
        (input as f64 * price["input"].as_f64().unwrap()
            + (cache_write - one_hour) as f64 * price["write5m"].as_f64().unwrap()
            + one_hour as f64 * price["write1h"].as_f64().unwrap()
            + cache_read as f64 * price["read"].as_f64().unwrap()
            + output as f64 * price["output"].as_f64().unwrap())
            / 1_000_000.0
    });
    Usage { tokens, cost }
}

fn codex_usage(model: &str, usage: &[u64; 5]) -> Usage {
    let all_input = usage[0];
    let cache_read = usage[1].min(all_input);
    let cache_write = usage[2].min(all_input - cache_read);
    let input = all_input - cache_read - cache_write;
    let output = usage[3];
    let tokens = Counts {
        input,
        output,
        cache_write,
        cache_read,
        total: all_input + output,
    };
    let cost = PRICES["openai"].get(model).map(|base| {
        let price = if all_input > base["long"]["over"].as_u64().unwrap() {
            &base["long"]
        } else {
            base
        };
        (input as f64 * price["input"].as_f64().unwrap()
            + cache_read as f64 * price["read"].as_f64().unwrap()
            + cache_write as f64 * price["write"].as_f64().unwrap()
            + output as f64 * price["output"].as_f64().unwrap())
            / 1_000_000.0
    });
    Usage { tokens, cost }
}

pub fn parse_day(day: &str) -> Result<NaiveDate, String> {
    let date = NaiveDate::parse_from_str(day, "%Y-%m-%d")
        .map_err(|_| "today must be a real YYYY-MM-DD date")?;
    if day.len() != 10 || date.format("%Y-%m-%d").to_string() != day {
        return Err("today must be a real YYYY-MM-DD date".into());
    }
    Ok(date)
}

fn timestamp_day(value: &Value) -> Option<String> {
    let text = value.as_str()?;
    // Both log producers emit ISO timestamps with an offset. Date-only strings
    // have JavaScript's UTC semantics; reject leap seconds as JS Date does.
    let timestamp = DateTime::parse_from_rfc3339(text)
        .ok()
        .map(|date| date.with_timezone(&Utc))
        .or_else(|| {
            parse_day(text)
                .ok()
                .and_then(|day| day.and_hms_opt(0, 0, 0))
                .map(|day| day.and_utc())
        })?;
    if timestamp.nanosecond() >= 1_000_000_000 {
        return None;
    }
    Some(
        timestamp
            .with_timezone(&Local)
            .format("%Y-%m-%d")
            .to_string(),
    )
}

fn files(root: &Path, codex: bool) -> io::Result<Vec<PathBuf>> {
    fn walk(root: &Path, out: &mut Vec<PathBuf>, codex: bool) -> io::Result<()> {
        for entry in fs::read_dir(root)? {
            let entry = entry?;
            let path = entry.path();
            if entry.file_type()?.is_dir() {
                walk(&path, out, codex)?;
            } else {
                let name = entry.file_name().to_string_lossy().into_owned();
                if (name.ends_with(".jsonl") || name.ends_with(".jsonl.zst"))
                    && (!codex || name.starts_with("rollout-"))
                    && !(name.ends_with(".zst") && path.with_extension("").exists())
                {
                    out.push(path);
                }
            }
        }
        Ok(())
    }
    let mut out = Vec::new();
    if !root.as_os_str().is_empty() && root.exists() {
        walk(root, &mut out, codex)?;
    }
    // JS Array.sort compares UTF-16 code units, not native filesystem byte order.
    out.sort_by(|a, b| {
        a.as_os_str()
            .to_string_lossy()
            .encode_utf16()
            .cmp(b.as_os_str().to_string_lossy().encode_utf16())
    });
    Ok(out)
}

fn records(path: &Path, markers: &[&[u8]], mut visit: impl FnMut(Value)) -> io::Result<()> {
    let file = File::open(path)?;
    let input: Box<dyn Read> = if path.extension().is_some_and(|ext| ext == "zst") {
        Box::new(zstd::stream::read::Decoder::new(file)?)
    } else {
        Box::new(file)
    };
    let mut reader = BufReader::with_capacity(64 * 1024, input);
    let mut line = Vec::new();
    loop {
        line.clear();
        if reader.read_until(b'\n', &mut line)? == 0 {
            break;
        }
        if !markers
            .iter()
            .any(|marker| memmem::find(&line, marker).is_some())
        {
            continue;
        }
        let parsed = serde_json::from_slice(&line)
            .or_else(|_| serde_json::from_str(&String::from_utf8_lossy(&line)));
        if let Ok(value) = parsed {
            visit(value);
        }
    }
    Ok(())
}

struct Builder {
    today: String,
    first_last: String,
    since: String,
    lifetime: Aggregate,
    last30: Aggregate,
    tools: [Aggregate; 2],
    models: HashMap<String, u64>,
    daily: BTreeMap<String, Aggregate>,
    unpriced: BTreeSet<String>,
    overflowed: bool,
}

impl Builder {
    fn new(today: NaiveDate) -> Self {
        let first = today
            .checked_sub_days(Days::new(89))
            .expect("supported date window");
        let mut daily = BTreeMap::new();
        let mut day = first;
        while day <= today {
            daily.insert(day.format("%Y-%m-%d").to_string(), Aggregate::default());
            day = day.succ_opt().expect("supported date window");
        }
        Self {
            today: today.format("%Y-%m-%d").to_string(),
            since: today.format("%Y-%m-%d").to_string(),
            first_last: today
                .checked_sub_days(Days::new(29))
                .unwrap()
                .format("%Y-%m-%d")
                .to_string(),
            lifetime: Aggregate::default(),
            last30: Aggregate::default(),
            tools: [Aggregate::default(); 2],
            models: HashMap::new(),
            daily,
            unpriced: BTreeSet::new(),
            overflowed: false,
        }
    }
    fn add(&mut self, day: String, tool: usize, model: String, usage: Usage) {
        if usage.cost.is_none() {
            self.unpriced.insert(if model.is_empty() {
                "(none)".into()
            } else {
                model.clone()
            });
        }
        if day > self.today {
            return;
        }
        if day < self.since {
            self.since.clone_from(&day);
        }
        self.overflowed |= !self.lifetime.add(usage);
        self.overflowed |= !self.tools[tool].add(usage);
        if day >= self.first_last {
            self.overflowed |= !self.last30.add(usage);
        }
        if let Some(total) = self.daily.get_mut(&day) {
            self.overflowed |= !total.add(usage);
        }
        let model_total = self
            .models
            .entry(model_label(&model).unwrap_or_else(|| "Other".into()))
            .or_default();
        if let Some(sum) = model_total
            .checked_add(usage.tokens.total)
            .filter(|sum| *sum <= MAX_SAFE as u64)
        {
            *model_total = sum;
        } else {
            self.overflowed = true;
        }
    }
    fn finish(self) -> Value {
        let mut ranked: Vec<_> = self
            .models
            .iter()
            .filter(|(label, _)| label.as_str() != "Other")
            .map(|(label, tokens)| (label.clone(), *tokens))
            .collect();
        ranked.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
        let other = ranked
            .iter()
            .skip(6)
            .map(|(_, tokens)| *tokens)
            .sum::<u64>()
            + self.models.get("Other").copied().unwrap_or(0);
        ranked.truncate(6);
        if other > 0 {
            ranked.push(("Other".into(), other));
        }
        let by_model: Vec<_> = ranked
            .into_iter()
            .map(|(model, tokens)| {
                let share = if self.lifetime.tokens.total == 0 {
                    0.0
                } else {
                    (tokens as f64 / self.lifetime.tokens.total as f64 * 10_000.0).round()
                        / 10_000.0
                };
                json!({"model": model, "tokens": tokens, "share": share})
            })
            .collect();
        let daily: Vec<_> = self.daily.iter().map(|(date, usage)| json!({"date": date, "tokens": usage.tokens.total, "costUsd": cents(usage.cost)})).collect();
        json!({"snapshot": {"asOf": self.today, "since": self.since, "pricesAsOf": PRICES["pricesAsOf"],
            "lifetime": self.lifetime.json(), "last30": self.last30.json(),
            "byTool": {"claudeCode": self.tools[0].json(), "codex": self.tools[1].json()},
            "byModel": by_model, "daily": daily}, "unpriced": self.unpriced.into_iter().collect::<Vec<_>>()})
    }
}

/// Returns {snapshot, unpriced}, compatible with the retained JS collect oracle.
pub fn collect(claude: &Path, codex: &Path, archive: &Path, today: NaiveDate) -> io::Result<Value> {
    let mut builder = Builder::new(today);
    // Keep only the winning usage per message, with first-insertion ordering.
    // Anonymous Claude rows and all Codex deltas aggregate immediately.
    let mut by_id: HashMap<String, usize> = HashMap::new();
    let mut messages: Vec<(String, String, Usage)> = Vec::new();
    for path in files(claude, false)? {
        records(&path, &[b"\"usage\""], |record| {
            let usage = &record["message"]["usage"];
            if !usage.is_object() && !usage.is_array() {
                return;
            }
            let Some(day) = timestamp_day(&record["timestamp"]) else {
                return;
            };
            let model = normalize_model(&record["message"]["model"]);
            let result = claude_usage(&model, usage);
            if result.tokens.total == 0 {
                return;
            }
            let id = record["message"]["id"].as_str().filter(|id| !id.is_empty());
            if let Some(id) = id {
                if let Some(index) = by_id.get(id).copied() {
                    if messages[index].2.tokens.total < result.tokens.total {
                        messages[index] = (day, model, result);
                    }
                } else {
                    by_id.insert(id.into(), messages.len());
                    messages.push((day, model, result));
                }
            } else {
                builder.add(day, 0, model, result);
            }
        })?;
    }
    for (day, model, result) in messages {
        builder.add(day, 0, model, result);
    }
    let mut seen = HashSet::new();
    for root in [codex, archive] {
        for path in files(root, true)? {
            let name = path
                .file_name()
                .unwrap()
                .to_string_lossy()
                .trim_end_matches(".zst")
                .to_string();
            if !seen.insert(name) {
                continue;
            }
            let mut previous: Option<[u64; 5]> = None;
            let mut model = String::new();
            records(
                &path,
                &[b"\"turn_context\"", b"\"token_count\""],
                |record| {
                    let payload = &record["payload"];
                    if record["type"] == "turn_context" {
                        let next = normalize_model(&payload["model"]);
                        if !next.is_empty() {
                            model = next;
                        }
                    }
                    if record["type"] != "event_msg" || payload["type"] != "token_count" {
                        return;
                    }
                    let total = &payload["info"]["total_token_usage"];
                    if !total.is_object() && !total.is_array() {
                        return;
                    }
                    let current = [
                        "input_tokens",
                        "cached_input_tokens",
                        "cache_write_input_tokens",
                        "output_tokens",
                        "total_tokens",
                    ]
                    .map(|key| count(&total[key]));
                    let delta = previous.map_or(current, |prior| {
                        std::array::from_fn(|i| {
                            if current[i] >= prior[i] {
                                current[i] - prior[i]
                            } else {
                                current[i]
                            }
                        })
                    });
                    // Invalid-date events still advance the cumulative counters, just
                    // like the JS producer contract; later deltas must not double count.
                    previous = Some(current);
                    let Some(day) = timestamp_day(&record["timestamp"]) else {
                        return;
                    };
                    let result = codex_usage(&model, &delta);
                    if result.tokens.total > 0 {
                        builder.add(day, 1, model.clone(), result);
                    }
                },
            )?;
        }
    }
    if builder.overflowed {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "usage totals exceed the public snapshot's safe numeric range",
        ));
    }
    Ok(builder.finish())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn models_and_private_ids() {
        assert_eq!(
            normalize_model(&json!("CLAUDE-OPUS-5-5[1m]")),
            "claude-opus-5-5"
        );
        assert_eq!(
            normalize_model(&json!("claude-haiku-4-5-20251001")),
            "claude-haiku-4-5"
        );
        assert_eq!(model_label("gpt-6.1-sol").as_deref(), Some("GPT-6.1 Sol"));
        for name in ["constructor", "__proto__", "gpt-7-secretproject"] {
            assert!(model_label(name).is_none());
        }
    }
    #[test]
    fn only_positive_safe_integer_counts() {
        for value in [
            json!(-1),
            json!(1.5),
            json!("5"),
            json!(true),
            json!(9_007_199_254_740_992_u64),
        ] {
            assert_eq!(count(&value), 0);
        }
        assert_eq!(count(&json!(5.0)), 5);
    }
    #[test]
    fn cache_counts_and_ttl_are_preserved() {
        let usage = codex_usage("gpt-6.1-sol", &[10, 50, 5, 1, 11]);
        assert_eq!(
            usage.tokens,
            Counts {
                cache_read: 10,
                output: 1,
                total: 11,
                ..Counts::default()
            }
        );
        let usage = claude_usage(
            "claude-opus-5-5",
            &json!({"cache_creation_input_tokens": 1000, "cache_creation": {"ephemeral_1h_input_tokens": 2000}}),
        );
        assert_eq!(usage.cost, Some(0.008));
    }
    #[test]
    fn real_calendar_dates_only() {
        for bad in ["2026-02-31", "2026-13-01", "2026-1-01", "not-a-day"] {
            assert!(parse_day(bad).is_err());
        }
        assert!(parse_day("2024-02-29").is_ok());
    }
    #[test]
    fn empty_snapshot_has_full_calendar_window() {
        let result = Builder::new(parse_day("2026-10-14").unwrap()).finish();
        assert_eq!(result["snapshot"]["daily"].as_array().unwrap().len(), 90);
        assert_eq!(result["snapshot"]["daily"][0]["date"], "2026-07-17");
        assert_eq!(result["snapshot"]["lifetime"]["tokens"]["total"], 0);
    }
}
