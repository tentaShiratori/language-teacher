use tauri::Config;

pub const PRODUCTION_IDENTIFIER: &str = "com.tenta.language_teacher";
pub const DEBUG_IDENTIFIER: &str = "com.tenta.language_teacher.debug";

pub fn identifier(debug: bool) -> &'static str {
    if debug {
        DEBUG_IDENTIFIER
    } else {
        PRODUCTION_IDENTIFIER
    }
}

pub fn debug_enabled() -> bool {
    cfg!(feature = "debug") || tauri::is_dev()
}

pub fn app_identifier() -> &'static str {
    identifier(debug_enabled())
}

pub fn apply_identifier(config: &mut Config) {
    config.identifier = app_identifier().to_string();
}

#[tauri::command]
pub fn is_debug() -> bool {
    debug_enabled()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identifier_off_is_production() {
        assert_eq!(identifier(false), PRODUCTION_IDENTIFIER);
        assert_eq!(identifier(false), "com.tenta.language_teacher");
    }

    #[test]
    fn identifier_on_adds_debug_suffix() {
        assert_eq!(identifier(true), DEBUG_IDENTIFIER);
        assert_eq!(identifier(true), format!("{PRODUCTION_IDENTIFIER}.debug"));
    }

    #[test]
    fn identifier_rejects_empty_and_same_value() {
        assert!(!PRODUCTION_IDENTIFIER.is_empty());
        assert!(!DEBUG_IDENTIFIER.is_empty());
        assert_ne!(identifier(false), identifier(true));
        assert!(!DEBUG_IDENTIFIER.ends_with('.'));
        assert!(!PRODUCTION_IDENTIFIER.contains("debug"));
    }

    #[test]
    fn app_identifier_follows_debug_enabled() {
        assert_eq!(app_identifier(), identifier(debug_enabled()));
    }

    #[test]
    fn debug_enabled_is_feature_or_tauri_dev() {
        assert_eq!(debug_enabled(), cfg!(feature = "debug") || tauri::is_dev());
    }

    #[test]
    fn prod_conf_keeps_production_identifier_without_debug_feature() {
        let v: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.conf.json")).unwrap();
        assert_eq!(v["identifier"], PRODUCTION_IDENTIFIER);
        match v["build"].get("features") {
            None => {}
            Some(features) => {
                let arr = features.as_array().expect("build.features is array");
                assert!(
                    !arr.iter().any(|f| f == "debug"),
                    "本番設定に debug feature を付けない"
                );
            }
        }
    }

    #[test]
    fn dev_conf_sets_debug_identifier_and_feature() {
        let v: serde_json::Value =
            serde_json::from_str(include_str!("../tauri.dev.conf.json")).unwrap();
        assert_eq!(v["identifier"], DEBUG_IDENTIFIER);
        let features = v["build"]["features"]
            .as_array()
            .expect("dev build.features is array");
        assert!(
            features.iter().any(|f| f == "debug"),
            "tauri dev 用設定で debug feature を付ける"
        );
    }

    #[cfg(feature = "debug")]
    #[test]
    fn debug_feature_on_uses_debug_identifier() {
        assert!(debug_enabled());
        assert_eq!(app_identifier(), DEBUG_IDENTIFIER);
    }

    #[cfg(not(feature = "debug"))]
    #[test]
    fn debug_feature_off_matches_tauri_dev() {
        if tauri::is_dev() {
            assert_eq!(app_identifier(), DEBUG_IDENTIFIER);
        } else {
            assert_eq!(app_identifier(), PRODUCTION_IDENTIFIER);
        }
    }
}
