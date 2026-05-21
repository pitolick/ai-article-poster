# ai-article-poster

> ⚠️ **このリポジトリは Archived 状態です（2026-05-22）。**
> 本ライブラリの責務は [`@pitolick/wp-poster`](https://github.com/pitolick/wp-poster) の draft sub-export（`@pitolick/wp-poster/draft`）に統合されました。
> 詳細は [`pitolick/ecomi` の Routines Pivot Design](https://github.com/pitolick/ecomi/blob/main/docs/superpowers/specs/2026-05-21-routines-pivot-design.md) を参照してください。
>
> 経緯: 2026-05-21 の実 API スモークテストで、Claude Code OAuth Token を Anthropic SDK の `authToken` オプションで使う経路は Anthropic のポリシーにより 429 でスロットリングされることが判明。代替として Claude Routines（claude.ai/code/routines、サブスク内で動くクラウド agent）+ filmlog-ai 互換の post-to-wp パターンに pivot し、本ライブラリの責務は消滅しました。

---

Claude API（Anthropic 公式 SDK）を呼び出して **Markdown 記事を生成** する汎用 TypeScript ライブラリ。

WordPress 投稿は別ライブラリ（[`@pitolick/wp-poster`](https://github.com/pitolick/wp-poster)）に委譲する。

## 設計思想

本ライブラリは **Claude API ラッパとしての純粋なインフラ層** を提供する。`system` / `prompt` の組み立て・記事タイプ（セール / 新刊 / 手動）の切替・サイト固有テンプレなどは **すべて呼び出し側の責務** とし、本ライブラリには含めない。これにより:

- 漫画ブログ・映画ブログ・技術ブログ等、用途を問わず同じインフラを再利用できる
- プロンプト変更が本ライブラリのリリースに依存しない
- ライブラリのテストは「Claude API を正しく呼べているか」だけに集中できる

## 責務

- Claude API 呼出（API キー / Claude Code OAuth Token 両対応）
- Anthropic prompt caching の有効化（`system` を `cache_control: ephemeral` で送る）
- エラーのラップ（`ClaudeRequestError`）
- 入力データ → Markdown 文字列を返す

## インストール

このリポジトリは npm に publish しない（`"private": true`）。利用側で submodule として取り込み、親リポジトリの npm workspaces 経由で利用する:

```bash
# 親リポジトリで submodule を追加
git submodule add https://github.com/pitolick/ai-article-poster.git plugins/ai-article-poster

# 親リポジトリの package.json の workspaces に登録
# {
#   "workspaces": ["plugins/ai-article-poster", "..."]
# }

# 親リポジトリで npm install（@anthropic-ai/sdk 等の依存もまとめて解決される）
npm install
```

利用側コードからは `@pitolick/ai-article-poster` で import できる（workspaces で解決されるため別途 npm publish は不要）。本ライブラリ自体は `@anthropic-ai/sdk` を `dependencies` に持つ。

スタンドアロン利用（workspace 外）はサポートしない。

## 使い方

### 基本

```typescript
import { generate } from '@pitolick/ai-article-poster';

const result = await generate({
  system: 'あなたは電子書籍のセール情報を紹介するブログ記事を書くアシスタントです。',
  prompt: '以下のセール情報をもとに紹介記事を書いてください: ...',
  auth: {
    type: 'oauth',
    oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN!,
  },
});

console.log(result.markdown);
console.log(result.usage); // { inputTokens, outputTokens, cacheReadInputTokens?, ... }
```

### API キーで呼ぶ

```typescript
const result = await generate({
  system: '...',
  prompt: '...',
  auth: { type: 'api', apiKey: process.env.ANTHROPIC_API_KEY! },
});
```

### モデル・トークン数の指定

```typescript
const result = await generate({
  prompt: '...',
  model: 'claude-opus-4-7',
  maxTokens: 8192,
  auth,
});
```

### サイト側でテンプレを組み立てる例（e-comi での想定）

```typescript
// e-comi/src/prompts/sale.ts
export function buildSalePrompt(context: SaleContext): { system: string; prompt: string } {
  return {
    system: ECOMI_SALE_SYSTEM_PROMPT, // 漫画・affilicard 等の e-comi 固有指示
    prompt: `以下のセール情報をもとに記事を書いてください\n${formatItems(context.items)}`,
  };
}

// e-comi/src/orchestrator/check-sales.ts
const { system, prompt } = buildSalePrompt(context);
const result = await generate({ system, prompt, auth });
```

## API リファレンス

### `generate(options: GenerateOptions): Promise<GenerateResult>`

メインのファサード関数。

### `GenerateOptions`

| プロパティ      | 型                    | 必須 | 説明                                                      |
| --------------- | --------------------- | ---- | --------------------------------------------------------- |
| `prompt`        | `string`              | ✅   | user プロンプト                                           |
| `system`        | `string`              |      | system プロンプト（指定すると prompt caching 対象になる） |
| `auth`          | `ClaudeAuth`          | ✅   | 認証情報                                                  |
| `model`         | `string`              |      | デフォルト `claude-sonnet-4-6`                            |
| `maxTokens`     | `number`              |      | デフォルト `4096`                                         |
| `clientFactory` | `(auth) => Anthropic` |      | テスト用クライアント差し込み                              |

### `ClaudeAuth`

```typescript
{
  type: 'api';
  apiKey: string;
}
// or
{
  type: 'oauth';
  oauthToken: string;
}
```

### `GenerateResult`

```typescript
{
  markdown: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
}
```

### `ClaudeRequestError`

API 呼出失敗時に投げられる。`status` / `body` / `cause` を保持する。

## テスト

```bash
npm test
npm run lint
npm run typecheck
```

Claude API は Vitest からモックされる（`clientFactory` または `createClient` をスタブ）。実 API を呼ぶ E2E はこのリポジトリ単体では行わない。

## ライセンス

MIT
