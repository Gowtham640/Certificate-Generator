'use client';

import { Check, X } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';

const FieldCapsuleBar = () => {
  const { csvData, placedFields, selectedField, placingField, startPlacing, selectField, removeField } = useCertificate();

  if (!csvData) return null;

  const placedNames = new Set(placedFields.map(f => f.columnName));

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border-default overflow-x-auto">
      <span className="label-sm whitespace-nowrap mr-1">FIELDS</span>
      {csvData.headers.map(header => {
        const isPlaced = placedNames.has(header);
        const isActive = placingField === header;
        const isSelected = selectedField === header;

        return (
          <div
            key={header}
            onClick={() => {
              if (isPlaced) {
                selectField(header);
              } else {
                startPlacing(header);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer border transition-all active:scale-95 shadow-sm select-none ${
              isActive
                ? 'bg-accent-dim border-accent border-2 text-accent'
                : isPlaced
                ? `bg-surface border-border-strong text-text-secondary ${isSelected ? 'ring-1 ring-accent' : ''}`
                : 'bg-raised border-border-default text-text-primary hover:bg-hover'
            }`}
          >
            {isPlaced && <Check size={12} className="text-text-secondary" />}
            <span>{header}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeField(header);
              }}
              className="ml-1 hover:text-danger transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FieldCapsuleBar;
