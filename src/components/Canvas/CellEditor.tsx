import { useRef, useEffect, useState, useCallback } from 'react';
import { useDocumentStore } from '../../store/document-store';

interface CellEditorProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CellEditor({ x, y, width, height }: CellEditorProps) {
  const selection = useDocumentStore((s) => s.selection);
  const document = useDocumentStore((s) => s.document);
  const setCellValue = useDocumentStore((s) => s.setCellValue);
  const stopEditingCell = useDocumentStore((s) => s.stopEditingCell);
  const selectCell = useDocumentStore((s) => s.selectCell);
  const editingCell = useDocumentStore((s) => s.editingCell);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!document || !selection.sectionId || !selection.blockId || !editingCell) return;

    const section = document.sections.find(s => s.id === selection.sectionId);
    if (!section) return;
    const block = section.blocks.find(b => b.id === selection.blockId);
    if (!block || block.type !== 'table') return;

    const cell = block.table.rows[editingCell.row]?.cells[editingCell.col];
    if (cell) {
      setValue(cell.formula || cell.value || '');
    }

    setTimeout(() => inputRef.current?.focus(), 0);
  }, [document, selection, editingCell]);

  const commit = useCallback(() => {
    if (!selection.sectionId || !selection.blockId || !editingCell) return;
    setCellValue(selection.sectionId, selection.blockId, editingCell.row, editingCell.col, value);
    stopEditingCell();
  }, [selection, editingCell, value, setCellValue, stopEditingCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
      if (editingCell) {
        selectCell(editingCell.row + 1, editingCell.col);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      if (editingCell) {
        selectCell(editingCell.row, editingCell.col + (e.shiftKey ? -1 : 1));
      }
    } else if (e.key === 'Escape') {
      stopEditingCell();
    }
  }, [commit, editingCell, selectCell, stopEditingCell]);

  return (
    <div
      className="cell-editor-overlay"
      style={{
        left: x,
        top: y,
        width: Math.max(width, 80),
        height: Math.max(height, 28),
      }}
    >
      <textarea
        ref={inputRef}
        className="cell-editor-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        style={{
          width: '100%',
          height: '100%',
          minHeight: height,
        }}
      />
    </div>
  );
}
