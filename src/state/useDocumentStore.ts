/**
 * Zustand store for managing PDF document state
 *
 * Manages:
 * - PDF loading and document metadata
 * - Page states and text boxes
 * - Zoom and pan
 * - Selection and editing
 * - Undo/redo history
 *
 * All state mutations go through this store to maintain consistency
 */

import { create } from 'zustand';
import type {
  DocumentState,
  PageState,
  TextBox,
  HistoryState,
} from '../types';

/**
 * Actions available on the document store
 */
interface DocumentActions {
  /** Load a PDF file into the editor */
  loadPDF: (fileName: string, pdfData: ArrayBuffer, numPages: number, pages: PageState[]) => void;

  /** Clear the current document */
  clearDocument: () => void;

  /** Set zoom level */
  setZoom: (zoom: number) => void;

  /** Set pan offset */
  setPanOffset: (offset: { x: number; y: number }) => void;

  /** Add a new text box to a page */
  addTextBox: (textBox: TextBox) => void;

  /** Update an existing text box */
  updateTextBox: (id: string, updates: Partial<TextBox>) => void;

  /** Delete a text box */
  deleteTextBox: (id: string) => void;

  /** Select a text box */
  selectTextBox: (id: string | null) => void;

  /** Enter edit mode for selected text box */
  enterEditMode: () => void;

  /** Exit edit mode */
  exitEditMode: () => void;

  /** Save current state to history (for undo) */
  saveHistory: () => void;

  /** Undo last action */
  undo: () => void;

  /** Redo last undone action */
  redo: () => void;

  /** Get all text boxes for a specific page */
  getTextBoxesForPage: (pageIndex: number) => TextBox[];
}

/**
 * Initial empty document state
 */
const initialState: DocumentState = {
  fileName: null,
  pdfData: null,
  numPages: 0,
  pages: [],
  zoom: 1.0,
  panOffset: { x: 0, y: 0 },
  selection: {
    selectedBoxId: null,
    isEditing: false,
  },
  history: {
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  },
  isLoaded: false,
};

/**
 * Document store hook
 * Use this hook in components to access and modify document state
 */
export const useDocumentStore = create<DocumentState & DocumentActions>((set, get) => ({
  ...initialState,

  loadPDF: (fileName, pdfData, numPages, pages) => {
    set({
      fileName,
      pdfData,
      numPages,
      pages,
      isLoaded: true,
      zoom: 1.0,
      panOffset: { x: 0, y: 0 },
      selection: {
        selectedBoxId: null,
        isEditing: false,
      },
      history: {
        past: [],
        future: [],
        canUndo: false,
        canRedo: false,
      },
    });
  },

  clearDocument: () => {
    set(initialState);
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.25, Math.min(4, zoom)) });
  },

  setPanOffset: (offset) => {
    set({ panOffset: offset });
  },

  addTextBox: (textBox) => {
    const state = get();
    const pages = [...state.pages];
    const pageIndex = textBox.pageIndex;

    if (pageIndex >= 0 && pageIndex < pages.length) {
      pages[pageIndex] = {
        ...pages[pageIndex],
        textBoxes: [...pages[pageIndex].textBoxes, textBox],
      };

      set({ pages });
    }
  },

  updateTextBox: (id, updates) => {
    const state = get();
    const pages = state.pages.map((page) => ({
      ...page,
      textBoxes: page.textBoxes.map((box) =>
        box.id === id ? { ...box, ...updates } : box
      ),
    }));

    set({ pages });
  },

  deleteTextBox: (id) => {
    const state = get();
    const pages = state.pages.map((page) => ({
      ...page,
      textBoxes: page.textBoxes.filter((box) => box.id !== id),
    }));

    set({
      pages,
      selection: {
        selectedBoxId: null,
        isEditing: false,
      },
    });
  },

  selectTextBox: (id) => {
    set({
      selection: {
        selectedBoxId: id,
        isEditing: false,
      },
    });
  },

  enterEditMode: () => {
    const state = get();
    if (state.selection.selectedBoxId) {
      set({
        selection: {
          ...state.selection,
          isEditing: true,
        },
      });
    }
  },

  exitEditMode: () => {
    set({
      selection: {
        ...get().selection,
        isEditing: false,
      },
    });
  },

  saveHistory: () => {
    const state = get();
    const historyState: HistoryState = {
      pages: state.pages,
    };

    set({
      history: {
        past: [...state.history.past, historyState],
        future: [],
        canUndo: true,
        canRedo: false,
      },
    });
  },

  undo: () => {
    const state = get();
    if (state.history.past.length === 0) return;

    const previous = state.history.past[state.history.past.length - 1];
    const newPast = state.history.past.slice(0, -1);

    const currentState: HistoryState = {
      pages: state.pages,
    };

    set({
      pages: previous.pages,
      history: {
        past: newPast,
        future: [currentState, ...state.history.future],
        canUndo: newPast.length > 0,
        canRedo: true,
      },
      selection: {
        selectedBoxId: null,
        isEditing: false,
      },
    });
  },

  redo: () => {
    const state = get();
    if (state.history.future.length === 0) return;

    const next = state.history.future[0];
    const newFuture = state.history.future.slice(1);

    const currentState: HistoryState = {
      pages: state.pages,
    };

    set({
      pages: next.pages,
      history: {
        past: [...state.history.past, currentState],
        future: newFuture,
        canUndo: true,
        canRedo: newFuture.length > 0,
      },
      selection: {
        selectedBoxId: null,
        isEditing: false,
      },
    });
  },

  getTextBoxesForPage: (pageIndex) => {
    const state = get();
    if (pageIndex >= 0 && pageIndex < state.pages.length) {
      return state.pages[pageIndex].textBoxes;
    }
    return [];
  },
}));
