import { runGenerate } from './pipeline.js';
import type { GenerateOptions, GenerateResult } from './types.js';

/**
 * 公開ファサード。
 * system + prompt + auth を受け取り、Claude API で記事 Markdown を生成して返す。
 *
 * プロンプト本文の組み立て（type 切替やテンプレート展開）は呼び出し側の責務。
 * 本ライブラリは Anthropic SDK の認証・呼出・キャッシュ制御のみを担う。
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  return runGenerate(options);
}

export type {
  ClaudeAuth,
  GenerateOptions,
  GenerateResult,
} from './types.js';
export { DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from './types.js';
export { AIArticlePosterError, ClaudeRequestError } from './errors.js';
export { createClient, callClaude } from './generator.js';
export { withCacheControl } from './cache.js';
export { runGenerate } from './pipeline.js';
