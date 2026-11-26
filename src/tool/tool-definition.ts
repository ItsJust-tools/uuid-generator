import type { Tool, DeserializeResult } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  clampCount,
  generateUuids,
  outputText,
  summaryText,
  type HistoryEntry,
  type ToolState,
  type UppercaseMode,
} from './types';

const VALID_CASES: UppercaseMode[] = ['lowercase', 'uppercase'];

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    case: state.case,
    count: state.count,
    hyphens: state.hyphens,
    braces: state.braces,
    output: state.output,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected UUID generator state object',
    };
  }
  const v = data as Record<string, unknown>;
  const caseMode: UppercaseMode = VALID_CASES.includes(v.case as UppercaseMode)
    ? (v.case as UppercaseMode)
    : DEFAULT_STATE.case;
  const state: ToolState = {
    case: caseMode,
    count: clampCount(typeof v.count === 'number' ? v.count : Number(v.count)),
    hyphens: boolOr(v.hyphens, DEFAULT_STATE.hyphens),
    braces: boolOr(v.braces, DEFAULT_STATE.braces),
    output: stringOr(v.output, DEFAULT_STATE.output),
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, text: string, now = new Date()): ToolState {
  const entry: HistoryEntry = { text, createdAt: now.toISOString() };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

/** Generate one batch of UUIDs and fill the output field. */
export function generateBatch(state: ToolState, randomUuid?: () => string): ToolState {
  const uuids = generateUuids(state.count, state, randomUuid);
  return { ...state, output: outputText(uuids) };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export const uuidGeneratorTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: () => import('./exporters/png') },
    { format: 'jpeg', loader: () => import('./exporters/jpeg') },
    { format: 'webp', loader: () => import('./exporters/webp') },
    { format: 'pdf', loader: () => import('./exporters/pdf') },
  ],
};

export { outputText, summaryText };
