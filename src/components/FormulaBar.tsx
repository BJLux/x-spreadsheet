import { useDocumentStore } from '../store/document-store';
import { useCallback, useState, useEffect } from 'react';
import type { TableBlock } from '../types/document';

function indexToColumn(index: number): string {
  let result = '';
  let n = index + 1;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

export function FormulaBar() {
  const doc = useDocumentStore((s) => s.document);
  const selection = useDocumentStore((s) => s.selection);
  const setCellValue = useDocumentStore((s) => s.setCellValue);
  const [value, setValue] = useState('');
  const [cellRef, setCellRef] = useState('');

  useEffect(() => {
    if (!doc || !selection.sectionId || !selection.blockId || selection.cellRow === null || selection.cellCol === null) {
      setValue('');
      setCellRef('');
      return;
    }

    const section = doc.sections.find(s => s.id === selection.sectionId);
    if (!section) return;
    const block = section.blocks.find(b => b.id === selection.blockId);
    if (!block || block.type !== 'table') {
      setValue('');
      setCellRef('');
      return;
    }

    const cell = (block as TableBlock).table.rows[selection.cellRow]?.cells[selection.cellCol];
    if (cell) {
      setValue(cell.formula || cell.value || '');
      setCellRef(`${indexToColumn(selection.cellCol)}${selection.cellRow + 1}`);
    }
  }, [doc, selection]);

  const handleSubmit = useCallback(() => {
    if (!selection.sectionId || !selection.blockId || selection.cellRow === null || selection.cellCol === null) return;
    setCellValue(selection.sectionId, selection.blockId, selection.cellRow, selection.cellCol, value);
  }, [selection, value, setCellValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="formula-bar">
      <div className="formula-bar-label" style={{ fontFamily: 'monospace', minWidth: 48 }}>
        {cellRef || '--'}
      </div>
      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', marginRight: 4 }}>
        fx
      </span>
      <input
        className="formula-bar-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={selection.cellRow !== null ? 'Enter value or formula (e.g. =SUM(A1:A10))' : 'Select a cell'}
        readOnly={selection.cellRow === null}
      />
    </div>
  );
}
