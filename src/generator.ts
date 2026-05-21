import AnthropicSDK from '@anthropic-ai/sdk';
import type Anthropic from '@anthropic-ai/sdk';
import type { ClaudeAuth, GenerateResult } from './types.js';
import { ClaudeRequestError } from './errors.js';
import { withCacheControl } from './cache.js';

/** Anthropic SDK クライアントを ClaudeAuth から生成する */
export function createClient(auth: ClaudeAuth): Anthropic {
  if (auth.type === 'api') {
    if (!auth.apiKey) {
      throw new Error('apiKey is required when auth.type === "api"');
    }
    return new AnthropicSDK({ apiKey: auth.apiKey });
  }
  if (!auth.oauthToken) {
    throw new Error('oauthToken is required when auth.type === "oauth"');
  }
  return new AnthropicSDK({ authToken: auth.oauthToken });
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

  const requestParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
    model: options.model,
    max_tokens: options.maxTokens,
    messages: [{ role: 'user', content: options.userPrompt }],
  };
  if (systemBlocks.length > 0) {
    requestParams.system = systemBlocks;
  }

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create(requestParams);
  } catch (cause) {
    const status = (cause as { status?: number })?.status ?? 0;
    const body = (cause as { error?: unknown })?.error ?? null;
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new ClaudeRequestError(`Claude API request failed: ${message}`, status, body, cause);
  }

  const first = response.content[0];
  if (!first || first.type !== 'text') {
    throw new ClaudeRequestError('Claude API response did not contain a text block', 0, response);
  }

  const usage = response.usage as Anthropic.Messages.Usage | undefined;
  return {
    markdown: first.text,
    model: response.model ?? options.model,
    usage: usage
      ? {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          ...(usage.cache_read_input_tokens != null
            ? { cacheReadInputTokens: usage.cache_read_input_tokens }
            : {}),
          ...(usage.cache_creation_input_tokens != null
            ? { cacheCreationInputTokens: usage.cache_creation_input_tokens }
            : {}),
        }
      : undefined,
  };
}
