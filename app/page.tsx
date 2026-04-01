'use client';

import { CertificateProvider, useCertificate } from '@/app/context/CertificateContext';
import Stepper from '@/app/components/Stepper';
import UploadStep from '@/app/components/UploadStep';
import PositionStep from '@/app/components/PositionStep';
import ExportStep from '@/app/components/ExportStep';

function CertificateGeneratorContent() {
  const { step } = useCertificate();

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border-default px-8 py-4">
        <h1 className="text-text-primary text-3xl font-semibold tracking-wide">
          Certificate Generator
        </h1>
      </header>

      {/* Stepper */}
      <Stepper />

      {/* Step Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {step === 1 && <UploadStep />}
        {step === 2 && <PositionStep />}
        {step === 3 && <ExportStep />}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CertificateProvider>
      <CertificateGeneratorContent />
    </CertificateProvider>
  );
}
