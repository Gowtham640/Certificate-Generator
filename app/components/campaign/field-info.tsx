'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';

type Props = {
  label: string;
  children: string;
};

/** Click the i to read what the field is. Closes on outside click or Escape. */
export function FieldInfo({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0 self-end pb-1">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-controls={tipId}
        className="inline-flex size-8 items-center justify-center rounded-full text-text-secondary hover:bg-raised hover:text-text-primary"
        onClick={() => setOpen((value) => !value)}
      >
        <Info className="size-4" strokeWidth={1.75} />
      </button>
      {open ? (
        <p
          id={tipId}
          role="tooltip"
          className="absolute right-0 z-20 mt-1 w-56 rounded-[10px] border border-border-default bg-surface px-3 py-2 text-xs leading-5 text-text-primary shadow-md"
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}
