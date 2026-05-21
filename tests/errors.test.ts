import { describe, it, expect } from 'vitest';
import { AIArticlePosterError, ClaudeRequestError } from '../src/errors.js';

describe('AIArticlePosterError', () => {
  it('Error のサブクラスである', () => {
    const err = new AIArticlePosterError('boom');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(err.name).toBe('AIArticlePosterError');
  });
});

describe('ClaudeRequestError', () => {
  it('status / body / cause を保持する', () => {
    const cause = new Error('underlying');
    const err = new ClaudeRequestError(
      '429 Too Many Requests',
      429,
      { type: 'rate_limit_error' },
      cause,
    );
    expect(err).toBeInstanceOf(AIArticlePosterError);
    expect(err.status).toBe(429);
    expect(err.body).toEqual({ type: 'rate_limit_error' });
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('ClaudeRequestError');
  });
});
