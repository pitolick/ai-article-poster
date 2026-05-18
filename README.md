# ai-article-poster

AI 記事生成パイプラインの汎用 TypeScript ライブラリ。Claude API で記事 Markdown を生成する。

## 責務

- Claude API 呼出（API キー / Claude Code OAuth Token 両対応）
- 汎用プロンプトテンプレ（`sale` / `new_release` / `manual`）
- 入力データ → MD 文字列 を返すパイプライン

## ステータス

骨組みのみ。実装は Phase 2（[`pitolick/ecomi`](https://github.com/pitolick/ecomi) の plan 参照）で進める。

## ライセンス

MIT
