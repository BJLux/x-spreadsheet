import { useRef, useEffect, useCallback, useState } from 'react';
import { useDocumentStore } from '../../store/document-store';
import { renderPage } from '../../engine/canvas/page-renderer';
import { A4_WIDTH_PX, A4_HEIGHT_PX, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from '../../engine/layout/constants';
import type { BlockFragment } from '../../engine/layout/layout-engine';
import type { TableBlock } from '../../types/document';
import { CellEditor } from './CellEditor';

export function DocumentCanvas() {
  const pagePlan = useDocumentStore((s) => s.pagePlan);
  const document = useDocumentStore((s) => s.document);
  const selection = useDocumentStore((s) => s.selection);
  const editingCell = useDocumentStore((s) => s.editingCell);
  const hoveredBlockId = useDocumentStore((s) => s.hoveredBlockId);
  const zoom = useDocumentStore((s) => s.zoom);
  const selectBlock = useDocumentStore((s) => s.selectBlock);
  const selectCell = useDocumentStore((s) => s.selectCell);
  const startEditingCell = useDocumentStore((s) => s.startEditingCell);
  const setHoveredBlock = useDocumentStore((s) => s.setHoveredBlock);
  const clearSelection = useDocumentStore((s) => s.clearSelection);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [editorPosition, setEditorPosition] = useState<{ x: number; y: number; width: number; height: number; pageIndex: number } | null>(null);

  const setCanvasRef = useCallback((pageIndex: number, el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(pageIndex, el);
    } else {
      canvasRefs.current.delete(pageIndex);
    }
  }, []);

  useEffect(() => {
    if (!pagePlan) return;

    for (const page of pagePlan.pages) {
      const canvas = canvasRefs.current.get(page.pageIndex);
      if (!canvas) continue;

      renderPage(canvas, page, {
        selectedBlockId: selection.blockId,
        selectedCell: selection.cellRow !== null && selection.cellCol !== null
          ? { row: selection.cellRow, col: selection.cellCol }
          : null,
        editingCell,
        hoveredBlockId,
        zoom,
      });
    }
  }, [pagePlan, selection, editingCell, hoveredBlockId, zoom]);

  const findFragmentAtPoint = useCallback((pageIndex: number, x: number, y: number): BlockFragment | null => {
    if (!pagePlan) return null;
    const page = pagePlan.pages[pageIndex];
    if (!page) return null;

    for (let i = page.fragments.length - 1; i >= 0; i--) {
      const f = page.fragments[i];
      if (x >= f.x && x <= f.x + f.width && y >= f.y && y <= f.y + f.height) {
        return f;
      }
    }
    return null;
  }, [pagePlan]);

  const findCellAtPoint = useCallback((fragment: BlockFragment, x: number, y: number): { row: number; col: number } | null => {
    if (fragment.blockType !== 'table') return null;
    const block = fragment.sourceBlock as TableBlock;
    const table = block.table;

    const rowStart = fragment.tableRowStart ?? 0;
    const rowEnd = fragment.tableRowEnd ?? table.rows.length;

    let cellY = fragment.y + (block.spacingBefore || 0);

    if (fragment.isTableContinuation && table.repeatHeaderRows > 0) {
      for (let ri = 0; ri < table.repeatHeaderRows; ri++) {
        const rh = table.rows[ri]?.height || DEFAULT_ROW_HEIGHT;
        if (y >= cellY && y < cellY + rh) {
          return findColAtX(table, fragment.x, x, ri);
        }
        cellY += rh;
      }
    }

    for (let ri = rowStart; ri < rowEnd; ri++) {
      const row = table.rows[ri];
      if (row.hidden) continue;
      const rh = row.height || DEFAULT_ROW_HEIGHT;
      if (y >= cellY && y < cellY + rh) {
        return findColAtX(table, fragment.x, x, ri);
      }
      cellY += rh;
    }

    return null;
  }, []);

  const findColAtX = (table: TableBlock['table'], startX: number, x: number, row: number): { row: number; col: number } | null => {
    let cellX = startX;
    for (let ci = 0; ci < table.cols.length; ci++) {
      const cw = table.cols[ci].width || DEFAULT_COL_WIDTH;
      if (x >= cellX && x < cellX + cw) {
        return { row, col: ci };
      }
      cellX += cw;
    }
    return null;
  };

  const getCellRect = useCallback((pageIndex: number, fragment: BlockFragment, row: number, col: number): { x: number; y: number; width: number; height: number } | null => {
    if (fragment.blockType !== 'table') return null;
    const block = fragment.sourceBlock as TableBlock;
    const table = block.table;

    let cellX = fragment.x;
    for (let ci = 0; ci < col; ci++) {
      cellX += table.cols[ci]?.width || DEFAULT_COL_WIDTH;
    }

    let cellY = fragment.y + (block.spacingBefore || 0);
    const rowStart = fragment.tableRowStart ?? 0;

    if (fragment.isTableContinuation && table.repeatHeaderRows > 0) {
      for (let ri = 0; ri < table.repeatHeaderRows; ri++) {
        if (ri === row) {
          return {
            x: cellX,
            y: cellY,
            width: table.cols[col]?.width || DEFAULT_COL_WIDTH,
            height: table.rows[ri]?.height || DEFAULT_ROW_HEIGHT,
          };
        }
        cellY += table.rows[ri]?.height || DEFAULT_ROW_HEIGHT;
      }
    }

    for (let ri = rowStart; ri < (fragment.tableRowEnd ?? table.rows.length); ri++) {
      if (table.rows[ri]?.hidden) continue;
      if (ri === row) {
        return {
          x: cellX,
          y: cellY,
          width: table.cols[col]?.width || DEFAULT_COL_WIDTH,
          height: table.rows[ri]?.height || DEFAULT_ROW_HEIGHT,
        };
      }
      cellY += table.rows[ri]?.height || DEFAULT_ROW_HEIGHT;
    }

    return null;
  }, []);

  const handleCanvasClick = useCallback((pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const fragment = findFragmentAtPoint(pageIndex, x, y);

    if (!fragment) {
      clearSelection();
      setEditorPosition(null);
      return;
    }

    const page = pagePlan?.pages[pageIndex];
    if (!page) return;

    const sectionId = page.sectionId;
    selectBlock(sectionId, fragment.blockId);

    if (fragment.blockType === 'table') {
      const cellPos = findCellAtPoint(fragment, x, y);
      if (cellPos) {
        selectCell(cellPos.row, cellPos.col);
      }
    }

    setEditorPosition(null);
  }, [zoom, pagePlan, findFragmentAtPoint, findCellAtPoint, selectBlock, selectCell, clearSelection]);

  const handleCanvasDoubleClick = useCallback((pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const fragment = findFragmentAtPoint(pageIndex, x, y);
    if (!fragment || fragment.blockType !== 'table') return;

    const cellPos = findCellAtPoint(fragment, x, y);
    if (!cellPos) return;

    const cellRect = getCellRect(pageIndex, fragment, cellPos.row, cellPos.col);
    if (!cellRect) return;

    startEditingCell(cellPos.row, cellPos.col);
    setEditorPosition({
      x: cellRect.x * zoom,
      y: cellRect.y * zoom,
      width: cellRect.width * zoom,
      height: cellRect.height * zoom,
      pageIndex,
    });
  }, [zoom, findFragmentAtPoint, findCellAtPoint, getCellRect, startEditingCell]);

  const handleCanvasMouseMove = useCallback((pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const fragment = findFragmentAtPoint(pageIndex, x, y);
    setHoveredBlock(fragment?.blockId || null);
  }, [zoom, findFragmentAtPoint, setHoveredBlock]);

  if (!pagePlan || pagePlan.pages.length === 0) {
    return (
      <div className="document-canvas-wrapper">
        <div className="empty-state">
          <div className="empty-state-text">No pages to display</div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-canvas-wrapper" ref={containerRef}>
      {pagePlan.pages.map((page) => (
        <div key={page.pageIndex} style={{ position: 'relative' }}>
          <div
            className="page-container"
            style={{
              width: A4_WIDTH_PX * zoom,
              height: A4_HEIGHT_PX * zoom,
            }}
          >
            <canvas
              ref={(el) => setCanvasRef(page.pageIndex, el)}
              style={{
                width: A4_WIDTH_PX * zoom,
                height: A4_HEIGHT_PX * zoom,
                cursor: 'default',
              }}
              onClick={(e) => handleCanvasClick(page.pageIndex, e)}
              onDoubleClick={(e) => handleCanvasDoubleClick(page.pageIndex, e)}
              onMouseMove={(e) => handleCanvasMouseMove(page.pageIndex, e)}
              onMouseLeave={() => setHoveredBlock(null)}
            />
            {editingCell && editorPosition && editorPosition.pageIndex === page.pageIndex && (
              <CellEditor
                x={editorPosition.x}
                y={editorPosition.y}
                width={editorPosition.width}
                height={editorPosition.height}
              />
            )}
          </div>
          <div className="page-number-label">
            Page {page.pageNumberInSection} of {page.totalPagesInSection} &mdash; {page.sectionTitle}
          </div>
        </div>
      ))}
    </div>
  );
}
