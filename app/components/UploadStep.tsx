'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Image } from 'lucide-react';
import Papa from 'papaparse';
import { useCertificate } from '@/app/context/CertificateContext';
import { PressDepth } from '@/app/components/interior/press-depth';
import {
  MAX_CSV_BYTES,
  MAX_IMAGE_BYTES,
  formatBytes,
  isCertificateImage,
  isCsvFile,
} from '@/app/lib/files';

const UploadZone = ({
  label,
  subtext,
  accept,
  icon: Icon,
  onFile,
  uploaded,
  uploadedInfo,
  error,
}: {
  label: string;
  subtext: string;
  accept: string;
  icon: React.ElementType;
  onFile: (file: File) => void;
  uploaded: boolean;
  uploadedInfo?: React.ReactNode;
  error?: string;
}) => {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const takeFile = useCallback((file: File) => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      onFile(file);
    }, 180);
  }, [onFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) takeFile(file);
  }, [takeFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) takeFile(file);
  }, [takeFile]);

  return (
    <div className="flex flex-col h-full min-h-[220px]">
      {busy ? (
        <div className="flex-1 border-2 border-dashed border-border-strong rounded-lg p-12 flex items-center justify-center bg-raised animate-pulse">
          <div className="w-full h-4 bg-hover rounded-lg" />
        </div>
      ) : uploaded && uploadedInfo ? (
        <div className="flex-1 bg-raised border border-border-default rounded-lg p-4 shadow-sm flex items-center">
          {uploadedInfo}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`flex-1 border-2 border-dashed rounded-lg p-8 md:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-150 ${
            dragging
              ? 'border-accent border-solid bg-accent-dim'
              : 'border-border-strong bg-surface hover:border-accent'
          }`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <Icon size={32} className="text-text-disabled" />
          <span className="label-sm">{label}</span>
          <span className="subtext text-center">{subtext}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
};

const UploadStep = () => {
  const {
    templateImage, templateFilename, setTemplateImage, clearTemplate,
    csvData, setCsvData, clearCsv, goToStep, canEnterPosition,
  } = useCertificate();
  const [imageError, setImageError] = useState('');
  const [csvError, setCsvError] = useState('');

  const handleTemplate = useCallback((file: File) => {
    setImageError('');
    if (!isCertificateImage(file)) {
      setImageError('Use a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`Image is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_IMAGE_BYTES)}.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setTemplateImage(url, file.name, img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setImageError('Could not read that image.');
    };
    img.src = url;
  }, [setTemplateImage]);

  const handleCsv = useCallback((file: File) => {
    setCsvError('');
    if (!isCsvFile(file)) {
      setCsvError('Use a .csv file.');
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setCsvError(`CSV is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_CSV_BYTES)}.`);
      return;
    }
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length < 2 || !data[0]?.length) {
          setCsvError('Need a header row and at least one recipient row.');
          return;
        }
        const headers = data[0].map(h => String(h).trim()).filter(Boolean);
        if (headers.length === 0) {
          setCsvError('The first row has no column names.');
          return;
        }
        const width = data[0].length;
        const rows = data.slice(1).map(row => {
          const next = row.map(cell => String(cell ?? ''));
          while (next.length < width) next.push('');
          return next.slice(0, width);
        }).filter(row => row.some(cell => cell.trim() !== ''));
        if (rows.length === 0) {
          setCsvError('No recipient rows after the header.');
          return;
        }
        setCsvData({ headers: data[0].map(h => String(h)), rows, filename: file.name });
      },
      error: () => {
        setCsvError('Could not parse this file. Check that it is a valid CSV with headers.');
      },
    });
  }, [setCsvData]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-5 md:px-8 py-8 md:py-12 overflow-y-auto">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl items-stretch">
        <div className="flex-1 min-w-0">
          <UploadZone
            label="CERTIFICATE TEMPLATE"
            subtext="PNG, JPG, or WebP of the blank certificate"
            accept="image/png,image/jpeg,image/webp"
            icon={Image}
            onFile={handleTemplate}
            uploaded={!!templateImage}
            error={imageError}
            uploadedInfo={
              templateImage && templateFilename ? (
                <div className="flex items-center gap-3 w-full">
                  <img src={templateImage} alt="Template preview" className="w-16 h-10 object-cover border border-border-default rounded-lg" />
                  <span className="text-text-primary text-sm flex-1 truncate">{templateFilename}</span>
                  <button
                    type="button"
                    className="text-text-secondary text-xs hover:text-accent transition-colors"
                    onClick={(e) => { e.stopPropagation(); clearTemplate(); }}
                  >
                    Replace
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <UploadZone
            label="RECIPIENT CSV"
            subtext="Each column becomes a field you can place"
            accept=".csv,text/csv"
            icon={FileText}
            onFile={handleCsv}
            uploaded={!!csvData}
            error={csvError}
            uploadedInfo={
              csvData ? (
                <div className="flex items-center gap-3 w-full">
                  <FileText size={20} className="text-text-disabled shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary text-sm truncate">{csvData.filename}</div>
                    <div className="subtext">{csvData.rows.length} recipients · {csvData.headers.length} fields</div>
                  </div>
                  <button
                    type="button"
                    className="text-text-secondary text-xs hover:text-accent transition-colors"
                    onClick={(e) => { e.stopPropagation(); clearCsv(); setCsvError(''); }}
                  >
                    Replace
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
      <div className="mt-6 w-full max-w-4xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <a
            href="/sample-recipients.csv"
            download
            className="text-xs text-text-secondary hover:text-accent underline-offset-4 hover:underline"
          >
            Download a sample CSV
          </a>
          <a
            href="/sample-template.png"
            download
            className="text-xs text-text-secondary hover:text-accent underline-offset-4 hover:underline"
          >
            Download a sample template
          </a>
        </div>
        <PressDepth
          disabled={!canEnterPosition}
          onClick={() => goToStep(2)}
          className={!canEnterPosition ? 'opacity-50 pointer-events-none' : ''}
        >
          Continue to Position
        </PressDepth>
      </div>
    </div>
  );
};

export default UploadStep;
