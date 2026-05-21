# CLAUDE.md — ai-article-poster

## プロジェクト概要

Claude API（Anthropic 公式 SDK）を呼び出して **Markdown 記事を生成** する汎用 TypeScript ライブラリ。Claude API ラッパとしての純粋なインフラ層を提供することに徹する。

- 複数の WordPress 投稿プロジェクトから submodule として利用される想定
- 記事タイプ（セール検知 / 新刊 / 手動依頼）に応じたプロンプトの組み立ては **呼び出し側の責務**
- WordPress への投稿は別ライブラリ（`@pitolick/wp-poster`）に委譲する
- 単独で `npm test` / `npm run typecheck` が成立する自己完結リポジトリ

Issue の起票・Claude Code GitHub Actions の起動は通常、利用側の親リポジトリで行う（このライブラリは PR レビューのみ）。

---

## このリポジトリの責務

| モジュール         | 役割                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `src/index.ts`     | 公開ファサード `generate()` と主要シンボルの re-export                                    |
| `src/pipeline.ts`  | `GenerateOptions` のデフォルト適用 → `callClaude` 呼出                                    |
| `src/generator.ts` | Anthropic SDK クライアント生成（`createClient`）と `messages.create` 呼出（`callClaude`） |
| `src/cache.ts`     | Anthropic prompt caching の `cache_control: ephemeral` ヘルパ                             |
| `src/types.ts`     | 公開型（`ClaudeAuth` / `GenerateOptions` / `GenerateResult` 等）                          |
| `src/errors.ts`    | エラー型（`AIArticlePosterError` / `ClaudeRequestError`）                                 |

---

## 重要な設計制約

### 設計思想: 純粋なインフラ層

本ライブラリは **Claude API ラッパとしてのインフラ** のみを提供する。以下は **持たない**:

- 記事タイプ（`sale` / `new_release` / `manual`）の概念
- プロンプトテンプレート（system / user の組み立てロジック）
- サイト固有のプロンプト・データ整形
- WordPress 投稿

呼び出し側（e-comi 等）が `system` / `prompt` 文字列を組み立てて渡し、本ライブラリはそれを Anthropic SDK 経由で Claude API に投げて Markdown を返すだけに徹する。

### Claude 認証の抽象化

API キー（従量課金）と Claude Code OAuth Token（既存サブスク）の両方をサポートする:

```typescript
interface ClaudeAuth {
  type: 'api' | 'oauth';
  apiKey?: string;
  oauthToken?: string;
}
```

`createClient(auth)` が `type` を見て Anthropic SDK の `apiKey` / `authToken` を切り替える。

### モデル

デフォルトは `claude-sonnet-4-6`（`DEFAULT_MODEL`）。呼び出し側で `model` を指定すれば任意のモデル ID を使える。

### prompt caching

`system` プロンプトに `cache_control: { type: 'ephemeral' }` を自動付与する（5 分 TTL）。user プロンプト側は context が毎回変わるためキャッシュ対象外。長い指示は `system` 側に置くとキャッシュ効果が出る。

---

## 技術スタック

| 項目       | 採用技術                                      |
| ---------- | --------------------------------------------- |
| 言語       | TypeScript 5.6+                               |
| ランタイム | Node.js 20+ (ESM)                             |
| AI         | Claude API（`@anthropic-ai/sdk` 公式 TS SDK） |
| テスト     | Vitest（Claude API はモック）                 |
| Lint       | ESLint 9 (flat config)                        |
| Formatter  | Prettier 3                                    |

---

## 開発ルール

- コミットメッセージ・PR・Issue はすべて日本語で記述
- Claude API を呼び出す処理は必ずモックを用意してテスト可能にする
- 公開 API はすべて TypeScript の型をエクスポート（`src/types.ts` 経由）
- `generate()` の動作変更は 6 つのテストファイル（errors / cache / generator / pipeline / generate / smoke）で担保する

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

設計の全体像は利用側プロジェクトの設計書を参照する。このリポジトリ単体での公開仕様は `README.md` と `src/types.ts` の JSDoc に集約する。
