import { useRef, useEffect, useCallback } from 'react';
// @ts-ignore - import pre-built bundle to avoid LESS dependency
import Spreadsheet from 'x-data-spreadsheet/dist/xspreadsheet.js';
import 'x-data-spreadsheet/dist/xspreadsheet.css';
import { useDocumentStore } from '../../store/document-store';
import { bravaToXSpreadsheet, xSpreadsheetToBrava } from '../../engine/bridge/table-bridge';
import type { TableBlock } from '../../types/document';
import type { BlockFragment } from '../../engine/layout/layout-engine';
import { FloatingToolbar } from './FloatingToolbar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const commitTableData = useDocumentStore((s) => s.commitTableData);
  const setActiveTableEditor = useDocumentStore((s) => s.setActiveTableEditor);
  const selectCell = useDocumentStore((s) => s.selectCell);

  const block = fragment.sourceBlock as TableBlock;
  const table = block.table;
  const blockId = fragment.blockId;

  const commitAndClose = useCallback(() => {
    if (!spreadsheetRef.current || !metaRef.current) return;
    const xs = spreadsheetRef.current as AnySpreadsheet;
    const sheetData = xs.getData();
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      const updatedTable = xSpreadsheetToBrava(sheetData[0], metaRef.current);
      commitTableData(sectionId, blockId, updatedTable);
    }
    setActiveTableEditor(null);
  }, [sectionId, blockId, commitTableData, setActiveTableEditor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    const spreadsheet: AnySpreadsheet = new Spreadsheet(container, opts as any);

    spreadsheet.loadData([data as any]);

    spreadsheet.on('cell-selected' as any, (_cell: any, ri: number, ci: number) => {
      selectCell(ri, ci);
    });

    setActiveTableEditor({ sectionId, blockId, meta });
    spreadsheetRef.current = spreadsheet;

    return () => {
      spreadsheetRef.current = null;
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

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 100);

    return () => {
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
