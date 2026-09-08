use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[serde(tag = "shurui", rename_all = "camelCase")]
#[ts(export)]
pub enum Kasho {
    #[serde(rename = "ketsujo")]
    Ketsujo { index: usize },
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
            Kasho::Ketsujo { index } if index <= len => {
                out.push(Kasho::Ketsujo { index });
            }
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

pub fn kasho_from_json(raw: Option<String>) -> Result<Vec<Kasho>, String> {
    let Some(text) = raw else {
        return Ok(Vec::new());
    };
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_keeps_valid_and_drops_invalid() {
        let out = normalize_kasho(
            "Hi",
            vec![
                Kasho::Ketsujo { index: 2 },
                Kasho::Ketsujo { index: 3 },
                Kasho::Ayamari { start: 0, end: 1 },
                Kasho::Ayamari { start: 1, end: 1 },
            ],
            false,
        );
        assert_eq!(
            out,
            vec![
                Kasho::Ketsujo { index: 2 },
                Kasho::Ayamari { start: 0, end: 1 },
            ]
        );
    }

    #[test]
    fn json_roundtrip() {
        let items = vec![
            Kasho::Ketsujo { index: 1 },
            Kasho::Ayamari { start: 0, end: 2 },
        ];
        let json = kasho_to_json(&items).unwrap();
        assert_eq!(kasho_from_json(Some(json)).unwrap(), items);
        assert!(kasho_from_json(None).unwrap().is_empty());
    }
}
