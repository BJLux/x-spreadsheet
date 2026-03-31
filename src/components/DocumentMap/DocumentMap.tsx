import { useDocumentStore } from '../../store/document-store';

const BLOCK_ICONS: Record<string, string> = {
  table: '\u2637',
  text: '\u2261',
  image: '\u25A3',
  divider: '\u2500',
  'page-break': '\u23CE',
};

interface DocumentMapProps {
  collapsed: boolean;
}

export function DocumentMap({ collapsed }: DocumentMapProps) {
  const doc = useDocumentStore((s) => s.document);
  const selection = useDocumentStore((s) => s.selection);
  const selectBlock = useDocumentStore((s) => s.selectBlock);
  const addBlock = useDocumentStore((s) => s.addBlock);
  const addSection = useDocumentStore((s) => s.addSection);

  if (!doc) return null;

  return (
    <div className={`document-map ${collapsed ? 'collapsed' : ''}`}>
      <div className="document-map-header">
        <span>Document Map</span>
      </div>
      <div className="document-map-content">
        {doc.sections.map((section) => (
          <div key={section.id} className="document-map-section">
            <div
              className={`document-map-section-header ${selection.sectionId === section.id && !selection.blockId ? 'active' : ''}`}
              onClick={() => selectBlock(section.id, '')}
            >
              <span style={{ fontSize: 10, opacity: 0.5 }}>{'\u25BC'}</span>
              {section.title}
            </div>
            {section.blocks.map((block) => {
              const label = block.type === 'table'
                ? 'Table'
                : block.type === 'text'
                  ? (block.content?.[0]?.runs?.[0]?.text?.slice(0, 30) || 'Text Block')
                  : block.type === 'divider'
                    ? 'Divider'
                    : block.type === 'page-break'
                      ? 'Page Break'
                      : block.type;

              return (
                <div
                  key={block.id}
                  className={`document-map-block ${selection.blockId === block.id ? 'active' : ''}`}
                  onClick={() => selectBlock(section.id, block.id)}
                >
                  <span className="document-map-block-icon">{BLOCK_ICONS[block.type] || '?'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              );
            })}
            <button
              className="document-map-block"
              style={{ opacity: 0.5, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-family)', width: '100%' }}
              onClick={() => addBlock(section.id, 'text')}
            >
              <span className="document-map-block-icon">+</span>
              <span>Add Block</span>
            </button>
          </div>
        ))}
        <div style={{ padding: '8px 12px' }}>
          <button
            style={{
              width: '100%',
              padding: '6px 12px',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-family)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
            onClick={() => addSection('New Section')}
          >
            + Add Section
          </button>
        </div>
      </div>
    </div>
  );
}
