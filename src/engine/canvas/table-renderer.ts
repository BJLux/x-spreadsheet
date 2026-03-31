import type { TableBlock } from '../../types/document';
import type { TableCell, CellStyle, BorderDef } from '../../types/table';
import type { BlockFragment } from '../layout/layout-engine';
import type { DrawContext } from './draw';
import { drawRect, drawText, drawLine, wrapText } from './draw';
import { DEFAULT_ROW_HEIGHT, DEFAULT_COL_WIDTH, DEFAULT_FONT_FAMILY } from '../layout/constants';

const CELL_PADDING = 4;

function getBorderWidth(style: BorderDef['style']): number {
  switch (style) {
    case 'thin': return 1;
    case 'medium': return 2;
    case 'thick': return 3;
    case 'dashed': return 1;
    case 'dotted': return 1;
    default: return 1;
  }
}

function getBorderDash(style: BorderDef['style']): number[] | undefined {
  switch (style) {
    case 'dashed': return [4, 2];
    case 'dotted': return [1, 2];
    default: return undefined;
  }
}

function getDisplayValue(cell: TableCell): string {
  if (cell.formula && cell.computedValue !== undefined) return cell.computedValue;
  return cell.value || '';
}

function formatValue(value: string, format: string): string {
  if (!format || format === 'general') return value;

  const num = parseFloat(value);
  if (isNaN(num)) return value;

  switch (format) {
    case '#,##0':
      return num.toLocaleString('de-LU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    case '#,##0.00':
      return num.toLocaleString('de-LU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case '0.00%':
      return (num * 100).toLocaleString('de-LU', { minimumFractionDigits: 2 }) + '%';
    case '#,##0.00 €':
      return num.toLocaleString('de-LU', { minimumFractionDigits: 2, style: 'currency', currency: 'EUR' });
    default:
      return value;
  }
}

export function renderTableBlock(
  dc: DrawContext,
  fragment: BlockFragment,
  block: TableBlock,
  selectedCell: { row: number; col: number } | null,
  editingCell: { row: number; col: number } | null
) {
  const { table } = block;
  const rowStart = fragment.tableRowStart ?? 0;
  const rowEnd = fragment.tableRowEnd ?? table.rows.length;

  const headerRows = fragment.isTableContinuation ? table.repeatHeaderRows : 0;

  let drawY = fragment.y + (block.spacingBefore || 0);

  if (headerRows > 0) {
    for (let ri = 0; ri < headerRows && ri < table.rows.length; ri++) {
      const row = table.rows[ri];
      const rowHeight = row.height || DEFAULT_ROW_HEIGHT;
      renderRow(dc, table, row, ri, fragment.x, drawY, rowHeight, table.cols.map((c: { width: number }) => c.width || DEFAULT_COL_WIDTH), true, selectedCell, editingCell);
      drawY += rowHeight;
    }
  }

  for (let ri = rowStart; ri < rowEnd; ri++) {
    const row = table.rows[ri];
    if (row.hidden) continue;
    const rowHeight = row.height || DEFAULT_ROW_HEIGHT;
    const isHeaderRow = row.isHeader;
    const isBandedRow = table.showBanding && !isHeaderRow && (ri - rowStart) % 2 === 1;

    renderRow(dc, table, row, ri, fragment.x, drawY, rowHeight, table.cols.map((c: { width: number }) => c.width || DEFAULT_COL_WIDTH), isHeaderRow, selectedCell, editingCell, isBandedRow ? table.bandingColor : undefined);
    drawY += rowHeight;
  }

  drawTableBorders(dc, fragment, block, rowStart, rowEnd, headerRows);
}

function renderRow(
  dc: DrawContext,
  table: { cols: { width: number; hidden: boolean; id: string }[] },
  row: { cells: TableCell[]; height: number },
  rowIndex: number,
  startX: number,
  startY: number,
  rowHeight: number,
  colWidths: number[],
  isHeader: boolean,
  selectedCell: { row: number; col: number } | null,
  editingCell: { row: number; col: number } | null,
  bandingColor?: string
) {
  let cellX = startX;

  for (let ci = 0; ci < row.cells.length && ci < colWidths.length; ci++) {
    if (table.cols[ci]?.hidden) {
      cellX += colWidths[ci];
      continue;
    }

    const cell = row.cells[ci];
    const cellWidth = colWidths[ci];
    const style = cell.style;

    let bgColor = style.backgroundColor || (isHeader ? '#f8f9fa' : bandingColor || '#ffffff');

    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === ci;
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === ci;

    if (isSelected && !isEditing) {
      bgColor = '#e8f0fe';
    }

    drawRect(dc, cellX, startY, cellWidth, rowHeight, bgColor);

    const displayValue = getDisplayValue(cell);
    const formatted = formatValue(displayValue, style.numberFormat);

    if (formatted) {
      const textX = getTextX(cellX, cellWidth, style);
      const textY = getTextY(startY, rowHeight, style);

      if (style.textWrap) {
        const lines = wrapText(dc, formatted, cellWidth - CELL_PADDING * 2, {
          fontSize: style.fontSize,
          fontFamily: style.fontFamily || DEFAULT_FONT_FAMILY,
          bold: style.bold || isHeader,
          italic: style.italic,
        });
        const lineHeight = (style.fontSize || 11) * 1.3;
        const totalTextHeight = lines.length * lineHeight;
        let lineY = startY + (rowHeight - totalTextHeight) / 2 + lineHeight / 2;

        for (const line of lines) {
          drawText(dc, line, textX, lineY, {
            fontSize: style.fontSize || 11,
            fontFamily: style.fontFamily || DEFAULT_FONT_FAMILY,
            bold: style.bold || isHeader,
            italic: style.italic,
            underline: style.underline,
            strikethrough: style.strikethrough,
            color: style.color || '#1a1a1a',
            align: style.align || 'left',
            baseline: 'middle',
          });
          lineY += lineHeight;
        }
      } else {
        drawText(dc, formatted, textX, textY, {
          fontSize: style.fontSize || 11,
          fontFamily: style.fontFamily || DEFAULT_FONT_FAMILY,
          bold: style.bold || isHeader,
          italic: style.italic,
          underline: style.underline,
          strikethrough: style.strikethrough,
          color: style.color || '#1a1a1a',
          align: style.align || 'left',
          baseline: 'middle',
          maxWidth: cellWidth - CELL_PADDING * 2,
        });
      }
    }

    if (cell.binding) {
      drawRect(dc, cellX + cellWidth - 8, startY + 2, 6, 6, '#0d9488');
    }

    drawCellBorders(dc, cellX, startY, cellWidth, rowHeight, style);

    if (isSelected && !isEditing) {
      drawRect(dc, cellX, startY, cellWidth, rowHeight, undefined, '#1a73e8', 2);
    }

    cellX += cellWidth;
  }
}

function getTextX(cellX: number, cellWidth: number, style: CellStyle): number {
  switch (style.align) {
    case 'center': return cellX + cellWidth / 2;
    case 'right': return cellX + cellWidth - CELL_PADDING - (style.paddingRight || 0);
    default: return cellX + CELL_PADDING + (style.paddingLeft || 0);
  }
}

function getTextY(cellY: number, cellHeight: number, style: CellStyle): number {
  switch (style.valign) {
    case 'top': return cellY + CELL_PADDING + (style.fontSize || 11) / 2;
    case 'bottom': return cellY + cellHeight - CELL_PADDING - (style.fontSize || 11) / 2;
    default: return cellY + cellHeight / 2;
  }
}

function drawCellBorders(
  dc: DrawContext,
  x: number,
  y: number,
  w: number,
  h: number,
  style: CellStyle
) {
  if (style.borderTop) {
    drawLine(dc, x, y, x + w, y, style.borderTop.color, getBorderWidth(style.borderTop.style), getBorderDash(style.borderTop.style));
  }
  if (style.borderRight) {
    drawLine(dc, x + w, y, x + w, y + h, style.borderRight.color, getBorderWidth(style.borderRight.style), getBorderDash(style.borderRight.style));
  }
  if (style.borderBottom) {
    drawLine(dc, x, y + h, x + w, y + h, style.borderBottom.color, getBorderWidth(style.borderBottom.style), getBorderDash(style.borderBottom.style));
  }
  if (style.borderLeft) {
    drawLine(dc, x, y, x, y + h, style.borderLeft.color, getBorderWidth(style.borderLeft.style), getBorderDash(style.borderLeft.style));
  }
}

function drawTableBorders(
  dc: DrawContext,
  fragment: BlockFragment,
  block: TableBlock,
  rowStart: number,
  rowEnd: number,
  headerRows: number
) {
  const { table } = block;
  let y = fragment.y + (block.spacingBefore || 0);
  let totalHeight = 0;
  let totalWidth = 0;

  for (const col of table.cols) {
    totalWidth += col.width || DEFAULT_COL_WIDTH;
  }

  if (headerRows > 0) {
    for (let i = 0; i < headerRows; i++) {
      totalHeight += table.rows[i]?.height || DEFAULT_ROW_HEIGHT;
    }
  }

  for (let ri = rowStart; ri < rowEnd; ri++) {
    const row = table.rows[ri];
    if (!row.hidden) {
      totalHeight += row.height || DEFAULT_ROW_HEIGHT;
    }
  }

  const gridColor = '#e2e5e9';
  let drawY = y;

  const rowsToDraw = [];
  if (headerRows > 0) {
    for (let i = 0; i < headerRows; i++) rowsToDraw.push(table.rows[i]);
  }
  for (let ri = rowStart; ri < rowEnd; ri++) {
    if (!table.rows[ri].hidden) rowsToDraw.push(table.rows[ri]);
  }

  for (const row of rowsToDraw) {
    const rh = row.height || DEFAULT_ROW_HEIGHT;
    drawLine(dc, fragment.x, drawY + rh, fragment.x + totalWidth, drawY + rh, gridColor);
    drawY += rh;
  }

  let drawX = fragment.x;
  for (const col of table.cols) {
    if (!col.hidden) {
      const cw = col.width || DEFAULT_COL_WIDTH;
      drawLine(dc, drawX + cw, y, drawX + cw, y + totalHeight, gridColor);
      drawX += cw;
    }
  }

  drawRect(dc, fragment.x, y, totalWidth, totalHeight, undefined, '#d0d4d9');
}
