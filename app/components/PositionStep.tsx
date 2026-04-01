'use client';

import { useState } from 'react';
import CanvasArea from './CanvasArea';
import FieldCapsuleBar from './FieldCapsuleBar';
import FieldPropertiesPanel from './FieldPropertiesPanel';
import RecipientList from './RecipientList';
import PreviewModal from './PreviewModal';
import { useCertificate } from '@/app/context/CertificateContext';

const PositionStep = () => {
  const { placedFields, selectedRowCount, setStep } = useCertificate();
  const [previewRow, setPreviewRow] = useState<number | null>(null);

  const canAdvance = placedFields.length > 0 && selectedRowCount > 0;

  return (
    <div className="flex flex-1 min-h-0">
      {/* Left Column */}
      <div className="flex flex-col flex-1 min-h-0">
        <FieldCapsuleBar />
        <CanvasArea />
        <RecipientList onPreview={setPreviewRow} />
      </div>

      {/* Right Column */}
      <div className="w-[35%] min-w-[320px] max-w-[420px] border-l border-border-default bg-surface overflow-y-auto flex flex-col">
        <div className="flex-1">
          <FieldPropertiesPanel />
        </div>
        <div className="p-4 border-t border-border-default">
          <button
            disabled={!canAdvance}
            onClick={() => setStep(3)}
            className={`w-full px-4 py-3 text-sm font-semibold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
              canAdvance
                ? 'bg-accent text-base shadow-md hover:shadow-lg hover:brightness-110'
                : 'bg-raised text-text-disabled cursor-not-allowed'
            }`}
          >
            Continue to Export
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewRow !== null && (
        <PreviewModal
          rowIndex={previewRow}
          onClose={() => setPreviewRow(null)}
          onNavigate={setPreviewRow}
        />
      )}
    </div>
  );
};

export default PositionStep;
