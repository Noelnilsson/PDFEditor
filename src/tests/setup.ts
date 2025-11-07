/**
 * Test setup file for Vitest
 * Configures testing environment and global mocks
 */

import '@testing-library/jest-dom';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for Node.js environment
// Use the legacy build which doesn't require worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// Mock the PDF.js worker to avoid loading issues in test environment
if (typeof window !== 'undefined') {
  global.URL.createObjectURL = () => 'mock-url';
}
