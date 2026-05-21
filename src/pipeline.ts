import type { GenerateOptions, GenerateResult } from './types.js';
import { DEFAULT_MAX_TOKENS, DEFAULT_MODEL } from './types.js';
import { callClaude, createClient } from './generator.js';

export async function runGenerate(options: GenerateOptions): Promise<GenerateResult> {
  const client = options.clientFactory
    ? options.clientFactory(options.auth)
    : createClient(options.auth);

  return callClaude(client, {
    model: options.model ?? DEFAULT_MODEL,
    system: options.system ?? '',
    userPrompt: options.prompt,
    maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
  });
}
