import * as React from 'react';

interface ColumnResizeHandleProps {
  onPointerDown: (event: React.PointerEvent) => void;
}

export function ColumnResizeHandle({ onPointerDown }: ColumnResizeHandleProps) {
  return (
    <span
      onPointerDown={onPointerDown}
      onClick={(event) => event.stopPropagation()}
      className="group absolute right-0 top-0 z-10 h-full w-2.5 -mr-1 cursor-col-resize touch-none select-none"
    >
      <span className="mx-auto block h-full w-px bg-transparent group-hover:bg-primary" />
    </span>
  );
}
