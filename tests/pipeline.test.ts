import { describe, it, expect, vi } from 'vitest';
import { runGenerate } from '../src/pipeline.js';
import * as generator from '../src/generator.js';
import type { GenerateOptions } from '../src/types.js';

vi.mock('../src/generator.js', async () => {
  const actual = await vi.importActual<typeof import('../src/generator.js')>('../src/generator.js');
  return {
    ...actual,
    createClient: vi.fn(),
  };
});

type FakeClient = {
  messages: { create: ReturnType<typeof vi.fn> };
};

function makeFakeClient(text = '# generated'): FakeClient {
  return {
    messages: {
      create: vi.fn(async () => ({
        model: 'claude-sonnet-4-6',
        content: [{ type: 'text', text }],
        usage: { input_tokens: 1, output_tokens: 2 },
      })),
    },
  };
}

describe('runGenerate', () => {
  it('prompt + system を Anthropic に渡す', async () => {
    const fake = makeFakeClient('# 生成本文');
    const opts: GenerateOptions = {
      prompt: 'user prompt body',
      system: 'system prompt body',
      auth: { type: 'api', apiKey: 'k' },
      clientFactory: () => fake as never,
    };
    const result = await runGenerate(opts);
    expect(result.markdown).toBe('# 生成本文');
    const args = fake.messages.create.mock.calls[0][0];
    expect(args.system[0].text).toBe('system prompt body');
    expect(args.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(args.messages[0].content).toBe('user prompt body');
  });

  it('system 未指定なら messages.create に system を渡さない', async () => {
    const fake = makeFakeClient();
    await runGenerate({
      prompt: 'q',
      auth: { type: 'oauth', oauthToken: 't' },
      clientFactory: () => fake as never,
    });
    const args = fake.messages.create.mock.calls[0][0];
    expect(args).not.toHaveProperty('system');
  });

  it('model / maxTokens を未指定ならデフォルトを使う', async () => {
    const fake = makeFakeClient();
    await runGenerate({
      prompt: 'q',
      auth: { type: 'api', apiKey: 'k' },
      clientFactory: () => fake as never,
    });
    const args = fake.messages.create.mock.calls[0][0];
    expect(args.model).toBe('claude-sonnet-4-6');
    expect(args.max_tokens).toBe(4096);
  });

  it('model / maxTokens を指定したらそれを使う', async () => {
    const fake = makeFakeClient();
    await runGenerate({
      prompt: 'q',
      model: 'claude-opus-4-7',
      maxTokens: 8192,
      auth: { type: 'api', apiKey: 'k' },
      clientFactory: () => fake as never,
    });
    const args = fake.messages.create.mock.calls[0][0];
    expect(args.model).toBe('claude-opus-4-7');
    expect(args.max_tokens).toBe(8192);
  });

  it('clientFactory に auth が渡される', async () => {
    const factory = vi.fn(() => makeFakeClient() as never);
    await runGenerate({
      prompt: 'q',
      auth: { type: 'oauth', oauthToken: 'tok' },
      clientFactory: factory,
    });
    expect(factory).toHaveBeenCalledWith({ type: 'oauth', oauthToken: 'tok' });
  });

  it('clientFactory 未指定なら createClient(auth) を経由する', async () => {
    const fake = makeFakeClient();
    vi.mocked(generator.createClient).mockReturnValue(fake as never);

    await runGenerate({
      prompt: 'q',
      auth: { type: 'api', apiKey: 'sk-test' },
    });

    expect(generator.createClient).toHaveBeenCalledWith({ type: 'api', apiKey: 'sk-test' });
    expect(fake.messages.create).toHaveBeenCalledOnce();
  });
});
