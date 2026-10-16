'use client';

import { useState } from 'react';
import CanvasArea from './CanvasArea';
import FieldCapsuleBar from './FieldCapsuleBar';
import FieldPropertiesPanel from './FieldPropertiesPanel';
import RecipientList from './RecipientList';
import PreviewModal from './PreviewModal';
import { useCertificate } from '@/app/context/CertificateContext';
import { PressDepth } from '@/app/components/interior/press-depth';

const PositionStep = () => {
  const { placedFields, selectedRowCount, goToStep, canEnterExport } = useCertificate();
  const [previewRow, setPreviewRow] = useState<number | null>(null);

  return (
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <FieldCapsuleBar />
        <CanvasArea />
        <RecipientList onPreview={setPreviewRow} />
      </div>

      <div className="w-full lg:w-[35%] lg:min-w-[320px] lg:max-w-[420px] border-t lg:border-t-0 lg:border-l border-border-default bg-surface overflow-y-auto flex flex-col max-h-[40vh] lg:max-h-none">
        <div className="flex-1">
          <FieldPropertiesPanel />
        </div>
        <div className="p-4 border-t border-border-default flex gap-3">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="px-4 py-3 text-sm font-semibold rounded-lg border border-border-default text-text-primary bg-raised"
          >
            Back
          </button>
          <div className="flex-1">
            <PressDepth
              disabled={!canEnterExport}
              onClick={() => goToStep(3)}
              className={`w-full ${!canEnterExport ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {placedFields.length === 0
                ? 'Place a field first'
                : selectedRowCount === 0
                  ? 'Select a recipient'
                  : 'Continue to Export'}
            </PressDepth>
          </div>
        </div>
      </div>

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
