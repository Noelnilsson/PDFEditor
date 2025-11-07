## PDF Text Editor (Web) — Project Brief

### Vision
Build a simple, fast, privacy-friendly website that lets users load an existing PDF, modify text visually on pages, and download a flattened, updated PDF. All processing should happen locally in the browser (no file uploads to servers by default).

### Goals (In Scope)
- **Upload existing PDF** from local disk.
- **Render pages** for viewing with smooth zoom and pan.
- **Add/modify text** via overlay text boxes:
  - Click to create a new text box.
  - Click existing text (from an approximated text layer) to edit/replace.
  - Drag to move; drag handles to resize; edit content inline.
  - Set font family, size, color, weight, alignment, and optional background.
- **Replace existing text visually** by covering original text (white-out) and writing new text on top (overlay-based editing).
- **Export/download** a new PDF with overlays flattened onto pages.

### Non-Goals (Out of Scope — for v1)
- True semantic text replacement inside PDF content streams (full parsing and reflow).
- Editing images, vector paths, forms, annotations, or page structure.
- OCR for scanned PDFs.
- Multi-user collaboration.
- Server-side processing.

### Key Constraints & Assumptions
- All operations run fully client-side in modern browsers.
- PDFs up to ~50 MB and ~300 pages should perform acceptably (target; may adjust after testing).
- Overlay-based text editing is acceptable for v1; users understand this is not full structural PDF editing.

---

## User Experience

### Primary Flow
1. User opens site.
2. Clicks “Open PDF” and selects a file.
3. Pages render in a scrollable viewer.
4. User selects the **Text Tool** and clicks on a page:
   - If clicking empty area: create new text box.
   - If clicking detected text region (from text layer): open edit mode for that region.
5. User edits text; adjusts font, size, color; moves/resizes as needed.
6. User previews export and clicks “Download PDF”.

### Editing Interactions
- Create, select, move, resize text boxes.
- Edit inline (double-click or Enter to edit, Esc to finish).
- Toolbar for font family, size, color, weight, alignment.
- Zoom (Ctrl/Cmd + scroll) and pan (space + drag or middle mouse).
- Undo/Redo (Ctrl/Cmd+Z / Shift+Ctrl/Cmd+Z).

### Accessibility
- Keyboard navigation for selecting boxes, moving by arrow keys with modifiers for precision.
- High-contrast UI option; sufficient color contrast.
- ARIA roles for toolbar controls and canvas viewer.

---

## Technical Approach

### Architecture (Client-Only)
- **Viewer/Rendering**: PDF.js for page rendering and optional text layer extraction.
- **Editing & State**: React + TypeScript managing an in-memory document model.
- **Export**: pdf-lib to generate a new PDF by copying original pages and drawing overlays (rectangles and text) onto them, then saving.

### Technology Stack
- **Framework**: React + TypeScript (Vite)
- **PDF Render**: PDF.js
- **PDF Write**: pdf-lib
- **UI**: Tailwind CSS (or CSS Modules) + Headless UI for controls
- **State**: Zustand or Redux Toolkit (lightweight predictable store)
- **Build**: Vite

### Alternatives Considered
- Server-side PDF processing (Node or Go): rejected for v1 due to privacy and complexity.
- Pure canvas export (rasterize then rebuild PDF): lower fidelity and larger output; rejected.

---

## Data Model (App State)
- `DocumentState`
  - `fileName: string`
  - `numPages: number`
  - `pages: PageState[]`
  - `zoom: number`
  - `selection: SelectionState`
  - `history: UndoRedoState`
- `PageState`
  - `index: number`
  - `width: number` (pt)
  - `height: number` (pt)
  - `textBoxes: TextBox[]`
- `TextBox`
  - `id: string`
  - `pageIndex: number`
  - `x: number`, `y: number` (pt, PDF coordinate space)
  - `width: number`, `height: number`
  - `text: string`
  - `fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier' | 'Inter' | ...`
  - `fontSize: number`
  - `color: string` (e.g., `#RRGGBB`)
  - `fontWeight?: 'normal' | 'bold'`
  - `textAlign?: 'left' | 'center' | 'right'`
  - `backgroundColor?: string` (for white-out/replace mode)
  - `mode: 'overlay' | 'replace'` (replace = draw white rect first)

