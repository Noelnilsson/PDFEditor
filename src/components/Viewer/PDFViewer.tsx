/**
 * PDFViewer component
 *
 * Main viewer for displaying PDF pages with:
 * - Scrollable container for all pages
 * - Zoom and pan support
 * - Keyboard shortcuts for zoom
 *
 * Props: None (uses global state)
 *
 * Displays all pages vertically with text box overlays
 */

import React, { useRef, useEffect } from 'react';
import { useDocumentStore } from '../../state/useDocumentStore';
import { PDFPage } from './PDFPage';

/**
 * PDFViewer component for displaying all PDF pages
 */
export const PDFViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfData = useDocumentStore((state) => state.pdfData);
  const pages = useDocumentStore((state) => state.pages);
  const zoom = useDocumentStore((state) => state.zoom);
  const setZoom = useDocumentStore((state) => state.setZoom);
  const isLoaded = useDocumentStore((state) => state.isLoaded);

  /**
   * Handle zoom with Ctrl/Cmd + scroll
   */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, setZoom]);

  /**
   * Handle keyboard shortcuts for zoom
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(zoom + 0.1);
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(zoom - 0.1);
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1.0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoom, setZoom]);

  if (!isLoaded || !pdfData) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">No PDF loaded. Open a PDF to get started.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-gray-200 p-8"
      style={{ height: '100%' }}
    >
      <div className="flex flex-col items-center">
        {pages.map((_, index) => (
          <PDFPage
            key={index}
            pageIndex={index}
            pdfData={pdfData}
            zoom={zoom}
          />
        ))}
      </div>
    </div>
  );
};
