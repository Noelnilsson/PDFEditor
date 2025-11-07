/**
 * Helper utility functions
 *
 * Provides:
 * - Coordinate conversion between screen and PDF space
 * - ID generation
 * - Color utilities
 */

/**
 * Generate a unique ID for text boxes
 *
 * @returns Unique string ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert screen coordinates to PDF coordinates
 * PDF.js renders with top-left origin
 *
 * @param screenX - X coordinate in screen pixels
 * @param screenY - Y coordinate in screen pixels (from top)
 * @param zoom - Current zoom level
 * @param containerOffset - Offset of the page container
 * @returns Coordinates in PDF points
 */
export function screenToPDF(
  screenX: number,
  screenY: number,
  zoom: number,
  containerOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const pdfX = (screenX - containerOffset.x) / zoom;
  const pdfY = (screenY - containerOffset.y) / zoom;

  return { x: pdfX, y: pdfY };
}

/**
 * Convert PDF coordinates to screen coordinates
 *
 * @param pdfX - X coordinate in PDF points
 * @param pdfY - Y coordinate in PDF points
 * @param zoom - Current zoom level
 * @param containerOffset - Offset of the page container
 * @returns Coordinates in screen pixels
 */
export function pdfToScreen(
  pdfX: number,
  pdfY: number,
  zoom: number,
  containerOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const screenX = pdfX * zoom + containerOffset.x;
  const screenY = pdfY * zoom + containerOffset.y;

  return { x: screenX, y: screenY };
}

/**
 * Clamp a value between min and max
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if a point is inside a rectangle
 *
 * @param point - Point coordinates
 * @param rect - Rectangle definition
 * @returns True if point is inside rectangle
 */
export function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce a function call
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
