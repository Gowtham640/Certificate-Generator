'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';

const CanvasArea = () => {
  const {
    templateImage, templateNaturalWidth, templateNaturalHeight,
    placedFields, fieldSettings, csvData,
    placingField, selectedField,
    placeField, moveField, commitFieldMove, selectField,
    zoom, setZoom,
    undo, redo, canUndo, canRedo,
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
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') spaceDown.current = e.type === 'keydown';
      if (e.key === 'Escape') {
        const { cancelPlacing } = useCertificateRef.current;
        cancelPlacing();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
    };
  }, [undo, redo]);

  // Non-passive wheel listener for zoom (avoid preventDefault warnings)
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

  const { cancelPlacing } = useCertificate();
  const useCertificateRef = useRef({ cancelPlacing });
  useCertificateRef.current = { cancelPlacing };

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
    if (isDraggingField.current && draggingFieldName.current && containerRef.current) {
      hasDraggedField.current = true;
      const imgEl = containerRef.current.querySelector('[data-template-img]') as HTMLElement;
      if (!imgEl) return;
      const rect = imgEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));
      moveField(draggingFieldName.current, clampedX, clampedY);
      return;
    }
    if (placingField && containerRef.current) {
      const imgEl = containerRef.current.querySelector('[data-template-img]') as HTMLElement;
      if (imgEl) {
        const rect = imgEl.getBoundingClientRect();
        setGhostPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    }
  }, [placingField, moveField]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (isDraggingField.current) {
      isDraggingField.current = false;
      draggingFieldName.current = null;
      if (hasDraggedField.current) {
        commitFieldMove();
      }
      hasDraggedField.current = false;
    }
  }, [commitFieldMove]);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      isPanning.current = false;
      if (isDraggingField.current) {
        isDraggingField.current = false;
        draggingFieldName.current = null;
        if (hasDraggedField.current) {
          commitFieldMove();
        }
        hasDraggedField.current = false;
      }
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => window.removeEventListener('mouseup', handleWindowMouseUp);
  }, [commitFieldMove]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!placingField || !containerRef.current) return;
    const imgEl = containerRef.current.querySelector('[data-template-img]') as HTMLElement;
    if (!imgEl) return;
    const rect = imgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      placeField(placingField, x, y);
      setGhostPos(null);
    }
  }, [placingField, placeField]);

  const handleFieldClick = useCallback((e: React.MouseEvent, columnName: string) => {
    e.stopPropagation();
    if (hasDraggedField.current) return;
    if (!placingField) {
      selectField(columnName);
    }
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

  const firstRow = csvData?.rows[0];

  const renderFieldText = (field: typeof placedFields[0]) => {
    const settings = fieldSettings[field.columnName] || field.settings;
    const colIndex = csvData?.headers.indexOf(field.columnName) ?? -1;
    const text = firstRow && colIndex >= 0 ? firstRow[colIndex] : field.columnName;
    return {
      text,
      style: {
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize * scale}px`,
        color: settings.color,
        fontWeight: settings.bold ? 700 : 400,
        fontStyle: settings.italic ? 'italic' as const : 'normal' as const,
        textDecoration: settings.underline ? 'underline' : 'none',
        textAlign: settings.align,
        whiteSpace: 'nowrap' as const,
        position: 'absolute' as const,
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: settings.align === 'center' ? 'translateX(-50%)' : settings.align === 'right' ? 'translateX(-100%)' : 'none',
        pointerEvents: 'auto' as const,
        cursor: 'move',
        userSelect: 'none' as const,
      },
      isSelected: selectedField === field.columnName,
    };
  };

  const ghostField = placingField ? fieldSettings[placingField] : null;
  const ghostColIndex = placingField && csvData ? csvData.headers.indexOf(placingField) : -1;
  const ghostText = placingField && firstRow && ghostColIndex >= 0 ? firstRow[ghostColIndex] : placingField;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border-default shadow-md relative z-10">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
            canUndo ? 'text-text-primary bg-raised' : 'text-text-disabled bg-surface cursor-not-allowed'
          }`}
        >
          <Undo2 size={14} /> UNDO
        </button>
        <button
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
          onClick={() => setZoom(z => Math.max(25, z - 10))}
          className="w-8 h-8 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          <Minus size={14} />
        </button>
        <span className="text-xs text-text-secondary w-10 text-center font-mono">{zoom}%</span>
        <button
          onClick={() => setZoom(z => Math.min(300, z + 10))}
          className="w-8 h-8 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={handleFit}
          className="px-2 py-1 text-xs font-medium border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform bg-raised text-text-primary"
        >
          FIT
        </button>
      </div>

      {/* Canvas */}
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
            <img
              data-template-img
              src={templateImage!}
              alt="Certificate template"
              className="w-full h-full block"
              draggable={false}
            />
            {/* Placed fields */}
            {placedFields.map(field => {
              const { text, style, isSelected } = renderFieldText(field);
              return (
                <div
                  key={field.columnName}
                  style={style}
                  onClick={(e) => handleFieldClick(e, field.columnName)}
                  onMouseDown={(e) => handleFieldMouseDown(e, field.columnName)}
                  className={isSelected ? 'outline outline-1 outline-accent outline-offset-2' : ''}
                >
                  {text}
                </div>
              );
            })}
            {/* Ghost */}
            {placingField && ghostPos && ghostField && (
              <div
                className="pointer-events-none opacity-60"
                style={{
                  position: 'absolute',
                  left: ghostPos.x,
                  top: ghostPos.y,
                  fontFamily: ghostField.fontFamily,
                  fontSize: `${ghostField.fontSize * scale}px`,
                  color: ghostField.color,
                  fontWeight: ghostField.bold ? 700 : 400,
                  fontStyle: ghostField.italic ? 'italic' : 'normal',
                  textDecoration: ghostField.underline ? 'underline' : 'none',
                  whiteSpace: 'nowrap',
                  transform: 'translate(-50%, -50%)',
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
