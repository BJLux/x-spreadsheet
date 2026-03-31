import type { BravaDocument, Section, Block, TextBlock, TableBlock } from '../../types/document';
import type { TableRow } from '../../types/table';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  MM_TO_PX,
  HEADER_FOOTER_HEIGHT_PX,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_ROW_HEIGHT,
} from './constants';

export interface PagePlan {
  pages: Page[];
}

export interface Page {
  pageIndex: number;
  sectionId: string;
  sectionTitle: string;
  pageNumberInSection: number;
  totalPagesInSection: number;
  width: number;
  height: number;
  margins: { top: number; right: number; bottom: number; left: number };
  fragments: BlockFragment[];
}

export interface BlockFragment {
  blockId: string;
  blockType: Block['type'];
  x: number;
  y: number;
  width: number;
  height: number;
  sourceBlock: Block;
  tableRowStart?: number;
  tableRowEnd?: number;
  isTableContinuation?: boolean;
  isTruncated?: boolean;
}

function getMarginsPx(section: Section) {
  return {
    top: Math.round(section.margins.top * MM_TO_PX),
    right: Math.round(section.margins.right * MM_TO_PX),
    bottom: Math.round(section.margins.bottom * MM_TO_PX),
    left: Math.round(section.margins.left * MM_TO_PX),
  };
}

function getContentArea(section: Section) {
  const m = getMarginsPx(section);
  const headerH = section.headerFooter.header.left || section.headerFooter.header.center || section.headerFooter.header.right ? HEADER_FOOTER_HEIGHT_PX : 0;
  const footerH = section.headerFooter.footer.left || section.headerFooter.footer.center || section.headerFooter.footer.right ? HEADER_FOOTER_HEIGHT_PX : 0;

  return {
    x: m.left,
    y: m.top + headerH,
    width: A4_WIDTH_PX - m.left - m.right,
    height: A4_HEIGHT_PX - m.top - m.bottom - headerH - footerH,
  };
}

function measureTextBlockHeight(block: TextBlock, contentWidth: number): number {
  let totalHeight = block.spacingBefore + block.spacingAfter;
  for (const para of block.content) {
    const fontSize = para.runs.length > 0 ? para.runs[0].fontSize : DEFAULT_FONT_SIZE;
    const lineHeight = fontSize * (para.lineSpacing || 1.5);
    let textLength = 0;
    for (const run of para.runs) {
      textLength += run.text.length;
    }
    const charsPerLine = Math.max(1, Math.floor(contentWidth / (fontSize * 0.6)));
    const lineCount = Math.max(1, Math.ceil(textLength / charsPerLine));
    totalHeight += lineCount * lineHeight + para.spacingBefore + para.spacingAfter;
  }
  return Math.max(24, totalHeight);
}

function getTableRowHeights(block: TableBlock): number[] {
  return block.table.rows.map((row: TableRow) => {
    if (row.hidden) return 0;
    return row.height || DEFAULT_ROW_HEIGHT;
  });
}

function measureTableBlockHeight(block: TableBlock): number {
  const rowHeights = getTableRowHeights(block);
  return rowHeights.reduce((sum, h) => sum + h, 0) + block.spacingBefore + block.spacingAfter;
}

function measureBlockHeight(block: Block, contentWidth: number): number {
  switch (block.type) {
    case 'table':
      return measureTableBlockHeight(block);
    case 'text':
      return measureTextBlockHeight(block, contentWidth);
    case 'image':
      return block.height + block.spacingBefore + block.spacingAfter;
    case 'divider':
      return block.thickness + block.spacingBefore + block.spacingAfter + 16;
    case 'page-break':
      return 0;
    default:
      return 0;
  }
}

export function computeLayout(document: BravaDocument): PagePlan {
  const pages: Page[] = [];

  for (const section of document.sections) {
    const content = getContentArea(section);
    const margins = getMarginsPx(section);
    let currentPage = createPage(pages.length, section, margins);
    let cursorY = content.y;
    const pageBottom = content.y + content.height;

    for (const block of section.blocks) {
      if (block.type === 'page-break' || block.pageBreakBefore) {
        pages.push(currentPage);
        currentPage = createPage(pages.length, section, margins);
        cursorY = content.y;
        if (block.type === 'page-break') continue;
      }

      if (block.type === 'table') {
        const rowHeights = getTableRowHeights(block);
        const headerRowCount = block.table.repeatHeaderRows;
        let headerHeight = 0;
        for (let i = 0; i < headerRowCount; i++) {
          headerHeight += rowHeights[i] || 0;
        }

        let rowStart = 0;
        let accHeight = block.spacingBefore;

        while (rowStart < rowHeights.length) {
          const spaceLeft = pageBottom - cursorY;
          let rowEnd = rowStart;
          let fragmentHeight = accHeight;

          while (rowEnd < rowHeights.length && fragmentHeight + rowHeights[rowEnd] <= spaceLeft) {
            fragmentHeight += rowHeights[rowEnd];
            rowEnd++;
          }

          if (rowEnd === rowStart) {
            if (cursorY > content.y) {
              pages.push(currentPage);
              currentPage = createPage(pages.length, section, margins);
              cursorY = content.y;
              accHeight = 0;
              continue;
            }
            fragmentHeight += rowHeights[rowEnd] || DEFAULT_ROW_HEIGHT;
            rowEnd++;
          }

          currentPage.fragments.push({
            blockId: block.id,
            blockType: 'table',
            x: content.x,
            y: cursorY,
            width: content.width,
            height: fragmentHeight + block.spacingAfter,
            sourceBlock: block,
            tableRowStart: rowStart,
            tableRowEnd: rowEnd,
            isTableContinuation: rowStart > 0,
            isTruncated: rowEnd < rowHeights.length,
          });

          cursorY += fragmentHeight + block.spacingAfter;

          if (rowEnd < rowHeights.length) {
            pages.push(currentPage);
            currentPage = createPage(pages.length, section, margins);
            cursorY = content.y;
            accHeight = headerHeight;
            rowStart = rowEnd;
          } else {
            rowStart = rowEnd;
            accHeight = 0;
          }
        }
        continue;
      }

      const blockHeight = measureBlockHeight(block, content.width);

      if (cursorY + blockHeight > pageBottom && cursorY > content.y) {
        pages.push(currentPage);
        currentPage = createPage(pages.length, section, margins);
        cursorY = content.y;
      }

      currentPage.fragments.push({
        blockId: block.id,
        blockType: block.type,
        x: content.x,
        y: cursorY,
        width: content.width,
        height: blockHeight,
        sourceBlock: block,
      });

      cursorY += blockHeight;
    }

    pages.push(currentPage);
  }

  assignPageNumbers(pages);
  return { pages };
}

function createPage(
  pageIndex: number,
  section: Section,
  margins: { top: number; right: number; bottom: number; left: number }
): Page {
  return {
    pageIndex,
    sectionId: section.id,
    sectionTitle: section.title,
    pageNumberInSection: 0,
    totalPagesInSection: 0,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    margins,
    fragments: [],
  };
}

function assignPageNumbers(pages: Page[]) {
  const sectionPages = new Map<string, Page[]>();
  for (const page of pages) {
    const arr = sectionPages.get(page.sectionId) || [];
    arr.push(page);
    sectionPages.set(page.sectionId, arr);
  }
  for (const [, sPages] of sectionPages) {
    for (let i = 0; i < sPages.length; i++) {
      sPages[i].pageNumberInSection = i + 1;
      sPages[i].totalPagesInSection = sPages.length;
    }
  }
}
