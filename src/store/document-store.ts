import { create } from 'zustand';
import type { BravaDocument, Section, Block, TableBlock } from '../types/document';
import type { CellStyle, TableCell, TableData } from '../types/table';
import { computeLayout, type PagePlan } from '../engine/layout/layout-engine';
import type { BravaMetaSideChannel } from '../engine/bridge/table-bridge';

interface EditorSelection {
  blockId: string | null;
  sectionId: string | null;
  cellRow: number | null;
  cellCol: number | null;
}

interface ActiveTableEditor {
  sectionId: string;
  blockId: string;
  meta: BravaMetaSideChannel;
}

interface DocumentState {
  document: BravaDocument | null;
  pagePlan: PagePlan | null;
  selection: EditorSelection;
  editingCell: { row: number; col: number } | null;
  hoveredBlockId: string | null;
  zoom: number;
  contextPanelOpen: boolean;
  documentMapOpen: boolean;
  undoStack: string[];
  redoStack: string[];
  activeTableEditor: ActiveTableEditor | null;

  loadDocument: (doc: BravaDocument) => void;
  recomputeLayout: () => void;

  selectBlock: (sectionId: string, blockId: string) => void;
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;
  startEditingCell: (row: number, col: number) => void;
  stopEditingCell: () => void;
  setHoveredBlock: (blockId: string | null) => void;

  setActiveTableEditor: (editor: ActiveTableEditor | null) => void;
  commitTableData: (sectionId: string, blockId: string, tableData: TableData) => void;

  setCellValue: (sectionId: string, blockId: string, row: number, col: number, value: string) => void;
  setCellStyle: (sectionId: string, blockId: string, row: number, col: number, style: Partial<CellStyle>) => void;
  setSelectedCellsStyle: (style: Partial<CellStyle>) => void;

  addSection: (title: string) => void;
  removeSection: (sectionId: string) => void;
  addBlock: (sectionId: string, type: Block['type'], afterBlockId?: string) => void;
  removeBlock: (sectionId: string, blockId: string) => void;
  moveBlock: (sectionId: string, blockId: string, direction: 'up' | 'down') => void;

  addTableRow: (sectionId: string, blockId: string, afterRow: number) => void;
  addTableCol: (sectionId: string, blockId: string, afterCol: number) => void;
  removeTableRow: (sectionId: string, blockId: string, rowIndex: number) => void;
  removeTableCol: (sectionId: string, blockId: string, colIndex: number) => void;

  setZoom: (zoom: number) => void;
  toggleContextPanel: () => void;
  toggleDocumentMap: () => void;

  undo: () => void;
  redo: () => void;
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11);
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

function createDefaultCell(): TableCell {
  return {
    id: generateId(),
    value: '',
    formula: '',
    computedValue: '',
    style: createDefaultCellStyle(),
    merge: null,
    binding: null,
    locked: false,
  };
}

