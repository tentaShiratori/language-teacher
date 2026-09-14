---
name: add-feature
description: Adds a feature on the existing apps/app surface without inventing new layers. Use when the user asks to add a feature, implement a screen, or extend an endpoint.
---

# 機能追加

## 手順

1. 対象面を決める（`apps/app`。`apps/web` / `api` は置かない）
2. graphify と better-code-review-graph `query`（`action=search`）で既存配置を確認する
3. 置き場所・命名は `architecture.mdc`。既存の隣に足す。層を先に新設しない
4. `write-test` スキルで、変更したファイルだけテストする
5. `progress.md` の状態・意思決定・次セッションを更新する
6. `graphify update .` を実行する
