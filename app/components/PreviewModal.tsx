'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';

interface PreviewModalProps {
  rowIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const PreviewModal = ({ rowIndex, onClose, onNavigate }: PreviewModalProps) => {
  const { templateImage, csvData, placedFields, fieldSettings } = useCertificate();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // First effect: keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && rowIndex > 0) onNavigate(rowIndex - 1);
      if (e.key === 'ArrowRight' && csvData && rowIndex < csvData.rows.length - 1) onNavigate(rowIndex + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rowIndex, csvData, onClose, onNavigate]);

  // Second effect: image scale tracking
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

  // Guard: all hooks called unconditionally above this point
  if (!csvData || !templateImage) return null;

  const row = csvData.rows[rowIndex];
  const personName = row?.[0] || `Row ${rowIndex + 1}`;
  const total = csvData.rows.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border-strong shadow-lg max-w-4xl w-full mx-4 rounded-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <span className="text-text-primary text-sm font-semibold">
            CERTIFICATE PREVIEW — {personName}
          </span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-hover transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-4 flex items-center justify-center"
          style={{ maxHeight: '70vh', overflow: 'auto' }}
        >
          <div className="relative inline-block">
            <img
              ref={imageRef}
              src={templateImage}
              alt="Certificate"
              className="max-w-full max-h-[60vh] block rounded-lg"
            />
            {placedFields.map(field => {
              const settings = fieldSettings[field.columnName] || field.settings;
              const colIndex = csvData.headers.indexOf(field.columnName);
              const text = colIndex >= 0 ? row[colIndex] : field.columnName;
              const scaledFontSize = settings.fontSize * previewScale;
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
                    transform: settings.align === 'center' ? 'translateX(-50%)' : settings.align === 'right' ? 'translateX(-100%)' : 'none',
                  }}
                >
                  {text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
          <button
            onClick={() => rowIndex > 0 && onNavigate(rowIndex - 1)}
            disabled={rowIndex === 0}
            className={`w-9 h-9 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
              rowIndex === 0 ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary bg-raised'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-text-secondary text-xs">{rowIndex + 1} / {total}</span>
          <button
            onClick={() => rowIndex < total - 1 && onNavigate(rowIndex + 1)}
            disabled={rowIndex === total - 1}
            className={`w-9 h-9 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
              rowIndex === total - 1 ? 'text-text-disabled cursor-not-allowed' : 'text-text-primary bg-raised'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <p className="text-text-disabled text-xs text-center">
            To make changes, close this preview and adjust fields or typography in the editor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
