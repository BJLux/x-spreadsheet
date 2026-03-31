import type { TableData, TableCell, CellStyle, BorderDef, MergeRange, CellBinding } from '../../types/table';

export interface XSCellStyle {
  bgcolor: string;
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  textwrap: boolean;
  strike: boolean;
  underline: boolean;
  color: string;
  font: {
    name: string;
    size: number;
    bold: boolean;
    italic: boolean;
  };
  format: string;
  border?: {
    top?: [string, string];
    bottom?: [string, string];
    left?: [string, string];
    right?: [string, string];
  };
}

export interface XSCellData {
  text?: string;
  style?: number;
  merge?: [number, number];
}

export interface XSRowData {
  cells?: Record<string, XSCellData>;
  height?: number;
}

export interface XSSheetData {
  name?: string;
  freeze?: string;
  styles?: XSCellStyle[];
  merges?: string[];
  rows?: Record<string, XSRowData | number> & { len?: number };
  cols?: Record<string, { width?: number; hide?: boolean } | number> & { len?: number };
  validations?: unknown[];
  autofilter?: unknown;
}

export interface BravaMetaSideChannel {
  tableId: string;
  repeatHeaderRows: number;
  showBanding: boolean;
  bandingColor: string;
  rowMeta: Map<number, { id: string; isHeader: boolean }>;
  colMeta: Map<number, { id: string }>;
  cellMeta: Map<string, { id: string; binding: CellBinding | null; locked: boolean }>;
}

function cellKey(ri: number, ci: number): string {
  return `${ri}:${ci}`;
}

function borderDefToXS(border: BorderDef | null): [string, string] | undefined {
  if (!border) return undefined;
  return [border.style === 'medium' ? 'medium' : border.style === 'thick' ? 'thick' : 'thin', border.color];
}

function xsBorderToDef(xs: [string, string] | undefined): BorderDef | null {
  if (!xs) return null;
  const styleMap: Record<string, BorderDef['style']> = {
    thin: 'thin', medium: 'medium', thick: 'thick', dashed: 'dashed', dotted: 'dotted',
  };
  return { style: styleMap[xs[0]] || 'thin', color: xs[1] || '#000000' };
}

function styleToXS(style: CellStyle): XSCellStyle {
  const border: XSCellStyle['border'] = {};
  const top = borderDefToXS(style.borderTop);
  const bottom = borderDefToXS(style.borderBottom);
  const left = borderDefToXS(style.borderLeft);
  const right = borderDefToXS(style.borderRight);
  if (top) border.top = top;
  if (bottom) border.bottom = bottom;
  if (left) border.left = left;
  if (right) border.right = right;

  const formatMap: Record<string, string> = {
    '': 'normal',
    'general': 'normal',
    '#,##0': 'number',
    '#,##0.00': 'number',
    '0.00%': 'percent',
    '#,##0.00 \u20AC': 'eur',
  };

  return {
    bgcolor: style.backgroundColor || '#ffffff',
    align: style.align || 'left',
    valign: style.valign || 'middle',
    textwrap: style.textWrap || false,
    strike: style.strikethrough || false,
    underline: style.underline || false,
    color: style.color || '#0a0a0a',
    font: {
      name: style.fontFamily || 'Inter',
      size: style.fontSize || 11,
      bold: style.bold || false,
      italic: style.italic || false,
    },
    format: formatMap[style.numberFormat] || 'normal',
    border: (top || bottom || left || right) ? border : undefined,
  };
}

function xsStyleToBrava(xs: XSCellStyle): CellStyle {
  const formatMap: Record<string, string> = {
    normal: '',
    text: '',
    number: '#,##0.00',
    percent: '0.00%',
    rmb: '#,##0.00',
    usd: '#,##0.00',
    eur: '#,##0.00 \u20AC',
  };

  return {
    fontFamily: xs.font?.name || '',
    fontSize: xs.font?.size || 11,
    bold: xs.font?.bold || false,
    italic: xs.font?.italic || false,
    underline: xs.underline || false,
    strikethrough: xs.strike || false,
    color: xs.color || '#1a1a1a',
    backgroundColor: (xs.bgcolor && xs.bgcolor !== '#ffffff') ? xs.bgcolor : '',
    align: xs.align || 'left',
    valign: xs.valign || 'middle',
    textWrap: xs.textwrap || false,
    numberFormat: formatMap[xs.format] || '',
    borderTop: xsBorderToDef(xs.border?.top),
    borderRight: xsBorderToDef(xs.border?.right),
    borderBottom: xsBorderToDef(xs.border?.bottom),
    borderLeft: xsBorderToDef(xs.border?.left),
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
  };
}

