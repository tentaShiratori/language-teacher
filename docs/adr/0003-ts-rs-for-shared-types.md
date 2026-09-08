# IPC 共有型は ts-rs で Rust から TypeScript を生成する

コマンドの戻り値や引数の JSON 形を両側で手書きするとずれる。`ts-rs` で Rust の構造体・列挙から TypeScript 型を出し、生成物をコミットする。`tauri-specta` は採らない。型付きコマンド関数まで生成すると `store.ts` の `invoke` 包みを置き換えることになり、今の薄さより重い。
