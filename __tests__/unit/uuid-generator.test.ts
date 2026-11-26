import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STATE,
  MAX_COUNT,
  MAX_HISTORY,
  MIN_COUNT,
  clampCount,
  formatUuid,
  generateUuids,
  defaultRandomUuid,
  isUuidV4,
  outputText,
  summaryText,
  type ToolState,
} from '@/tool/types';
import {
  deserializeState,
  serializeState,
  withHistory,
  generateBatch,
  roundTrips,
  uuidGeneratorTool,
} from '@/tool/tool-definition';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('defaultRandomUuid', () => {
  it('produces canonical v4 UUIDs', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isUuidV4(defaultRandomUuid())).toBe(true);
    }
  });

  it('produces unique values', () => {
    const set = new Set(Array.from({ length: 200 }, () => defaultRandomUuid()));
    expect(set.size).toBe(200);
  });
});

describe('isUuidV4', () => {
  it('accepts canonical v4 UUIDs in any case', () => {
    expect(isUuidV4('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
    expect(isUuidV4('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(true);
  });

  it('rejects wrong version, variant, or format', () => {
    expect(isUuidV4('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(false); // v1
    expect(isUuidV3()).toBe(false);
    expect(isUuidV4('not-a-uuid')).toBe(false);
    expect(isUuidV4('')).toBe(false);
  });

  function isUuidV3(): boolean {
    return isUuidV4('3f2504e0-4f89-31d3-9a0c-0305e82c3301');
  }
});

describe('clampCount', () => {
  it('clamps to 1-100 and rounds', () => {
    expect(clampCount(0)).toBe(MIN_COUNT);
    expect(clampCount(-5)).toBe(MIN_COUNT);
    expect(clampCount(1000)).toBe(MAX_COUNT);
    expect(clampCount(7)).toBe(7);
    expect(clampCount(7.6)).toBe(8);
    expect(clampCount(Number.NaN)).toBe(DEFAULT_STATE.count);
  });
});

describe('formatUuid', () => {
  const uuid = '3f2504e0-4f89-4cd3-9a0c-0305e82c3301';
  it('applies hyphens, case, and braces options', () => {
    expect(formatUuid(uuid, { case: 'lowercase', hyphens: true, braces: false })).toBe(uuid);
    expect(formatUuid(uuid, { case: 'uppercase', hyphens: true, braces: false })).toBe(
      uuid.toUpperCase()
    );
    expect(formatUuid(uuid, { case: 'lowercase', hyphens: false, braces: false })).toBe(
      uuid.replace(/-/g, '')
    );
    expect(formatUuid(uuid, { case: 'uppercase', hyphens: false, braces: true })).toBe(
      `{${uuid.toUpperCase().replace(/-/g, '')}}`
    );
  });
});

describe('generateUuids', () => {
  it('generates the requested count (clamped)', () => {
    const fake = () => '3f2504e0-4f89-4cd3-9a0c-0305e82c3301';
    expect(generateUuids(5, DEFAULT_STATE, fake)).toHaveLength(5);
    expect(generateUuids(0, DEFAULT_STATE, fake)).toHaveLength(1);
    expect(generateUuids(1000, DEFAULT_STATE, fake)).toHaveLength(100);
  });

  it('applies formatting options', () => {
    const fake = () => '3f2504e0-4f89-4cd3-9a0c-0305e82c3301';
    const out = generateUuids(1, { case: 'uppercase', hyphens: false, braces: true }, fake);
    expect(out[0]).toBe('{3F2504E04F894CD39A0C0305E82C3301}');
  });

  it('values are unique in real generation', () => {
    const out = generateUuids(100, DEFAULT_STATE);
    expect(new Set(out).size).toBe(100);
    expect(out.every((u) => isUuidV4(u))).toBe(true);
  });
});

describe('outputText and summaryText', () => {
  it('joins one per line and summarizes count', () => {
    const out = outputText(['a', 'b']);
    expect(out).toBe('a\nb');
    expect(summaryText(state({ output: out }))).toBe('2 UUIDs (lowercase)');
    expect(summaryText(state({ output: 'only', case: 'uppercase' }))).toBe('1 UUID (uppercase)');
    expect(summaryText(state({ output: '' }))).toBe('0 UUIDs (lowercase)');
  });
});

describe('generateBatch', () => {
  it('fills the output and uses options', () => {
    const fake = () => '3f2504e0-4f89-4cd3-9a0c-0305e82c3301';
    const next = generateBatch(state({ count: 3, case: 'uppercase' }), fake);
    expect(next.output.split('\n')).toHaveLength(3);
    expect(next.output).toBe(Array.from({ length: 3 }, () => formatUuid(fake(), next)).join('\n'));
  });

  it('preserves history and other fields', () => {
    const withH = withHistory(state(), 'old');
    const next = generateBatch(withH, () => '3f2504e0-4f89-4cd3-9a0c-0305e82c3301');
    expect(next.history).toHaveLength(1);
  });
});

describe('serialize/deserialize', () => {
  it('round-trips valid full state', () => {
    const full = state({ count: 10, case: 'uppercase', hyphens: false, braces: true, output: 'x' });
    const restored = deserializeState(JSON.parse(serializeState(full)));
    expect(restored.success).toBe(true);
    expect(restored.success && restored.data).toEqual(full);
    expect(roundTrips(full)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(deserializeState('nope').success).toBe(false);
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState([1]).success).toBe(false);
  });

  it('repairs invalid fields with defaults', () => {
    const repaired = deserializeState({ nope: true, count: 5000, case: 'sideways' });
    expect(repaired.success).toBe(true);
    expect(repaired.success && repaired.data.case).toBe('lowercase');
    expect(repaired.success && repaired.data.count).toBe(MAX_COUNT);
    expect(repaired.success && repaired.data.hyphens).toBe(true);
  });
});

describe('withHistory', () => {
  it('prepends newest and caps at MAX_HISTORY', () => {
    let s = state();
    for (let i = 0; i < MAX_HISTORY + 5; i += 1) {
      s = withHistory(s, `u${i}`, new Date(2026, 0, 1, 0, 0, i));
    }
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`u${MAX_HISTORY + 4}`);
    expect(s.history[MAX_HISTORY - 1]?.text).toBe(`u${5}`);
  });
});

describe('tool wiring', () => {
  it('exposes the correct identity', () => {
    expect(uuidGeneratorTool.id).toBe('uuid-generator');
    expect(uuidGeneratorTool.name).toBe('UUID Generator');
    expect(uuidGeneratorTool.initialState).toEqual(DEFAULT_STATE);
  });

  it('supports image export formats', () => {
    const formats = (uuidGeneratorTool.exporters ?? []).map((e) => e.format);
    expect(formats).toEqual(expect.arrayContaining(['png', 'jpeg', 'webp', 'pdf']));
  });
});
