/**
 * Type definitions for PDF Text Editor
 * Defines the data model for document state, pages, and text boxes
 */

/**
 * Mode for text box rendering
 * - overlay: draws text on top of existing content
 * - replace: draws white rectangle first to cover existing text, then draws new text
 */
export type TextBoxMode = 'overlay' | 'replace';

/**
 * Font family options for text boxes
 * Using PDF standard base-14 fonts plus modern web fonts
 */
export type FontFamily =
  | 'Helvetica'
  | 'Times-Roman'
  | 'Courier'
  | 'Inter';

/**
 * Font weight options
 */
export type FontWeight = 'normal' | 'bold';

/**
 * Text alignment options
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Represents a text box overlay on a PDF page
 * Coordinates are in PDF points (72 points = 1 inch)
 */
export interface TextBox {
  /** Unique identifier for the text box */
  id: string;

  /** Index of the page this text box belongs to (0-based) */
  pageIndex: number;

  /** X coordinate in PDF points (from left edge) */
  x: number;

  /** Y coordinate in PDF points (from bottom edge in PDF space) */
  y: number;

  /** Width in PDF points */
  width: number;

  /** Height in PDF points */
  height: number;

  /** Text content */
  text: string;

  /** Font family */
  fontFamily: FontFamily;

  /** Font size in points */
  fontSize: number;

  /** Text color in hex format (e.g., #000000) */
  color: string;

  /** Font weight (normal or bold) */
  fontWeight?: FontWeight;

  /** Text alignment within the box */
  textAlign?: TextAlign;

  /** Background color for replace mode (default: white) */
  backgroundColor?: string;

  /** Rendering mode (overlay or replace) */
  mode: TextBoxMode;
}

/**
 * Represents the state of a single PDF page
 */
export interface PageState {
  /** Page index (0-based) */
  index: number;

  /** Page width in PDF points */
  width: number;

  /** Page height in PDF points */
  height: number;

  /** Text boxes on this page */
  textBoxes: TextBox[];
}

/**
 * Represents the current selection state
 */
export interface SelectionState {
  /** ID of the currently selected text box, or null if none */
  selectedBoxId: string | null;

  /** Whether the selected box is in edit mode */
  isEditing: boolean;
}

/**
 * Represents a state snapshot for undo/redo
 */
export interface HistoryState {
  /** Array of all page states */
  pages: PageState[];
}

/**
 * Undo/redo history management
 */
export interface UndoRedoState {
  /** Past states (for undo) */
  past: HistoryState[];

  /** Future states (for redo) */
  future: HistoryState[];

  /** Whether undo is available */
  canUndo: boolean;

  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Main document state for the PDF editor
 */
export interface DocumentState {
  /** Original PDF file name */
  fileName: string | null;

  /** Original PDF file as ArrayBuffer */
  pdfData: ArrayBuffer | null;

  /** Total number of pages in the PDF */
  numPages: number;

  /** State for each page */
  pages: PageState[];

  /** Current zoom level (1.0 = 100%) */
  zoom: number;

  /** Current pan offset in pixels */
  panOffset: { x: number; y: number };

  /** Selection state */
  selection: SelectionState;

  /** Undo/redo state */
  history: UndoRedoState;

  /** Whether a PDF is currently loaded */
  isLoaded: boolean;
}

/**
 * Tool types for the editor
 */
export type Tool = 'select' | 'text';

/**
 * Editor preferences
 */
export interface EditorPreferences {
  /** Current active tool */
  activeTool: Tool;

  /** Default font family for new text boxes */
  defaultFontFamily: FontFamily;

  /** Default font size for new text boxes */
  defaultFontSize: number;

  /** Default text color for new text boxes */
  defaultColor: string;

  /** Whether to show grid for alignment */
  showGrid: boolean;

  /** Whether to enable snapping */
  enableSnapping: boolean;
}
