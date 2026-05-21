import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeAuth, GenerateResult } from './types.js';
import { ClaudeRequestError } from './errors.js';
import { withCacheControl } from './cache.js';

/** Anthropic SDK クライアントを ClaudeAuth から生成する */
export function createClient(auth: ClaudeAuth): Anthropic {
  if (auth.type === 'api') {
    if (!auth.apiKey) {
      throw new Error('apiKey is required when auth.type === "api"');
    }
    return new Anthropic({ apiKey: auth.apiKey });
  }
  if (!auth.oauthToken) {
    throw new Error('oauthToken is required when auth.type === "oauth"');
  }
  return new Anthropic({ authToken: auth.oauthToken });
}

export interface CallClaudeOptions {
  model: string;
  system: string;
  userPrompt: string;
  maxTokens: number;
}

/** Anthropic SDK の messages.create を呼び出して GenerateResult を返す */
export async function callClaude(
  client: Anthropic,
  options: CallClaudeOptions,
): Promise<GenerateResult> {
  const systemBlocks = withCacheControl(options.system);

  const requestParams: Record<string, unknown> = {
    model: options.model,
    max_tokens: options.maxTokens,
    messages: [{ role: 'user', content: options.userPrompt }],
  };
  if (systemBlocks.length > 0) {
    requestParams.system = systemBlocks;
  }

  let response: Awaited<ReturnType<Anthropic['messages']['create']>>;
  try {
    response = await client.messages.create(requestParams as never);
  } catch (cause) {
    const status = (cause as { status?: number })?.status ?? 0;
    const body = (cause as { error?: unknown })?.error ?? null;
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ClaudeRequestError(`Claude API request failed: ${message}`, status, body, cause);
  }

  const first = (response as unknown as { content?: Array<{ type: string; text?: string }> })
    .content?.[0];
  if (!first || first.type !== 'text' || typeof first.text !== 'string') {
    throw new ClaudeRequestError(
      'Claude API response did not contain a text block',
      0,
      response,
    );
  }

  const usage = (response as unknown as { usage?: Record<string, number> }).usage;
  return {
    markdown: first.text,
    model: (response as { model?: string }).model ?? options.model,
    usage: usage
      ? {
          inputTokens: usage.input_tokens ?? 0,
          outputTokens: usage.output_tokens ?? 0,
          ...(usage.cache_read_input_tokens !== undefined
            ? { cacheReadInputTokens: usage.cache_read_input_tokens }
            : {}),
          ...(usage.cache_creation_input_tokens !== undefined
            ? { cacheCreationInputTokens: usage.cache_creation_input_tokens }
            : {}),
        }
      : undefined,
  };
}
