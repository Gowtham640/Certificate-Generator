'use client';

import { useState } from 'react';
import { Minus, Plus, Eye } from 'lucide-react';
import { useCertificate } from '@/app/context/CertificateContext';
import { ExpandingSearch } from '@/app/components/interior/expanding-search';

interface RecipientListProps {
  onPreview: (rowIndex: number) => void;
}

const RecipientList = ({ onPreview }: RecipientListProps) => {
  const {
    csvData, deselectedRows, toggleRow, selectedRowCount,
    setAllRowsSelected, sampleRowIndex, setSampleRowIndex,
  } = useCertificate();
  const [search, setSearch] = useState('');

  if (!csvData) return null;

  const total = csvData.rows.length;
  const filtered = csvData.rows.map((row, i) => ({ row, index: i })).filter(({ row }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return row.some(val => val.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-[240px] md:h-[280px] border-t border-border-default bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-default">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-text-primary font-semibold text-sm">RECIPIENTS</span>
          <span className="px-2 py-0.5 text-xs bg-raised border border-border-default rounded-md text-text-secondary">
            {selectedRowCount} / {total}
          </span>
          <button type="button" className="text-[11px] text-text-secondary hover:text-accent" onClick={() => setAllRowsSelected(true)}>
            All
          </button>
          <button type="button" className="text-[11px] text-text-secondary hover:text-accent" onClick={() => setAllRowsSelected(false)}>
            None
          </button>
        </div>
        <ExpandingSearch
          label="Search recipients"
          placeholder="Name or value"
          value={search}
          onChange={setSearch}
          resultCount={filtered.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-3 py-4 subtext">No recipients match that search.</p>
        )}
        {filtered.map(({ row, index }) => {
          const isDeselected = deselectedRows.has(index);
          const primary = row[0] || '';
          const rest = row.slice(1).filter(Boolean).join(' · ');
          const isSample = sampleRowIndex === index;

          return (
            <div
              key={index}
              className={`group flex items-center h-11 px-3 border-b border-border-default transition-colors duration-200 ${
                isDeselected ? 'bg-surface' : isSample ? 'bg-hover' : 'bg-raised hover:bg-hover'
              }`}
            >
              <span className="w-8 text-text-disabled text-xs font-mono">{String(index + 1).padStart(3, '0')}</span>
              <button
                type="button"
                className="flex-1 truncate text-left"
                onClick={() => setSampleRowIndex(index)}
                title="Use this row as live canvas sample"
              >
                <span className={`text-sm ${isDeselected ? 'text-text-disabled' : 'text-text-primary'}`}>{primary}</span>
                {rest && (
                  <span className={`text-xs ml-2 ${isDeselected ? 'text-text-disabled' : 'text-text-secondary'}`}>· {rest}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onPreview(index)}
                className="md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 mr-2 text-text-secondary hover:text-accent text-xs flex items-center gap-1"
              >
                <Eye size={12} /> PREVIEW
              </button>
              <button
                type="button"
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
