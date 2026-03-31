export const MM_TO_PX = 96 / 25.4;

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
export const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);

export const DEFAULT_MARGINS: { top: number; right: number; bottom: number; left: number } = {
  top: 25,
  right: 20,
  bottom: 25,
  left: 20,
};

export const DEFAULT_MARGINS_PX = {
  top: Math.round(DEFAULT_MARGINS.top * MM_TO_PX),
  right: Math.round(DEFAULT_MARGINS.right * MM_TO_PX),
  bottom: Math.round(DEFAULT_MARGINS.bottom * MM_TO_PX),
  left: Math.round(DEFAULT_MARGINS.left * MM_TO_PX),
};

export const HEADER_FOOTER_HEIGHT_PX = Math.round(15 * MM_TO_PX);

export const PAGE_GAP_PX = 24;

export const MIN_ROW_HEIGHT = 24;
export const DEFAULT_ROW_HEIGHT = 28;
export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_FONT_SIZE = 11;
export const DEFAULT_FONT_FAMILY = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