Notes:
- Store positions in PDF points; map to screen pixels using zoom for rendering.
- Persist only in memory; export composes from state + original PDF bytes.

---

## Rendering & Export Pipeline

### Rendering (Viewer)
1. Load PDF bytes into PDF.js.
2. Render each page to canvas at current zoom.
3. Optionally extract `textContent` from PDF.js to approximate text regions; create default `TextBox` entries (non-destructive) for easier editing of existing text.
4. Render overlay layer with positioned, editable `TextBox` components.

### Export (Flatten to PDF with pdf-lib)
For each page:
1. Copy original page into a new PDF document.
2. For each `TextBox` on that page:
   - If `mode === 'replace'`: draw an opaque rectangle `backgroundColor` (default white) covering the box area.
   - Draw text using embedded font at `(x, y)` with alignment and wrapping within `width`.
3. Save the new PDF and trigger download.

Font Strategy:
- Prefer PDF base 14 fonts for simplicity (Helvetica, Times, Courier) to avoid licensing/embedding issues.
- Optionally embed open-source fonts (e.g., Inter) when selected.

Fidelity Caveat:
- This approach visually replaces text but does not rewrite content streams. Complex layouts (curved text, ligatures) may not map 1:1.

---

## Performance Targets
- Open a 100-page, 20 MB PDF within 5–8 seconds on a mid-range laptop.
- Keep memory under 500 MB for typical documents; render pages lazily (virtualized).
- Debounce expensive operations; only rerender the active page during edits.

---

## Error Handling & Edge Cases
- Corrupted or encrypted PDFs → show clear error message.
- Very large pages/sizes → warn about potential performance issues; allow selective page rendering.
- Missing fonts in original PDF → editing still works (overlay), but visual match may differ.

---

## Privacy & Security
- Default: process entirely in-browser; files never leave the device.
- No telemetry or analytics by default; if added later, ask for consent.

---

## Milestones & Estimates (v1)
1. Project scaffold (Vite, React, TS, Tailwind, routing) — 0.5–1 day
2. PDF viewer with zoom/pan and lazy rendering — 1–2 days
3. Text layer extraction and clickable regions — 1–2 days
4. Text box CRUD (create, edit, move, resize) + toolbar — 2–3 days
5. Export via pdf-lib with overlay/replace modes — 1–2 days
6. Polish: undo/redo, keyboard shortcuts, accessibility — 1–2 days
7. QA, performance passes, docs — 1 day

Total: ~7–12 days (solo dev, v1 scope).

---

## Acceptance Criteria (Definition of Done)
- Can open a local PDF and render all pages with zoom/pan.
- Can create new text boxes and edit existing approximated text regions.
- Can move/resize text boxes; change font, size, color, alignment.
- Exported PDF visually matches the edits on at least 95% of test PDFs.
- No server calls for core flow; works offline after initial load (optional PWA).
- Works on latest Chrome, Edge, Firefox, Safari desktop.

---

## Suggested Folder Structure
```
src/
  components/
    Viewer/
    Toolbar/
    TextBox/
  hooks/
  state/
  utils/
  styles/
  app.tsx
public/
index.html
```

---

## Developer Setup
- Node 18+
- Package manager: pnpm or npm
- Scripts:
  - `dev`: start vite dev server
  - `build`: production build
  - `preview`: preview production build

---

## Coding Standards (Important)
- TypeScript everywhere; strict mode on.
- Each function, class, and module must include a brief header comment above its definition describing purpose, parameters, return value, side effects, and assumptions.
- Prefer small, focused components and hooks; separate rendering from state logic.
- Avoid deep nesting; use guard clauses.
- ESLint + Prettier configured; no unused variables; no `any` unless justified.

---

## Future Enhancements (Post v1)
- Text style pickers for letter spacing/line height; text rotation.
- Snapping to guides/grids; smart alignment.
- Redaction mode; highlight/underline annotations.
- Multi-select and bulk operations.
- Page operations (reorder, delete, rotate).
- Basic shapes (rectangles, arrows) as overlays.
- Optional server worker for heavy PDFs (opt-in).


