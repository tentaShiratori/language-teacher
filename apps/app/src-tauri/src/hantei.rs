use crate::error_log::{log_rust_err, ErrorLogPaths};
use crate::hantei_log::{write_attempt, HanteiLogPath};
use crate::store::Store;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tauri::State;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[serde(rename_all = "camelCase")]
pub struct Hantei {
    pub tekisetsu: bool,
    pub imi: bool,
    pub bunpo: bool,
    pub shiteki: Option<String>,
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChatChoiceMessage {
    content: Option<String>,
}

pub fn normalize_hantei(raw: Hantei) -> Hantei {
    let tekisetsu = raw.imi && raw.bunpo;
    Hantei {
        tekisetsu,
        imi: raw.imi,
        bunpo: raw.bunpo,
        shiteki: raw.shiteki,
    }
}

pub fn gengo_hyoji(gakushu_gengo: &str) -> Option<&'static str> {
    match gakushu_gengo {
        "en" => Some("英語"),
        "zh_hans" => Some("中国語（簡体）"),
        "ko" => Some("韓国語"),
        "de" => Some("ドイツ語"),
        _ => None,
    }
}

fn common_rules() -> &'static str {
    r#"あなたは言語学習の判定器である。
適切 = 意味が原文と合う ∧ 文法が破綻していない。自然さとトーンは結論に入れない。
指摘（shiteki）は適切でも不適切でも出す。適切さの判定には使わない。

言語共通:
- 不適切（意味）: 訳文が原文と別のことを言っている。主語・否定・時制・数量の取り違えを含む
- 不適切（文法）: 述語がない、一致が壊れている、語順が通らない
- 指摘: 直し方と自然な訳を一つの文章に混ぜる。不適切なら、どこが不適切かも同じ文章に書く。十分自然なら「このままで自然」でよく、直した全文は必須にしない
- 見ない: 米語／英語の綴り差だけ。指摘にもしない

指摘は母語（日本語）で一文。直し方と自然な訳を混ぜてよい。不適切ならどこが不適切かも書く。

応答は次の JSON オブジェクトだけを返す。前後に説明文を付けない。
{"tekisetsu":true,"imi":true,"bunpo":true,"shiteki":"このままで自然"}
tekisetsu は imi && bunpo と一致させる。
shiteki は適切でも不適切でも文字列。"#
}

fn gengo_hatantable(gakushu_gengo: &str) -> &'static str {
    match gakushu_gengo {
        "zh_hans" => {
            r#"
中国語（簡体）の扱い:
字体は簡体だけ。繁体で書かれていても字体の違いは見ない（不適切にも指摘にもしない）。別の意味になっていれば意味の不適切。
- 動詞がない → 不適切（文法）
- 語順が通らない → 不適切（文法）
- 了 / 着 / 过 の誤り → 指摘
- 量詞の誤り → 指摘
- 通じるが不自然 → 指摘"#
        }
        "ko" => {
            r#"
韓国語の扱い:
- 述語がない → 不適切（文法）
- 活用が壊れている → 不適切（文法）
- 助詞の取り違え（を／が など） → 不適切（文法）
- 은/는 と 이/가 の揺れ → 指摘
- 敬語のずれ → 指摘（トーン）"#
        }
        "de" => {
            r#"
ドイツ語の扱い:
- 格が違う → 不適切（文法）
- 人称変化が違う → 不適切（文法）
- 動詞第二位が崩れる → 不適切（文法）
- 性・冠詞が違う → 不適切（文法）
- 通るが不自然 → 指摘"#
        }
        _ => "",
    }
}

pub fn build_system_prompt(gakushu_gengo: &str) -> String {
    let mut prompt = common_rules().to_string();
    let table = gengo_hatantable(gakushu_gengo);
    if !table.is_empty() {
        prompt.push_str(table);
    }
    prompt
}

