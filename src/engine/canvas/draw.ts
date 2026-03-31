export interface DrawContext {
  ctx: CanvasRenderingContext2D;
  dpr: number;
}

export function createDrawContext(canvas: HTMLCanvasElement, width: number, height: number): DrawContext {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { ctx, dpr };
}

export function drawRect(
  dc: DrawContext,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: string,
  stroke?: string,
  lineWidth = 1
) {
  const { ctx } = dc;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

export function drawLine(
  dc: DrawContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1,
  dash?: number[]
) {
  const { ctx } = dc;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1 + 0.5, y1 + 0.5);
  ctx.lineTo(x2 + 0.5, y2 + 0.5);
  ctx.stroke();
  ctx.restore();
}

export interface TextOptions {
  font?: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  underline?: boolean;
  strikethrough?: boolean;
}

function buildFontString(opts: TextOptions): string {
  const style = opts.italic ? 'italic ' : '';
  const weight = opts.bold ? 'bold ' : '';
  const size = opts.fontSize || 11;
  const family = opts.fontFamily || 'Inter, sans-serif';
  return `${style}${weight}${size}px ${family}`;
}

export function drawText(
  dc: DrawContext,
  text: string,
  x: number,
  y: number,
  opts: TextOptions = {}
) {
  const { ctx } = dc;
  ctx.save();
  ctx.font = opts.font || buildFontString(opts);
  ctx.fillStyle = opts.color || '#1a1a1a';
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'middle';
  ctx.fillText(text, x, y, opts.maxWidth);

  if (opts.underline || opts.strikethrough) {
    const metrics = ctx.measureText(text);
    const textWidth = Math.min(metrics.width, opts.maxWidth || Infinity);
    let startX = x;
    if (opts.align === 'center') startX = x - textWidth / 2;
    else if (opts.align === 'right') startX = x - textWidth;

    ctx.strokeStyle = opts.color || '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();

    if (opts.underline) {
      const lineY = y + (opts.fontSize || 11) * 0.15;
      ctx.moveTo(startX, lineY);
      ctx.lineTo(startX + textWidth, lineY);
    }
    if (opts.strikethrough) {
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + textWidth, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export function measureText(dc: DrawContext, text: string, opts: TextOptions = {}): TextMetrics {
  const { ctx } = dc;
  ctx.save();
  ctx.font = opts.font || buildFontString(opts);
  const metrics = ctx.measureText(text);
  ctx.restore();
  return metrics;
}

export function wrapText(
  dc: DrawContext,
  text: string,
  maxWidth: number,
  opts: TextOptions = {}
): string[] {
  const { ctx } = dc;
  ctx.save();
  ctx.font = opts.font || buildFontString(opts);

  const words = text.split(/(\s+)/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  ctx.restore();
  return lines.length > 0 ? lines : [''];
}
