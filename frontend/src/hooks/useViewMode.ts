import * as React from 'react';

const STORAGE_KEY = 'rt-helpdesk:kb-view-mode';

export type KnowledgeBaseViewMode = 'grid' | 'list';

export function useViewMode(defaultMode: KnowledgeBaseViewMode = 'grid') {
  const [mode, setMode] = React.useState<KnowledgeBaseViewMode>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === 'grid' || stored === 'list' ? stored : defaultMode;
    } catch {
      return defaultMode;
    }
  });

  function setAndPersist(next: KnowledgeBaseViewMode) {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  return [mode, setAndPersist] as const;
}
