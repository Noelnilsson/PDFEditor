/**
 * Zustand store for managing editor preferences and UI state
 *
 * Manages:
 * - Active tool selection
 * - Default text box properties
 * - Grid and snapping preferences
 *
 * Separate from document store to keep concerns separated
 */

import { create } from 'zustand';
import type { EditorPreferences, Tool, FontFamily } from '../types';

/**
 * Actions available on the editor store
 */
interface EditorActions {
  /** Set the active tool */
  setActiveTool: (tool: Tool) => void;

  /** Set default font family */
  setDefaultFontFamily: (fontFamily: FontFamily) => void;

  /** Set default font size */
  setDefaultFontSize: (fontSize: number) => void;

  /** Set default text color */
  setDefaultColor: (color: string) => void;

  /** Toggle grid visibility */
  toggleGrid: () => void;

  /** Toggle snapping */
  toggleSnapping: () => void;
}

/**
 * Initial editor preferences
 */
const initialPreferences: EditorPreferences = {
  activeTool: 'select',
  defaultFontFamily: 'Helvetica',
  defaultFontSize: 12,
  defaultColor: '#000000',
  showGrid: false,
  enableSnapping: true,
};

/**
 * Editor store hook
 * Use this hook in components to access and modify editor preferences
 */
export const useEditorStore = create<EditorPreferences & EditorActions>((set) => ({
  ...initialPreferences,

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  setDefaultFontFamily: (fontFamily) => {
    set({ defaultFontFamily: fontFamily });
  },

  setDefaultFontSize: (fontSize) => {
    set({ defaultFontSize: Math.max(1, Math.min(200, fontSize)) });
  },

  setDefaultColor: (color) => {
    set({ defaultColor: color });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleSnapping: () => {
    set((state) => ({ enableSnapping: !state.enableSnapping }));
  },
}));
