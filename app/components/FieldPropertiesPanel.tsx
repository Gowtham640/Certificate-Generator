'use client';

import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';
import { fontOptions } from '@/app/types/certificate';

const FieldPropertiesPanel = () => {
  const { selectedField, fieldSettings, updateFieldSettings, csvData } = useCertificate();
  const [fontOpen, setFontOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setColorOpen(false);
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) setFontOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!selectedField) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-text-secondary text-sm text-center">Select a field capsule to configure it</p>
      </div>
    );
  }

  const settings = fieldSettings[selectedField];
  if (!settings) return null;

  const update = (updates: Partial<typeof settings>) => updateFieldSettings(selectedField, updates);

  const firstRow = csvData?.rows[0];
  const colIndex = csvData?.headers.indexOf(selectedField) ?? -1;
  const sampleText = firstRow && colIndex >= 0 ? firstRow[colIndex] : selectedField;

  return (
    <div className="p-4 flex flex-col gap-0">
      <span className="label-sm mb-1">FIELD PROPERTIES</span>

      {/* Field Name */}
      <div className="py-4 border-b border-border-default">
        <span className="text-text-primary font-semibold text-sm uppercase">{selectedField}</span>
      </div>

      {/* Font Family */}
      <div className="py-4 border-b border-border-default relative" ref={fontRef}>
        <span className="label-sm mb-2 block">FONT FAMILY</span>
        <button
          onClick={() => setFontOpen(!fontOpen)}
          className="w-full text-left px-3 py-2 bg-raised border border-border-default rounded-lg text-text-primary text-sm shadow-sm active:scale-95 transition-transform"
        >
          {settings.fontFamily}
        </button>
        {fontOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-raised border border-border-default shadow-md z-20 rounded-lg">
            {fontOptions.map(font => (
              <div
                key={font}
                onClick={() => { update({ fontFamily: font }); setFontOpen(false); }}
                className={`flex items-center h-9 px-3 cursor-pointer hover:bg-hover text-sm first:rounded-t-lg last:rounded-b-lg ${
                  settings.fontFamily === font ? 'text-accent' : 'text-text-primary'
                }`}
              >
                {settings.fontFamily === font && <div className="w-0.5 h-5 bg-accent mr-2 rounded-full" />}
                <span style={{ fontFamily: font }}>{font}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Font Size */}
      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">FONT SIZE</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ fontSize: Math.max(6, settings.fontSize - 1) })}
            className="w-8 h-8 flex items-center justify-center bg-raised border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform text-text-primary"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={settings.fontSize}
            onChange={e => update({ fontSize: Math.max(6, Math.min(120, Number(e.target.value) || 6)) })}
            className="w-14 h-8 text-center bg-raised border border-border-default rounded-lg text-text-primary text-sm"
          />
          <button
            onClick={() => update({ fontSize: Math.min(120, settings.fontSize + 1) })}
            className="w-8 h-8 flex items-center justify-center bg-raised border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform text-text-primary"
          >
            <Plus size={14} />
          </button>
          <span className="text-text-secondary text-xs">pt</span>
        </div>
      </div>

      {/* Text Color */}
      <div className="py-4 border-b border-border-default relative" ref={colorRef}>
        <span className="label-sm mb-2 block">TEXT COLOR</span>
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="w-9 h-9 border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform"
          style={{ backgroundColor: settings.color }}
        />
        {colorOpen && (
          <div className="absolute left-0 top-full mt-1 bg-raised border border-border-default shadow-md z-20 p-3 rounded-lg">
            <input
              type="color"
              value={settings.color}
              onChange={e => update({ color: e.target.value })}
              className="w-32 h-32 border-none cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={settings.color}
              onChange={e => update({ color: e.target.value })}
              className="mt-2 w-full px-2 py-1 bg-surface border border-border-default rounded-lg text-text-primary text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Style Toggles */}
      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">STYLE</span>
        <div className="flex gap-2">
          {[
            { key: 'bold' as const, icon: Bold, label: 'B' },
            { key: 'italic' as const, icon: Italic, label: 'I' },
            { key: 'underline' as const, icon: Underline, label: 'U' },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => update({ [key]: !settings[key] })}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-sm active:scale-95 transition-transform ${
                settings[key]
                  ? 'bg-accent text-base border-accent'
                  : 'bg-raised text-text-secondary border-border-default'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">ALIGNMENT</span>
        <div className="flex gap-2">
          {[
            { key: 'left' as const, icon: AlignLeft },
            { key: 'center' as const, icon: AlignCenter },
            { key: 'right' as const, icon: AlignRight },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => update({ align: key })}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border shadow-sm active:scale-95 transition-transform ${
                settings.align === key
                  ? 'bg-accent text-base border-accent'
                  : 'bg-raised text-text-secondary border-border-default'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="py-4">
        <span className="label-sm mb-2 block">PREVIEW</span>
        <div
          className="h-12 bg-base border border-border-default shadow-sm rounded-lg flex items-center px-3 overflow-hidden"
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize}px`,
            color: settings.color,
            fontWeight: settings.bold ? 700 : 400,
            fontStyle: settings.italic ? 'italic' : 'normal',
            textDecoration: settings.underline ? 'underline' : 'none',
            textAlign: settings.align,
            justifyContent: settings.align === 'center' ? 'center' : settings.align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {sampleText}
        </div>
      </div>
    </div>
  );
};

export default FieldPropertiesPanel;
