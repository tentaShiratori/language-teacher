use serde::de::Deserializer;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[serde(tag = "shurui", rename_all = "camelCase")]
#[ts(export)]
pub enum Kasho {
    #[serde(rename = "ayamari")]
    Ayamari { start: usize, end: usize },
}

pub fn yakubun_char_count(yakubun: &str) -> usize {
    yakubun.chars().count()
}

pub fn normalize_kasho(yakubun: &str, kasho: Vec<Kasho>, tekisetsu: bool) -> Vec<Kasho> {
    if tekisetsu {
        return Vec::new();
    }
    let len = yakubun_char_count(yakubun);
    let mut out = Vec::new();
    for item in kasho {
        match item {
            Kasho::Ayamari { start, end } if start < end && end <= len => {
                out.push(Kasho::Ayamari { start, end });
            }
            _ => {}
        }
    }
    out
}

pub fn kasho_to_json(kasho: &[Kasho]) -> Result<String, String> {
    serde_json::to_string(kasho).map_err(|e| e.to_string())
}

/// 未知形（旧 ketsujo など）は無視して ayamari だけ残す。
pub fn kasho_from_json(raw: Option<String>) -> Result<Vec<Kasho>, String> {
    let Some(text) = raw else {
        return Ok(Vec::new());
    };
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }
    let values: Vec<serde_json::Value> = serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(filter_ayamari(values))
}

pub fn deserialize_kasho<'de, D>(deserializer: D) -> Result<Vec<Kasho>, D::Error>
where
    D: Deserializer<'de>,
{
    let values = Vec::<serde_json::Value>::deserialize(deserializer)?;
    Ok(filter_ayamari(values))
}

fn filter_ayamari(values: Vec<serde_json::Value>) -> Vec<Kasho> {
    let mut out = Vec::new();
    for value in values {
        if let Ok(item) = serde_json::from_value::<Kasho>(value) {
            out.push(item);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_keeps_valid_and_drops_invalid() {
        let out = normalize_kasho(
            "Hi",
            vec![
                Kasho::Ayamari { start: 0, end: 1 },
                Kasho::Ayamari { start: 1, end: 1 },
                Kasho::Ayamari { start: 0, end: 99 },
            ],
            false,
        );
        assert_eq!(out, vec![Kasho::Ayamari { start: 0, end: 1 }]);
    }

    #[test]
    fn json_roundtrip() {
        let items = vec![Kasho::Ayamari { start: 0, end: 2 }];
        let json = kasho_to_json(&items).unwrap();
        assert_eq!(kasho_from_json(Some(json)).unwrap(), items);
        assert!(kasho_from_json(None).unwrap().is_empty());
    }

    #[test]
    fn json_skips_unknown_shurui() {
        let raw = r#"[{"shurui":"ketsujo","index":1},{"shurui":"ayamari","start":0,"end":2}]"#;
        assert_eq!(
            kasho_from_json(Some(raw.to_string())).unwrap(),
            vec![Kasho::Ayamari { start: 0, end: 2 }]
        );
    }
}
