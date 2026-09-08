use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BunRecord {
    pub body: String,
    pub yakubun: String,
    pub tekisetsu: Option<bool>,
    pub imi: Option<bool>,
    pub bunpo: Option<bool>,
    pub shiteki: Option<String>,
    pub hinto: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenbunRecord {
    pub id: String,
    pub body: String,
    pub gakushu_gengo: String,
    pub created_at: String,
    pub buns: Vec<BunRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenbunSummary {
    pub id: String,
    pub first_line: String,
    pub gakushu_gengo: String,
    pub created_at: String,
}

pub struct Store {
    conn: Mutex<Connection>,
}

impl Store {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .map_err(|e| e.to_string())?;
        let store = Self {
            conn: Mutex::new(conn),
        };
        store.migrate()?;
        Ok(store)
    }

    fn migrate(&self) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS genbun (
              id TEXT PRIMARY KEY NOT NULL,
              body TEXT NOT NULL,
              gakushu_gengo TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bun (
              id TEXT PRIMARY KEY NOT NULL,
              genbun_id TEXT NOT NULL REFERENCES genbun(id) ON DELETE CASCADE,
              position INTEGER NOT NULL,
              body TEXT NOT NULL,
              yakubun TEXT NOT NULL,
              tekisetsu INTEGER,
              imi INTEGER,
              bunpo INTEGER,
              shiteki TEXT,
              hinto TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              ollama_base_url TEXT NOT NULL DEFAULT 'http://127.0.0.1:11434',
              ollama_model TEXT NOT NULL DEFAULT 'qwen3:8b'
            );

            INSERT OR IGNORE INTO settings (id) VALUES (1);
            "#,
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save_genbun(&self, record: GenbunRecord) -> Result<(), String> {
        let mut conn = self.conn.lock().map_err(|e| e.to_string())?;
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            r#"
            INSERT INTO genbun (id, body, gakushu_gengo, created_at)
            VALUES (?1, ?2, ?3, ?4)
            ON CONFLICT(id) DO UPDATE SET
              body = excluded.body,
              gakushu_gengo = excluded.gakushu_gengo
            "#,
            params![
                record.id,
                record.body,
                record.gakushu_gengo,
                record.created_at
            ],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM bun WHERE genbun_id = ?1", params![record.id])
            .map_err(|e| e.to_string())?;

        for (position, bun) in record.buns.iter().enumerate() {
            let bun_id = format!("{}:{}", record.id, position);
            tx.execute(
                r#"
                INSERT INTO bun (
                  id, genbun_id, position, body, yakubun,
                  tekisetsu, imi, bunpo, shiteki, hinto
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                "#,
                params![
                    bun_id,
                    record.id,
                    position as i64,
                    bun.body,
                    bun.yakubun,
                    opt_bool_to_sql(bun.tekisetsu),
                    opt_bool_to_sql(bun.imi),
                    opt_bool_to_sql(bun.bunpo),
                    bun.shiteki,
                    bun.hinto,
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_genbun(&self) -> Result<Vec<GenbunSummary>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn
            .prepare(
                r#"
                SELECT id, body, gakushu_gengo, created_at
                FROM genbun
                ORDER BY created_at DESC
                "#,
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let body: String = row.get(1)?;
                let gakushu_gengo: String = row.get(2)?;
                let created_at: String = row.get(3)?;
                Ok(GenbunSummary {
                    id,
                    first_line: first_line(&body),
                    gakushu_gengo,
                    created_at,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut out = Vec::new();
        for row in rows {
            out.push(row.map_err(|e| e.to_string())?);
        }
        Ok(out)
    }

    pub fn load_genbun(&self, id: &str) -> Result<Option<GenbunRecord>, String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        let genbun = conn
            .query_row(
                r#"
                SELECT id, body, gakushu_gengo, created_at
                FROM genbun
                WHERE id = ?1
                "#,
                params![id],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                    ))
                },
            )
            .optional()
            .map_err(|e| e.to_string())?;

        let Some((id, body, gakushu_gengo, created_at)) = genbun else {
            return Ok(None);
        };

        let mut stmt = conn
            .prepare(
                r#"
                SELECT body, yakubun, tekisetsu, imi, bunpo, shiteki, hinto
                FROM bun
                WHERE genbun_id = ?1
                ORDER BY position ASC
                "#,
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![id], |row| {
                Ok(BunRecord {
                    body: row.get(0)?,
                    yakubun: row.get(1)?,
                    tekisetsu: sql_to_opt_bool(row.get(2)?),
                    imi: sql_to_opt_bool(row.get(3)?),
                    bunpo: sql_to_opt_bool(row.get(4)?),
                    shiteki: row.get(5)?,
                    hinto: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut buns = Vec::new();
        for row in rows {
            buns.push(row.map_err(|e| e.to_string())?);
        }

        Ok(Some(GenbunRecord {
            id,
            body,
            gakushu_gengo,
            created_at,
            buns,
        }))
    }

    pub fn delete_genbun(&self, id: &str) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM bun WHERE genbun_id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM genbun WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn first_line(body: &str) -> String {
    body.lines().next().unwrap_or("").to_string()
}

fn opt_bool_to_sql(value: Option<bool>) -> Option<i64> {
    value.map(|v| if v { 1 } else { 0 })
}

fn sql_to_opt_bool(value: Option<i64>) -> Option<bool> {
    value.map(|v| v != 0)
}

#[tauri::command]
pub fn save_genbun(store: State<'_, Store>, record: GenbunRecord) -> Result<(), String> {
    store.save_genbun(record)
}

#[tauri::command]
pub fn list_genbun(store: State<'_, Store>) -> Result<Vec<GenbunSummary>, String> {
    store.list_genbun()
}

#[tauri::command]
pub fn load_genbun(store: State<'_, Store>, id: String) -> Result<Option<GenbunRecord>, String> {
    store.load_genbun(&id)
}

#[tauri::command]
pub fn delete_genbun(store: State<'_, Store>, id: String) -> Result<(), String> {
    store.delete_genbun(&id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_store() -> Store {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("language_teacher_store_{nanos}.sqlite"));
        Store::open(&path).expect("open store")
    }

    fn sample(id: &str, yakubun: &str) -> GenbunRecord {
        GenbunRecord {
            id: id.to_string(),
            body: "こんにちは。\n次の行。".to_string(),
            gakushu_gengo: "en".to_string(),
            created_at: "2026-09-08T00:00:00.000Z".to_string(),
            buns: vec![
                BunRecord {
                    body: "こんにちは。".to_string(),
                    yakubun: yakubun.to_string(),
                    tekisetsu: None,
                    imi: None,
                    bunpo: None,
                    shiteki: None,
                    hinto: None,
                },
                BunRecord {
                    body: "次の行。".to_string(),
                    yakubun: "".to_string(),
                    tekisetsu: None,
                    imi: None,
                    bunpo: None,
                    shiteki: None,
                    hinto: None,
                },
            ],
        }
    }

    #[test]
    fn save_and_load_roundtrip() {
        let store = temp_store();
        store.save_genbun(sample("g1", "Hello.")).unwrap();
        let loaded = store.load_genbun("g1").unwrap().expect("exists");
        assert_eq!(loaded.body, "こんにちは。\n次の行。");
        assert_eq!(loaded.gakushu_gengo, "en");
        assert_eq!(loaded.buns.len(), 2);
        assert_eq!(loaded.buns[0].yakubun, "Hello.");
        assert_eq!(loaded.buns[0].tekisetsu, None);
    }

    #[test]
    fn save_empty_yakubun() {
        let store = temp_store();
        store.save_genbun(sample("g2", "")).unwrap();
        let loaded = store.load_genbun("g2").unwrap().expect("exists");
        assert_eq!(loaded.buns[0].yakubun, "");
    }

    #[test]
    fn list_uses_first_line() {
        let store = temp_store();
        store.save_genbun(sample("g3", "")).unwrap();
        let list = store.list_genbun().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].first_line, "こんにちは。");
        assert_eq!(list[0].gakushu_gengo, "en");
    }

    #[test]
    fn delete_removes_genbun_and_bun() {
        let store = temp_store();
        store.save_genbun(sample("g4", "x")).unwrap();
        store.delete_genbun("g4").unwrap();
        assert!(store.load_genbun("g4").unwrap().is_none());
        assert!(store.list_genbun().unwrap().is_empty());
    }

    #[test]
    fn upsert_replaces_buns() {
        let store = temp_store();
        store.save_genbun(sample("g5", "one")).unwrap();
        let mut next = sample("g5", "two");
        next.buns = vec![BunRecord {
            body: "だけ。".to_string(),
            yakubun: "only".to_string(),
            tekisetsu: Some(true),
            imi: Some(true),
            bunpo: Some(false),
            shiteki: Some("指摘".to_string()),
            hinto: None,
        }];
        store.save_genbun(next).unwrap();
        let loaded = store.load_genbun("g5").unwrap().expect("exists");
        assert_eq!(loaded.buns.len(), 1);
        assert_eq!(loaded.buns[0].yakubun, "only");
        assert_eq!(loaded.buns[0].tekisetsu, Some(true));
        assert_eq!(loaded.buns[0].bunpo, Some(false));
    }

    #[test]
    fn load_missing_is_none() {
        let store = temp_store();
        assert!(store.load_genbun("missing").unwrap().is_none());
    }
}
