'use client';

import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, Plus } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';
import { fontOptions } from '@/app/types/certificate';
import { Dropdown } from '@/app/components/interior/dropdown';

const FieldPropertiesPanel = () => {
  const { selectedField, fieldSettings, updateFieldSettings, csvData, sampleRowIndex } = useCertificate();

  if (!selectedField) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-text-secondary text-sm text-center">
          Select a field to set type, size, color, and alignment.
        </p>
      </div>
    );
  }

  const settings = fieldSettings[selectedField];
  if (!settings) return null;

  const update = (updates: Partial<typeof settings>) => updateFieldSettings(selectedField, updates);

  const row = csvData?.rows[sampleRowIndex] ?? csvData?.rows[0];
  const colIndex = csvData?.headers.indexOf(selectedField) ?? -1;
  const sampleText = row && colIndex >= 0 ? row[colIndex] : selectedField;

  return (
    <div className="p-4 flex flex-col gap-0">
      <span className="label-sm mb-1">FIELD PROPERTIES</span>

      <div className="py-4 border-b border-border-default">
        <span className="text-text-primary font-semibold text-sm uppercase">{selectedField}</span>
      </div>

      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">FONT FAMILY</span>
        <Dropdown
          label="Font family"
          items={fontOptions.map(font => ({ value: font, label: font }))}
          value={settings.fontFamily}
          onChange={(value) => update({ fontFamily: value })}
        />
      </div>

      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">FONT SIZE</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
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
            type="button"
            onClick={() => update({ fontSize: Math.min(120, settings.fontSize + 1) })}
            className="w-8 h-8 flex items-center justify-center bg-raised border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform text-text-primary"
          >
            <Plus size={14} />
          </button>
          <span className="text-text-secondary text-xs">px</span>
        </div>
      </div>

      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">TEXT COLOR</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.color}
            onChange={e => update({ color: e.target.value })}
            className="w-9 h-9 border border-border-default rounded-lg cursor-pointer bg-transparent"
            aria-label="Text color"
          />
          <input
            type="text"
            value={settings.color}
            onChange={e => {
              const v = e.target.value;
              if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) update({ color: v });
            }}
            className="px-2 py-1 w-28 bg-surface border border-border-default rounded-lg text-text-primary text-xs font-mono"
          />
        </div>
      </div>

      <div className="py-4 border-b border-border-default">
        <span className="label-sm mb-2 block">STYLE</span>
        <div className="flex gap-2">
          {[
            { key: 'bold' as const, icon: Bold },
            { key: 'italic' as const, icon: Italic },
            { key: 'underline' as const, icon: Underline },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
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
              type="button"
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

      <div className="py-4">
        <span className="label-sm mb-2 block">PREVIEW</span>
        <div
          className="h-12 bg-base border border-border-default shadow-sm rounded-lg flex items-center px-3 overflow-hidden"
          style={{
            fontFamily: settings.fontFamily,
            fontSize: `${Math.min(settings.fontSize, 28)}px`,
            color: settings.color,
            fontWeight: settings.bold ? 700 : 400,
            fontStyle: settings.italic ? 'italic' : 'normal',
            textDecoration: settings.underline ? 'underline' : 'none',
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
