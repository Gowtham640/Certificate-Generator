'use client';

import { useCertificate } from '@/app/context/CertificateContext';
import Stepper from '@/app/components/Stepper';
import UploadStep from '@/app/components/UploadStep';
import PositionStep from '@/app/components/PositionStep';
import ExportStep from '@/app/components/ExportStep';
import { HoldToConfirm } from '@/app/components/interior/hold-to-confirm';

function CertificateGeneratorContent() {
  const { step, resetAll, canEnterPosition } = useCertificate();

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="bg-surface border-b border-border-default px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-text-primary text-2xl md:text-3xl font-semibold tracking-wide truncate">
            Certificate Generator
          </h1>
          <p className="subtext mt-1 hidden sm:block">
            Template + CSV, place fields, export a ZIP of PNG or PDF files.
          </p>
        </div>
        {canEnterPosition && (
          <HoldToConfirm onConfirm={resetAll} duration={1100} confirmLabel="Cleared">
            Hold to reset
          </HoldToConfirm>
        )}
      </header>

      <Stepper />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {step === 1 && <UploadStep />}
        {step === 2 && <PositionStep />}
        {step === 3 && <ExportStep />}
      </div>
    </div>
  );
}

export default function GenerateCertificatePage() {
  return <CertificateGeneratorContent />;
}
