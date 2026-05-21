/** Anthropic system プロンプト用のブロック型（キャッシュ対象） */
export interface CachedTextBlock {
  type: 'text';
  text: string;
  cache_control: { type: 'ephemeral' };
}

/**
 * テキストを Anthropic prompt caching 対象のブロック配列に変換する。
 * 空文字列・null・undefined は空配列を返す（system プロンプト未指定として扱う）。
 */
export function withCacheControl(text: string | null | undefined): CachedTextBlock[] {
  if (!text) return [];
  return [
    {
      type: 'text',
      text,
      cache_control: { type: 'ephemeral' },
    },
  ];
}
