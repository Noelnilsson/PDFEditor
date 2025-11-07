/**
 * PDF loading utilities using PDF.js
 *
 * Provides functions to:
 * - Load PDF files
 * - Extract page information
 * - Render pages to canvas
 * - Extract text layers for editing
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { PageState } from '../types';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Load a PDF file from ArrayBuffer
 *
 * @param data - PDF file data as ArrayBuffer
 * @returns PDF document proxy
 */
export async function loadPDFDocument(data: ArrayBuffer) {
  // PDF.js requires a TypedArray (Uint8Array), not an ArrayBuffer
  const uint8Array = new Uint8Array(data);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  return await loadingTask.promise;
}

/**
 * Extract page information from a PDF document
 *
 * @param pdfDoc - PDF.js document proxy
 * @returns Array of PageState objects with dimensions
 */
export async function extractPageInfo(
  pdfDoc: pdfjsLib.PDFDocumentProxy
): Promise<PageState[]> {
  const pages: PageState[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });

    pages.push({
      index: i - 1,
      width: viewport.width,
      height: viewport.height,
      textBoxes: [],
    });
  }

  return pages;
}

/**
 * Render a PDF page to a canvas element
 *
 * @param pdfDoc - PDF.js document proxy
 * @param pageNumber - Page number (1-based)
 * @param canvas - Canvas element to render to
 * @param scale - Zoom scale (1.0 = 100%)
 * @returns Rendered canvas element
 */
export async function renderPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.0
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Extract text content from a PDF page
 *
 * @param pdfDoc - PDF.js document proxy
 * @param pageNumber - Page number (1-based)
 * @returns Text content with position information
 */
export async function extractTextContent(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number
) {
  const page = await pdfDoc.getPage(pageNumber);
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });

  return {
    items: textContent.items,
    viewport,
  };
}

/**
 * Load PDF file from user file input
 *
 * @param file - File object from input
 * @returns Object with file name, data, and page info
 */
export async function loadPDFFromFile(file: File): Promise<{
  fileName: string;
  pdfData: ArrayBuffer;
  numPages: number;
  pages: PageState[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file');
        }

        const arrayBuffer = e.target.result as ArrayBuffer;
        const pdfDoc = await loadPDFDocument(arrayBuffer);
        const pages = await extractPageInfo(pdfDoc);

        resolve({
          fileName: file.name,
          pdfData: arrayBuffer,
          numPages: pdfDoc.numPages,
          pages,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
