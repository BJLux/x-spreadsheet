import type { TableData } from './table';

export type BlockType = 'table' | 'text' | 'image' | 'divider' | 'page-break';

export type NumberingStyle = 'arabic' | 'roman' | 'roman-upper' | 'none';

export type PageOrientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface HeaderFooterZone {
  left: string;
  center: string;
  right: string;
}

export interface SectionHeaderFooter {
  header: HeaderFooterZone;
  footer: HeaderFooterZone;
  showOnFirstPage: boolean;
}

export interface BravaDocument {
  id: string;
  title: string;
  entityId: string;
  financialYear: string;
  currency: string;
  language: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  title: string;
  collapsed: boolean;
  orientation: PageOrientation;
  margins: PageMargins;
  numberingStyle: NumberingStyle;
  numberingStart: number;
  headerFooter: SectionHeaderFooter;
  blocks: Block[];
}

export type Block = TableBlock | TextBlock | ImageBlock | DividerBlock | PageBreakBlock;

export interface BaseBlock {
  id: string;
  type: BlockType;
  pageBreakBefore: boolean;
  keepWithNext: boolean;
  spacingBefore: number;
  spacingAfter: number;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  table: TableData;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: RichTextParagraph[];
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
  color: string;
}

export interface PageBreakBlock extends BaseBlock {
  type: 'page-break';
}

export interface RichTextParagraph {
  id: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineSpacing: number;
  spacingBefore: number;
  spacingAfter: number;
  indentLeft: number;
  listType: 'none' | 'bullet' | 'numbered';
  listLevel: number;
  runs: RichTextRun[];
}

export interface RichTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  superscript: boolean;
  subscript: boolean;
}
