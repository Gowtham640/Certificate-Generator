export interface FieldSettings {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

export interface PlacedField {
  columnName: string;
  x: number; // percentage of template width
  y: number; // percentage of template height
  settings: FieldSettings;
}

export interface CsvData {
  headers: string[];
  rows: string[][];
  filename: string;
}

export interface HistoryEntry {
  fields: PlacedField[];
}

export const defaultFieldSettings: FieldSettings = {
  fontFamily: 'Inter',
  fontSize: 24,
  color: '#1a1a1a',
  bold: false,
  italic: false,
  underline: false,
  align: 'center',
};

export const fontOptions = [
  'Basic',
  'Inter',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Playfair Display',
  'Montserrat',
];
