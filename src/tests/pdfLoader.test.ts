/**
 * Unit tests for PDF loading functionality
 * Tests the pdfLoader utility functions and diagnoses PDF upload issues
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { loadPDFFromFile, extractPageInfo } from '../utils/pdfLoader';
import * as pdfjsLib from 'pdfjs-dist';
import * as fs from 'fs';
import * as path from 'path';

// Configure PDF.js worker for test environment
// Using a data URI to provide a minimal worker that prevents the worker error
const workerCode = `
  self.onmessage = function() {};
`;
const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

/**
 * Modified loadPDFDocument for tests that disables worker
 */
async function loadPDFDocument(data: ArrayBuffer) {
  const uint8Array = new Uint8Array(data);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  return await loadingTask.promise;
}

describe('PDF Loader Tests', () => {
  let testPdfBuffer: ArrayBuffer;
  let testPdfFile: File;

  beforeAll(async () => {
    // Load the test.pdf file from the project root
    const pdfPath = path.join(process.cwd(), 'test.pdf');

    try {
      const fileBuffer = fs.readFileSync(pdfPath);
      testPdfBuffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength
      );

      // Create a File object from the buffer
      const blob = new Blob([testPdfBuffer], { type: 'application/pdf' });
      testPdfFile = new File([blob], 'test.pdf', { type: 'application/pdf' });

      console.log('✓ Successfully loaded test.pdf');
      console.log(`  File size: ${testPdfBuffer.byteLength} bytes`);
    } catch (error) {
      console.error('✗ Failed to load test.pdf:', error);
      throw error;
    }
  });

  describe('loadPDFDocument', () => {
    it('should load a valid PDF document from ArrayBuffer', async () => {
      const pdfDoc = await loadPDFDocument(testPdfBuffer);

      expect(pdfDoc).toBeDefined();
      expect(pdfDoc.numPages).toBeGreaterThan(0);

      console.log(`✓ PDF loaded successfully`);
      console.log(`  Number of pages: ${pdfDoc.numPages}`);
    });

    it('should throw an error for invalid PDF data', async () => {
      const invalidBuffer = new ArrayBuffer(10);

      await expect(loadPDFDocument(invalidBuffer)).rejects.toThrow();
      console.log('✓ Correctly rejected invalid PDF data');
    });

    it('should throw an error for empty buffer', async () => {
      const emptyBuffer = new ArrayBuffer(0);

      await expect(loadPDFDocument(emptyBuffer)).rejects.toThrow();
      console.log('✓ Correctly rejected empty buffer');
    });
  });

  describe('extractPageInfo', () => {
    it('should extract page information from PDF document', async () => {
      const pdfDoc = await loadPDFDocument(testPdfBuffer);
      const pages = await extractPageInfo(pdfDoc);

      expect(pages).toBeDefined();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBe(pdfDoc.numPages);

      console.log(`✓ Extracted page info for ${pages.length} page(s)`);

      // Check first page structure
      if (pages.length > 0) {
        const firstPage = pages[0];
        expect(firstPage).toHaveProperty('index');
        expect(firstPage).toHaveProperty('width');
        expect(firstPage).toHaveProperty('height');
        expect(firstPage).toHaveProperty('textBoxes');
        expect(firstPage.textBoxes).toEqual([]);

        console.log(`  Page 1 dimensions: ${firstPage.width} x ${firstPage.height} points`);
      }
    });

    it('should have correct page dimensions', async () => {
      const pdfDoc = await loadPDFDocument(testPdfBuffer);
      const pages = await extractPageInfo(pdfDoc);

      pages.forEach((page, index) => {
        expect(page.index).toBe(index);
        expect(page.width).toBeGreaterThan(0);
        expect(page.height).toBeGreaterThan(0);
        console.log(`  Page ${index + 1}: ${page.width.toFixed(2)} x ${page.height.toFixed(2)} points`);
      });
    });
  });

  describe('loadPDFFromFile', () => {
    it('should load PDF from File object successfully', async () => {
      const result = await loadPDFFromFile(testPdfFile);

      expect(result).toBeDefined();
      expect(result.fileName).toBe('test.pdf');
      expect(result.pdfData).toBeInstanceOf(ArrayBuffer);
      expect(result.numPages).toBeGreaterThan(0);
      expect(Array.isArray(result.pages)).toBe(true);
      expect(result.pages.length).toBe(result.numPages);

      console.log('✓ Successfully loaded PDF from File object');
      console.log(`  File name: ${result.fileName}`);
      console.log(`  Number of pages: ${result.numPages}`);
      console.log(`  Data size: ${result.pdfData.byteLength} bytes`);
    });

    it('should handle file reading correctly', async () => {
      const result = await loadPDFFromFile(testPdfFile);

      // Verify the ArrayBuffer is valid
      expect(result.pdfData.byteLength).toBe(testPdfBuffer.byteLength);

      console.log('✓ FileReader correctly processed the PDF');
    });

    it('should extract all page information', async () => {
      const result = await loadPDFFromFile(testPdfFile);

      result.pages.forEach((page, index) => {
        expect(page.index).toBe(index);
        expect(page.width).toBeGreaterThan(0);
        expect(page.height).toBeGreaterThan(0);
        expect(page.textBoxes).toEqual([]);
      });

      console.log('✓ All pages have valid structure');
    });
  });

  describe('File format validation', () => {
    it('should verify PDF magic number', () => {
      // Check if file starts with PDF magic number (%PDF)
      const view = new Uint8Array(testPdfBuffer);
      const magicNumber = String.fromCharCode(...view.slice(0, 4));

      expect(magicNumber).toBe('%PDF');
      console.log(`✓ PDF magic number verified: ${magicNumber}`);
    });

    it('should have valid PDF structure', () => {
      const view = new Uint8Array(testPdfBuffer);
      const content = String.fromCharCode(...view.slice(0, 100));

      // Check for PDF version
      expect(content).toMatch(/%PDF-\d\.\d/);
      console.log('✓ PDF version header found');
    });
  });

  describe('Error scenarios', () => {
    it('should handle corrupted file gracefully', async () => {
      // Create a file with PDF header but corrupted content
      const corruptedData = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, // %PDF
        0x00, 0x00, 0x00, 0x00  // corrupted data
      ]);
      const blob = new Blob([corruptedData], { type: 'application/pdf' });
      const corruptedFile = new File([blob], 'corrupted.pdf', { type: 'application/pdf' });

      await expect(loadPDFFromFile(corruptedFile)).rejects.toThrow();
      console.log('✓ Correctly handles corrupted PDF');
    });

    it('should handle non-PDF file with .pdf extension', async () => {
      const textData = new TextEncoder().encode('This is not a PDF file');
      const blob = new Blob([textData], { type: 'application/pdf' });
      const fakeFile = new File([blob], 'fake.pdf', { type: 'application/pdf' });

      await expect(loadPDFFromFile(fakeFile)).rejects.toThrow();
      console.log('✓ Correctly rejects non-PDF content');
    });
  });

  describe('Integration test with actual upload flow', () => {
    it('should simulate the complete file upload flow', async () => {
      // This simulates what happens when a user selects a file
      console.log('\n--- Simulating File Upload Flow ---');

      try {
        console.log('1. User selects test.pdf from file input');
        console.log(`   File: ${testPdfFile.name}`);
        console.log(`   Size: ${testPdfFile.size} bytes`);
        console.log(`   Type: ${testPdfFile.type}`);

        console.log('2. Calling loadPDFFromFile...');
        const result = await loadPDFFromFile(testPdfFile);

        console.log('3. PDF loaded successfully!');
        console.log(`   ✓ File name: ${result.fileName}`);
        console.log(`   ✓ Pages: ${result.numPages}`);
        console.log(`   ✓ Data size: ${result.pdfData.byteLength} bytes`);

        console.log('4. Verifying page data...');
        result.pages.forEach((page, idx) => {
          console.log(`   Page ${idx + 1}: ${page.width.toFixed(2)} x ${page.height.toFixed(2)} pts`);
        });

        console.log('✓ Complete upload flow successful!');

        expect(result).toBeDefined();
        expect(result.numPages).toBeGreaterThan(0);
      } catch (error) {
        console.error('✗ Upload flow failed:');
        console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.stack) {
          console.error(`   Stack: ${error.stack}`);
        }
        throw error;
      }
    });
  });
});