pub fn build_user_prompt(
    gakushu_gengo: &str,
    genbun: &str,
    bun: &str,
    yakubun: &str,
) -> Result<String, String> {
    let hyoji = gengo_hyoji(gakushu_gengo).ok_or_else(|| "未知の学習言語".to_string())?;
    Ok(format!(
        "学習言語: {hyoji}\n原文:\n{genbun}\n\n対象の文:\n{bun}\n\n訳文:\n{yakubun}"
    ))
}

pub fn chat_completions_url(base_url: &str) -> String {
    format!("{}/v1/chat/completions", base_url.trim_end_matches('/'))
}

fn strip_think_tags(content: &str) -> String {
    let mut out = content.to_string();
    while let Some(start) = out.find("<think>") {
        if let Some(end_rel) = out[start..].find("</think>") {
            let end = start + end_rel + "</think>".len();
            out.replace_range(start..end, "");
        } else {
            break;
        }
    }
    out
}

pub fn parse_hantei_content(content: &str) -> Result<Hantei, String> {
    let cleaned = strip_think_tags(content);
    let start = cleaned
        .find('{')
        .ok_or_else(|| "JSON オブジェクトが無い".to_string())?;
    let end = cleaned
        .rfind('}')
        .ok_or_else(|| "JSON オブジェクトが閉じられていない".to_string())?;
    if end < start {
        return Err("JSON の範囲が不正".to_string());
    }
    let slice = &cleaned[start..=end];
    let raw: Hantei = serde_json::from_str(slice).map_err(|e| e.to_string())?;
    Ok(normalize_hantei(raw))
}