function stylesEqual(a: XSCellStyle, b: XSCellStyle): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function findOrAddStyle(styles: XSCellStyle[], style: XSCellStyle): number {
  for (let i = 0; i < styles.length; i++) {
    if (stylesEqual(styles[i], style)) return i;
  }
  styles.push(style);
  return styles.length - 1;
}

function indexToColRef(ci: number): string {
  let result = '';
  let n = ci + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

export function bravaToXSpreadsheet(table: TableData): { data: XSSheetData; meta: BravaMetaSideChannel } {
  const styles: XSCellStyle[] = [];
  const merges: string[] = [];
  const rows: Record<string, XSRowData | number> = {};
  const cols: Record<string, { width?: number; hide?: boolean } | number> = {};

  const meta: BravaMetaSideChannel = {
    tableId: table.id,
    repeatHeaderRows: table.repeatHeaderRows,
    showBanding: table.showBanding,
    bandingColor: table.bandingColor,
    rowMeta: new Map(),
    colMeta: new Map(),
    cellMeta: new Map(),
  };

  for (let ci = 0; ci < table.cols.length; ci++) {
    const col = table.cols[ci];
    meta.colMeta.set(ci, { id: col.id });
    const colData: { width?: number; hide?: boolean } = {};
    if (col.width !== 100) colData.width = col.width;
    if (col.hidden) colData.hide = true;
    if (colData.width || colData.hide) {
      cols[String(ci)] = colData;
    }
  }
  cols['len'] = table.cols.length;

  for (let ri = 0; ri < table.rows.length; ri++) {
    const row = table.rows[ri];
    meta.rowMeta.set(ri, { id: row.id, isHeader: row.isHeader });

    const cells: Record<string, XSCellData> = {};

    for (let ci = 0; ci < row.cells.length; ci++) {
      const cell = row.cells[ci];
      meta.cellMeta.set(cellKey(ri, ci), {
        id: cell.id,
        binding: cell.binding,
        locked: cell.locked,
      });

      const xsStyle = styleToXS(cell.style);
      const styleIndex = findOrAddStyle(styles, xsStyle);

      const cellData: XSCellData = {};
      const text = cell.formula || cell.value || '';
      if (text) cellData.text = text;
      cellData.style = styleIndex;

      if (cell.merge && (cell.merge.rowSpan > 1 || cell.merge.colSpan > 1)) {
        cellData.merge = [cell.merge.rowSpan - 1, cell.merge.colSpan - 1];
      }

      cells[String(ci)] = cellData;
    }

    const rowData: XSRowData = { cells };
    if (row.height !== 28) rowData.height = row.height;

    rows[String(ri)] = rowData;
  }
  rows['len'] = table.rows.length;

  for (const m of table.merges) {
    const startRef = `${indexToColRef(m.startCol)}${m.startRow + 1}`;
    const endRef = `${indexToColRef(m.startCol + m.colSpan - 1)}${m.startRow + m.rowSpan}`;
    merges.push(`${startRef}:${endRef}`);
  }

  const data: XSSheetData = {
    name: 'Sheet1',
    styles,
    merges: merges.length > 0 ? merges : undefined,
    rows,
    cols,
  };

  return { data, meta };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function xSpreadsheetToBrava(
  sheetData: Record<string, any>,
  meta: BravaMetaSideChannel
): TableData {
  const styles = sheetData.styles || [];
  const rowCount = typeof sheetData.rows?.len === 'number' ? sheetData.rows.len : 100;
  const colCount = typeof sheetData.cols?.len === 'number' ? sheetData.cols.len : 26;

  const actualRowCount = Math.max(rowCount, getMaxRowIndex(sheetData.rows) + 1);
  const actualColCount = Math.max(colCount, getMaxColIndex(sheetData.rows, sheetData.cols) + 1);

  const tableCols = [];
  for (let ci = 0; ci < actualColCount; ci++) {
    const colData = sheetData.cols?.[String(ci)];
    const existingMeta = meta.colMeta.get(ci);
    const width = (colData && typeof colData === 'object' && 'width' in colData) ? (colData.width || 100) : 100;
    const hidden = (colData && typeof colData === 'object' && 'hide' in colData) ? (colData.hide || false) : false;
    tableCols.push({
      id: existingMeta?.id || crypto.randomUUID(),
      width,
      hidden,
    });
  }

  const tableRows = [];
  for (let ri = 0; ri < actualRowCount; ri++) {
    const rowData = sheetData.rows?.[String(ri)];
    const existingMeta = meta.rowMeta.get(ri);
    const height = (rowData && typeof rowData === 'object' && 'height' in rowData) ? (rowData.height || 28) : 28;

    const cells: TableCell[] = [];
    for (let ci = 0; ci < actualColCount; ci++) {
      const cellData = (rowData && typeof rowData === 'object' && 'cells' in rowData)
        ? rowData.cells?.[String(ci)]
        : undefined;
      const existingCellMeta = meta.cellMeta.get(cellKey(ri, ci));

      const styleIdx = cellData?.style;
      const xsStyle = (styleIdx !== undefined && styles[styleIdx]) ? styles[styleIdx] : undefined;
      const bravaStyle: CellStyle = xsStyle ? xsStyleToBrava(xsStyle) : createDefaultCellStyle();

      const text = cellData?.text || '';
      const isFormula = text.startsWith('=');

      let merge = null;
      if (cellData?.merge) {
        const [addRows, addCols] = cellData.merge;
        if (addRows > 0 || addCols > 0) {
          merge = { rowSpan: addRows + 1, colSpan: addCols + 1 };
        }
      }

      cells.push({
        id: existingCellMeta?.id || crypto.randomUUID(),
        value: isFormula ? '' : text,
        formula: isFormula ? text : '',
        computedValue: isFormula ? '' : text,
        style: bravaStyle,
        merge,
        binding: existingCellMeta?.binding || null,
        locked: existingCellMeta?.locked || false,
      });
    }

    tableRows.push({
      id: existingMeta?.id || crypto.randomUUID(),
      height,
      hidden: false,
      isHeader: existingMeta?.isHeader || false,
      cells,
    });
  }

  const merges: MergeRange[] = [];
  if (sheetData.merges) {
    for (const mergeStr of sheetData.merges) {
      const parsed = parseMergeRange(mergeStr);
      if (parsed) merges.push(parsed);
    }
  }

  return {
    id: meta.tableId,
    rows: tableRows,
    cols: tableCols,
    merges,
    repeatHeaderRows: meta.repeatHeaderRows,
    showBanding: meta.showBanding,
    bandingColor: meta.bandingColor,
  };
}

function createDefaultCellStyle(): CellStyle {
  return {
    fontFamily: '',
    fontSize: 11,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: '#1a1a1a',
    backgroundColor: '',
    align: 'left',
    valign: 'middle',
    textWrap: false,
    numberFormat: '',
    borderTop: null,
    borderRight: null,
    borderBottom: null,
    borderLeft: null,
    paddingTop: 2,
    paddingRight: 4,
    paddingBottom: 2,
    paddingLeft: 4,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMaxRowIndex(rows: any): number {
  if (!rows) return 0;
  let max = 0;
  for (const key of Object.keys(rows)) {
    if (key === 'len') continue;
    const idx = parseInt(key, 10);
    if (!isNaN(idx) && idx > max) max = idx;
  }
  return max;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMaxColIndex(rows: any, cols: any): number {
  let max = 0;
  if (cols) {
    for (const key of Object.keys(cols)) {
      if (key === 'len') continue;
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx > max) max = idx;
    }
  }
  if (rows) {
    for (const key of Object.keys(rows)) {
      if (key === 'len') continue;
      const rowData = rows[key];
      if (rowData && typeof rowData === 'object' && 'cells' in rowData && rowData.cells) {
        for (const ck of Object.keys(rowData.cells)) {
          const idx = parseInt(ck, 10);
          if (!isNaN(idx) && idx > max) max = idx;
        }
      }
    }
  }
  return max;
}

function colRefToIndex(ref: string): number {
  let index = 0;
  for (let i = 0; i < ref.length; i++) {
    index = index * 26 + (ref.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseMergeRange(mergeStr: string): MergeRange | null {
  const match = mergeStr.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!match) return null;
  const startCol = colRefToIndex(match[1]);
  const startRow = parseInt(match[2], 10) - 1;
  const endCol = colRefToIndex(match[3]);
  const endRow = parseInt(match[4], 10) - 1;
  return {
    startRow,
    startCol,
    rowSpan: endRow - startRow + 1,
    colSpan: endCol - startCol + 1,
  };
}