function findBlockInDocument(doc: BravaDocument, sectionId: string, blockId: string): { section: Section; block: Block; blockIndex: number } | null {
  const section = doc.sections.find(s => s.id === sectionId);
  if (!section) return null;
  const blockIndex = section.blocks.findIndex(b => b.id === blockId);
  if (blockIndex === -1) return null;
  return { section, block: section.blocks[blockIndex], blockIndex };
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  pagePlan: null,
  selection: { blockId: null, sectionId: null, cellRow: null, cellCol: null },
  editingCell: null,
  hoveredBlockId: null,
  zoom: 1,
  contextPanelOpen: true,
  documentMapOpen: true,
  undoStack: [],
  redoStack: [],
  activeTableEditor: null,

  loadDocument: (doc) => {
    const pagePlan = computeLayout(doc);
    set({ document: doc, pagePlan, undoStack: [], redoStack: [] });
  },

  recomputeLayout: () => {
    const { document: doc } = get();
    if (!doc) return;
    const pagePlan = computeLayout(doc);
    set({ pagePlan });
  },

  selectBlock: (sectionId, blockId) => {
    set({
      selection: { sectionId, blockId, cellRow: null, cellCol: null },
      editingCell: null,
    });
  },

  selectCell: (row, col) => {
    const { selection } = get();
    set({
      selection: { ...selection, cellRow: row, cellCol: col },
      editingCell: null,
    });
  },

  clearSelection: () => {
    set({
      selection: { blockId: null, sectionId: null, cellRow: null, cellCol: null },
      editingCell: null,
    });
  },

  startEditingCell: (row, col) => {
    set({ editingCell: { row, col } });
  },

  stopEditingCell: () => {
    set({ editingCell: null });
  },

  setHoveredBlock: (blockId) => {
    set({ hoveredBlockId: blockId });
  },

  setActiveTableEditor: (editor) => {
    set({ activeTableEditor: editor });
  },

  commitTableData: (sectionId, blockId, tableData) => {
    const { document: doc } = get();
    if (!doc) return;

    const snapshot = JSON.stringify(doc);

    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;

    const tableBlock = result.block as TableBlock;
    tableBlock.table = tableData;

    const pagePlan = computeLayout(doc);

    set((state) => ({
      document: { ...doc },
      pagePlan,
      undoStack: [...state.undoStack.slice(-49), snapshot],
      redoStack: [],
    }));
  },

  setCellValue: (sectionId, blockId, row, col, value) => {
    const { document: doc } = get();
    if (!doc) return;

    const snapshot = JSON.stringify(doc);

    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;

    const tableBlock = result.block as TableBlock;
    const tableRow = tableBlock.table.rows[row];
    if (!tableRow) return;

    while (tableRow.cells.length <= col) {
      tableRow.cells.push(createDefaultCell());
    }

    const cell = tableRow.cells[col];
    if (value.startsWith('=')) {
      cell.formula = value;
      cell.value = '';
      cell.computedValue = '';
    } else {
      cell.formula = '';
      cell.value = value;
      cell.computedValue = value;
    }

    const pagePlan = computeLayout(doc);

    set((state) => ({
      document: { ...doc },
      pagePlan,
      undoStack: [...state.undoStack.slice(-49), snapshot],
      redoStack: [],
    }));
  },

  setCellStyle: (sectionId, blockId, row, col, style) => {
    const { document: doc } = get();
    if (!doc) return;

    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;

    const tableBlock = result.block as TableBlock;
    const tableRow = tableBlock.table.rows[row];
    if (!tableRow || !tableRow.cells[col]) return;

    tableRow.cells[col].style = { ...tableRow.cells[col].style, ...style };

    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  setSelectedCellsStyle: (style) => {
    const { selection, document: doc } = get();
    if (!doc || !selection.sectionId || !selection.blockId || selection.cellRow === null || selection.cellCol === null) return;

    const result = findBlockInDocument(doc, selection.sectionId, selection.blockId);
    if (!result || result.block.type !== 'table') return;

    const tableBlock = result.block as TableBlock;
    const cell = tableBlock.table.rows[selection.cellRow]?.cells[selection.cellCol];
    if (!cell) return;

    cell.style = { ...cell.style, ...style };
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  addSection: (title) => {
    const { document: doc } = get();
    if (!doc) return;

    const newSection: Section = {
      id: generateId(),
      title,
      collapsed: false,
      orientation: 'portrait',
      margins: { top: 25, right: 20, bottom: 25, left: 20 },
      numberingStyle: 'arabic',
      numberingStart: 1,
      headerFooter: {
        header: { left: '', center: '', right: '' },
        footer: { left: '', center: '', right: '' },
        showOnFirstPage: true,
      },
      blocks: [],
    };

    doc.sections.push(newSection);
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  removeSection: (sectionId) => {
    const { document: doc } = get();
    if (!doc) return;
    doc.sections = doc.sections.filter(s => s.id !== sectionId);
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  addBlock: (sectionId, type, afterBlockId) => {
    const { document: doc } = get();
    if (!doc) return;

    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;

    const baseBlock = {
      id: generateId(),
      pageBreakBefore: false,
      keepWithNext: false,
      spacingBefore: 8,
      spacingAfter: 8,
    };

    let newBlock: Block;

    switch (type) {
      case 'table': {
        const cols = Array.from({ length: 6 }, () => ({ id: generateId(), width: 100, hidden: false }));
        const rows = Array.from({ length: 8 }, (_, ri) => ({
          id: generateId(),
          height: 28,
          hidden: false,
          isHeader: ri === 0,
          cells: Array.from({ length: 6 }, () => createDefaultCell()),
        }));
        newBlock = {
          ...baseBlock,
          type: 'table',
          table: {
            id: generateId(),
            rows,
            cols,
            merges: [],
            repeatHeaderRows: 1,
            showBanding: true,
            bandingColor: '#f8fafc',
          },
        };
        break;
      }
      case 'text':
        newBlock = {
          ...baseBlock,
          type: 'text',
          content: [{
            id: generateId(),
            alignment: 'left',
            lineSpacing: 1.5,
            spacingBefore: 0,
            spacingAfter: 4,
            indentLeft: 0,
            listType: 'none',
            listLevel: 0,
            runs: [{
              text: '',
              bold: false,
              italic: false,
              underline: false,
              strikethrough: false,
              fontSize: 11,
              fontFamily: '',
              color: '#1a1a1a',
              superscript: false,
              subscript: false,
            }],
          }],
        };
        break;
      case 'divider':
        newBlock = { ...baseBlock, type: 'divider', style: 'solid', thickness: 1, color: '#d1d5db' };
        break;
      case 'page-break':
        newBlock = { ...baseBlock, type: 'page-break' };
        break;
      default:
        return;
    }

    if (afterBlockId) {
      const idx = section.blocks.findIndex(b => b.id === afterBlockId);
      section.blocks.splice(idx + 1, 0, newBlock);
    } else {
      section.blocks.push(newBlock);
    }

    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  removeBlock: (sectionId, blockId) => {
    const { document: doc } = get();
    if (!doc) return;
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;
    section.blocks = section.blocks.filter(b => b.id !== blockId);
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  moveBlock: (sectionId, blockId, direction) => {
    const { document: doc } = get();
    if (!doc) return;
    const section = doc.sections.find(s => s.id === sectionId);
    if (!section) return;
    const idx = section.blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= section.blocks.length) return;
    [section.blocks[idx], section.blocks[newIdx]] = [section.blocks[newIdx], section.blocks[idx]];
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  addTableRow: (sectionId, blockId, afterRow) => {
    const { document: doc } = get();
    if (!doc) return;
    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;
    const tableBlock = result.block as TableBlock;
    const colCount = tableBlock.table.cols.length;
    const newRow = {
      id: generateId(),
      height: 28,
      hidden: false,
      isHeader: false,
      cells: Array.from({ length: colCount }, () => createDefaultCell()),
    };
    tableBlock.table.rows.splice(afterRow + 1, 0, newRow);
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  addTableCol: (sectionId, blockId, afterCol) => {
    const { document: doc } = get();
    if (!doc) return;
    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;
    const tableBlock = result.block as TableBlock;
    tableBlock.table.cols.splice(afterCol + 1, 0, { id: generateId(), width: 100, hidden: false });
    for (const row of tableBlock.table.rows) {
      row.cells.splice(afterCol + 1, 0, createDefaultCell());
    }
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  removeTableRow: (sectionId, blockId, rowIndex) => {
    const { document: doc } = get();
    if (!doc) return;
    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;
    const tableBlock = result.block as TableBlock;
    if (tableBlock.table.rows.length <= 1) return;
    tableBlock.table.rows.splice(rowIndex, 1);
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  removeTableCol: (sectionId, blockId, colIndex) => {
    const { document: doc } = get();
    if (!doc) return;
    const result = findBlockInDocument(doc, sectionId, blockId);
    if (!result || result.block.type !== 'table') return;
    const tableBlock = result.block as TableBlock;
    if (tableBlock.table.cols.length <= 1) return;
    tableBlock.table.cols.splice(colIndex, 1);
    for (const row of tableBlock.table.rows) {
      row.cells.splice(colIndex, 1);
    }
    const pagePlan = computeLayout(doc);
    set({ document: { ...doc }, pagePlan });
  },

  setZoom: (zoom) => set({ zoom }),

  toggleContextPanel: () => set((s) => ({ contextPanelOpen: !s.contextPanelOpen })),

  toggleDocumentMap: () => set((s) => ({ documentMapOpen: !s.documentMapOpen })),

  undo: () => {
    const { undoStack, document: doc } = get();
    if (undoStack.length === 0 || !doc) return;

    const currentSnapshot = JSON.stringify(doc);
    const previousSnapshot = undoStack[undoStack.length - 1];
    const previousDoc = JSON.parse(previousSnapshot) as BravaDocument;
    const pagePlan = computeLayout(previousDoc);

    set((state) => ({
      document: previousDoc,
      pagePlan,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentSnapshot],
    }));
  },

  redo: () => {
    const { redoStack, document: doc } = get();
    if (redoStack.length === 0 || !doc) return;

    const currentSnapshot = JSON.stringify(doc);
    const nextSnapshot = redoStack[redoStack.length - 1];
    const nextDoc = JSON.parse(nextSnapshot) as BravaDocument;
    const pagePlan = computeLayout(nextDoc);

    set((state) => ({
      document: nextDoc,
      pagePlan,
      undoStack: [...state.undoStack, currentSnapshot],
      redoStack: state.redoStack.slice(0, -1),
    }));
  },
}));
