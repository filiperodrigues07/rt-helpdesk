import * as React from 'react';

export type ViewMode = 'grid' | 'list';

export function useViewMode(storageKey: string, defaultMode: ViewMode = 'grid') {
  const [mode, setMode] = React.useState<ViewMode>(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored === 'grid' || stored === 'list' ? stored : defaultMode;
    } catch {
      return defaultMode;
    }
  });

  function setAndPersist(next: ViewMode) {
    setMode(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // ignore
    }
  }

  return [mode, setAndPersist] as const;
}
