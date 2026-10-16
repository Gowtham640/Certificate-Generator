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
  x: number;
  y: number;
  settings: FieldSettings;
}

export interface CsvData {
  headers: string[];
  rows: string[][];
  filename: string;
}

export interface HistoryEntry {
  fields: PlacedField[];
  fieldSettings: Record<string, FieldSettings>;
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
  'Inter',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Playfair Display',
  'Montserrat',
];
