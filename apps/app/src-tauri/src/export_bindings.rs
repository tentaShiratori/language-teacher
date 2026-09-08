use crate::hantei::Hantei;
use crate::ollama::OllamaStatus;
use crate::store::{BunRecord, GenbunRecord, GenbunSummary, Settings};
use ts_rs::{Config, TS};

/// `cargo test` では走らない。生成するときだけ `cargo export-bindings`。
#[test]
#[ignore]
fn export_bindings() {
    let cfg = Config::from_env();
    BunRecord::export(&cfg).expect("export BunRecord");
    GenbunRecord::export(&cfg).expect("export GenbunRecord");
    GenbunSummary::export(&cfg).expect("export GenbunSummary");
    Settings::export(&cfg).expect("export Settings");
    Hantei::export(&cfg).expect("export Hantei");
    OllamaStatus::export(&cfg).expect("export OllamaStatus");
}
