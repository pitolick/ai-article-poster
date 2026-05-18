import { describe, it, expect } from 'vitest';
import { AI_ARTICLE_POSTER_VERSION } from '../src/index.js';

describe('ai-article-poster smoke test', () => {
  it('exports a version string', () => {
    expect(typeof AI_ARTICLE_POSTER_VERSION).toBe('string');
    expect(AI_ARTICLE_POSTER_VERSION).toBe('0.0.0');
  });
});
