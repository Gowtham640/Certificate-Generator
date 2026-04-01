'use client';

import { useState } from 'react';
import { Minus, Plus, Search, Eye } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';

interface RecipientListProps {
  onPreview: (rowIndex: number) => void;
}

const RecipientList = ({ onPreview }: RecipientListProps) => {
  const { csvData, deselectedRows, toggleRow, selectedRowCount } = useCertificate();
  const [search, setSearch] = useState('');

  if (!csvData) return null;

  const total = csvData.rows.length;
  const filtered = csvData.rows.map((row, i) => ({ row, index: i })).filter(({ row }) => {
    if (!search) return true;
    return row.some(val => val.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="flex flex-col h-[280px] border-t border-border-default bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
        <div className="flex items-center gap-2">
          <span className="text-text-primary font-semibold text-sm">RECIPIENTS</span>
          <span className="px-2 py-0.5 text-xs bg-raised border border-border-default rounded-md text-text-secondary">
            {selectedRowCount} / {total} selected
          </span>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-disabled" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or value..."
            className="pl-7 pr-3 py-1.5 w-52 text-xs bg-raised border border-border-default rounded-lg text-text-primary shadow-sm placeholder:text-text-disabled focus:border-border-strong outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(({ row, index }) => {
          const isDeselected = deselectedRows.has(index);
          const primary = row[0] || '';
          const rest = row.slice(1).filter(Boolean).join(' · ');

          return (
            <div
              key={index}
              className={`group flex items-center h-11 px-3 border-b border-border-default transition-colors duration-200 ${
                isDeselected ? 'bg-surface' : 'bg-raised hover:bg-hover'
              }`}
            >
              <span className="w-8 text-text-disabled text-xs font-mono">{String(index + 1).padStart(3, '0')}</span>
              <div className="flex-1 truncate">
                <span className={`text-sm ${isDeselected ? 'text-text-disabled' : 'text-text-primary'}`}>{primary}</span>
                {rest && (
                  <span className={`text-xs ml-2 ${isDeselected ? 'text-text-disabled' : 'text-text-secondary'}`}>· {rest}</span>
                )}
              </div>
              <button
                onClick={() => onPreview(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mr-2 text-text-secondary hover:text-accent text-xs flex items-center gap-1"
              >
                <Eye size={12} /> PREVIEW
              </button>
              <button
                onClick={() => toggleRow(index)}
                className={`w-7 h-7 flex items-center justify-center border border-border-default rounded-lg shadow-sm active:scale-95 transition-transform ${
                  isDeselected ? 'bg-raised hover:text-success' : 'bg-raised hover:text-danger'
                } text-text-secondary`}
              >
                {isDeselected ? <Plus size={12} /> : <Minus size={12} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecipientList;
