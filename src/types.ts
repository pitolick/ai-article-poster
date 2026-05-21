import type Anthropic from '@anthropic-ai/sdk';

/** Claude API への認証情報 */
export interface ClaudeAuth {
  /** 'api' は Anthropic API キー、'oauth' は Claude Code OAuth Token */
  type: 'api' | 'oauth';
  /** type='api' のとき必須 */
  apiKey?: string;
  /** type='oauth' のとき必須 */
  oauthToken?: string;
}

/** generate() の入力 */
export interface GenerateOptions {
  /** user プロンプト（必須） */
  prompt: string;
  /** system プロンプト。指定すると Anthropic prompt caching の cache_control: ephemeral 対象になる */
  system?: string;
  /** Claude API への認証情報 */
  auth: ClaudeAuth;
  /** Anthropic モデル ID。未指定なら 'claude-sonnet-4-6' */
  model?: string;
  /** max_tokens（未指定なら 4096） */
  maxTokens?: number;
  /** テスト等から差し替えるためのクライアントファクトリ。未指定なら内部で new Anthropic() */
  clientFactory?: (auth: ClaudeAuth) => Anthropic;
}

/** generate() の戻り値 */
export interface GenerateResult {
  /** 生成された Markdown 本文 */
  markdown: string;
  /** 使用したモデル ID（後段ログ用） */
  model: string;
  /** Anthropic API が返した使用トークン情報（ある場合のみ） */
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
}

/** デフォルトモデル ID */
export const DEFAULT_MODEL = 'claude-sonnet-4-6';

/** デフォルト max_tokens */
export const DEFAULT_MAX_TOKENS = 4096;
