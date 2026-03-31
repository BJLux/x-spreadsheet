import { useRef, useState, useEffect, type MutableRefObject } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FloatingToolbarProps {
  x: number;
  y: number;
  spreadsheetRef: MutableRefObject<any>;
}

type ToolbarAction =
  | 'bold' | 'italic' | 'underline' | 'strike'
  | 'align-left' | 'align-center' | 'align-right'
  | 'valign-top' | 'valign-middle' | 'valign-bottom'
  | 'textwrap'
  | 'merge';

function ToolbarButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`ft-btn ${active ? 'ft-btn-active' : ''}`}
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="ft-separator" />;
}

export function FloatingToolbar({ x, y, spreadsheetRef }: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const triggerAction = (action: ToolbarAction) => {
    const xs = spreadsheetRef.current;
    if (!xs) return;

    const sheet = (xs as unknown as { sheet: { toolbar?: { change?: (type: string, val: unknown) => void } } }).sheet;
    if (sheet?.toolbar?.change) {
      switch (action) {
        case 'bold':
          sheet.toolbar.change('font-bold', undefined);
          break;
        case 'italic':
          sheet.toolbar.change('font-italic', undefined);
          break;
        case 'underline':
          sheet.toolbar.change('underline', undefined);
          break;
        case 'strike':
          sheet.toolbar.change('strike', undefined);
          break;
        case 'align-left':
          sheet.toolbar.change('align', 'left');
          break;
        case 'align-center':
          sheet.toolbar.change('align', 'center');
          break;
        case 'align-right':
          sheet.toolbar.change('align', 'right');
          break;
        case 'valign-top':
          sheet.toolbar.change('valign', 'top');
          break;
        case 'valign-middle':
          sheet.toolbar.change('valign', 'middle');
          break;
        case 'valign-bottom':
          sheet.toolbar.change('valign', 'bottom');
          break;
        case 'textwrap':
          sheet.toolbar.change('textwrap', undefined);
          break;
        case 'merge':
          sheet.toolbar.change('merge', undefined);
          break;
      }
    }
  };

  const constrainedY = Math.max(0, y);

  return (
    <div
      ref={toolbarRef}
      className={`floating-toolbar ${visible ? 'floating-toolbar-visible' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: constrainedY,
        zIndex: 70,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ToolbarButton title="Bold (Ctrl+B)" onClick={() => triggerAction('bold')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Italic (Ctrl+I)" onClick={() => triggerAction('italic')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Underline (Ctrl+U)" onClick={() => triggerAction('underline')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" onClick={() => triggerAction('strike')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton title="Align Left" onClick={() => triggerAction('align-left')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Align Center" onClick={() => triggerAction('align-center')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Align Right" onClick={() => triggerAction('align-right')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
        </svg>
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton title="Text Wrap" onClick={() => triggerAction('textwrap')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3 3 3v-2h2c2.21 0 4-1.79 4-4s-1.79-4-4-4z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton title="Merge Cells" onClick={() => triggerAction('merge')}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
          <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" />
        </svg>
      </ToolbarButton>
    </div>
  );
}
