import { useRef, useEffect, useCallback, useState } from 'react';
import { useDocumentStore } from '../../store/document-store';
import { renderPage } from '../../engine/canvas/page-renderer';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '../../engine/layout/constants';
import type { BlockFragment } from '../../engine/layout/layout-engine';
import type { TableBlock } from '../../types/document';
import { TableEditor } from './TableEditor';

interface ActiveEditorState {
  fragment: BlockFragment;
  sectionId: string;
  pageIndex: number;
}

export function DocumentCanvas() {
  const pagePlan = useDocumentStore((s) => s.pagePlan);
  const selection = useDocumentStore((s) => s.selection);
  const editingCell = useDocumentStore((s) => s.editingCell);
  const hoveredBlockId = useDocumentStore((s) => s.hoveredBlockId);
  const zoom = useDocumentStore((s) => s.zoom);
  const activeTableEditor = useDocumentStore((s) => s.activeTableEditor);
  const selectBlock = useDocumentStore((s) => s.selectBlock);
  const selectCell = useDocumentStore((s) => s.selectCell);
  const setHoveredBlock = useDocumentStore((s) => s.setHoveredBlock);
  const clearSelection = useDocumentStore((s) => s.clearSelection);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEditor, setActiveEditor] = useState<ActiveEditorState | null>(null);

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

      const isActiveEditorPage = activeTableEditor && activeEditor?.pageIndex === page.pageIndex;

      renderPage(canvas, page, {
        selectedBlockId: isActiveEditorPage ? null : selection.blockId,
        selectedCell: selection.cellRow !== null && selection.cellCol !== null
          ? { row: selection.cellRow, col: selection.cellCol }
          : null,
        editingCell,
        hoveredBlockId: isActiveEditorPage ? null : hoveredBlockId,
        zoom,
        activeTableBlockId: activeTableEditor ? activeEditor?.fragment.blockId ?? null : null,
      });
    }
  }, [pagePlan, selection, editingCell, hoveredBlockId, zoom, activeTableEditor, activeEditor]);

  useEffect(() => {
    if (!activeTableEditor) {
      setActiveEditor(null);
    }
  }, [activeTableEditor]);

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

  const handleCanvasClick = useCallback((pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTableEditor) return;

    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const fragment = findFragmentAtPoint(pageIndex, x, y);

    if (!fragment) {
      clearSelection();
      return;
    }

    const page = pagePlan?.pages[pageIndex];
    if (!page) return;

    const sectionId = page.sectionId;
    selectBlock(sectionId, fragment.blockId);

    if (fragment.blockType === 'table') {
      setActiveEditor({ fragment, sectionId, pageIndex });

      const tableBlock = fragment.sourceBlock as TableBlock;
      const table = tableBlock.table;
      selectBlock(sectionId, fragment.blockId);
    }
  }, [zoom, pagePlan, findFragmentAtPoint, selectBlock, clearSelection, activeTableEditor]);

  const handleCanvasMouseMove = useCallback((pageIndex: number, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTableEditor) return;

    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const fragment = findFragmentAtPoint(pageIndex, x, y);
    setHoveredBlock(fragment?.blockId || null);
  }, [zoom, findFragmentAtPoint, setHoveredBlock, activeTableEditor]);

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
              onMouseMove={(e) => handleCanvasMouseMove(page.pageIndex, e)}
              onMouseLeave={() => setHoveredBlock(null)}
            />
            {activeEditor && activeEditor.pageIndex === page.pageIndex && (
              <TableEditor
                fragment={activeEditor.fragment}
                sectionId={activeEditor.sectionId}
                zoom={zoom}
                canvasRect={canvasRefs.current.get(page.pageIndex)?.getBoundingClientRect() || new DOMRect()}
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
