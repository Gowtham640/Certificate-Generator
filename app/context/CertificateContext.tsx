'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { PlacedField, CsvData, FieldSettings, defaultFieldSettings, HistoryEntry } from '@/app/types/certificate';

const HISTORY_CAP = 50;

interface CertificateState {
  step: number;
  templateImage: string | null;
  templateFilename: string | null;
  templateNaturalWidth: number;
  templateNaturalHeight: number;
  csvData: CsvData | null;
  placedFields: PlacedField[];
  fieldSettings: Record<string, FieldSettings>;
  selectedField: string | null;
  placingField: string | null;
  deselectedRows: Set<number>;
  zoom: number;
  sampleRowIndex: number;
}

interface CertificateContextType extends CertificateState {
  goToStep: (s: number) => void;
  setTemplateImage: (url: string, filename: string, w: number, h: number) => void;
  clearTemplate: () => void;
  setCsvData: (data: CsvData) => void;
  clearCsv: () => void;
  placeField: (columnName: string, x: number, y: number) => void;
  moveField: (columnName: string, x: number, y: number) => void;
  commitFieldMove: () => void;
  removeField: (columnName: string) => void;
  selectField: (columnName: string | null) => void;
  startPlacing: (columnName: string) => void;
  cancelPlacing: () => void;
  updateFieldSettings: (columnName: string, settings: Partial<FieldSettings>) => void;
  toggleRow: (index: number) => void;
  setAllRowsSelected: (selected: boolean) => void;
  setSampleRowIndex: (index: number) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedRowCount: number;
  canEnterPosition: boolean;
  canEnterExport: boolean;
  resetAll: () => void;
}

const CertificateContext = createContext<CertificateContextType | null>(null);

export const useCertificate = () => {
  const ctx = useContext(CertificateContext);
  if (!ctx) throw new Error('useCertificate must be inside CertificateProvider');
  return ctx;
};

function cloneHistory(fields: PlacedField[], fieldSettings: Record<string, FieldSettings>): HistoryEntry {
  return {
    fields: JSON.parse(JSON.stringify(fields)),
    fieldSettings: JSON.parse(JSON.stringify(fieldSettings)),
  };
}

