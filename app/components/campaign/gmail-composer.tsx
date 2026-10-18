'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type Action = {
  cmd: string;
  title: string;
  icon: ReactNode;
  arg?: string;
};

const iconClass = 'block fill-current';

/** Material icons Gmail compose uses (20dp, same paths as Google Material). */
function IconBold() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function IconItalic() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
  );
}

function IconUnderline() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
    </svg>
  );
}

function IconStrike() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 .49 3.9 1.28.77.65 1.46 1.73 1.46 3.24h-3.01c0-.31-.05-.59-.15-.85-.29-.7-1.04-1.03-2.2-1.03-1.54 0-2.23.83-2.23 1.72 0 .48.22.93.76 1.24.32.18.69.33 1.11.44H7.39c-.37-.41-.54-.96-.54-1.96zM21 12v-2H3v2h9.62c.18.07.4.14.55.2.37.17.66.34.87.51s.35.36.43.57c.07.17.1.38.1.64 0 .6-.26 1.05-.65 1.33-.48.32-1.23.45-2.22.45-1.61 0-2.73-.49-3.23-1.43a2.77 2.77 0 0 1-.22-.92H6.04c.05.98.3 1.81.8 2.48.69.91 1.87 1.62 3.65 1.87.51.07 1.05.1 1.6.1 2.92 0 5.09-1.14 5.09-3.71 0-.44-.09-.85-.24-1.23H21z" />
    </svg>
  );
}

function IconBullets() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12.02c-.83 0-1.5.67-1.5 1.5s.68 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
    </svg>
  );
}

function IconNumbers() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  );
}

function IconAlignLeft() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
    </svg>
  );
}

function IconAlignCenter() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
    </svg>
  );
}

function IconAlignRight() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M3.27 5 2 6.27l6.97 6.97L6.5 19h3l1.57-3.54L13.73 15 17.73 19 19 17.73 3.27 5zM6 5v.18L8.82 8h2.4l-.4 1.15 1.44 1.44L13.5 8H15l-2.85 6.15.91 2.01L17.73 8H20V5H6z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg className={iconClass} width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  );
}

const ACTIONS: Action[] = [
  { cmd: 'bold', title: 'Bold', icon: <IconBold /> },
  { cmd: 'italic', title: 'Italic', icon: <IconItalic /> },
  { cmd: 'underline', title: 'Underline', icon: <IconUnderline /> },
  { cmd: 'strikeThrough', title: 'Strikethrough', icon: <IconStrike /> },
  { cmd: 'insertUnorderedList', title: 'Bulleted list', icon: <IconBullets /> },
  { cmd: 'insertOrderedList', title: 'Numbered list', icon: <IconNumbers /> },
  { cmd: 'justifyLeft', title: 'Align left', icon: <IconAlignLeft /> },
  { cmd: 'justifyCenter', title: 'Align center', icon: <IconAlignCenter /> },
  { cmd: 'justifyRight', title: 'Align right', icon: <IconAlignRight /> },
  { cmd: 'removeFormat', title: 'Remove formatting', icon: <IconClear /> },
];

const btnClass =
  'inline-flex size-8 items-center justify-center rounded-[4px] text-[#444746] hover:bg-[#e8eaed]';

/** Method: Gmail-style ContentEditable Composer — Gmail Material toolbar icons + contenteditable HTML. */
export function GmailComposer({ value, onChange }: { value: string; onChange: (html: string) => void }) {
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
        <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 px-1.5 py-1">
          {ACTIONS.map((action) => (
            <button
              key={action.cmd}
              type="button"
              title={action.title}
              aria-label={action.title}
              className={btnClass}
              onMouseDown={(event) => {
                event.preventDefault();
                run(action.cmd);
              }}
            >
              {action.icon}
            </button>
          ))}
          <button
            type="button"
            title="Insert link"
            aria-label="Insert link"
            className={btnClass}
            onMouseDown={(event) => {
              event.preventDefault();
              const href = window.prompt('Link URL');
              if (href) run('createLink', href);
            }}
          >
            <IconLink />
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
