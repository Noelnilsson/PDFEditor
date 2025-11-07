/**
 * Main App component
 *
 * Root component that:
 * - Provides file upload interface
 * - Displays toolbar when PDF is loaded
 * - Displays PDF viewer
 * - Handles global keyboard shortcuts
 *
 * Layout:
 * - Header with file open button
 * - Toolbar (when PDF loaded)
 * - Viewer area
 */

import React, { useRef, useEffect } from 'react';
import { useDocumentStore } from './state/useDocumentStore';
import { useEditorStore } from './state/useEditorStore';
import { loadPDFFromFile } from './utils/pdfLoader';
import { Toolbar } from './components/Toolbar/Toolbar';
import { PDFViewer } from './components/Viewer/PDFViewer';

/**
 * Main application component
 */
function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPDF = useDocumentStore((state) => state.loadPDF);
  const isLoaded = useDocumentStore((state) => state.isLoaded);
  const fileName = useDocumentStore((state) => state.fileName);
  const undo = useDocumentStore((state) => state.undo);
  const redo = useDocumentStore((state) => state.redo);
  const selection = useDocumentStore((state) => state.selection);
  const enterEditMode = useDocumentStore((state) => state.enterEditMode);

  const setActiveTool = useEditorStore((state) => state.setActiveTool);

  /**
   * Handle file selection
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fileName, pdfData, numPages, pages } = await loadPDFFromFile(file);
      loadPDF(fileName, pdfData, numPages, pages);
    } catch (error) {
      console.error('Error loading PDF:', error);
      alert('Failed to load PDF. Please make sure the file is a valid PDF.');
    }

    // Reset input to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle global keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
        if (!selection.isEditing) {
          setActiveTool('select');
        }
      } else if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        if (!selection.isEditing) {
          setActiveTool('text');
        }
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // Enter edit mode on selected box
      if (e.key === 'Enter' && selection.selectedBoxId && !selection.isEditing) {
        e.preventDefault();
        enterEditMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveTool, undo, redo, selection, enterEditMode]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-gray-800 text-white p-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">PDF Text Editor</h1>

        <div className="flex items-center gap-4">
          {isLoaded && fileName && (
            <span className="text-sm text-gray-300">{fileName}</span>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
          >
            Open PDF
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </header>

      {/* Toolbar - shown when PDF is loaded */}
      {isLoaded && <Toolbar />}

      {/* Main viewer area */}
      <main className="flex-1 overflow-hidden">
        <PDFViewer />
      </main>

      {/* Footer with keyboard shortcuts hint */}
      {isLoaded && (
        <footer className="bg-gray-100 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
          <div className="flex gap-6">
            <span>
              <strong>V</strong> - Select tool
            </span>
            <span>
              <strong>T</strong> - Text tool
            </span>
            <span>
              <strong>Ctrl/Cmd + Z</strong> - Undo
            </span>
            <span>
              <strong>Ctrl/Cmd + Shift + Z</strong> - Redo
            </span>
            <span>
              <strong>Ctrl/Cmd + Scroll</strong> - Zoom
            </span>
            <span>
              <strong>Enter</strong> - Edit selected
            </span>
            <span>
              <strong>Esc</strong> - Exit edit
            </span>
            <span>
              <strong>Delete</strong> - Delete selected
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
