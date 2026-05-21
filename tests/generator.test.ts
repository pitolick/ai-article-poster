import { describe, it, expect, vi } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, callClaude } from '../src/generator.js';
import { ClaudeRequestError } from '../src/errors.js';
import type { ClaudeAuth } from '../src/types.js';

function makeFakeClient(response: unknown): { messages: { create: ReturnType<typeof vi.fn> } } {
  return {
    messages: {
      create: vi.fn(async () => response),
    },
  };
}

describe('createClient', () => {
  it('type=api のとき Anthropic クライアントを返す', () => {
    const auth: ClaudeAuth = { type: 'api', apiKey: 'sk-test' };
    const client = createClient(auth);
    expect(client).toBeInstanceOf(Anthropic);
  });

  it('type=oauth のとき Anthropic クライアントを返す', () => {
    const auth: ClaudeAuth = { type: 'oauth', oauthToken: 'oauth-token-xxx' };
    const client = createClient(auth);
    expect(client).toBeInstanceOf(Anthropic);
  });

  it('type=api で apiKey 未指定なら例外', () => {
    expect(() => createClient({ type: 'api' })).toThrow(/apiKey is required/);
  });

  it('type=oauth で oauthToken 未指定なら例外', () => {
    expect(() => createClient({ type: 'oauth' })).toThrow(/oauthToken is required/);
  });
});

describe('callClaude', () => {
  it('messages.create を model / system / messages / max_tokens 付きで呼ぶ', async () => {
    const fake = makeFakeClient({
      model: 'claude-sonnet-4-6',
      content: [{ type: 'text', text: '# 生成本文' }],
      usage: { input_tokens: 100, output_tokens: 50 },
    });
    const result = await callClaude(fake as never, {
      model: 'claude-sonnet-4-6',
      system: 'You are an assistant.',
      userPrompt: 'こんにちは',
      maxTokens: 1024,
    });
    expect(fake.messages.create).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: 'You are an assistant.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: 'こんにちは' }],
    });
    expect(result.markdown).toBe('# 生成本文');
    expect(result.model).toBe('claude-sonnet-4-6');
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
  });

  it('system が空文字列のときは system キーを送らない', async () => {
    const fake = makeFakeClient({
      model: 'claude-sonnet-4-6',
      content: [{ type: 'text', text: 'ok' }],
    });
    await callClaude(fake as never, {
      model: 'claude-sonnet-4-6',
      system: '',
      userPrompt: 'q',
      maxTokens: 100,
    });
    const args = fake.messages.create.mock.calls[0][0];
    expect(args).not.toHaveProperty('system');
  });

  it('content[0] が text 以外なら ClaudeRequestError を投げる', async () => {
    const fake = makeFakeClient({
      model: 'claude-sonnet-4-6',
      content: [{ type: 'tool_use', id: 'x', name: 'y', input: {} }],
    });
    await expect(
      callClaude(fake as never, {
        model: 'claude-sonnet-4-6',
        system: '',
        userPrompt: 'q',
        maxTokens: 100,
      }),
    ).rejects.toBeInstanceOf(ClaudeRequestError);
  });

  it('content が空配列なら ClaudeRequestError を投げる', async () => {
    const fake = makeFakeClient({
      model: 'claude-sonnet-4-6',
      content: [],
    });
    await expect(
      callClaude(fake as never, {
        model: 'claude-sonnet-4-6',
        system: '',
        userPrompt: 'q',
        maxTokens: 100,
      }),
    ).rejects.toBeInstanceOf(ClaudeRequestError);
  });

  it('SDK が APIError を投げたら ClaudeRequestError にラップする', async () => {
    const underlying = Object.assign(new Error('rate limit'), {
      status: 429,
      error: { type: 'rate_limit_error' },
    });
    const client = {
      messages: {
        create: vi.fn(async () => {
          throw underlying;
        }),
      },
    };
    await expect(
      callClaude(client as never, {
        model: 'claude-sonnet-4-6',
        system: 'sys',
        userPrompt: 'q',
        maxTokens: 100,
      }),
    ).rejects.toMatchObject({
      name: 'ClaudeRequestError',
      status: 429,
    });
  });

  it('usage に cache_*_input_tokens が含まれていれば返却に反映する', async () => {
    const fake = makeFakeClient({
      model: 'claude-sonnet-4-6',
      content: [{ type: 'text', text: 'ok' }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        cache_read_input_tokens: 5,
        cache_creation_input_tokens: 3,
      },
    });
    const result = await callClaude(fake as never, {
      model: 'claude-sonnet-4-6',
      system: 's',
      userPrompt: 'q',
      maxTokens: 100,
    });
    expect(result.usage).toEqual({
      inputTokens: 10,
      outputTokens: 20,
      cacheReadInputTokens: 5,
      cacheCreationInputTokens: 3,
    });
  });
});
