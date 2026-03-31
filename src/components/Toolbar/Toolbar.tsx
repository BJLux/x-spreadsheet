import { useDocumentStore } from '../../store/document-store';
import { useState, useRef, useEffect } from 'react';

export function Toolbar() {
  const doc = useDocumentStore((s) => s.document);
  const zoom = useDocumentStore((s) => s.zoom);
  const setZoom = useDocumentStore((s) => s.setZoom);
  const toggleDocumentMap = useDocumentStore((s) => s.toggleDocumentMap);
  const toggleContextPanel = useDocumentStore((s) => s.toggleContextPanel);
  const documentMapOpen = useDocumentStore((s) => s.documentMapOpen);
  const contextPanelOpen = useDocumentStore((s) => s.contextPanelOpen);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const undoStack = useDocumentStore((s) => s.undoStack);
  const redoStack = useDocumentStore((s) => s.redoStack);
  const selection = useDocumentStore((s) => s.selection);
  const setSelectedCellsStyle = useDocumentStore((s) => s.setSelectedCellsStyle);
  const addBlock = useDocumentStore((s) => s.addBlock);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  const zoomOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="shell-toolbar">
      <div className="toolbar-title">{doc?.title || 'Untitled'}</div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 0 1 0 8H9" /><polyline points="7 6 3 10 7 14" /></svg>
        </button>
        <button className="toolbar-btn" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 0 0 0 8h5" /><polyline points="17 6 21 10 17 14" /></svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${selection.cellRow !== null ? '' : 'disabled'}`}
          onClick={() => setSelectedCellsStyle({ bold: true })}
          title="Bold"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setSelectedCellsStyle({ italic: true })}
          title="Italic"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setSelectedCellsStyle({ underline: true })}
          title="Underline"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => setSelectedCellsStyle({ align: 'left' })}
          title="Align Left"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setSelectedCellsStyle({ align: 'center' })}
          title="Align Center"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/></svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setSelectedCellsStyle({ align: 'right' })}
          title="Align Right"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/></svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group" style={{ position: 'relative' }} ref={addMenuRef}>
        <button
          className="toolbar-btn"
          style={{ width: 'auto', padding: '0 10px', gap: 4, display: 'flex', alignItems: 'center', fontSize: 12 }}
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          title="Insert Block"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Insert
        </button>
        {addMenuOpen && selection.sectionId && (
          <div className="add-block-menu" style={{ top: '100%', left: 0, marginTop: 4 }}>
            {([
              { type: 'table' as const, icon: '\u2637', label: 'Table' },
              { type: 'text' as const, icon: '\u2261', label: 'Text Block' },
              { type: 'divider' as const, icon: '\u2500', label: 'Divider' },
              { type: 'page-break' as const, icon: '\u23CE', label: 'Page Break' },
            ]).map(({ type, icon, label }) => (
              <button
                key={type}
                className="add-block-menu-item"
                onClick={() => {
                  addBlock(selection.sectionId!, type, selection.blockId || undefined);
                  setAddMenuOpen(false);
                }}
              >
                <span className="add-block-menu-item-icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${documentMapOpen ? 'active' : ''}`}
          onClick={toggleDocumentMap}
          title="Toggle Document Map"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
        </button>
        <button
          className={`toolbar-btn ${contextPanelOpen ? 'active' : ''}`}
          onClick={toggleContextPanel}
          title="Toggle Properties Panel"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="zoom-control">
        <button className="toolbar-btn" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} title="Zoom Out">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><path d="M19 13H5v-2h14v2z"/></svg>
        </button>
        <select
          className="toolbar-select"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ width: 72 }}
        >
          {zoomOptions.map(z => (
            <option key={z} value={z}>{Math.round(z * 100)}%</option>
          ))}
        </select>
        <button className="toolbar-btn" onClick={() => setZoom(Math.min(2, zoom + 0.25))} title="Zoom In">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
    </div>
  );
}
