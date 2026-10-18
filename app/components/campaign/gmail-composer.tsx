'use client';

import { useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

const ACTIONS: { cmd: string; label: string; arg?: string }[] = [
  { cmd: 'bold', label: 'B' },
  { cmd: 'italic', label: 'I' },
  { cmd: 'underline', label: 'U' },
  { cmd: 'strikeThrough', label: 'S' },
  { cmd: 'insertUnorderedList', label: '•' },
  { cmd: 'insertOrderedList', label: '1.' },
  { cmd: 'justifyLeft', label: 'Left' },
  { cmd: 'justifyCenter', label: 'Center' },
  { cmd: 'justifyRight', label: 'Right' },
  { cmd: 'removeFormat', label: 'Clear' },
];

/** Method: Gmail-style ContentEditable Composer — toolbar + contenteditable HTML body, same idea as Gmail compose. Interior has no rich-text component. */
export function GmailComposer({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (skip.current) {
      skip.current = false;
      return;
    }
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const run = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    skip.current = true;
    onChange(ref.current?.innerHTML ?? '');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-1.5 text-[12.5px] font-medium text-text-secondary">Content</p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-border-default bg-white">
        <div className="flex flex-wrap gap-1 border-b border-neutral-200 p-1.5">
          {ACTIONS.map((action) => (
            <button
              key={action.cmd}
              type="button"
              className="rounded-[7px] px-2 py-1 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100"
              onMouseDown={(event) => {
                event.preventDefault();
                run(action.cmd);
              }}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded-[7px] px-2 py-1 text-[12px] font-medium text-neutral-700 hover:bg-neutral-100"
            onMouseDown={(event) => {
              event.preventDefault();
              const href = window.prompt('Link URL');
              if (href) run('createLink', href);
            }}
          >
            Link
          </button>
        </div>
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-label="Email content"
          className="min-h-[240px] flex-1 overflow-auto px-3 py-2 text-[14px] text-neutral-900 outline-none"
          onInput={() => {
            skip.current = true;
            onChange(ref.current?.innerHTML ?? '');
          }}
        />
      </div>
    </div>
  );
}
