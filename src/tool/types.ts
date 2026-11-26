export type UppercaseMode = 'lowercase' | 'uppercase';

export type VersionOption = 'v4' | 'v4-multiple';

export interface HistoryEntry {
  /** The generated UUID. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** Letter case of generated UUIDs. */
  case: UppercaseMode;
  /** Number of UUIDs to generate at once (1-100). */
  count: number;
  /** Include hyphens in the output. */
  hyphens: boolean;
  /** Wrap each UUID in braces. */
  braces: boolean;
  /** The last generated UUIDs, one per line. */
  output: string;
  /** Saved generation history, newest first. */
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  case: 'lowercase',
  count: 5,
  hyphens: true,
  braces: false,
  output: '',
  history: [],
};

export const MAX_COUNT = 100;
export const MIN_COUNT = 1;
export const MAX_HISTORY = 20;

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when the string is a well-formed RFC 4122 version-4 UUID. */
export function isUuidV4(value: string): boolean {
  return UUID_V4_RE.test(value);
}

/** Clamp a requested count to the supported range. */
export function clampCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STATE.count;
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.round(value)));
}

/** Format a canonical UUID per state options (case, hyphens, braces). */
export function formatUuid(
  uuid: string,
  state: Pick<ToolState, 'case' | 'hyphens' | 'braces'>
): string {
  let out = state.case === 'uppercase' ? uuid.toUpperCase() : uuid.toLowerCase();
  if (!state.hyphens) out = out.replace(/-/g, '');
  if (state.braces) out = `{${out}}`;
  return out;
}

/**
 * Generate `count` UUID v4 strings using the platform CSPRNG
 * (crypto.randomUUID) with a randomBytes-based fallback.
 */
export function generateUuids(
  count: number,
  format: Pick<ToolState, 'case' | 'hyphens' | 'braces'>,
  randomUuid: () => string = defaultRandomUuid
): string[] {
  const clamped = clampCount(count);
  const result: string[] = [];
  for (let i = 0; i < clamped; i += 1) {
    result.push(formatUuid(randomUuid(), format));
  }
  return result;
}

/** CSPRNG UUID v4 source; falls back to random bytes when unavailable. */
interface MinimalCrypto {
  randomUUID?: () => string;
  getRandomValues?: (array: Uint8Array) => Uint8Array;
}
export function defaultRandomUuid(): string {
  const g = globalThis as { crypto?: MinimalCrypto };
  const cryptoObj = g.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID().toLowerCase();
  }
  const getRandomValues = cryptoObj?.getRandomValues;
  if (cryptoObj && typeof getRandomValues === 'function') {
    const bytes = getRandomValues.call(cryptoObj, new Uint8Array(16));
    const b6 = bytes[6] ?? 0;
    const b8 = bytes[8] ?? 0;
    bytes[6] = (b6 & 0x0f) | 0x40; // version 4
    bytes[8] = (b8 & 0x3f) | 0x80; // RFC variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  // Last-resort non-cryptographic fallback (never used in browsers/Node >= 19).
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  const r6 = bytes[6] ?? 0;
  const r8 = bytes[8] ?? 0;
  bytes[6] = (r6 & 0x0f) | 0x40;
  bytes[8] = (r8 & 0x3f) | 0x80;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Output text for a batch, one UUID per line. */
export function outputText(uuids: string[]): string {
  return uuids.join('\n');
}

/** Compact summary used by the status bar and copy actions. */
export function summaryText(state: ToolState): string {
  const count = state.output ? state.output.split('\n').filter(Boolean).length : 0;
  const variant = state.case === 'uppercase' ? 'uppercase' : 'lowercase';
  return `${count} UUID${count === 1 ? '' : 's'} (${variant})`;
}

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.case === 'string' &&
    typeof v.count === 'number' &&
    Array.isArray(v.history) &&
    DEFAULT_STATE !== undefined
  );
}
