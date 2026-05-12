# CLAUDE.md — pitolick/ai-article-poster

## プロジェクト概要

「ええこみ！」ブログ（`e-comi.pitolick.com`）で使用する **汎用 AI 記事生成・WordPress 投稿プラグイン**。

- **ecomi リポジトリのサブモジュール**として `plugins/ai-article-poster/` に配置される
- トリガーの種類を問わず記事生成・投稿を担う。ええこみ固有のロジックは含めない
- Claude API（`claude-sonnet-4-6`）を使って SEO 最適化記事を生成し、WordPress REST API で投稿する

Issue の起票・Claude Code GitHub Actions の起動は **`pitolick/ecomi` リポジトリで行う**。

---

## このリポジトリの責務

| クラス | 役割 |
|--------|------|
| `src/ArticleGenerator.php` | Claude API を呼び出して記事コンテンツを生成 |
| `src/PostPublisher.php` | 生成コンテンツを WordPress に投稿（下書き or 即時公開） |
| `src/WebhookEndpoint.php` | REST API Webhook を公開（外部からのトリガー受付） |
| `src/Settings.php` | Claude API キーを WP 管理画面で設定・DB 暗号化保存 |

---

## ディレクトリ構成

```
ai-article-poster/
├── CLAUDE.md
├── composer.json
├── grumphp.yml
├── phpcs.xml
├── .php-cs-fixer.php
├── phpunit.xml
├── .coderabbit.yaml
├── .env.example
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── auto-merge.yml
│   ├── dependabot.yml
│   └── pull_request_template.md
├── src/
│   ├── ArticleGenerator.php
│   ├── PostPublisher.php
│   ├── WebhookEndpoint.php
│   └── Settings.php
├── tests/
│   └── Unit/
├── vendor/
└── ai-article-poster.php
```

---

## REST API エンドポイント仕様

```
POST /wp-json/ai-article-poster/v1/generate
```

**リクエストボディ**

```json
{
  "type": "sale",
  "context": {
    "title": "〇〇 Kindle セール",
    "items": [ ... ]
  }
}
```

`type` に応じてプロンプトテンプレートを切り替える。現在対応するタイプ:

| type | 説明 |
|------|------|
| `sale` | DMM / Kindle セールまとめ記事 |
| `new_release` | 新刊紹介記事 |
| `manual` | 手動指定（context に記事の指示を渡す） |

---

## 重要な設計制約

### 記事への affilicard 埋め込み

記事中に商品カードを挿入する場合は必ずショートコードを使う。Gutenberg ブロックは使わない。

```
[affilicard id="123"]
```

### 投稿モード

`PostPublisher.php` は設定で投稿モードを切り替えられるように実装する。

| モード | 動作 |
|--------|------|
| `draft` | 下書きとして保存。重要記事は人間がレビュー後に公開 |
| `publish` | 即時公開 |
| `scheduled` | 指定日時に予約公開 |

### Claude API モデル

`claude-sonnet-4-6` を使用する（最新安定版モデル）。

### API キー管理

Claude API キーは WordPress 管理画面（`設定 > AI Article Poster`）から設定し、AES-256-CBC で暗号化して DB に保存する。コードにハードコードしない。

---

## 技術スタック

| 項目 | 採用技術 |
|------|---------|
| 言語 | PHP 8.1 |
| AI | Claude API（Anthropic） |
| テスト | PHPUnit + WP_Mock（Claude API はモック） |
| Lint | PHP_CodeSniffer（WordPress Coding Standards） |
| フォーマット | PHP CS Fixer |
| Git フック | GrumPHP |

---

## 開発ルール

- コミットメッセージ・PR・Issue はすべて日本語で記述する
- Claude API を呼び出す処理は必ずモックを用意してテスト可能にする
- ええこみ固有のプロンプト・ロジックを混入させない（`type` ごとのテンプレートは設定 or 外部から渡す設計にする）

### コミットメッセージ形式

```
feat: 〇〇機能を追加
fix: 〇〇のバグを修正
chore: ライブラリを更新
test: テストを追加・修正
refactor: 〇〇をリファクタリング
style: フォーマット修正
```

---

## 仕様書の場所

| ドキュメント | 参照すべきセクション |
|------------|------------------|
| Cowork: `docs/01_企画・要件定義.md` | §4-6（AI 記事生成プラグイン仕様）・§4-8（記事自動生成フロー） |
| Cowork: `docs/02_プラグイン開発・運用手順書.md` | §5（API キー管理）・§6（テスト）・§7（lint） |

---

## 関連リポジトリ

| リポジトリ | 関係 |
|-----------|------|
| `pitolick/ecomi` | 親リポジトリ（Issue 起票・トリガー送信元） |
| `pitolick/affilicard` | `[affilicard id="xxx"]` ショートコードを記事に埋め込む先 |
