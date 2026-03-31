import { useEffect } from 'react';
import { useDocumentStore } from '../store/document-store';
import type { TableBlock } from '../types/document';

export function useKeyboardNav() {
  const selection = useDocumentStore((s) => s.selection);
  const editingCell = useDocumentStore((s) => s.editingCell);
  const document = useDocumentStore((s) => s.document);
  const selectCell = useDocumentStore((s) => s.selectCell);
  const startEditingCell = useDocumentStore((s) => s.startEditingCell);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const setCellValue = useDocumentStore((s) => s.setCellValue);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if (!selection.sectionId || !selection.blockId || selection.cellRow === null || selection.cellCol === null) return;

      if (!document) return;
      const section = document.sections.find(s => s.id === selection.sectionId);
      if (!section) return;
      const block = section.blocks.find(b => b.id === selection.blockId);
      if (!block || block.type !== 'table') return;

      const table = (block as TableBlock).table;
      const maxRow = table.rows.length - 1;
      const maxCol = table.cols.length - 1;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          selectCell(Math.max(0, selection.cellRow - 1), selection.cellCol);
          break;
        case 'ArrowDown':
          e.preventDefault();
          selectCell(Math.min(maxRow, selection.cellRow + 1), selection.cellCol);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          selectCell(selection.cellRow, Math.max(0, selection.cellCol - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          selectCell(selection.cellRow, Math.min(maxCol, selection.cellCol + 1));
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            selectCell(selection.cellRow, Math.max(0, selection.cellCol - 1));
          } else {
            selectCell(selection.cellRow, Math.min(maxCol, selection.cellCol + 1));
          }
          break;
        case 'Enter':
          e.preventDefault();
          startEditingCell(selection.cellRow, selection.cellCol);
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          setCellValue(selection.sectionId!, selection.blockId!, selection.cellRow, selection.cellCol, '');
          break;
        case 'F2':
          e.preventDefault();
          startEditingCell(selection.cellRow, selection.cellCol);
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            startEditingCell(selection.cellRow, selection.cellCol);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, editingCell, document, selectCell, startEditingCell, undo, redo, setCellValue]);
}
