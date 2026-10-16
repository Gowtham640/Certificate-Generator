'use client';

import { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useCertificate } from '@/app/context/CertificateContext';
import { ProgressBar } from '@/app/components/interior/progress-bar';
import { SegmentedControl } from '@/app/components/interior/segmented-control';
import { Dropdown } from '@/app/components/interior/dropdown';
import { HoldToConfirm } from '@/app/components/interior/hold-to-confirm';
import { LoadingButton } from '@/app/components/interior/loading-button';
import { makeUniqueBaseName, sanitizeFileNameBase } from '@/app/lib/files';

type ExportFormat = 'png' | 'pdf';
type FileNameMode = 'column' | 'sequential';

const CHUNK_SIZE = 100;

const ExportStep = () => {
  const {
    templateImage, templateNaturalWidth, templateNaturalHeight,
    csvData, placedFields, fieldSettings, deselectedRows, selectedRowCount,
    templateFilename, resetAll, goToStep,
  } = useCertificate();

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState(0);
  const [zipCount, setZipCount] = useState(0);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [fileNameMode, setFileNameMode] = useState<FileNameMode>('column');
  const [fileNameColumn, setFileNameColumn] = useState<string>('');

  useEffect(() => {
    if (!csvData?.headers.length) return;
    setFileNameColumn((prev) =>
      prev && csvData.headers.includes(prev) ? prev : csvData.headers[0],
    );
  }, [csvData]);

  const generate = useCallback(async () => {
    if (!csvData || !templateImage) return;
    setGenerating(true);
    setDone(false);
    setErrors(0);
    setZipCount(0);

    try {
      const selectedRows = csvData.rows
        .map((row, i) => ({ row, index: i }))
        .filter(({ index }) => !deselectedRows.has(index));

      const totalCount = selectedRows.length;
      const chunks = Math.ceil(totalCount / CHUNK_SIZE);

      setTotal(totalCount);
      setTotalChunks(chunks);
      setProgress(0);
      setCurrentChunk(0);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load template image'));
        img.src = templateImage;
      });

      if (document.fonts) {
        try {
          await document.fonts.ready;
          const uniqueFonts = new Set(placedFields.map(f => fieldSettings[f.columnName]?.fontFamily || f.settings.fontFamily));
          for (const font of uniqueFonts) {
            await document.fonts.load(`24px ${font}`);
          }
        } catch (e) {
          console.warn('Font loading check failed:', e);
        }
      }

      const jsPDF = format === 'pdf' ? (await import('jspdf')).default : null;
      let errorCount = 0;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const nameColIndex =
        fileNameMode === 'column' && fileNameColumn
          ? csvData.headers.indexOf(fileNameColumn)
          : -1;

      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
        setCurrentChunk(chunkIndex + 1);
        const chunkStart = chunkIndex * CHUNK_SIZE;
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, totalCount);
        const chunkRows = selectedRows.slice(chunkStart, chunkEnd);
        const zip = new JSZip();
        const uniqueNameTracker = new Map<string, number>();

        for (let i = 0; i < chunkRows.length; i++) {
          const globalIndex = chunkStart + i;
          const { row } = chunkRows[i];

          try {
            const canvas = document.createElement('canvas');
            canvas.width = templateNaturalWidth;
            canvas.height = templateNaturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context unavailable');

            ctx.drawImage(img, 0, 0, templateNaturalWidth, templateNaturalHeight);

            for (const field of placedFields) {
              const settings = fieldSettings[field.columnName] || field.settings;
              const colIndex = csvData.headers.indexOf(field.columnName);
              const text = colIndex >= 0 ? (row[colIndex] ?? '') : field.columnName;

              const x = (field.x / 100) * templateNaturalWidth;
              const y = (field.y / 100) * templateNaturalHeight;

              let fontStr = '';
              if (settings.italic) fontStr += 'italic ';
              if (settings.bold) fontStr += 'bold ';
              fontStr += `${settings.fontSize}px "${settings.fontFamily}"`;

              ctx.font = fontStr;
              ctx.fillStyle = settings.color;
              ctx.textAlign = settings.align;
              ctx.textBaseline = 'top';
              ctx.fillText(text, x, y);

              if (settings.underline) {
                const metrics = ctx.measureText(text);
                const lineY = y + settings.fontSize + 2;
                let lineStartX = x;
                if (settings.align === 'center') lineStartX = x - metrics.width / 2;
                if (settings.align === 'right') lineStartX = x - metrics.width;

                ctx.beginPath();
                ctx.strokeStyle = settings.color;
                ctx.lineWidth = Math.max(1, settings.fontSize / 20);
                ctx.moveTo(lineStartX, lineY);
                ctx.lineTo(lineStartX + metrics.width, lineY);
                ctx.stroke();
              }
            }

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
              const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
              });
              zip.file(`${fileBase}.png`, blob);
            } else if (jsPDF) {
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

          if (i % 10 === 0) {
            await new Promise(r => setTimeout(r, 10));
          }
        }

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

        await new Promise(r => setTimeout(r, 100));
      }

      setGenerating(false);
      setDone(true);
    } catch (error) {
      console.error('Export failed:', error);
      setGenerating(false);
      setDone(true);
      setErrors(prev => prev + 1);
      throw error;
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
    format,
  ]);

  if (!csvData) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-5 md:px-8 py-8 md:py-12 overflow-y-auto">
      <div className="w-full max-w-lg bg-surface border border-border-default shadow-lg rounded-xl p-6">
        <h2 className="heading text-text-primary mb-6">EXPORT SUMMARY</h2>

        <div className="flex items-center gap-3 py-3 border-b border-border-default">
          <div className="w-12 h-8 bg-raised border border-border-default rounded-lg overflow-hidden">
            {templateImage && <img src={templateImage} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="text-text-primary text-sm truncate">{templateFilename}</span>
        </div>

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

        <div className="py-3 border-b border-border-default">
          <span className="label-sm mb-2 block">FIELD CONFIGURATION</span>
          {placedFields.map(field => {
            const s = fieldSettings[field.columnName] || field.settings;
            return (
              <div key={field.columnName} className="flex items-center gap-2 py-1.5 text-xs">
                <span className="text-text-primary font-semibold uppercase">{field.columnName}</span>
                <span className="text-text-secondary">{s.fontFamily}, {s.fontSize}px</span>
                <div className="w-3 h-3 rounded-md border border-border-default" style={{ backgroundColor: s.color }} />
              </div>
            );
          })}
        </div>

        <div className="py-3 border-b border-border-default space-y-3">
          <span className="label-sm block">FORMAT</span>
          <SegmentedControl
            label="Export format"
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'pdf', label: 'PDF' },
            ]}
            value={format}
            onValueChange={(v) => setFormat(v as ExportFormat)}
          />
        </div>

        <div className="py-3 border-b border-border-default space-y-3">
          <span className="label-sm block">FILE NAMES</span>
          <SegmentedControl
            label="File name mode"
            options={[
              { value: 'column', label: 'From column' },
              { value: 'sequential', label: 'Sequential' },
            ]}
            value={fileNameMode}
            onValueChange={(v) => setFileNameMode(v as FileNameMode)}
          />
          {fileNameMode === 'column' && (
            <Dropdown
              label="Name column"
              items={csvData.headers.filter(Boolean).map((h) => ({ value: h, label: h }))}
              value={fileNameColumn}
              onChange={setFileNameColumn}
            />
          )}
        </div>

        <div className="mt-6 space-y-4">
          {generating && (
            <ProgressBar
              value={total ? progress : null}
              max={total || 100}
              label={totalChunks > 1 ? `Chunk ${currentChunk} of ${totalChunks}` : 'Generating'}
              pendingLabel="Starting"
              completeLabel="Zipping"
            />
          )}
          {errors > 0 && (
            <p className="text-xs text-center text-danger">
              {errors} error{errors > 1 ? 's' : ''} encountered
            </p>
          )}

          {!generating && (
            <LoadingButton
              onAction={generate}
              pendingLabel="Generating"
              successLabel="Downloaded"
              errorLabel="Try again"
              resetAfter={done ? 4000 : 1400}
              disabled={selectedRowCount === 0}
            >
              {done ? 'Generate again' : `Generate ${format.toUpperCase()} ZIP`}
            </LoadingButton>
          )}

          {done && !generating && (
            <div className="p-4 bg-raised border border-border-default rounded-lg">
              <p className="text-sm text-center text-success">
                {Math.max(0, total - errors)} certificate{total - errors !== 1 ? 's' : ''} generated
                {zipCount > 1 && ` across ${zipCount} ZIP files`}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={generating}
              onClick={() => goToStep(2)}
              className="px-4 py-2 text-sm rounded-lg border border-border-default text-text-primary bg-raised disabled:opacity-50"
            >
              Back to position
            </button>
            <HoldToConfirm onConfirm={resetAll} duration={1100} confirmLabel="Cleared" disabled={generating}>
              Hold to start over
            </HoldToConfirm>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportStep;
