import type { TextBlock } from '../../types/document';
import type { BlockFragment } from '../layout/layout-engine';
import type { DrawContext } from './draw';
import { drawText, wrapText, drawLine } from './draw';
import { DEFAULT_FONT_FAMILY } from '../layout/constants';

const LIST_INDENT = 20;
const BULLET_CHARS = ['\u2022', '\u25E6', '\u25AA'];

export function renderTextBlock(
  dc: DrawContext,
  fragment: BlockFragment,
  block: TextBlock
) {
  let cursorY = fragment.y + (block.spacingBefore || 0);
  const contentWidth = fragment.width;

  for (const para of block.content) {
    cursorY += para.spacingBefore || 0;
    const fontSize = para.runs.length > 0 ? para.runs[0].fontSize : 11;
    const lineHeight = fontSize * (para.lineSpacing || 1.5);
    const indent = para.indentLeft + (para.listType !== 'none' ? LIST_INDENT * (para.listLevel + 1) : 0);

    if (para.listType === 'bullet') {
      const bulletChar = BULLET_CHARS[para.listLevel % BULLET_CHARS.length];
      drawText(dc, bulletChar, fragment.x + LIST_INDENT * para.listLevel + 8, cursorY + lineHeight / 2, {
        fontSize,
        fontFamily: DEFAULT_FONT_FAMILY,
        color: '#4a4a4a',
        align: 'center',
        baseline: 'middle',
      });
    } else if (para.listType === 'numbered') {
      drawText(dc, '1.', fragment.x + LIST_INDENT * para.listLevel + 8, cursorY + lineHeight / 2, {
        fontSize,
        fontFamily: DEFAULT_FONT_FAMILY,
        color: '#4a4a4a',
        align: 'right',
        baseline: 'middle',
      });
    }

    const availableWidth = contentWidth - indent;

    for (const run of para.runs) {
      const lines = wrapText(dc, run.text, availableWidth, {
        fontSize: run.fontSize || fontSize,
        fontFamily: run.fontFamily || DEFAULT_FONT_FAMILY,
        bold: run.bold,
        italic: run.italic,
      });

      for (const line of lines) {
        let textX = fragment.x + indent;
        if (para.alignment === 'center') textX = fragment.x + indent + availableWidth / 2;
        else if (para.alignment === 'right') textX = fragment.x + indent + availableWidth;

        drawText(dc, line, textX, cursorY + lineHeight / 2, {
          fontSize: run.fontSize || fontSize,
          fontFamily: run.fontFamily || DEFAULT_FONT_FAMILY,
          bold: run.bold,
          italic: run.italic,
          underline: run.underline,
          strikethrough: run.strikethrough,
          color: run.color || '#1a1a1a',
          align: para.alignment === 'justify' ? 'left' : para.alignment,
          baseline: 'middle',
        });

        cursorY += lineHeight;
      }
    }

    cursorY += para.spacingAfter || 0;
  }
}

export function renderDividerBlock(
  dc: DrawContext,
  fragment: BlockFragment,
  color: string,
  thickness: number,
  style: 'solid' | 'dashed' | 'dotted'
) {
  const y = fragment.y + fragment.height / 2;
  const dash = style === 'dashed' ? [6, 3] : style === 'dotted' ? [2, 2] : undefined;
  drawLine(dc, fragment.x, y, fragment.x + fragment.width, y, color, thickness, dash);
}
