'use client';

import React from 'react';
import { formatUuid, isUuidV4, type ToolState } from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onGenerate?: () => void;
  onSaveHistory?: (text: string) => void;
}

const toggleClass = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-xs font-medium ${
    active
      ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
  }`;

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Copy value"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onGenerate, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const lines = state.output ? state.output.split('\n').filter(Boolean) : [];

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="uuid-canvas">
      <div className="grid gap-4 sm:grid-cols-2" data-testid="options">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Number of UUIDs (1-100)
          <input
            type="number"
            min={1}
            max={100}
            value={state.count}
            onChange={(e) => update({ count: Number(e.target.value) })}
            data-testid="input-count"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        <div>
          <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">Case</span>
          <div className="mt-1 flex gap-2" role="group" aria-label="Letter case">
            {(['lowercase', 'uppercase'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={state.case === c}
                data-testid={`case-${c}`}
                onClick={() => update({ case: c })}
                className={toggleClass(state.case === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={state.hyphens}
              onChange={(e) => update({ hyphens: e.target.checked })}
              data-testid="toggle-hyphens"
            />
            Hyphens
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={state.braces}
              onChange={(e) => update({ braces: e.target.checked })}
              data-testid="toggle-braces"
            />
            Braces
          </label>
        </div>
      </div>

      <button
        type="button"
        data-testid="btn-generate"
        onClick={() => onGenerate?.()}
        className="w-full rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600"
      >
        Generate
      </button>

      <div
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        data-testid="output-card"
        role="status"
      >
        <span className="mb-2 block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Output ({lines.length})
        </span>
        {lines.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="output-empty">
            Click Generate to create UUIDs.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="output-list">
            {lines.map((line, i) => {
              // Validate the core canonical form after stripping options.
              const core = line
                .replace(/^\{|\}$/g, '')
                .replace(/-/g, '')
                .toLowerCase();
              const canonical = `${core.slice(0, 8)}-${core.slice(8, 12)}-${core.slice(12, 16)}-${core.slice(16, 20)}-${core.slice(20)}`;
              const valid = isUuidV4(canonical);
              return (
                <li
                  key={`${line}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 font-mono text-xs dark:border-gray-800"
                  data-testid="uuid-row"
                >
                  <span
                    className={
                      valid ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {line}
                  </span>
                  <CopyButton value={line} testid={i === 0 ? 'copy-first' : undefined} />
                </li>
              );
            })}
          </ul>
        )}
        {lines.length > 0 ? (
          <div className="mt-3 flex gap-2">
            <CopyButton value={state.output} testid="copy-all" />
            <button
              type="button"
              data-testid="btn-save-history"
              onClick={() =>
                onSaveHistory?.(
                  lines.length === 1 && lines[0] !== undefined ? lines[0] : `${lines.length} UUIDs`
                )
              }
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Save to history
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          About
        </h3>
        <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300" data-testid="about-list">
          <li>UUID v4 — random, generated with the platform CSPRNG (crypto.randomUUID).</li>
          <li>122 random bits; collision probability is negligible.</li>
          <li>Everything runs locally in your browser; nothing is uploaded.</li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved UUIDs yet.
          </p>
        ) : (
          <ul className="space-y-1" data-testid="history-list">
            {state.history.map((entry, i) => (
              <li
                key={`${entry.createdAt}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-800"
              >
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {formatUuid(entry.text, state)}
                </span>
                <CopyButton value={entry.text} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        All UUIDs are generated on your device using a secure random source.
      </p>
    </div>
  );
};
