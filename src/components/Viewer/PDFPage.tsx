/**
 * PDFPage component
 *
 * Renders a single PDF page with:
 * - Canvas rendering of the original PDF page
 * - Overlay layer for text boxes
 * - Click handling to create new text boxes
 *
 * Props:
 * - pageIndex: Index of the page to render
 * - pdfData: PDF document data
 * - zoom: Current zoom level
 *
 * Uses PDF.js to render the page to a canvas
 */

import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useDocumentStore } from '../../state/useDocumentStore';
import { useEditorStore } from '../../state/useEditorStore';
import { TextBoxOverlay } from '../TextBox/TextBoxOverlay';
import { generateId, screenToPDF } from '../../utils/helpers';
import type { TextBox } from '../../types';

interface PDFPageProps {
  pageIndex: number;
  pdfData: ArrayBuffer;
  zoom: number;
}

/**
 * PDFPage component for rendering a single PDF page
 */
export const PDFPage: React.FC<PDFPageProps> = ({ pageIndex, pdfData, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = useDocumentStore((state) => state.pages);
  const selection = useDocumentStore((state) => state.selection);
  const addTextBox = useDocumentStore((state) => state.addTextBox);
  const updateTextBox = useDocumentStore((state) => state.updateTextBox);
  const deleteTextBox = useDocumentStore((state) => state.deleteTextBox);
  const selectTextBox = useDocumentStore((state) => state.selectTextBox);
  const enterEditMode = useDocumentStore((state) => state.enterEditMode);
  const exitEditMode = useDocumentStore((state) => state.exitEditMode);
  const saveHistory = useDocumentStore((state) => state.saveHistory);

  const activeTool = useEditorStore((state) => state.activeTool);
  const defaultFontFamily = useEditorStore((state) => state.defaultFontFamily);
  const defaultFontSize = useEditorStore((state) => state.defaultFontSize);
  const defaultColor = useEditorStore((state) => state.defaultColor);

  const pageState = pages[pageIndex];

  /**
   * Load and render PDF page
   */
  useEffect(() => {
    let isMounted = true;

    async function renderPage() {
      if (!canvasRef.current || !pdfData) return;

      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(pageIndex + 1);

        if (!isMounted) return;

        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering page:', error);
      }
    }

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfData, pageIndex, zoom]);

  /**
   * Handle click on page to create new text box
   */
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only create text box if text tool is active and clicking on the canvas
    if (activeTool !== 'text' || !containerRef.current || !pageState) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { x, y } = screenToPDF(clickX, clickY, zoom);

    // Create new text box
    const newTextBox: TextBox = {
      id: generateId(),
      pageIndex,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 200,
      height: 50,
      text: 'New Text',
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
      color: defaultColor,
      fontWeight: 'normal',
      textAlign: 'left',
      mode: 'overlay',
    };

    saveHistory();
    addTextBox(newTextBox);
    selectTextBox(newTextBox.id);
    enterEditMode();
  };

  /**
   * Handle click on canvas background to deselect
   */
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectTextBox(null);
      exitEditMode();
    }
  };

  if (!pageState) return null;

  return (
    <div
      ref={containerRef}
      className="relative mb-4 shadow-lg"
      style={{
        width: `${pageState.width * zoom}px`,
        height: `${pageState.height * zoom}px`,
      }}
      onClick={handleCanvasClick}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        onClick={handlePageClick}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
        />
      </div>

      {/* Text box overlays */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {pageState.textBoxes.map((textBox) => (
            <TextBoxOverlay
              key={textBox.id}
              textBox={textBox}
              isSelected={selection.selectedBoxId === textBox.id}
              isEditing={selection.isEditing && selection.selectedBoxId === textBox.id}
              zoom={zoom}
              onSelect={() => {
                saveHistory();
                selectTextBox(textBox.id);
              }}
              onUpdate={(updates) => {
                updateTextBox(textBox.id, updates);
              }}
              onDelete={() => {
                saveHistory();
                deleteTextBox(textBox.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
