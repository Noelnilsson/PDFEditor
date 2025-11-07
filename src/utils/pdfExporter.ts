/**
 * PDF export utilities using pdf-lib
 *
 * Provides functions to:
 * - Generate new PDF with text box overlays flattened
 * - Handle text wrapping within boxes
 * - Support replace mode (white-out existing text)
 * - Embed fonts and apply styling
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { TextBox, PageState, FontFamily } from '../types';

/**
 * Map our font family types to pdf-lib StandardFonts
 *
 * @param fontFamily - Font family name
 * @returns pdf-lib StandardFont enum value
 */
function getFontForFamily(fontFamily: FontFamily): StandardFonts {
  switch (fontFamily) {
    case 'Helvetica':
      return StandardFonts.Helvetica;
    case 'Times-Roman':
      return StandardFonts.TimesRoman;
    case 'Courier':
      return StandardFonts.Courier;
    default:
      return StandardFonts.Helvetica;
  }
}

/**
 * Convert hex color string to RGB values
 *
 * @param hex - Hex color string (e.g., #FF0000)
 * @returns RGB object for pdf-lib
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Simple text wrapping function
 * Splits text into lines that fit within the given width
 *
 * @param text - Text to wrap
 * @param maxWidth - Maximum width in points
 * @param font - PDF font object
 * @param fontSize - Font size in points
 * @returns Array of text lines
 */
function wrapText(
  text: string,
  maxWidth: number,
  font: { widthOfTextAtSize: (text: string, size: number) => number },
  fontSize: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Export PDF with text box overlays flattened
 *
 * Process:
 * 1. Load original PDF
 * 2. For each page, copy to new document
 * 3. For each text box on the page:
 *    - If replace mode, draw white rectangle
 *    - Draw text with specified styling
 * 4. Save and return as Blob
 *
 * @param originalPdfData - Original PDF as ArrayBuffer
 * @param pages - Page states with text boxes
 * @returns Blob containing the new PDF
 */
export async function exportPDF(
  originalPdfData: ArrayBuffer,
  pages: PageState[]
): Promise<Blob> {
  // Load the original PDF
  const originalPdf = await PDFDocument.load(originalPdfData);

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Copy each page and add overlays
  for (let i = 0; i < pages.length; i++) {
    const pageState = pages[i];

    // Copy the original page
    const [copiedPage] = await pdfDoc.copyPages(originalPdf, [i]);
    const page = pdfDoc.addPage(copiedPage);

    // Get page dimensions
    const { height } = page.getSize();

    // Process each text box on this page
    for (const textBox of pageState.textBoxes) {
      await drawTextBox(pdfDoc, page, textBox, height);
    }
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Create and return a Blob
  return new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
}

/**
 * Draw a text box onto a PDF page
 *
 * @param pdfDoc - PDF document
 * @param page - PDF page to draw on
 * @param textBox - Text box to draw
 * @param pageHeight - Height of the page in points
 */
async function drawTextBox(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['addPage']>,
  textBox: TextBox,
  pageHeight: number
): Promise<void> {
  // Get font
  const fontType = getFontForFamily(textBox.fontFamily);
  const font = await pdfDoc.embedFont(fontType);

  // Convert coordinates (PDF.js uses top-left origin, pdf-lib uses bottom-left)
  const pdfY = pageHeight - textBox.y - textBox.height;

  // If replace mode, draw background rectangle
  if (textBox.mode === 'replace') {
    const bgColor = hexToRgb(textBox.backgroundColor || '#FFFFFF');
    page.drawRectangle({
      x: textBox.x,
      y: pdfY,
      width: textBox.width,
      height: textBox.height,
      color: rgb(bgColor.r, bgColor.g, bgColor.b),
    });
  }

  // Wrap text to fit within box width
  const lines = wrapText(textBox.text, textBox.width - 4, font, textBox.fontSize);

  // Get text color
  const textColor = hexToRgb(textBox.color);

  // Calculate line height
  const lineHeight = textBox.fontSize * 1.2;

  // Calculate starting Y position based on alignment
  let currentY = pdfY + textBox.height - textBox.fontSize - 2;

  // Draw each line
  for (const line of lines) {
    if (currentY < pdfY) break; // Don't draw outside the box

    let x = textBox.x + 2;

    // Apply horizontal alignment
    if (textBox.textAlign === 'center') {
      const textWidth = font.widthOfTextAtSize(line, textBox.fontSize);
      x = textBox.x + (textBox.width - textWidth) / 2;
    } else if (textBox.textAlign === 'right') {
      const textWidth = font.widthOfTextAtSize(line, textBox.fontSize);
      x = textBox.x + textBox.width - textWidth - 2;
    }

    page.drawText(line, {
      x,
      y: currentY,
      size: textBox.fontSize,
      font,
      color: rgb(textColor.r, textColor.g, textColor.b),
    });

    currentY -= lineHeight;
  }
}

/**
 * Trigger download of a Blob as a file
 *
 * @param blob - Blob to download
 * @param fileName - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
