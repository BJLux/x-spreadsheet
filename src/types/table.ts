export interface TableData {
  id: string;
  rows: TableRow[];
  cols: TableCol[];
  merges: MergeRange[];
  repeatHeaderRows: number;
  showBanding: boolean;
  bandingColor: string;
}

export interface TableRow {
  id: string;
  height: number;
  hidden: boolean;
  isHeader: boolean;
  cells: TableCell[];
}

export interface TableCol {
  id: string;
  width: number;
  hidden: boolean;
}

export interface TableCell {
  id: string;
  value: string;
  formula: string;
  computedValue: string;
  style: CellStyle;
  merge: CellMerge | null;
  binding: CellBinding | null;
  locked: boolean;
}

export interface CellStyle {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  backgroundColor: string;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  textWrap: boolean;
  numberFormat: string;
  borderTop: BorderDef | null;
  borderRight: BorderDef | null;
  borderBottom: BorderDef | null;
  borderLeft: BorderDef | null;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

export interface BorderDef {
  style: 'thin' | 'medium' | 'thick' | 'dashed' | 'dotted';
  color: string;
}

export interface CellMerge {
  rowSpan: number;
  colSpan: number;
}

export interface MergeRange {
  startRow: number;
  startCol: number;
  rowSpan: number;
  colSpan: number;
}

export type BindingSource = 'trial-balance' | 'pcn' | 'entity' | 'statement' | 'note' | 'other-table';

export interface CellBinding {
  source: BindingSource;
  sourceId: string;
  field: string;
  overridden: boolean;
  overrideValue: string;
}
