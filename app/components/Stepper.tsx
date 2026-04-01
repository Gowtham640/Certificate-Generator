'use client';

import { Check } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';

const steps = ['UPLOAD', 'POSITION', 'EXPORT'];

const Stepper = () => {
  const { step } = useCertificate();

  return (
    <div className="bg-surface border-b border-border-default shadow-md relative z-20">
      <div className="flex items-center justify-center py-4 px-8 gap-0">
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          const isInactive = stepNum > step;

          return (
            <div key={label} className="flex items-center">
              {i > 0 && (
                <div className={`w-16 h-px mx-3 ${isCompleted || isActive ? 'bg-border-strong' : 'bg-border-default'}`} />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-accent text-base'
                      : isCompleted
                      ? 'bg-border-strong text-text-primary'
                      : 'bg-transparent border border-text-disabled text-text-disabled'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : stepNum}
                </div>
                <span
                  className={`stepper-label ${
                    isActive ? 'text-accent' : isCompleted ? 'text-text-secondary' : 'text-text-disabled'
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
