import { useRef, useEffect, useCallback, useState } from 'react';
import { useDocumentStore } from '../../store/document-store';
import { bravaToXSpreadsheet, xSpreadsheetToBrava } from '../../engine/bridge/table-bridge';
import type { TableBlock } from '../../types/document';
import type { BlockFragment } from '../../engine/layout/layout-engine';
import { FloatingToolbar } from './FloatingToolbar';

type AnySpreadsheet = any;

interface TableEditorProps {
  fragment: BlockFragment;
  sectionId: string;
  zoom: number;
  canvasRect: DOMRect;
}

export function TableEditor({ fragment, sectionId, zoom, canvasRect }: TableEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spreadsheetRef = useRef<AnySpreadsheet>(null);
  const metaRef = useRef<ReturnType<typeof bravaToXSpreadsheet>['meta'] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const commitTableData = useDocumentStore((s) => s.commitTableData);
  const setActiveTableEditor = useDocumentStore((s) => s.setActiveTableEditor);
  const selectCell = useDocumentStore((s) => s.selectCell);

  const block = fragment.sourceBlock as TableBlock;
  const table = block.table;
  const blockId = fragment.blockId;

  const commitAndClose = useCallback(() => {
    if (!spreadsheetRef.current || !metaRef.current) {
      setActiveTableEditor(null);
      return;
    }
    const xs = spreadsheetRef.current as AnySpreadsheet;
    try {
      const sheetData = xs.getData();
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const updatedTable = xSpreadsheetToBrava(sheetData[0], metaRef.current!);
        commitTableData(sectionId, blockId, updatedTable);
      }
    } catch {
      // data commit failed silently -- table data unchanged
    }
    setActiveTableEditor(null);
  }, [sectionId, blockId, commitTableData, setActiveTableEditor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let aborted = false;

    (async () => {
      try {
        await import('x-data-spreadsheet');
        if (aborted) return;

        const xSpreadsheet = (window as any).x_spreadsheet;
        if (typeof xSpreadsheet !== 'function') {
          throw new Error(
            `x-data-spreadsheet loaded but window.x_spreadsheet is ${typeof xSpreadsheet}`
          );
        }

        container.innerHTML = '';

        const totalWidth = table.cols.reduce((sum, c) => sum + (c.width || 100), 0);
        const totalHeight = table.rows.reduce((sum, r) => sum + (r.hidden ? 0 : (r.height || 28)), 0);

        const { data, meta } = bravaToXSpreadsheet(table);
        metaRef.current = meta;

        const opts = {
          mode: 'edit',
          showToolbar: false,
          showGrid: true,
          showContextmenu: true,
          showBottomBar: false,
          view: {
            height: () => Math.min(totalHeight + 40, 600),
            width: () => Math.min(totalWidth + 60, container.clientWidth),
          },
          row: {
            len: table.rows.length,
            height: 28,
          },
          col: {
            len: table.cols.length,
            width: 100,
            indexWidth: 50,
            minWidth: 40,
          },
        };

        const spreadsheet: AnySpreadsheet = xSpreadsheet(container, opts);

        if (aborted) {
          container.innerHTML = '';
          return;
        }

        spreadsheet.loadData([data as any]);

        spreadsheet.on('cell-selected' as any, (_cell: any, ri: number, ci: number) => {
          selectCell(ri, ci);
        });

        setActiveTableEditor({ sectionId, blockId, meta });
        spreadsheetRef.current = spreadsheet;
      } catch (err) {
        if (!aborted) {
          console.error('Failed to initialize table editor:', err);
          const msg = err instanceof Error ? err.message : String(err);
          setLoadError(msg);
        }
      }
    })();

    return () => {
      aborted = true;
      spreadsheetRef.current = null;
      metaRef.current = null;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const toolbarEl = document.querySelector('.floating-toolbar');
        if (toolbarEl && toolbarEl.contains(e.target as Node)) return;
        commitAndClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        commitAndClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [commitAndClose]);

  const editorLeft = fragment.x * zoom;
  const editorTop = fragment.y * zoom;
  const totalWidth = table.cols.reduce((sum, c) => sum + (c.width || 100), 0);
  const totalHeight = table.rows.reduce((sum, r) => sum + (r.hidden ? 0 : (r.height || 28)), 0);
  const editorWidth = Math.max(totalWidth + 60, fragment.width * zoom);
  const editorHeight = Math.min(totalHeight + 40, 600);

  if (loadError !== null) {
    return (
      <div
        style={{
          position: 'absolute',
          left: editorLeft,
          top: editorTop,
          width: editorWidth,
          height: editorHeight,
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: 4,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px #dc2626',
          color: '#64748b',
          fontSize: 13,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', maxWidth: '90%' }}>
          <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            Unable to load table editor
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12, wordBreak: 'break-word' }}>
            {loadError}
          </div>
          <button
            onClick={() => {
              setLoadError(null);
              setActiveTableEditor(null);
            }}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#334155',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingToolbar
        x={editorLeft}
        y={editorTop - 44}
        spreadsheetRef={spreadsheetRef}
      />
      <div
        ref={containerRef}
        className="table-editor-container"
        style={{
          position: 'absolute',
          left: editorLeft,
          top: editorTop,
          width: editorWidth,
          height: editorHeight,
          zIndex: 60,
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 2px #1a73e8',
          borderRadius: 4,
          overflow: 'hidden',
          background: '#ffffff',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </>
  );
}
