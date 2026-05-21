import { describe, it, expect, vi } from 'vitest';
import { generate } from '../src/index.js';

describe('generate (facade)', () => {
  it('runGenerate を呼んで結果を返す', async () => {
    const fake = {
      messages: {
        create: vi.fn(async () => ({
          model: 'claude-sonnet-4-6',
          content: [{ type: 'text', text: '# title\n本文' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        })),
      },
    };
    const result = await generate({
      prompt: 'テーマ X について書いて',
      system: 'あなたはアシスタントです',
      auth: { type: 'oauth', oauthToken: 't' },
      clientFactory: () => fake as never,
    });
    expect(result.markdown).toBe('# title\n本文');
    expect(result.usage?.inputTokens).toBe(5);
    expect(fake.messages.create).toHaveBeenCalledOnce();
  });
});
