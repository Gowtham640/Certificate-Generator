'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { PlacedField, CsvData, FieldSettings, defaultFieldSettings, HistoryEntry } from '@/app/types/certificate';

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
}

interface CertificateContextType extends CertificateState {
  setStep: (s: number) => void;
  setTemplateImage: (url: string, filename: string, w: number, h: number) => void;
  setCsvData: (data: CsvData) => void;
  placeField: (columnName: string, x: number, y: number) => void;
  moveField: (columnName: string, x: number, y: number) => void;
  commitFieldMove: () => void;
  removeField: (columnName: string) => void;
  selectField: (columnName: string | null) => void;
  startPlacing: (columnName: string) => void;
  cancelPlacing: () => void;
  updateFieldSettings: (columnName: string, settings: Partial<FieldSettings>) => void;
  toggleRow: (index: number) => void;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedRowCount: number;
  resetAll: () => void;
}

const CertificateContext = createContext<CertificateContextType | null>(null);

export const useCertificate = () => {
  const ctx = useContext(CertificateContext);
  if (!ctx) throw new Error('useCertificate must be inside CertificateProvider');
  return ctx;
};

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

  const historyRef = useRef<HistoryEntry[]>([{ fields: [] }]);
  const historyIndexRef = useRef(0);
  const [, forceUpdate] = useState(0);

  const pushHistory = useCallback((fields: PlacedField[]) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push({ fields: JSON.parse(JSON.stringify(fields)) });
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    forceUpdate(n => n + 1);
  }, []);

  const setTemplateImage = useCallback((url: string, filename: string, w: number, h: number) => {
    setTemplateImageState(url);
    setTemplateFilename(filename);
    setTemplateNaturalWidth(w);
    setTemplateNaturalHeight(h);
  }, []);

  const setCsvData = useCallback((data: CsvData) => {
    setCsvDataState(data);
    const settings: Record<string, FieldSettings> = {};
    data.headers.forEach(h => {
      settings[h] = { ...defaultFieldSettings };
    });
    setFieldSettings(settings);
  }, []);

  const placeField = useCallback((columnName: string, x: number, y: number) => {
    setPlacedFields(prev => {
      const filtered = prev.filter(f => f.columnName !== columnName);
      const settings = fieldSettings[columnName] || defaultFieldSettings;
      const next = [...filtered, { columnName, x, y, settings }];
      pushHistory(next);
      return next;
    });
    setPlacingField(null);
    setSelectedField(columnName);
  }, [fieldSettings, pushHistory]);

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
    if (selectedField === columnName) setSelectedField(null);
    if (placingField === columnName) setPlacingField(null);
  }, [selectedField, placingField, pushHistory]);

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
      return { ...prev, [columnName]: { ...current, ...updates } };
    });
    setPlacedFields(prev => prev.map(f => {
      if (f.columnName === columnName) {
        return { ...f, settings: { ...(f.settings), ...updates } };
      }
      return f;
    }));
  }, []);

  const toggleRow = useCallback((index: number) => {
    setDeselectedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setPlacedFields(JSON.parse(JSON.stringify(entry.fields)));
      forceUpdate(n => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setPlacedFields(JSON.parse(JSON.stringify(entry.fields)));
      forceUpdate(n => n + 1);
    }
  }, []);

  const selectedRowCount = csvData ? csvData.rows.length - deselectedRows.size : 0;

  const resetAll = useCallback(() => {
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
    historyRef.current = [{ fields: [] }];
    historyIndexRef.current = 0;
    forceUpdate(n => n + 1);
  }, []);

  return (
    <CertificateContext.Provider value={{
      step, setStep,
      templateImage, templateFilename, templateNaturalWidth, templateNaturalHeight,
      setTemplateImage,
      csvData, setCsvData,
      placedFields, fieldSettings,
      selectedField, placingField,
      placeField, moveField, commitFieldMove, removeField, selectField, startPlacing, cancelPlacing,
      updateFieldSettings,
      deselectedRows, toggleRow,
      zoom, setZoom,
      undo, redo,
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
      selectedRowCount,
      resetAll,
    }}>
      {children}
    </CertificateContext.Provider>
  );
};
