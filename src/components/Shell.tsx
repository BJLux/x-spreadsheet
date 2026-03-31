import { useDocumentStore } from '../store/document-store';
import { Toolbar } from './Toolbar/Toolbar';
import { DocumentMap } from './DocumentMap/DocumentMap';
import { DocumentCanvas } from './Canvas/DocumentCanvas';
import { ContextPanel } from './ContextPanel/ContextPanel';
import { FormulaBar } from './FormulaBar';
import { StatusBar } from './StatusBar';
import { useKeyboardNav } from '../hooks/useKeyboardNav';

export function Shell() {
  useKeyboardNav();
  const doc = useDocumentStore((s) => s.document);
  const documentMapOpen = useDocumentStore((s) => s.documentMapOpen);
  const contextPanelOpen = useDocumentStore((s) => s.contextPanelOpen);

  if (!doc) {
    return (
      <div className="shell">
        <div className="empty-state">
          <div className="empty-state-icon">&#9633;</div>
          <div className="empty-state-text">Loading document...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <Toolbar />
      <FormulaBar />
      <div className="shell-body">
        <DocumentMap collapsed={!documentMapOpen} />
        <DocumentCanvas />
        <ContextPanel collapsed={!contextPanelOpen} />
      </div>
      <StatusBar />
    </div>
  );
}
