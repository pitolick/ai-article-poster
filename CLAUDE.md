# CLAUDE.md — ai-article-poster

## プロジェクト概要

AI 記事生成パイプラインの汎用 TypeScript ライブラリ。Claude API でデータを Markdown 記事に変換する責務を持つ。

- 複数の WordPress 投稿プロジェクトから submodule として利用される想定
- トリガーの種類（セール検知・新刊・手動依頼）を問わず記事生成を担う汎用ライブラリ
- WordPress への投稿は別ライブラリ（`@pitolick/wp-poster` 等）に委譲する
- 単独で `npm test` / `npm run typecheck` が成立する自己完結リポジトリ

Issue の起票・Claude Code GitHub Actions の起動は通常、利用側の親リポジトリで行う（このライブラリは PR レビューのみ）。

---

## このリポジトリの責務

| モジュール | 役割 |
|---|---|
| `src/generator.ts` | Claude API 呼出（Anthropic API キー or Claude Code OAuth Token の両対応） |
| `src/prompts/sale.ts` | セール記事プロンプトテンプレ（汎用） |
| `src/prompts/new-release.ts` | 新刊記事プロンプトテンプレ（汎用） |
| `src/prompts/manual.ts` | 手動指定記事プロンプトテンプレ（汎用） |
| `src/pipeline.ts` | 入力 → プロンプト適用 → Claude 呼出 → MD 出力 |
| `src/cache.ts` | Anthropic prompt caching の有効化 |

---

## 重要な設計制約

### Claude 認証の抽象化

API キー（従量課金）と Claude Code OAuth Token（既存サブスク）の両方をサポートする:

```typescript
interface ClaudeAuth {
  type: 'api' | 'oauth';
  apiKey?: string;
  oauthToken?: string;
}
```

呼び出し側が `auth` を渡して、内部でクライアント初期化方式を切り替える。

### サイト固有ロジック禁止

- 特定サイト固有のプロンプト・ロジックを混入させない
- 各 `type` のプロンプトはデフォルトテンプレを提供し、`customPrompt` で呼び出し側が上書き可能にする

### モデル

`claude-sonnet-4-6` を使用する（最新安定版モデル）。

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| 言語 | TypeScript 5.6+ |
| ランタイム | Node.js 20+ (ESM) |
| AI | Claude API（Anthropic 公式 TS SDK） |
| テスト | Vitest（Claude API はモック） |
| Lint | ESLint 9 (flat config) |
| Formatter | Prettier 3 |

---

## 開発ルール

- コミットメッセージ・PR・Issue はすべて日本語で記述
- Claude API を呼び出す処理は必ずモックを用意してテスト可能にする
- 公開 API はすべて TypeScript の型をエクスポート

### コミットメッセージ形式

```
feat: 〇〇機能を追加
fix: 〇〇のバグを修正
chore: ライブラリを更新
test: テストを追加・修正
refactor: 〇〇をリファクタリング
docs: ドキュメントを更新
```

---

## 仕様書の場所

設計の全体像は利用側プロジェクトの設計書を参照する。このリポジトリ単体での公開仕様は README.md と `src/types.ts` の TSDoc に集約する。
