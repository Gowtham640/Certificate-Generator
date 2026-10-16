'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useCertificate } from '@/app/context/CertificateContext';
import { useWizard } from '@/app/components/interior/wizard-steps';

const STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'position', label: 'Position' },
  { id: 'export', label: 'Export' },
];

const RAIL = { type: 'spring', stiffness: 520, damping: 40, mass: 0.5 } as const;

const Stepper = () => {
  const { step, goToStep, canEnterPosition, canEnterExport } = useCertificate();
  const reduced = useReducedMotion();
  const furthest = canEnterExport ? 2 : canEnterPosition ? 1 : 0;

  const wizard = useWizard({
    total: 3,
    index: step - 1,
    onIndexChange: (index) => goToStep(index + 1),
  });

  return (
    <div className="bg-surface border-b border-border-default shadow-md relative z-20 px-5 md:px-8 py-4">
      <p className="sr-only" aria-live="polite">
        Step {step} of 3: {STEPS[step - 1]?.label}
      </p>
      <ol aria-label="Certificate workflow" className="flex max-w-xl mx-auto list-none items-center gap-1 p-0">
        {STEPS.map((s, i) => {
          const done = i < step - 1;
          const here = i === step - 1;
          const reachable = i <= furthest;

          const tile = (
            <motion.span
              aria-hidden
              className={`grid size-7 place-items-center rounded-[8px] border text-[11.5px] font-medium tabular-nums transition-colors duration-150 ${
                done
                  ? 'border-accent bg-accent text-base'
                  : here
                    ? 'border-accent bg-raised text-text-primary'
                    : 'border-border-default bg-surface text-text-disabled'
              }`}
              initial={false}
              animate={{ scale: here ? 1 : 0.92 }}
              transition={reduced ? { duration: 0 } : RAIL}
            >
              {done ? (
                <svg width="12" height="12" viewBox="0 0 256 256" fill="none" aria-hidden="true">
                  <polyline
                    points="216 72 104 184 48 128"
                    stroke="currentColor"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                i + 1
              )}
            </motion.span>
          );

          return (
            <li key={s.id} className="flex flex-1 items-center gap-1 last:flex-none">
              {reachable ? (
                <button
                  type="button"
                  data-current={here ? 'true' : undefined}
                  aria-current={here ? 'step' : undefined}
                  aria-label={`Step ${i + 1} of 3: ${s.label}`}
                  onClick={() => wizard.goTo(i)}
                  className="flex items-center gap-2 rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {tile}
                  <span className={`stepper-label hidden sm:inline ${here ? 'text-accent' : done ? 'text-text-secondary' : 'text-text-disabled'}`}>
                    {s.label}
                  </span>
                </button>
              ) : (
                <span className="flex items-center gap-2">
                  {tile}
                  <span className="stepper-label hidden sm:inline text-text-disabled">{s.label}</span>
                </span>
              )}

              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className="relative h-[3px] flex-1 overflow-hidden rounded-[2px] bg-raised"
                >
                  <motion.span
                    className="absolute inset-0 origin-left rounded-[2px] bg-accent"
                    initial={false}
                    animate={{ scaleX: i < step - 1 ? 1 : 0 }}
                    transition={reduced ? { duration: 0 } : RAIL}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default Stepper;