export const CertificateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState(1);
  const [templateImage, setTemplateImageState] = useState<string | null>(null);
  const [templateFilename, setTemplateFilename] = useState<string | null>(null);
  const [templateNaturalWidth, setTemplateNaturalWidth] = useState(0);
  const [templateNaturalHeight, setTemplateNaturalHeight] = useState(0);
  const [csvData, setCsvDataState] = useState<CsvData | null>(null);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [fieldSettings, setFieldSettings] = useState<Record<string, FieldSettings>>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [placingField, setPlacingField] = useState<string | null>(null);
  const [deselectedRows, setDeselectedRows] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState(100);
  const [sampleRowIndex, setSampleRowIndex] = useState(0);

  const historyRef = useRef<HistoryEntry[]>([cloneHistory([], {})]);
  const historyIndexRef = useRef(0);
  const [, forceUpdate] = useState(0);
  const templateUrlRef = useRef<string | null>(null);
  const fieldSettingsRef = useRef(fieldSettings);
  fieldSettingsRef.current = fieldSettings;
  const placedFieldsRef = useRef(placedFields);
  placedFieldsRef.current = placedFields;
  const csvDataRef = useRef(csvData);
  csvDataRef.current = csvData;

  const pushHistory = useCallback((fields: PlacedField[], settings?: Record<string, FieldSettings>) => {
    const snapshot = cloneHistory(fields, settings ?? fieldSettingsRef.current);
    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push(snapshot);
    if (next.length > HISTORY_CAP) next.splice(0, next.length - HISTORY_CAP);
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
    forceUpdate(n => n + 1);
  }, []);

  const revokeTemplate = useCallback(() => {
    if (templateUrlRef.current) {
      URL.revokeObjectURL(templateUrlRef.current);
      templateUrlRef.current = null;
    }
  }, []);

  const setTemplateImage = useCallback((url: string, filename: string, w: number, h: number) => {
    revokeTemplate();
    templateUrlRef.current = url;
    setTemplateImageState(url);
    setTemplateFilename(filename);
    setTemplateNaturalWidth(w);
    setTemplateNaturalHeight(h);
  }, [revokeTemplate]);

  const clearTemplate = useCallback(() => {
    revokeTemplate();
    setTemplateImageState(null);
    setTemplateFilename(null);
    setTemplateNaturalWidth(0);
    setTemplateNaturalHeight(0);
  }, [revokeTemplate]);

  const setCsvData = useCallback((data: CsvData) => {
    setCsvDataState(data);
    setFieldSettings(prev => {
      const settings: Record<string, FieldSettings> = {};
      data.headers.forEach(h => {
        settings[h] = prev[h] ? { ...prev[h] } : { ...defaultFieldSettings };
      });
      fieldSettingsRef.current = settings;
      return settings;
    });
    setPlacedFields(prev => {
      const allowed = new Set(data.headers);
      const next = prev.filter(f => allowed.has(f.columnName));
      placedFieldsRef.current = next;
      return next;
    });
    setDeselectedRows(new Set());
    setSampleRowIndex(0);
    if (selectedField && !data.headers.includes(selectedField)) setSelectedField(null);
    if (placingField && !data.headers.includes(placingField)) setPlacingField(null);
  }, [placingField, selectedField]);

  const clearCsv = useCallback(() => {
    setCsvDataState(null);
    setPlacedFields([]);
    setFieldSettings({});
    setSelectedField(null);
    setPlacingField(null);
    setDeselectedRows(new Set());
    setSampleRowIndex(0);
    historyRef.current = [cloneHistory([], {})];
    historyIndexRef.current = 0;
    forceUpdate(n => n + 1);
  }, []);

  const placeField = useCallback((columnName: string, x: number, y: number) => {
    setPlacedFields(prev => {
      const filtered = prev.filter(f => f.columnName !== columnName);
      const settings = fieldSettingsRef.current[columnName] || defaultFieldSettings;
      const next = [...filtered, { columnName, x, y, settings: { ...settings } }];
      pushHistory(next);
      return next;
    });
    setPlacingField(null);
    setSelectedField(columnName);
  }, [pushHistory]);

  const moveField = useCallback((columnName: string, x: number, y: number) => {
    setPlacedFields((prev) =>
      prev.map((f) => (f.columnName === columnName ? { ...f, x, y } : f)),
    );
  }, []);

  const commitFieldMove = useCallback(() => {
    setPlacedFields((prev) => {
      pushHistory(prev);
      return prev;
    });
  }, [pushHistory]);

  const removeField = useCallback((columnName: string) => {
    setPlacedFields(prev => {
      const next = prev.filter(f => f.columnName !== columnName);
      pushHistory(next);
      return next;
    });
    setSelectedField(cur => (cur === columnName ? null : cur));
    setPlacingField(cur => (cur === columnName ? null : cur));
  }, [pushHistory]);

  const selectField = useCallback((columnName: string | null) => {
    setSelectedField(columnName);
    setPlacingField(null);
  }, []);

  const startPlacing = useCallback((columnName: string) => {
    setPlacingField(columnName);
    setSelectedField(columnName);
  }, []);

  const cancelPlacing = useCallback(() => {
    setPlacingField(null);
  }, []);

  const updateFieldSettings = useCallback((columnName: string, updates: Partial<FieldSettings>) => {
    setFieldSettings(prev => {
      const current = prev[columnName] || defaultFieldSettings;
      const next = { ...prev, [columnName]: { ...current, ...updates } };
      fieldSettingsRef.current = next;
      return next;
    });
    setPlacedFields(prev => {
      const next = prev.map(f => {
        if (f.columnName !== columnName) return f;
        return { ...f, settings: { ...f.settings, ...updates } };
      });
      pushHistory(next, fieldSettingsRef.current);
      return next;
    });
  }, [pushHistory]);

  const toggleRow = useCallback((index: number) => {
    setDeselectedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const setAllRowsSelected = useCallback((selected: boolean) => {
    const current = csvDataRef.current;
    if (!current) return;
    setDeselectedRows(selected ? new Set() : new Set(current.rows.map((_, i) => i)));
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setPlacedFields(JSON.parse(JSON.stringify(entry.fields)));
      setFieldSettings(JSON.parse(JSON.stringify(entry.fieldSettings)));
      forceUpdate(n => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setPlacedFields(JSON.parse(JSON.stringify(entry.fields)));
      setFieldSettings(JSON.parse(JSON.stringify(entry.fieldSettings)));
      forceUpdate(n => n + 1);
    }
  }, []);

  const selectedRowCount = csvData ? csvData.rows.length - deselectedRows.size : 0;
  const canEnterPosition = !!templateImage && !!csvData && csvData.headers.length > 0 && csvData.rows.length > 0;
  const canEnterExport = placedFields.length > 0 && selectedRowCount > 0;

  const goToStep = useCallback((s: number) => {
    if (s < 1 || s > 3) return;
    if (s >= 2 && !canEnterPosition) return;
    if (s >= 3 && !canEnterExport) return;
    setStep(s);
  }, [canEnterExport, canEnterPosition]);

  const resetAll = useCallback(() => {
    revokeTemplate();
    setStep(1);
    setTemplateImageState(null);
    setTemplateFilename(null);
    setTemplateNaturalWidth(0);
    setTemplateNaturalHeight(0);
    setCsvDataState(null);
    setPlacedFields([]);
    setFieldSettings({});
    setSelectedField(null);
    setPlacingField(null);
    setDeselectedRows(new Set());
    setZoom(100);
    setSampleRowIndex(0);
    historyRef.current = [cloneHistory([], {})];
    historyIndexRef.current = 0;
    forceUpdate(n => n + 1);
  }, [revokeTemplate]);

  return (
    <CertificateContext.Provider value={{
      step, goToStep,
      templateImage, templateFilename, templateNaturalWidth, templateNaturalHeight,
      setTemplateImage, clearTemplate,
      csvData, setCsvData, clearCsv,
      placedFields, fieldSettings,
      selectedField, placingField,
      placeField, moveField, commitFieldMove, removeField, selectField, startPlacing, cancelPlacing,
      updateFieldSettings,
      deselectedRows, toggleRow, setAllRowsSelected,
      sampleRowIndex, setSampleRowIndex,
      zoom, setZoom,
      undo, redo,
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
      selectedRowCount,
      canEnterPosition,
      canEnterExport,
      resetAll,
    }}>
      {children}
    </CertificateContext.Provider>
  );
};
