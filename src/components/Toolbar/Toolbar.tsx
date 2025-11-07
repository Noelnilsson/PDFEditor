/**
 * Toolbar component
 *
 * Provides UI controls for:
 * - Tool selection (select, text)
 * - Font family, size, color selection
 * - Text alignment
 * - Text mode (overlay, replace)
 * - Zoom controls
 * - Undo/redo
 * - Export PDF
 *
 * Props: None (uses global state)
 *
 * Updates both selected text box and default preferences
 */

import React from 'react';
import { useDocumentStore } from '../../state/useDocumentStore';
import { useEditorStore } from '../../state/useEditorStore';
import { exportPDF, downloadBlob } from '../../utils/pdfExporter';
import type { FontFamily, TextAlign, TextBoxMode } from '../../types';

/**
 * Toolbar component for editor controls
 */
export const Toolbar: React.FC = () => {
  const pdfData = useDocumentStore((state) => state.pdfData);
  const fileName = useDocumentStore((state) => state.fileName);
  const pages = useDocumentStore((state) => state.pages);
  const selection = useDocumentStore((state) => state.selection);
  const zoom = useDocumentStore((state) => state.zoom);
  const setZoom = useDocumentStore((state) => state.setZoom);
  const updateTextBox = useDocumentStore((state) => state.updateTextBox);
  const history = useDocumentStore((state) => state.history);
  const undo = useDocumentStore((state) => state.undo);
  const redo = useDocumentStore((state) => state.redo);
  const saveHistory = useDocumentStore((state) => state.saveHistory);

  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const defaultFontFamily = useEditorStore((state) => state.defaultFontFamily);
  const setDefaultFontFamily = useEditorStore((state) => state.setDefaultFontFamily);
  const defaultFontSize = useEditorStore((state) => state.defaultFontSize);
  const setDefaultFontSize = useEditorStore((state) => state.setDefaultFontSize);
  const defaultColor = useEditorStore((state) => state.defaultColor);
  const setDefaultColor = useEditorStore((state) => state.setDefaultColor);

  // Get selected text box if any
  const selectedBox = selection.selectedBoxId
    ? pages
        .flatMap((p) => p.textBoxes)
        .find((box) => box.id === selection.selectedBoxId)
    : null;

  /**
   * Handle export PDF
   */
  const handleExport = async () => {
    if (!pdfData) return;

    try {
      const blob = await exportPDF(pdfData, pages);
      const exportFileName = fileName
        ? fileName.replace('.pdf', '_edited.pdf')
        : 'edited.pdf';
      downloadBlob(blob, exportFileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  /**
   * Update selected box or default preferences
   */
  const updateFontFamily = (fontFamily: FontFamily) => {
    if (selectedBox) {
      saveHistory();
      updateTextBox(selectedBox.id, { fontFamily });
    }
    setDefaultFontFamily(fontFamily);
  };

  const updateFontSize = (fontSize: number) => {
    if (selectedBox) {
      saveHistory();
      updateTextBox(selectedBox.id, { fontSize });
    }
    setDefaultFontSize(fontSize);
  };

  const updateColor = (color: string) => {
    if (selectedBox) {
      saveHistory();
      updateTextBox(selectedBox.id, { color });
    }
    setDefaultColor(color);
  };

  const updateTextAlign = (textAlign: TextAlign) => {
    if (selectedBox) {
      saveHistory();
      updateTextBox(selectedBox.id, { textAlign });
    }
  };

  const updateMode = (mode: TextBoxMode) => {
    if (selectedBox) {
      saveHistory();
      updateTextBox(selectedBox.id, { mode });
    }
  };

  const currentFontFamily = selectedBox?.fontFamily || defaultFontFamily;
  const currentFontSize = selectedBox?.fontSize || defaultFontSize;
  const currentColor = selectedBox?.color || defaultColor;
  const currentTextAlign = selectedBox?.textAlign || 'left';
  const currentMode = selectedBox?.mode || 'overlay';

  return (
    <div className="bg-white border-b border-gray-300 p-2 flex items-center gap-2 flex-wrap">
      {/* Tool Selection */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => setActiveTool('select')}
          className={`px-3 py-1 rounded ${
            activeTool === 'select'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          title="Select Tool (V)"
        >
          Select
        </button>
        <button
          onClick={() => setActiveTool('text')}
          className={`px-3 py-1 rounded ${
            activeTool === 'text'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          title="Text Tool (T)"
        >
          Text
        </button>
      </div>

      {/* Font Family */}
      <select
        value={currentFontFamily}
        onChange={(e) => updateFontFamily(e.target.value as FontFamily)}
        className="px-2 py-1 border border-gray-300 rounded"
        title="Font Family"
      >
        <option value="Helvetica">Helvetica</option>
        <option value="Times-Roman">Times Roman</option>
        <option value="Courier">Courier</option>
        <option value="Inter">Inter</option>
      </select>

      {/* Font Size */}
      <input
        type="number"
        value={currentFontSize}
        onChange={(e) => updateFontSize(Number(e.target.value))}
        className="w-16 px-2 py-1 border border-gray-300 rounded"
        min="1"
        max="200"
        title="Font Size"
      />

      {/* Color */}
      <input
        type="color"
        value={currentColor}
        onChange={(e) => updateColor(e.target.value)}
        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
        title="Text Color"
      />

      {/* Text Alignment */}
      <div className="flex gap-1 border-x border-gray-300 px-2">
        <button
          onClick={() => updateTextAlign('left')}
          className={`px-2 py-1 rounded ${
            currentTextAlign === 'left' ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="Align Left"
          disabled={!selectedBox}
        >
          L
        </button>
        <button
          onClick={() => updateTextAlign('center')}
          className={`px-2 py-1 rounded ${
            currentTextAlign === 'center' ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="Align Center"
          disabled={!selectedBox}
        >
          C
        </button>
        <button
          onClick={() => updateTextAlign('right')}
          className={`px-2 py-1 rounded ${
            currentTextAlign === 'right' ? 'bg-gray-300' : 'hover:bg-gray-200'
          }`}
          title="Align Right"
          disabled={!selectedBox}
        >
          R
        </button>
      </div>

      {/* Mode */}
      <select
        value={currentMode}
        onChange={(e) => updateMode(e.target.value as TextBoxMode)}
        className="px-2 py-1 border border-gray-300 rounded"
        title="Text Mode"
        disabled={!selectedBox}
      >
        <option value="overlay">Overlay</option>
        <option value="replace">Replace</option>
      </select>

      {/* Zoom */}
      <div className="flex items-center gap-1 border-x border-gray-300 px-2">
        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          title="Zoom Out"
        >
          -
        </button>
        <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={undo}
          disabled={!history.canUndo}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!history.canRedo}
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
      </div>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={!pdfData}
        className="ml-auto px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export PDF"
      >
        Download PDF
      </button>
    </div>
  );
};
