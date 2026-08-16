import * as React from 'react';

const MIN_COLUMN_WIDTH = 60;

export function useResizableColumns(defaultWidths: Record<string, number>, storageKey: string) {
  const [widths, setWidths] = React.useState<Record<string, number>>(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) return { ...defaultWidths, ...JSON.parse(stored) };
    } catch {
      // localStorage indisponível ou valor corrompido — usa os padrões
    }
    return defaultWidths;
  });

  const resizing = React.useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const handlePointerMove = React.useCallback((event: PointerEvent) => {
    if (!resizing.current) return;
    const { key, startX, startWidth } = resizing.current;
    const nextWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + (event.clientX - startX));
    setWidths((prev) => ({ ...prev, [key]: nextWidth }));
  }, []);

  const handlePointerUp = React.useCallback(() => {
    resizing.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    setWidths((current) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(current));
      } catch {
        // ignore
      }
      return current;
    });
  }, [handlePointerMove, storageKey]);

  function startResize(key: string) {
    return (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      resizing.current = { key, startX: event.clientX, startWidth: widths[key] ?? defaultWidths[key] ?? 150 };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    };
  }

  return { widths, startResize };
}