pub fn request_hantei(
    base_url: &str,
    model: &str,
    gakushu_gengo: &str,
    genbun: &str,
    bun: &str,
    yakubun: &str,
    log_path: Option<&Path>,
) -> Result<Hantei, String> {
    if yakubun.is_empty() {
        return Err("空の訳文は判定しない".to_string());
    }
    let system = build_system_prompt(gakushu_gengo);
    let user = build_user_prompt(gakushu_gengo, genbun, bun, yakubun)?;
    let url = chat_completions_url(base_url);
    let body = ChatRequest {
        model: model.to_string(),
        messages: vec![
            ChatMessage {
                role: "system".to_string(),
                content: system.clone(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: user.clone(),
            },
        ],
        stream: false,
        temperature: 0.0,
    };

    let mut last_err = String::new();
    for _ in 0..2 {
        match fetch_chat_content(&url, &body) {
            Ok(content) => match parse_hantei_content(&content) {
                Ok(hantei) => {
                    log_attempt(log_path, model, &system, &user, Some(&content), Ok(&hantei));
                    return Ok(hantei);
                }
                Err(err) => {
                    log_attempt(log_path, model, &system, &user, Some(&content), Err(&err));
                    last_err = err;
                }
            },
            Err(err) => {
                log_attempt(log_path, model, &system, &user, None, Err(&err));
                last_err = err;
            }
        }
    }
    Err(last_err)
}

fn log_attempt(
    log_path: Option<&Path>,
    model: &str,
    system_prompt: &str,
    user_prompt: &str,
    message_content: Option<&str>,
    outcome: Result<&Hantei, &str>,
) {
    let Some(path) = log_path else {
        return;
    };
    let _ = write_attempt(
        path,
        crate::hantei_log::now_iso(),
        model,
        system_prompt,
        user_prompt,
        message_content,
        outcome,
    );
}

fn fetch_chat_content(url: &str, body: &ChatRequest) -> Result<String, String> {
    let response = ureq::post(url)
        .set("Content-Type", "application/json")
        .send_json(body)
        .map_err(|e| e.to_string())?;
    if !(200..300).contains(&response.status()) {
        return Err(format!("chat completions HTTP {}", response.status()));
    }
    let parsed: ChatResponse = response.into_json().map_err(|e| e.to_string())?;
    parsed
        .choices
        .first()
        .and_then(|c| c.message.content.clone())
        .ok_or_else(|| "choices が空".to_string())
}

#[tauri::command]
pub async fn hantei_bun(
    store: State<'_, Store>,
    log_path: State<'_, HanteiLogPath>,
    error_log: State<'_, ErrorLogPaths>,
    gakushu_gengo: String,
    genbun: String,
    bun: String,
    yakubun: String,
) -> Result<Hantei, String> {
    let rust_path = error_log.rust.clone();
    let result = async {
        let settings = store.load_settings()?;
        let base_url = settings.ollama_base_url;
        let model = settings.ollama_model;
        let log_path = log_path.0.clone();
        tauri::async_runtime::spawn_blocking(move || {
            request_hantei(
                &base_url,
                &model,
                &gakushu_gengo,
                &genbun,
                &bun,
                &yakubun,
                Some(&log_path),
            )
        })
        .await
        .map_err(|e| e.to_string())?
    }
    .await;
    log_rust_err(&rust_path, result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_aligns_tekisetsu_and_keeps_shiteki() {
        let fixed = normalize_hantei(Hantei {
            tekisetsu: true,
            imi: true,
            bunpo: false,
            shiteki: Some("動詞がなく、I went. が自然です".into()),
        });
        assert_eq!(
            fixed,
            Hantei {
                tekisetsu: false,
                imi: true,
                bunpo: false,
                shiteki: Some("動詞がなく、I went. が自然です".into()),
            }
        );
    }

    #[test]
    fn parse_strips_think_and_keeps_shiteki_when_futekisetsu() {
        let content = r#"<think>reason</think>
{"tekisetsu":false,"imi":false,"bunpo":true,"shiteki":"動詞が無く、I went to school. が自然です","hinto":"捨てる"}
"#;
        let h = parse_hantei_content(content).unwrap();
        assert!(!h.tekisetsu);
        assert_eq!(
            h.shiteki.as_deref(),
            Some("動詞が無く、I went to school. が自然です")
        );
    }

    #[test]
    fn system_prompt_adds_language_table_only_for_that_gengo() {
        let zh = build_system_prompt("zh_hans");
        assert!(zh.contains("量詞"));
        assert!(!zh.contains("動詞第二位"));

        let de = build_system_prompt("de");
        assert!(de.contains("動詞第二位"));
        assert!(!de.contains("量詞"));

        let en = build_system_prompt("en");
        assert!(!en.contains("量詞"));
        assert!(!en.contains("動詞第二位"));
        assert!(en.contains("適切 ="));
        assert!(en.contains("このままで自然"));
        assert!(en.contains("適切でも不適切でも"));
        assert!(!en.contains("hinto"));
        assert!(!en.contains("ヒント"));
    }

    #[test]
    fn user_prompt_includes_materials() {
        let user = build_user_prompt("en", "全文。", "対象。", "Hello.").unwrap();
        assert!(user.contains("学習言語: 英語"));
        assert!(user.contains("全文。"));
        assert!(user.contains("対象。"));
        assert!(user.contains("Hello."));
    }

    #[test]
    fn empty_yakubun_is_rejected() {
        let err = request_hantei(
            "http://127.0.0.1:1",
            "qwen3:8b",
            "en",
            "原文",
            "文",
            "",
            None,
        )
        .unwrap_err();
        assert!(err.contains("空"));
    }

    #[test]
    fn empty_yakubun_does_not_write_log() {
        let path = std::env::temp_dir().join(format!(
            "language_teacher_hantei_empty_{}.jsonl",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let err = request_hantei(
            "http://127.0.0.1:1",
            "qwen3:8b",
            "en",
            "原文",
            "文",
            "",
            Some(&path),
        )
        .unwrap_err();
        assert!(err.contains("空"));
        assert!(!path.exists());
    }

    #[test]
    fn chat_url_trims_slash() {
        assert_eq!(
            chat_completions_url("http://127.0.0.1:11434/"),
            "http://127.0.0.1:11434/v1/chat/completions"
        );
    }
}
