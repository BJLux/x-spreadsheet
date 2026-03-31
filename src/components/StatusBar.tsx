import { useDocumentStore } from '../store/document-store';

export function StatusBar() {
  const doc = useDocumentStore((s) => s.document);
  const pagePlan = useDocumentStore((s) => s.pagePlan);
  const selection = useDocumentStore((s) => s.selection);
  const zoom = useDocumentStore((s) => s.zoom);

  const sectionCount = doc?.sections.length || 0;
  const pageCount = pagePlan?.pages.length || 0;

  let blockCount = 0;
  if (doc) {
    for (const s of doc.sections) {
      blockCount += s.blocks.length;
    }
  }

  return (
    <div className="status-bar">
      <div className="status-bar-item">
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </div>
      <div className="status-bar-item">
        {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
      </div>
      <div className="status-bar-item">
        {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
      </div>
      {selection.blockId && (
        <div className="status-bar-item" style={{ opacity: 0.7 }}>
          Selected: {selection.blockId.slice(0, 8)}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div className="status-bar-item">
        Zoom: {Math.round(zoom * 100)}%
      </div>
      <div className="status-bar-item">
        {doc?.currency || 'EUR'}
      </div>
    </div>
  );
}
