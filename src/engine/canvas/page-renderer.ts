import type { Page, BlockFragment } from '../layout/layout-engine';
import type { TableBlock, TextBlock, DividerBlock } from '../../types/document';
import type { DrawContext } from './draw';
import { createDrawContext, drawRect, drawText } from './draw';
import { renderTableBlock } from './table-renderer';
import { renderTextBlock, renderDividerBlock } from './text-renderer';
import { DEFAULT_FONT_FAMILY, HEADER_FOOTER_HEIGHT_PX } from '../layout/constants';

export interface RenderOptions {
  selectedBlockId: string | null;
  selectedCell: { row: number; col: number } | null;
  editingCell: { row: number; col: number } | null;
  hoveredBlockId: string | null;
  zoom: number;
}

export function renderPage(
  canvas: HTMLCanvasElement,
  page: Page,
  options: RenderOptions
): DrawContext {
  const dc = createDrawContext(canvas, page.width, page.height);

  drawRect(dc, 0, 0, page.width, page.height, '#ffffff');

  renderHeaderFooter(dc, page);

  for (const fragment of page.fragments) {
    renderFragment(dc, fragment, options);
  }

  return dc;
}

function renderHeaderFooter(dc: DrawContext, page: Page) {
  const headerY = page.margins.top;
  const footerY = page.height - page.margins.bottom - HEADER_FOOTER_HEIGHT_PX;
  const leftX = page.margins.left;
  const rightX = page.width - page.margins.right;
  const centerX = page.width / 2;

  const headerOpts = {
    fontSize: 9,
    fontFamily: DEFAULT_FONT_FAMILY,
    color: '#6b7280',
    baseline: 'middle' as const,
  };

  if (page.sectionTitle) {
    drawText(dc, page.sectionTitle, leftX, headerY + HEADER_FOOTER_HEIGHT_PX / 2, {
      ...headerOpts,
      align: 'left',
    });
  }

  const pageNum = `Page ${page.pageNumberInSection} of ${page.totalPagesInSection}`;
  drawText(dc, pageNum, rightX, footerY + HEADER_FOOTER_HEIGHT_PX / 2, {
    ...headerOpts,
    align: 'right',
  });

  drawText(dc, page.sectionTitle, centerX, footerY + HEADER_FOOTER_HEIGHT_PX / 2, {
    ...headerOpts,
    align: 'center',
  });
}

function renderFragment(
  dc: DrawContext,
  fragment: BlockFragment,
  options: RenderOptions
) {
  const isSelected = fragment.blockId === options.selectedBlockId;
  const isHovered = fragment.blockId === options.hoveredBlockId;

  switch (fragment.blockType) {
    case 'table':
      renderTableBlock(
        dc,
        fragment,
        fragment.sourceBlock as TableBlock,
        isSelected ? options.selectedCell : null,
        isSelected ? options.editingCell : null
      );
      break;

    case 'text':
      renderTextBlock(dc, fragment, fragment.sourceBlock as TextBlock);
      break;

    case 'divider': {
      const divider = fragment.sourceBlock as DividerBlock;
      renderDividerBlock(dc, fragment, divider.color, divider.thickness, divider.style);
      break;
    }

    case 'image':
      drawRect(dc, fragment.x, fragment.y, fragment.width, fragment.height, '#f3f4f6', '#d1d5db');
      drawText(dc, '[Image]', fragment.x + fragment.width / 2, fragment.y + fragment.height / 2, {
        fontSize: 12,
        color: '#9ca3af',
        align: 'center',
        baseline: 'middle',
      });
      break;
  }

  if (isSelected && fragment.blockType !== 'table') {
    drawRect(dc, fragment.x - 2, fragment.y - 2, fragment.width + 4, fragment.height + 4, undefined, '#1a73e8', 2);
  } else if (isHovered && !isSelected) {
    drawRect(dc, fragment.x - 1, fragment.y - 1, fragment.width + 2, fragment.height + 2, undefined, '#bfdbfe', 1);
  }
}
