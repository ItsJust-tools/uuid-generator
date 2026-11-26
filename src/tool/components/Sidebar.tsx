'use client';

import React from 'react';
import { MAX_COUNT, MIN_COUNT, type ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="uuid-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Current options</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li className="flex justify-between gap-2">
            <span>Batch size</span>
            <span className="text-gray-500 dark:text-gray-400">
              {state.count} ({MIN_COUNT}–{MAX_COUNT})
            </span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Case</span>
            <span className="text-gray-500 dark:text-gray-400">{state.case}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Hyphens</span>
            <span className="text-gray-500 dark:text-gray-400">{state.hyphens ? 'on' : 'off'}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Braces</span>
            <span className="text-gray-500 dark:text-gray-400">{state.braces ? 'on' : 'off'}</span>
          </li>
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved results</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>G</kbd> — Generate
          </li>
          <li>
            <kbd>C</kbd> — Copy all
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current output and options;
          open it to restore this state.
        </p>
      </div>
    </div>
  );
};
