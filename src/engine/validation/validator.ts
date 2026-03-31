import type { BravaDocument, TableBlock } from '../../types/document';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationResult {
  id: string;
  severity: ValidationSeverity;
  message: string;
  sectionId: string;
  blockId: string;
  cellRef?: string;
  row?: number;
  col?: number;
}

export function validateDocument(doc: BravaDocument): ValidationResult[] {
  const results: ValidationResult[] = [];
  let resultId = 0;

  for (const section of doc.sections) {
    if (section.blocks.length === 0) {
      results.push({
        id: `v-${++resultId}`,
        severity: 'warning',
        message: `Section "${section.title}" has no content blocks`,
        sectionId: section.id,
        blockId: '',
      });
    }

    for (const block of section.blocks) {
      if (block.type === 'table') {
        const tableBlock = block as TableBlock;
        const { table } = tableBlock;

        if (table.rows.length === 0) {
          results.push({
            id: `v-${++resultId}`,
            severity: 'warning',
            message: 'Table has no rows',
            sectionId: section.id,
            blockId: block.id,
          });
        }

        for (let ri = 0; ri < table.rows.length; ri++) {
          const row = table.rows[ri];
          for (let ci = 0; ci < row.cells.length; ci++) {
            const cell = row.cells[ci];

            if (cell.formula && (cell.computedValue === '#ERROR!' || cell.computedValue === '#REF!' || cell.computedValue === '#DIV/0!' || cell.computedValue === '#NAME?')) {
              results.push({
                id: `v-${++resultId}`,
                severity: 'error',
                message: `Formula error ${cell.computedValue} in cell ${String.fromCharCode(65 + ci)}${ri + 1}`,
                sectionId: section.id,
                blockId: block.id,
                cellRef: `${String.fromCharCode(65 + ci)}${ri + 1}`,
                row: ri,
                col: ci,
              });
            }

            if (cell.binding && !cell.binding.overridden && (!cell.value || cell.value === '0')) {
              results.push({
                id: `v-${++resultId}`,
                severity: 'info',
                message: `Bound cell ${String.fromCharCode(65 + ci)}${ri + 1} has zero/empty value`,
                sectionId: section.id,
                blockId: block.id,
                cellRef: `${String.fromCharCode(65 + ci)}${ri + 1}`,
                row: ri,
                col: ci,
              });
            }
          }
        }
      }

      if (block.type === 'text') {
        const hasContent = block.content.some(p => p.runs.some(r => r.text.trim().length > 0));
        if (!hasContent) {
          results.push({
            id: `v-${++resultId}`,
            severity: 'info',
            message: 'Text block is empty',
            sectionId: section.id,
            blockId: block.id,
          });
        }
      }
    }
  }

  return results;
}
