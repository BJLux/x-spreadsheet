import { Shell } from './components/Shell';
import { useDocumentStore } from './store/document-store';
import { useEffect } from 'react';
import { createSampleDocument } from './lib/sample-document';
import { ErrorBoundary } from './components/ErrorBoundary';

export function App() {
  const loadDocument = useDocumentStore((s) => s.loadDocument);

  useEffect(() => {
    loadDocument(createSampleDocument());
  }, [loadDocument]);

  return (
    <ErrorBoundary>
      <Shell />
    </ErrorBoundary>
  );
}
