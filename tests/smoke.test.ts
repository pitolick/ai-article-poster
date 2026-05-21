import { describe, it, expect } from 'vitest';
import * as api from '../src/index.js';

describe('public API smoke', () => {
  it('主要シンボルが export されている', () => {
    expect(typeof api.generate).toBe('function');
    expect(typeof api.runGenerate).toBe('function');
    expect(typeof api.createClient).toBe('function');
    expect(typeof api.callClaude).toBe('function');
    expect(typeof api.withCacheControl).toBe('function');
    expect(api.DEFAULT_MODEL).toBe('claude-sonnet-4-6');
    expect(api.DEFAULT_MAX_TOKENS).toBe(4096);
  });
});
