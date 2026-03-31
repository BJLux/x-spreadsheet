import { useDocumentStore } from '../../store/document-store';
import type { TableBlock } from '../../types/document';

interface ContextPanelProps {
  collapsed: boolean;
}

export function ContextPanel({ collapsed }: ContextPanelProps) {
  const doc = useDocumentStore((s) => s.document);
  const selection = useDocumentStore((s) => s.selection);
  const setSelectedCellsStyle = useDocumentStore((s) => s.setSelectedCellsStyle);
  const addBlock = useDocumentStore((s) => s.addBlock);
  const removeBlock = useDocumentStore((s) => s.removeBlock);
  const addTableRow = useDocumentStore((s) => s.addTableRow);
  const addTableCol = useDocumentStore((s) => s.addTableCol);

  if (!doc) return null;

  const section = doc.sections.find(s => s.id === selection.sectionId);
  const block = section?.blocks.find(b => b.id === selection.blockId);

  const hasTableCell = block?.type === 'table' && selection.cellRow !== null && selection.cellCol !== null;
  const cell = hasTableCell
    ? (block as TableBlock).table.rows[selection.cellRow!]?.cells[selection.cellCol!]
    : null;

  return (
    <div className={`context-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="context-panel-header">
        <span>Properties</span>
      </div>
      <div className="context-panel-content">
        {!selection.blockId && !section && (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            <div className="empty-state-text">Select a block or cell to view properties</div>
          </div>
        )}

        {section && !block && (
          <div>
            <div className="context-section">
              <div className="context-section-title">Section</div>
              <div className="context-field">
                <div className="context-field-label">Title</div>
                <div className="context-field-value">{section.title}</div>
              </div>
              <div className="context-field">
                <div className="context-field-label">Orientation</div>
                <div className="context-field-value">{section.orientation}</div>
              </div>
              <div className="context-field">
                <div className="context-field-label">Page Numbering</div>
                <div className="context-field-value">{section.numberingStyle}</div>
              </div>
            </div>
            <div className="context-section">
              <div className="context-section-title">Add Block</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(['table', 'text', 'divider', 'page-break'] as const).map((type) => (
                  <button
                    key={type}
                    className="add-block-menu-item"
                    onClick={() => addBlock(section.id, type)}
                  >
                    <span className="add-block-menu-item-icon">
                      {type === 'table' ? '\u2637' : type === 'text' ? '\u2261' : type === 'divider' ? '\u2500' : '\u23CE'}
                    </span>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {block && block.type === 'table' && (
          <div>
            <div className="context-section">
              <div className="context-section-title">Table</div>
              <div className="context-field">
                <div className="context-field-label">Rows</div>
                <div className="context-field-value">{(block as TableBlock).table.rows.length}</div>
              </div>
              <div className="context-field">
                <div className="context-field-label">Columns</div>
                <div className="context-field-value">{(block as TableBlock).table.cols.length}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button
                  className="toolbar-btn"
                  style={{ width: 'auto', padding: '0 8px', fontSize: 11 }}
                  onClick={() => selection.sectionId && addTableRow(selection.sectionId, block.id, (block as TableBlock).table.rows.length - 1)}
                  title="Add Row"
                >
                  + Row
                </button>
                <button
                  className="toolbar-btn"
                  style={{ width: 'auto', padding: '0 8px', fontSize: 11 }}
                  onClick={() => selection.sectionId && addTableCol(selection.sectionId, block.id, (block as TableBlock).table.cols.length - 1)}
                  title="Add Column"
                >
                  + Col
                </button>
              </div>
            </div>

            {cell && (
              <div className="context-section">
                <div className="context-section-title">Cell ({String.fromCharCode(65 + (selection.cellCol || 0))}{(selection.cellRow || 0) + 1})</div>
                <div className="context-field">
                  <div className="context-field-label">Value</div>
                  <div className="context-field-value">{cell.formula || cell.value || '(empty)'}</div>
                </div>
                {cell.formula && (
                  <div className="context-field">
                    <div className="context-field-label">Computed</div>
                    <div className="context-field-value">{cell.computedValue}</div>
                  </div>
                )}
                <div className="context-field">
                  <div className="context-field-label">Format</div>
                  <select
                    className="toolbar-select"
                    style={{ width: '100%' }}
                    value={cell.style.numberFormat || ''}
                    onChange={(e) => setSelectedCellsStyle({ numberFormat: e.target.value })}
                  >
                    <option value="">General</option>
                    <option value="#,##0">#,##0</option>
                    <option value="#,##0.00">#,##0.00</option>
                    <option value="0.00%">Percentage</option>
                    <option value="#,##0.00 €">Currency (EUR)</option>
                  </select>
                </div>
                <div className="context-field">
                  <div className="context-field-label">Alignment</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        className={`toolbar-btn ${cell.style.align === align ? 'active' : ''}`}
                        onClick={() => setSelectedCellsStyle({ align })}
                      >
                        {align === 'left' ? '\u2190' : align === 'center' ? '\u2194' : '\u2192'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="context-field">
                  <div className="context-field-label">Style</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      className={`toolbar-btn ${cell.style.bold ? 'active' : ''}`}
                      onClick={() => setSelectedCellsStyle({ bold: !cell.style.bold })}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      className={`toolbar-btn ${cell.style.italic ? 'active' : ''}`}
                      onClick={() => setSelectedCellsStyle({ italic: !cell.style.italic })}
                      title="Italic"
                    >
                      <em>I</em>
                    </button>
                    <button
                      className={`toolbar-btn ${cell.style.underline ? 'active' : ''}`}
                      onClick={() => setSelectedCellsStyle({ underline: !cell.style.underline })}
                      title="Underline"
                    >
                      <u>U</u>
                    </button>
                  </div>
                </div>
                {cell.binding && (
                  <div className="context-field">
                    <div className="context-field-label">Data Binding</div>
                    <div className="context-field-value" style={{ color: 'var(--color-accent)' }}>
                      {cell.binding.source}: {cell.binding.field}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selection.sectionId && (
              <div className="context-section" style={{ marginTop: 16 }}>
                <button
                  className="toolbar-btn"
                  style={{ width: '100%', color: 'var(--color-error)', fontSize: 11, padding: '6px 0' }}
                  onClick={() => removeBlock(selection.sectionId!, block.id)}
                >
                  Remove Table
                </button>
              </div>
            )}
          </div>
        )}

        {block && block.type === 'text' && (
          <div>
            <div className="context-section">
              <div className="context-section-title">Text Block</div>
              <div className="context-field">
                <div className="context-field-label">Paragraphs</div>
                <div className="context-field-value">{block.content.length}</div>
              </div>
            </div>
            {selection.sectionId && (
              <div className="context-section" style={{ marginTop: 16 }}>
                <button
                  className="toolbar-btn"
                  style={{ width: '100%', color: 'var(--color-error)', fontSize: 11, padding: '6px 0' }}
                  onClick={() => removeBlock(selection.sectionId!, block.id)}
                >
                  Remove Text Block
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
