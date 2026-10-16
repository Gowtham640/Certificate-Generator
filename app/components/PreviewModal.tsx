'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';
import { Modal } from '@/app/components/interior/modal';

interface PreviewModalProps {
  rowIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PreviewModal({ rowIndex, onClose, onNavigate }: PreviewModalProps) {
  const { templateImage, csvData, placedFields, fieldSettings } = useCertificate();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && rowIndex > 0) onNavigate(rowIndex - 1);
      if (e.key === 'ArrowRight' && csvData && rowIndex < csvData.rows.length - 1) {
        onNavigate(rowIndex + 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rowIndex, csvData, onNavigate]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img || !templateImage) return;

    const updateScale = () => {
      const naturalWidth = img.naturalWidth || 1;
      const displayedWidth = img.clientWidth || 1;
      setPreviewScale(displayedWidth / naturalWidth);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(img);
    img.addEventListener('load', updateScale);

    return () => {
      observer.disconnect();
      img.removeEventListener('load', updateScale);
    };
  }, [templateImage, rowIndex]);

  if (!csvData || !templateImage) return null;

  const row = csvData.rows[rowIndex];
  const personName = row?.[0] || `Row ${rowIndex + 1}`;
  const total = csvData.rows.length;

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Certificate preview — ${personName}`}
      description={`${rowIndex + 1} of ${total}. Arrow keys move between recipients.`}
      maxWidth={920}
      maxHeight="min(88vh, 860px)"
      footer={(
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (rowIndex > 0) onNavigate(rowIndex - 1);
            }}
            disabled={rowIndex === 0}
            className={`w-9 h-9 flex items-center justify-center border border-border-default rounded-lg ${
              rowIndex === 0 ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary bg-raised'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-text-secondary text-xs">
            {rowIndex + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => {
              if (rowIndex < total - 1) onNavigate(rowIndex + 1);
            }}
            disabled={rowIndex === total - 1}
            className={`w-9 h-9 flex items-center justify-center border border-border-default rounded-lg ${
              rowIndex === total - 1 ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary bg-raised'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    >
      <div className="flex justify-center">
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={templateImage}
            alt="Certificate"
            className="max-w-full max-h-[58vh] block rounded-lg"
          />
          {placedFields.map((field) => {
            const settings = fieldSettings[field.columnName] || field.settings;
            const colIndex = csvData.headers.indexOf(field.columnName);
            const text = colIndex >= 0 ? row[colIndex] : field.columnName;
            const scaledFontSize = settings.fontSize * previewScale;
            const shift =
              settings.align === 'center'
                ? 'translateX(-50%)'
                : settings.align === 'right'
                  ? 'translateX(-100%)'
                  : 'none';
            return (
              <div
                key={field.columnName}
                style={{
                  position: 'absolute',
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  fontFamily: settings.fontFamily,
                  fontSize: `${scaledFontSize}px`,
                  color: settings.color,
                  fontWeight: settings.bold ? 700 : 400,
                  fontStyle: settings.italic ? 'italic' : 'normal',
                  textDecoration: settings.underline ? 'underline' : 'none',
                  textAlign: settings.align,
                  whiteSpace: 'nowrap',
                  transform: shift,
                }}
              >
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
