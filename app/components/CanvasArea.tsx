'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';
import { FieldSettings } from '@/app/types/certificate';

function alignTransform(align: FieldSettings['align']) {
  if (align === 'center') return 'translateX(-50%)';
  if (align === 'right') return 'translateX(-100%)';
  return 'none';
}

const CanvasArea = () => {
  const {
    templateImage, templateNaturalWidth, templateNaturalHeight,
    placedFields, fieldSettings, csvData,
    placingField, selectedField,
    placeField, moveField, commitFieldMove, selectField, cancelPlacing,
    zoom, setZoom,
    undo, redo, canUndo, canRedo,
    sampleRowIndex, deselectedRows,
  } = useCertificate();

  const containerRef = useRef<HTMLDivElement>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const isDraggingField = useRef(false);
  const draggingFieldName = useRef<string | null>(null);
  const hasDraggedField = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spaceDown = useRef(false);

  const scale = zoom / 100;
  const displayW = templateNaturalWidth * scale;
  const displayH = templateNaturalHeight * scale;

  const handleFit = useCallback(() => {
    if (!containerRef.current || !templateNaturalWidth) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (rect.width - padding * 2) / templateNaturalWidth;
    const scaleY = (rect.height - padding * 2) / templateNaturalHeight;
    const fitScale = Math.min(scaleX, scaleY, 3) * 100;
    setZoom(Math.round(Math.max(25, Math.min(300, fitScale))));
    setPan({ x: 0, y: 0 });
  }, [templateNaturalWidth, templateNaturalHeight, setZoom]);

  useEffect(() => {
    handleFit();
  }, [templateImage, handleFit]);

  useEffect(() => {
    const onResize = () => handleFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [handleFit]);

  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isTypingTarget(e.target)) {
        spaceDown.current = true;
        e.preventDefault();
      }
      if (e.key === 'Escape') cancelPlacing();
      if (isTypingTarget(e.target)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      if (selectedField && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const field = placedFields.find(f => f.columnName === selectedField);
        if (!field) return;
        const step = e.shiftKey ? 1 : 0.25;
        let x = field.x;
        let y = field.y;
        if (e.key === 'ArrowLeft') x -= step;
        if (e.key === 'ArrowRight') x += step;
        if (e.key === 'ArrowUp') y -= step;
        if (e.key === 'ArrowDown') y += step;
        moveField(selectedField, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') spaceDown.current = false;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && selectedField) {
        commitFieldMove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, cancelPlacing, selectedField, placedFields, moveField, commitFieldMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => Math.round(Math.max(25, Math.min(300, z - e.deltaY * 0.1))));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  const percentFromEvent = useCallback((e: { clientX: number; clientY: number }) => {
    const imgEl = containerRef.current?.querySelector('[data-template-img]') as HTMLElement | null;
    if (!imgEl) return null;
    const rect = imgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x, y, inside: x >= 0 && x <= 100 && y >= 0 && y <= 100 };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      setPan(p => ({
        x: p.x + e.clientX - lastMouse.current.x,
        y: p.y + e.clientY - lastMouse.current.y,
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const pct = percentFromEvent(e);
    if (isDraggingField.current && draggingFieldName.current && pct) {
      hasDraggedField.current = true;
      moveField(draggingFieldName.current, Math.max(0, Math.min(100, pct.x)), Math.max(0, Math.min(100, pct.y)));
      return;
    }
    if (placingField && pct) {
      setGhostPos({ x: pct.x, y: pct.y });
    }
  }, [placingField, moveField, percentFromEvent]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (isDraggingField.current) {
      isDraggingField.current = false;
      draggingFieldName.current = null;
      if (hasDraggedField.current) commitFieldMove();
      hasDraggedField.current = false;
    }
  }, [commitFieldMove]);

  useEffect(() => {
    const handleWindowMouseUp = () => handleMouseUp();
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [handleMouseUp]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!placingField) return;
    const pct = percentFromEvent(e);
    if (pct?.inside) {
      placeField(placingField, pct.x, pct.y);
      setGhostPos(null);
    }
  }, [placingField, placeField, percentFromEvent]);

  const handleFieldClick = useCallback((e: React.MouseEvent, columnName: string) => {
    e.stopPropagation();
    if (hasDraggedField.current) return;
    if (!placingField) selectField(columnName);
  }, [placingField, selectField]);

  const handleFieldMouseDown = useCallback(
    (e: React.MouseEvent, columnName: string) => {
      if (e.button !== 0 || placingField) return;
      e.preventDefault();
      e.stopPropagation();
      isDraggingField.current = true;
      draggingFieldName.current = columnName;
      hasDraggedField.current = false;
      selectField(columnName);
    },
    [placingField, selectField],
  );

  const sampleRow =
    csvData?.rows[sampleRowIndex] && !deselectedRows.has(sampleRowIndex)
      ? csvData.rows[sampleRowIndex]
      : csvData?.rows.find((_, i) => !deselectedRows.has(i));

  const ghostField = placingField ? fieldSettings[placingField] : null;
  const ghostColIndex = placingField && csvData ? csvData.headers.indexOf(placingField) : -1;
  const ghostText = placingField && sampleRow && ghostColIndex >= 0 ? sampleRow[ghostColIndex] : placingField;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border-default shadow-md relative z-10">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
            canUndo ? 'text-text-primary bg-raised' : 'text-text-disabled bg-surface cursor-not-allowed'
          }`}
        >
          <Undo2 size={14} /> UNDO
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
            canRedo ? 'text-text-primary bg-raised' : 'text-text-disabled bg-surface cursor-not-allowed'
          }`}
        >
          <Redo2 size={14} /> REDO
        </button>
        <div className="w-px h-5 bg-border-default mx-1" />
        <button
          type="button"
          onClick={() => setZoom(z => Math.max(25, z - 10))}
          className="w-8 h-8 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs text-text-secondary w-10 text-center font-mono">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom(z => Math.min(300, z + 10))}
          className="w-8 h-8 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={handleFit}
          className="px-2 py-1 text-xs font-medium border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          FIT
        </button>
        <span className="ml-auto hidden md:block subtext">Space-drag to pan · arrows nudge · wheel zoom</span>
      </div>

      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden dot-grid relative ${placingField ? 'cursor-crosshair' : 'cursor-default'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
        >
          <div className="relative shadow-lg" style={{ width: displayW, height: displayH }}>
            {templateImage && (
              <img
                data-template-img
                src={templateImage}
                alt="Certificate template"
                className="w-full h-full block"
                draggable={false}
              />
            )}
            {placedFields.map(field => {
              const settings = fieldSettings[field.columnName] || field.settings;
              const colIndex = csvData?.headers.indexOf(field.columnName) ?? -1;
              const text = sampleRow && colIndex >= 0 ? sampleRow[colIndex] : field.columnName;
              const isSelected = selectedField === field.columnName;
              return (
                <div
                  key={field.columnName}
                  onClick={(e) => handleFieldClick(e, field.columnName)}
                  onMouseDown={(e) => handleFieldMouseDown(e, field.columnName)}
                  className={isSelected ? 'outline outline-1 outline-accent outline-offset-2' : ''}
                  style={{
                    fontFamily: settings.fontFamily,
                    fontSize: `${settings.fontSize * scale}px`,
                    color: settings.color,
                    fontWeight: settings.bold ? 700 : 400,
                    fontStyle: settings.italic ? 'italic' : 'normal',
                    textDecoration: settings.underline ? 'underline' : 'none',
                    textAlign: settings.align,
                    whiteSpace: 'nowrap',
                    position: 'absolute',
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: alignTransform(settings.align),
                    pointerEvents: 'auto',
                    cursor: 'move',
                    userSelect: 'none',
                  }}
                >
                  {text}
                </div>
              );
            })}
            {placingField && ghostPos && ghostField && (
              <div
                className="pointer-events-none opacity-60"
                style={{
                  position: 'absolute',
                  left: `${ghostPos.x}%`,
                  top: `${ghostPos.y}%`,
                  fontFamily: ghostField.fontFamily,
                  fontSize: `${ghostField.fontSize * scale}px`,
                  color: ghostField.color,
                  fontWeight: ghostField.bold ? 700 : 400,
                  fontStyle: ghostField.italic ? 'italic' : 'normal',
                  textDecoration: ghostField.underline ? 'underline' : 'none',
                  whiteSpace: 'nowrap',
                  transform: alignTransform(ghostField.align),
                }}
              >
                {ghostText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;
