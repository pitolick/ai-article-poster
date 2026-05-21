import { describe, it, expect } from 'vitest';
import { withCacheControl } from '../src/cache.js';

describe('withCacheControl', () => {
  it('text と cache_control を持つブロック配列を返す', () => {
    const blocks = withCacheControl('You are an assistant.');
    expect(blocks).toEqual([
      {
        type: 'text',
        text: 'You are an assistant.',
        cache_control: { type: 'ephemeral' },
      },
    ]);
  });

  it('空文字列は空配列を返す（キャッシュ対象なし）', () => {
    expect(withCacheControl('')).toEqual([]);
  });

  it('null/undefined は空配列を返す', () => {
    expect(withCacheControl(null)).toEqual([]);
    expect(withCacheControl(undefined)).toEqual([]);
  });
});
