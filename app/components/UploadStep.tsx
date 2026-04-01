'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image } from 'lucide-react';
import Papa from 'papaparse';
import { useCertificate } from '@/app/context/CertificateContext';

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
  const [shimmer, setShimmer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setShimmer(true);
      setTimeout(() => { setShimmer(false); onFile(file); }, 300);
    }
  }, [onFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShimmer(true);
      setTimeout(() => { setShimmer(false); onFile(file); }, 300);
    }
  }, [onFile]);

  if (shimmer) {
    return (
      <div className="flex-1 border-2 border-dashed border-border-strong rounded-lg p-12 flex items-center justify-center bg-raised animate-pulse">
        <div className="w-full h-4 bg-hover rounded-lg" />
      </div>
    );
  }

  if (uploaded && uploadedInfo) {
    return (
      <div className="flex-1 bg-raised border border-border-default rounded-lg p-4 shadow-sm">
        {uploadedInfo}
      </div>
    );
  }

  return (
    <div>
      <div
        className={`flex-1 border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-150 ${
          dragging
            ? 'border-accent border-solid bg-accent-dim'
            : 'border-border-strong bg-surface hover:border-accent'
        }`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
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
      {error && <p className="mt-2 text-sm" style={{ color: 'hsl(var(--danger))' }}>{error}</p>}
    </div>
  );
};

const UploadStep = () => {
  const { templateImage, templateFilename, setTemplateImage, csvData, setCsvData, setStep } = useCertificate();
  const [csvError, setCsvError] = useState<string>('');

  const handleTemplate = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setTemplateImage(url, file.name, img.naturalWidth, img.naturalHeight);
    };
    img.src = url;
  }, [setTemplateImage]);

  const handleCsv = useCallback((file: File) => {
    setCsvError('');
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length < 2 || !data[0]?.length) {
          setCsvError('Could not parse this file. Check that it is a valid CSV with headers.');
          return;
        }
        const headers = data[0];
        const rows = data.slice(1);
        setCsvData({ headers, rows, filename: file.name });
      },
      error: () => {
        setCsvError('Could not parse this file. Check that it is a valid CSV with headers.');
      },
    });
  }, [setCsvData]);

  const canAdvance = !!templateImage && !!csvData;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-12">
      <div className="flex gap-6 w-full max-w-4xl">
        <div className="flex-1">
          <UploadZone
            label="CERTIFICATE TEMPLATE"
            subtext="Upload a PNG or JPG of your blank certificate"
            accept="image/png,image/jpeg"
            icon={Image}
            onFile={handleTemplate}
            uploaded={!!templateImage}
            uploadedInfo={
              templateImage && templateFilename ? (
                <div className="flex items-center gap-3">
                  <img src={templateImage} alt="Template" className="w-16 h-10 object-cover border border-border-default rounded-lg" />
                  <span className="text-text-primary text-sm flex-1 truncate">{templateFilename}</span>
                  <button
                    className="text-text-secondary text-xs hover:text-accent transition-colors"
                    onClick={(e) => { e.stopPropagation(); setTemplateImage('', '', 0, 0); }}
                  >
                    Replace
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
        <div className="flex-1">
          <UploadZone
            label="RECIPIENT CSV"
            subtext="Upload a CSV — each column becomes a field"
            accept=".csv,text/csv"
            icon={FileText}
            onFile={handleCsv}
            uploaded={!!csvData}
            error={csvError}
            uploadedInfo={
              csvData ? (
                <div className="flex items-center gap-3">
                  <Upload size={20} className="text-text-disabled" />
                  <div className="flex-1">
                    <div className="text-text-primary text-sm truncate">{csvData.filename}</div>
                    <div className="subtext">{csvData.rows.length} recipients · {csvData.headers.length} fields detected</div>
                  </div>
                  <button
                    className="text-text-secondary text-xs hover:text-accent transition-colors"
                    onClick={(e) => { e.stopPropagation(); setCsvData({ headers: [], rows: [], filename: '' }); setCsvError(''); }}
                  >
                    Replace
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
      </div>
      <div className="mt-10 flex justify-end w-full max-w-4xl">
        <button
          disabled={!canAdvance}
          onClick={() => setStep(2)}
          className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
            canAdvance
              ? 'bg-accent text-base shadow-md hover:shadow-lg hover:brightness-110'
              : 'bg-raised text-text-disabled cursor-not-allowed'
          }`}
        >
          Continue to Position
        </button>
      </div>
    </div>
  );
};

export default UploadStep;
