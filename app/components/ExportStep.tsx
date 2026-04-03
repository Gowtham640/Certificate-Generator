'use client';

import { useState, useCallback, useEffect } from 'react';
import { FileImage, FileText, ChevronDown } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useCertificate } from '@/app/context/CertificateContext';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type ExportFormat = 'png' | 'pdf';

/** How each certificate file inside the ZIP should be named */
type FileNameMode = 'column' | 'sequential';

// Chunk size for batching exports into separate ZIP files
const CHUNK_SIZE = 100;

// Strip characters that are invalid in file names (Windows-safe)
function sanitizeFileNameBase(raw: string): string {
  const trimmed = raw.trim().slice(0, 120);
  if (!trimmed) return '';
  const withoutInvalid = trimmed.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
  const collapsed = withoutInvalid.replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return collapsed || '';
}

/** Ensures unique base names within one ZIP chunk */
function makeUniqueBaseName(tracker: Map<string, number>, base: string): string {
  const next = (tracker.get(base) ?? 0) + 1;
  tracker.set(base, next);
  if (next === 1) return base;
  return `${base}_${next}`;
}

const ExportStep = () => {
  const {
    templateImage, templateNaturalWidth, templateNaturalHeight,
    csvData, placedFields, fieldSettings, deselectedRows, selectedRowCount,
    templateFilename, resetAll,
  } = useCertificate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState(0);
  const [zipCount, setZipCount] = useState(0);

  // Per-certificate file naming: column cell vs cert_0001 style
  const [fileNameMode, setFileNameMode] = useState<FileNameMode>('column');
  const [fileNameColumn, setFileNameColumn] = useState<string>('');

  // Default filename column to first CSV header when data is available
  useEffect(() => {
    if (!csvData?.headers.length) return;
    setFileNameColumn((prev) =>
      prev && csvData.headers.includes(prev) ? prev : csvData.headers[0],
    );
  }, [csvData]);

  const generate = useCallback(async (format: ExportFormat) => {
    if (!csvData || !templateImage) return;
    setDropdownOpen(false);
    setGenerating(true);
    setDone(false);
    setErrors(0);
    setZipCount(0);

    try {
      // Precompute selected rows with stable ordering
      const selectedRows = csvData.rows
        .map((row, i) => ({ row, index: i }))
        .filter(({ index }) => !deselectedRows.has(index));

      const totalCount = selectedRows.length;
      const chunks = Math.ceil(totalCount / CHUNK_SIZE);

      setTotal(totalCount);
      setTotalChunks(chunks);
      setProgress(0);
      setCurrentChunk(0);

      // Preload template image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load template image'));
        img.src = templateImage;
      });

      // Ensure all custom fonts are loaded for canvas rendering
      if (document.fonts) {
        try {
          await document.fonts.ready;
          // Force load Basic font if used
          const uniqueFonts = new Set(placedFields.map(f => fieldSettings[f.columnName]?.fontFamily || f.settings.fontFamily));
          for (const font of uniqueFonts) {
            if (font === 'Basic') {
              await document.fonts.load('24px Basic');
            }
          }
        } catch (e) {
          console.warn('Font loading check failed:', e);
        }
      }

      // Dynamic import for PDF
      const jsPDF = format === 'pdf' ? (await import('jspdf')).default : null;

      let errorCount = 0;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Column index for filename (when using column mode)
    const nameColIndex =
      fileNameMode === 'column' && fileNameColumn
        ? csvData.headers.indexOf(fileNameColumn)
        : -1;

    // Process each chunk
    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
      setCurrentChunk(chunkIndex + 1);

      const chunkStart = chunkIndex * CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalCount);
      const chunkRows = selectedRows.slice(chunkStart, chunkEnd);

      const zip = new JSZip();
      // Track duplicate sanitized names within this ZIP only
      const uniqueNameTracker = new Map<string, number>();

      // Generate certificates for this chunk
      for (let i = 0; i < chunkRows.length; i++) {
        const globalIndex = chunkStart + i;
        const { row } = chunkRows[i];

        try {
          // Create canvas for this certificate
          const canvas = document.createElement('canvas');
          canvas.width = templateNaturalWidth;
          canvas.height = templateNaturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');

          // Draw template
          ctx.drawImage(img, 0, 0, templateNaturalWidth, templateNaturalHeight);

          // Draw fields
          for (const field of placedFields) {
            const settings = fieldSettings[field.columnName] || field.settings;
            const colIndex = csvData.headers.indexOf(field.columnName);
            const text = colIndex >= 0 ? row[colIndex] : field.columnName;

            const x = (field.x / 100) * templateNaturalWidth;
            const y = (field.y / 100) * templateNaturalHeight;

            let fontStr = '';
            if (settings.italic) fontStr += 'italic ';
            if (settings.bold) fontStr += 'bold ';
            fontStr += `${settings.fontSize}px ${settings.fontFamily}`;

            ctx.font = fontStr;
            ctx.fillStyle = settings.color;
            ctx.textAlign = settings.align;
            ctx.textBaseline = 'top';

            let drawX = x;
            if (settings.align === 'center') drawX = x;
            if (settings.align === 'right') drawX = x;

            ctx.fillText(text, drawX, y);

            if (settings.underline) {
              const metrics = ctx.measureText(text);
              const lineY = y + settings.fontSize + 2;
              let lineStartX = drawX;
              if (settings.align === 'center') lineStartX = drawX - metrics.width / 2;
              if (settings.align === 'right') lineStartX = drawX - metrics.width;

              ctx.beginPath();
              ctx.strokeStyle = settings.color;
              ctx.lineWidth = Math.max(1, settings.fontSize / 20);
              ctx.moveTo(lineStartX, lineY);
              ctx.lineTo(lineStartX + metrics.width, lineY);
              ctx.stroke();
            }
          }

          // File base name: column cell (row value) or sequential cert_0001
          const paddedIndex = String(globalIndex + 1).padStart(4, '0');
          let fileBase: string;
          if (fileNameMode === 'column' && nameColIndex >= 0) {
            const cell = row[nameColIndex] ?? '';
            const sanitized = sanitizeFileNameBase(cell);
            const fallback = `cert_${paddedIndex}`;
            fileBase = makeUniqueBaseName(uniqueNameTracker, sanitized || fallback);
          } else {
            fileBase = makeUniqueBaseName(uniqueNameTracker, `cert_${paddedIndex}`);
          }

          if (format === 'png') {
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob(b => resolve(b!), 'image/png');
            });
            zip.file(`${fileBase}.png`, blob);
          } else if (jsPDF) {
            // Use canvas directly instead of toDataURL to save memory
            const doc = new jsPDF({
              orientation: templateNaturalWidth > templateNaturalHeight ? 'landscape' : 'portrait',
              unit: 'px',
              format: [templateNaturalWidth, templateNaturalHeight],
            });
            doc.addImage(canvas, 'PNG', 0, 0, templateNaturalWidth, templateNaturalHeight);
            const pdfBlob = doc.output('blob');
            zip.file(`${fileBase}.pdf`, pdfBlob);
          }

          setProgress(globalIndex + 1);
        } catch (error) {
          console.error(`Failed to generate certificate ${globalIndex + 1}:`, error);
          errorCount++;
          setErrors(errorCount);
        }

        // Small delay to keep UI responsive
        if (i % 10 === 0) {
          await new Promise(r => setTimeout(r, 10));
        }
      }

      // Generate and download this chunk's ZIP
      try {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const paddedChunk = String(chunkIndex + 1).padStart(3, '0');
        const paddedTotal = String(chunks).padStart(3, '0');
        const zipName = chunks > 1
          ? `certificates_${format}_${timestamp}_part_${paddedChunk}_of_${paddedTotal}.zip`
          : `certificates_${format}_${timestamp}.zip`;

        saveAs(zipBlob, zipName);
        setZipCount(chunkIndex + 1);
      } catch (error) {
        console.error(`Failed to generate ZIP for chunk ${chunkIndex + 1}:`, error);
        errorCount++;
        setErrors(errorCount);
      }

      // Release memory before next chunk
      await new Promise(r => setTimeout(r, 100));
    }

    setGenerating(false);
    setDone(true);
    } catch (error) {
      console.error('Export failed:', error);
      setGenerating(false);
      setDone(true);
      setErrors(prev => prev + 1);
    }
  }, [
    csvData,
    templateImage,
    templateNaturalWidth,
    templateNaturalHeight,
    placedFields,
    fieldSettings,
    deselectedRows,
    fileNameMode,
    fileNameColumn,
  ]);

  if (!csvData) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 py-12">
      <div className="w-full max-w-lg bg-surface border border-border-default shadow-lg rounded-xl p-6">
        <h2 className="heading text-text-primary mb-6">EXPORT SUMMARY</h2>

        {/* Template Info */}
        <div className="flex items-center gap-3 py-3 border-b border-border-default">
          <div className="w-12 h-8 bg-raised border border-border-default rounded-lg overflow-hidden">
            {templateImage && <img src={templateImage} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="text-text-primary text-sm truncate">{templateFilename}</span>
        </div>

        {/* Counts */}
        <div className="py-3 border-b border-border-default flex gap-6">
          <div>
            <span className="label-sm">RECIPIENTS</span>
            <p className="text-text-primary text-lg font-semibold">{selectedRowCount}</p>
          </div>
          <div>
            <span className="label-sm">FIELDS PLACED</span>
            <p className="text-text-primary text-lg font-semibold">{placedFields.length}</p>
          </div>
        </div>

        {/* Field Details */}
        <div className="py-3 border-b border-border-default">
          <span className="label-sm mb-2 block">FIELD CONFIGURATION</span>
          {placedFields.map(field => {
            const s = fieldSettings[field.columnName] || field.settings;
            return (
              <div key={field.columnName} className="flex items-center gap-2 py-1.5 text-xs">
                <span className="text-text-primary font-semibold uppercase">{field.columnName}</span>
                <span className="text-text-secondary">{s.fontFamily}, {s.fontSize}pt</span>
                <div className="w-3 h-3 rounded-md border border-border-default" style={{ backgroundColor: s.color }} />
                {s.bold && <span className="text-text-disabled">B</span>}
                {s.italic && <span className="text-text-disabled">I</span>}
                {s.underline && <span className="text-text-disabled">U</span>}
              </div>
            );
          })}
        </div>

        {/* How to name each exported file inside the ZIP */}
        <div className="py-3 border-b border-border-default">
          <span className="label-sm mb-3 block">FILE NAMES</span>
          <RadioGroup
            value={fileNameMode}
            onValueChange={(v) => setFileNameMode(v as FileNameMode)}
            className="gap-3"
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="column" id="fn-column" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="fn-column" className="text-text-primary text-sm font-normal cursor-pointer">
                  Use a column value (each row uses that cell as the file name)
                </Label>
                {fileNameMode === 'column' && (
                  <Select value={fileNameColumn} onValueChange={setFileNameColumn}>
                    <SelectTrigger className="w-full max-w-xs bg-base border-border-default text-text-primary h-10">
                      <SelectValue placeholder="Choose column" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="sequential" id="fn-seq" />
              <Label htmlFor="fn-seq" className="text-text-primary text-sm font-normal cursor-pointer">
                Sequential (cert_0001, cert_0002, …)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Generate Button */}
        <div className="mt-6 relative">
          {!generating && !done && (
            <>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full h-12 bg-accent text-base font-semibold uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110"
              >
                GENERATE CERTIFICATES <ChevronDown size={16} />
              </button>
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-raised border border-border-default shadow-md rounded-lg z-10 overflow-hidden">
                  <button
                    onClick={() => generate('png')}
                    className="w-full flex items-center gap-3 px-4 h-11 hover:bg-hover text-text-primary text-sm"
                  >
                    <FileImage size={16} /> Export as PNG
                  </button>
                  <button
                    onClick={() => generate('pdf')}
                    className="w-full flex items-center gap-3 px-4 h-11 hover:bg-hover text-text-primary text-sm border-t border-border-default"
                  >
                    <FileText size={16} /> Export as PDF
                  </button>
                </div>
              )}
            </>
          )}

          {generating && (
            <div>
              <button className="w-full h-12 bg-accent text-base font-semibold uppercase tracking-wider rounded-lg cursor-wait flex items-center justify-center">
                GENERATING... {progress} / {total}
              </button>
              <div className="mt-2 h-1 bg-base rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-out"
                  style={{ width: `${(progress / total) * 100}%` }}
                />
              </div>
              {totalChunks > 1 && (
                <p className="mt-2 text-xs text-center text-text-secondary">
                  Chunk {currentChunk} of {totalChunks}
                  {zipCount > 0 && ` | ${zipCount} ZIP${zipCount > 1 ? 's' : ''} downloaded`}
                </p>
              )}
              {errors > 0 && (
                <p className="mt-1 text-xs text-center" style={{ color: 'hsl(var(--destructive))' }}>
                  {errors} error{errors > 1 ? 's' : ''} encountered
                </p>
              )}
            </div>
          )}

          {done && (
            <div>
              <div className="mb-4 p-4 bg-raised border border-border-default rounded-lg">
                <p className="text-sm text-center" style={{ color: 'hsl(var(--success))' }}>
                  {total - errors} certificate{total - errors !== 1 ? 's' : ''} generated successfully
                  {zipCount > 1 && ` across ${zipCount} ZIP files`}
                </p>
                {errors > 0 && (
                  <p className="mt-1 text-xs text-center" style={{ color: 'hsl(var(--destructive))' }}>
                    {errors} certificate{errors > 1 ? 's' : ''} failed
                  </p>
                )}
                {zipCount > 1 && (
                  <p className="mt-2 text-xs text-center text-text-disabled">
                    Files are named: certificates_..._part_001_of_{String(totalChunks).padStart(3, '0')}.zip
                  </p>
                )}
              </div>
              <button
                onClick={resetAll}
                className="w-full h-12 bg-accent text-base font-semibold uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all flex items-center justify-center hover:brightness-110"
              >
                START OVER
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportStep;
