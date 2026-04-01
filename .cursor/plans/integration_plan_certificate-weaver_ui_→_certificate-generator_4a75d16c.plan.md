---
name: "Integration Plan: certificate-weaver UI → Certificate-Generator"
overview: Replace the existing Certificate-Generator UI with the new stepper-based workflow from certificate-weaver, adapt it to work within Next.js architecture, soften the design (rounded corners instead of sharp edges, normal shadows instead of hard black), and clean up obsolete files.
todos: []
isProject: false
---

# Integration Plan: certificate-weaver UI → Certificate-Generator

## Phase 1: Dependency Management

**Update `[package.json](package.json)`**

- Add missing dependencies from certificate-weaver:
  - `papaparse` and `@types/papaparse` (CSV parsing)
  - `@radix-ui/*` components (dialog, dropdown-menu, select, tooltip, toast, etc.)
  - `class-variance-authority`, `clsx`, `tailwind-merge` (styling utilities)
  - `lucide-react` (icons)
  - `sonner` (toast notifications)
  - `@tanstack/react-query` (query management)
- Remove unused dependencies:
  - `@dnd-kit/*`, `react-draggable`, `react-color`, `react-pdf`, `pdf-lib`, `pdfjs-dist`
- Keep essential: `jspdf`, `jszip`, `file-saver`, `html2canvas`

## Phase 2: Core Architecture Setup

**Create new structure in `[app/](app/)`**

Context & Types:

- Port `certificate-weaver/src/context/CertificateContext.tsx` → `[app/context/CertificateContext.tsx](app/context/CertificateContext.tsx)`
- Port `certificate-weaver/src/types/certificate.ts` → `[app/types/certificate.ts](app/types/certificate.ts)` (replace existing)
- Port `certificate-weaver/src/lib/utils.ts` → `[app/lib/utils.ts](app/lib/utils.ts)`
- Port `certificate-weaver/src/hooks/use-toast.ts` → `[app/hooks/use-toast.ts](app/hooks/use-toast.ts)`
- Port `certificate-weaver/src/hooks/use-mobile.tsx` → `[app/hooks/use-mobile.tsx](app/hooks/use-mobile.tsx)`

## Phase 3: Component System Integration

**Port shadcn/ui components**

- Copy entire `certificate-weaver/src/components/ui/` → `[app/components/ui/](app/components/ui/)`
- These provide the base primitives (Button, Dialog, Card, etc.)

**Port feature components**

- `certificate-weaver/src/components/Stepper.tsx` → `[app/components/Stepper.tsx](app/components/Stepper.tsx)`
- `certificate-weaver/src/components/UploadStep.tsx` → `[app/components/UploadStep.tsx](app/components/UploadStep.tsx)`
- `certificate-weaver/src/components/PositionStep.tsx` → `[app/components/PositionStep.tsx](app/components/PositionStep.tsx)`
- `certificate-weaver/src/components/ExportStep.tsx` → `[app/components/ExportStep.tsx](app/components/ExportStep.tsx)`
- `certificate-weaver/src/components/CanvasArea.tsx` → `[app/components/CanvasArea.tsx](app/components/CanvasArea.tsx)`
- `certificate-weaver/src/components/FieldCapsuleBar.tsx` → `[app/components/FieldCapsuleBar.tsx](app/components/FieldCapsuleBar.tsx)`
- `certificate-weaver/src/components/FieldPropertiesPanel.tsx` → `[app/components/FieldPropertiesPanel.tsx](app/components/FieldPropertiesPanel.tsx)`
- `certificate-weaver/src/components/RecipientList.tsx` → `[app/components/RecipientList.tsx](app/components/RecipientList.tsx)`
- `certificate-weaver/src/components/PreviewModal.tsx` → `[app/components/PreviewModal.tsx](app/components/PreviewModal.tsx)`

## Phase 4: Styling System Overhaul

**Update `[app/globals.css](app/globals.css)`**

- Import complete design system from `certificate-weaver/src/index.css`
- Modify CSS variables:
  - **Soften shadows**: Change hard shadows to normal box-shadows
    - `--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3)` instead of `4px 4px 0px #111`
    - `--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4)` instead of `6px 6px 0px #111`
    - `--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5)` instead of `10px 10px 0px #0d0d0d`
  - **Add rounded corners**: Update border-radius values
    - Change `border-radius: 4px` → `border-radius: 8px` for buttons/capsules
    - Use `12px` for cards/panels, `6px` for inputs
- Remove `.press-effect` class (tied to hard shadows)
- Keep utility classes: `.dot-grid`, `.heading`, `.subtext`, `.label-sm`, `.stepper-label`

**Update Tailwind config**

- Merge `certificate-weaver/tailwind.config.ts` settings into `[tailwind.config.ts](tailwind.config.ts)` or create new one
- Update shadow utilities to use normal shadows instead of hard offsets
- Ensure rounded corner utilities are available (`rounded-lg`, `rounded-xl`)

## Phase 5: Main Page Replacement

**Rewrite `[app/page.tsx](app/page.tsx)`**

- Remove all old component imports and state management
- Import new components: `Stepper`, `UploadStep`, `PositionStep`, `ExportStep`
- Wrap in `CertificateProvider` from context
- Simple structure:

```tsx
  <CertificateProvider>
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header>Certificate Generator</header>
      <Stepper />
      {step === 1 && <UploadStep />}
      {step === 2 && <PositionStep />}
      {step === 3 && <ExportStep />}
    </div>
  </CertificateProvider>


```

**Update `[app/layout.tsx](app/layout.tsx)`**

- Add providers: `QueryClientProvider`, `TooltipProvider`
- Add `Toaster` components (Radix + Sonner)
- Update font imports to include Inter, Playfair Display, Montserrat via next/font/google

## Phase 6: Adapt Export Logic

**Update generation libraries**

- Keep `[app/lib/certificateGenerator.ts](app/lib/certificateGenerator.ts)` core logic
- Modify to work with new field placement system (percentage-based positions)
- Integrate with `ExportStep.tsx`'s PNG/PDF generation flow
- Keep `[app/lib/bulkExport.ts](app/lib/bulkExport.ts)` but adapt for new data structure

## Phase 7: Component Styling Refinement

**Apply rounded corner modifications to all ported components:**

- `UploadStep.tsx`: Upload zones, file preview strips
- `FieldCapsuleBar.tsx`: Field capsules
- `FieldPropertiesPanel.tsx`: Input fields, color picker, toggle buttons
- `CanvasArea.tsx`: Toolbar buttons, zoom controls
- `RecipientList.tsx`: List rows, search input, action buttons
- `ExportStep.tsx`: Summary card, CTA button, dropdown panel
- `PreviewModal.tsx`: Modal panel
- All `ui/` components: Buttons, Cards, Dialogs, Dropdowns, Inputs

**Replace button press effects:**

- Remove `translate-y-[2px]` hard shadow press animations
- Add subtle scale transforms: `active:scale-95 transition-transform`
- Use normal hover shadows: `hover:shadow-lg`

## Phase 8: Clean Up Old Files

**Delete obsolete components:**

- `[app/components/TemplateUploader.tsx](app/components/TemplateUploader.tsx)` (replaced by UploadStep)
- `[app/components/TextBoxEditor.tsx](app/components/TextBoxEditor.tsx)` (replaced by CanvasArea)
- `[app/components/MemberManager.tsx](app/components/MemberManager.tsx)` (replaced by RecipientList)
- `[app/components/FieldModal.tsx](app/components/FieldModal.tsx)` (no longer needed)
- `[app/components/MemberFormModal.tsx](app/components/MemberFormModal.tsx)` (CSV-based now)
- `[app/components/CertificatePreview.tsx](app/components/CertificatePreview.tsx)` (replaced by PreviewModal)
- `[app/components/PreviewModal.tsx](app/components/PreviewModal.tsx)` (will be replaced)
- `[app/components/ExportControls.tsx](app/components/ExportControls.tsx)` (replaced by ExportStep)

**Delete unused library files:**

- `[app/lib/pdfGenerator.ts](app/lib/pdfGenerator.ts)` (logic integrated into ExportStep)

**Delete empty folders** after component removal

## Phase 9: Configuration Files

**Update/create:**

- `components.json` for shadcn/ui config (copy from certificate-weaver)
- `postcss.config.js` ensure Tailwind is properly configured
- Update `tsconfig.json` path aliases if needed (`@/`* should map correctly)

## Phase 10: Final Polish

**Micro-interactions refinement:**

- Replace all hard shadow animations with smooth transitions
- Update hover states to use `transition-colors duration-150`
- Ensure drag-and-drop zones use smooth opacity/background transitions
- Preview modal entrance: `transition-all duration-200 ease-out`

**Testing checklist:**

- CSV upload and parsing
- Field placement on canvas
- Typography customization
- Recipient list management
- Individual certificate preview
- Bulk export (PNG/PDF)
- Undo/redo functionality
- Zoom and pan on canvas
- Ghost text cursor during placement

## Key Technical Decisions

1. **State Management**: Use CertificateContext (React Context) instead of prop drilling
2. **CSV Parsing**: PapaParse for robust CSV handling
3. **Styling**: Tailwind + CSS variables, normal shadows, rounded corners (8px-12px)
4. **Field Positioning**: Store as percentages, render as pixels based on zoom
5. **Export**: Client-side Canvas API + jsPDF + JSZip
6. **No Backend**: Fully client-side operation maintained

## Shadow & Corner Standards

**Shadows:**

- Small elements (buttons, capsules): `0 2px 8px rgba(0,0,0,0.3)`
- Medium panels (toolbars): `0 4px 12px rgba(0,0,0,0.4)`
- Large surfaces (modals, canvas): `0 8px 24px rgba(0,0,0,0.5)`

**Rounded Corners:**

- Buttons, capsules, small inputs: `8px`
- Cards, panels, larger surfaces: `12px`
- Modals: `16px`
- Never use sharp `0px` or tiny `4px` values

Project Overview
  Build a single-page, bulk-only certificate generator web application. The user uploads a certificate template image and a CSV file, positions fields on the template using a click-to-place interaction, customizes each field's typography, previews individual certificates, manages the recipient list, and exports a ZIP of generated certificates. The entire experience lives on one application shell with a top stepper guiding the user through three distinct phases.
  Design System
  Philosophy: Flat, grounded, heavy. No gradients. No emojis. No rounded bubbly UI. Every element should feel like it has physical weight — achieved through layered box shadows, strong borders, and deliberate use of grey tones. The UI should feel like a professional desktop tool, not a SaaS marketing page.
  Color Palette:
  --bg-base: #1a1a1a — page background
  --bg-surface: #242424 — cards, panels, canvas surround
  --bg-raised: #2e2e2e — inputs, dropdowns, list rows
  --bg-hover: #383838 — hover state for interactive rows and buttons
  --border: #3d3d3d — all borders and dividers
  --border-strong: #555555 — active/focused borders
  --text-primary: #f0f0f0 — headings, labels
  --text-secondary: #999999 — subtext, hints, placeholders
  --text-disabled: #555555 — inactive elements
  --accent: #d4a843 — the single accent color, used for active stepper step, active field capsule ring, CTA buttons, and selected states. A warm amber-gold, grounded and non-neon.
  --accent-dim: #3a2e12 — accent background tint for selected states
  --danger: #c0392b — remove/delete actions
  --danger-dim: #2e1210 — danger background tint
  --success: #27ae60 — success states, generation complete indicator
  Shadows (the depth system):
  --shadow-sm: 4px 4px 0px #111111 — small interactive elements like capsules and buttons
  --shadow-md: 6px 6px 0px #111111 — panels, toolbars
  --shadow-lg: 10px 10px 0px #0d0d0d — modals, canvas area
  All shadows are hard/offset — zero blur, zero spread. This is what gives the UI its grounded, physical character.
  Typography:
  Font: Inter (Google Fonts). Load weights 400, 500, 600.
  All UI labels: 13px / weight 500 / letter-spacing 0.02em
  Section headings: 15px / weight 600
  Subtext / hints: 12px / weight 400 / --text-secondary
  Stepper labels: 12px / weight 600 / uppercase / letter-spacing 0.08em
  Borders: All interactive containers use a 1px solid var(--border) border. Active/focused states upgrade to 1px solid var(--border-strong). No border-radius above 4px anywhere in the app. Capsules use exactly border-radius: 4px.
  Top Stepper
  A fixed top bar below the app header. Three steps: UPLOAD, POSITION, EXPORT. Each step is a horizontally laid out block with a step number circle and a label. The active step renders the circle in --accent with --bg-base text. Completed steps render a filled checkmark circle in --border-strong. Inactive steps use --text-disabled. Steps are connected by a horizontal line in --border. The stepper is not clickable — it advances only when the current step's requirements are satisfied. The stepper has --shadow-md beneath it to separate it from the page content below.
  Step 1 — Upload
  Layout: Two side-by-side upload zones centered on the page, each equal width, with a visible gap between them.
  Template Image Upload Zone:
  A large bordered rectangle with border: 2px dashed var(--border-strong).
  Label: "CERTIFICATE TEMPLATE" in --text-secondary, 11px, uppercase, letter-spacing 0.1em.
  Subtext below: "Upload a PNG or JPG of your blank certificate"
  On hover the dashed border transitions to --accent over 150ms.
  On file drop or click-to-upload, the zone collapses into a compact preview strip showing a thumbnail of the image with filename and a small "Replace" text button aligned right.
  Micro-interaction: when a file is dragged over the zone, the entire zone background shifts to --accent-dim and the dashed border becomes solid accent.
  CSV Upload Zone:
  Identical layout and behavior as the template zone.
  Label: "RECIPIENT CSV"
  Subtext: "Upload a CSV — each column becomes a field"
  On successful parse, the zone collapses into a compact strip showing: filename, row count ("42 recipients"), and column count ("5 fields detected"), with a "Replace" text button.
  If CSV parsing fails (malformed file, empty file), show an inline error in --danger color beneath the zone: "Could not parse this file. Check that it is a valid CSV with headers."
  Advance Condition: Both files successfully uploaded and parsed. The stepper's "Next" CTA button (bottom-right of the upload section, styled in --accent background with --bg-base text, --shadow-sm) becomes active. It reads "CONTINUE TO POSITION". Before both are ready it is visually disabled in --text-disabled / --bg-raised.
  Step 2 — Position
  This is the primary workspace. The layout is a two-column split: the left column is the canvas area (roughly 65% width), the right column is the field properties panel (roughly 35% width). Both columns are full viewport height minus the stepper, with internal scroll where needed.
  Left Column — Canvas Area
  Canvas Toolbar (top of left column):
  A slim horizontal bar sitting above the canvas. It contains, left to right:
  Undo button (icon + label "UNDO") and Redo button (icon + label "REDO"). Both are flat buttons with --shadow-sm. Disabled state uses --text-disabled. Keyboard shortcuts: Ctrl+Z / Ctrl+Y.
  A divider.
  Zoom controls: a minus button, a zoom percentage readout (e.g. "100%"), and a plus button. Also support scroll-wheel zoom on the canvas. A "FIT" button resets zoom to fit the template in the available canvas area.
  These buttons are small, 32px tall, with 1px solid var(--border) borders and --shadow-sm.
  Canvas:
  The canvas area below the toolbar has a background of --bg-base with a subtle dot-grid pattern (1px dots, --border color, 20px spacing) to indicate it is an interactive surface.
  The certificate template image is rendered centered inside the canvas at the current zoom level.
  The template image has --shadow-lg beneath it to make it feel like a physical document sitting on a desk.
  Pan is achieved by middle-mouse drag or spacebar + left-mouse drag. Zoom via scroll wheel or the toolbar controls.
  Zoom range: 25% to 300%.
  Field Placement Interaction:
  When the user clicks a field capsule in the capsule bar (described below), the cursor changes to a crosshair when hovering the canvas. A ghost text label follows the cursor, showing the field's placeholder value (e.g. "John Smith" if the first row's value for that column), rendered in the field's current font settings. This gives the user a live preview of where the text will land.
  On click within the canvas, the field is placed at that coordinate. Its position is stored as a percentage of the template image's natural dimensions (not pixels), so it is resolution-independent.
  Once placed, the field renders on the canvas as a text element. It is not draggable after placement — to reposition it the user must remove it (via the capsule's X) and re-place it. This is intentional and keeps the interaction model simple.
  A placed field shows a thin bounding box outline in --accent when it is the currently selected field (selected by clicking on it in the canvas or clicking its capsule). The outline disappears in the final output.
  Undo/redo tracks every place and remove action as discrete steps.
  Field Capsule Bar (above the canvas, below the toolbar):
  A horizontally scrollable row of capsules. Each capsule represents one column from the CSV.
  Capsule anatomy: [FIELD NAME] [X]. The field name is uppercase, 12px, weight 600. The X is a small remove button on the right inside the capsule.
  Unplaced capsule: --bg-raised background, --border border, --shadow-sm. Text in --text-primary.
  Active / currently-being-placed capsule: --accent-dim background, --accent border (2px), --shadow-sm. Text in --accent.
  Placed capsule (already on canvas): --bg-surface background, --border-strong border, checkmark icon prepended to the label. Text in --text-secondary to indicate it is committed.
  Clicking a placed capsule selects that field on the canvas and loads its properties in the right panel, but does not re-enter placement mode.
  Clicking an unplaced capsule enters placement mode for that field.
  Pressing Escape cancels placement mode without placing anything.
  The X inside a capsule removes the field entirely: if it was placed on the canvas it is removed from the canvas, its properties reset, and its capsule returns to the unplaced state. This action is undoable.
  Micro-interaction: on capsule click, the capsule does a subtle 2px downward translate for 100ms (press feel, using the hard shadow system).
  Right Column — Field Properties Panel
  Header: "FIELD PROPERTIES" in --text-secondary, uppercase, 11px.
  When no field is selected, the panel shows a centered placeholder message: "Select a field capsule to configure it" in --text-secondary.
  When a field capsule is selected (whether placed or not), the panel shows the following controls for that field. All settings persist per-field across the session.
  Controls in the panel:
  Field name — non-editable label at the top showing the column name. e.g. "NAME". Acts as the panel title.
  Font Family — a styled dropdown (not the browser native select). Shows current font name. Options: Inter, Georgia, Times New Roman, Courier New, Playfair Display, Montserrat. Dropdown opens downward with --shadow-md, rows are 36px tall, hover state uses --bg-hover. The selected option has a left accent bar in --accent.
  Font Size — a number input with minus/plus stepper buttons on either side. Range 6pt to 120pt. Default 24pt. The input field is 56px wide, centered text. Buttons are 32px square with --shadow-sm.
  Text Color — a color swatch button (36x36px, --shadow-sm, --border) that opens a compact color picker popover. The popover contains a hue/saturation square picker, a hue slider, and a hex input field. Default color #1a1a1a.
  Style toggles — three toggle buttons side by side: B (Bold), I (Italic), U (Underline). Each is 36x36px. Active state: --accent background, --bg-base text. Inactive: --bg-raised, --text-secondary. They have --shadow-sm and the same press micro-interaction as capsules (2px translate down on active).
  Text Alignment — three toggle buttons: align-left icon, align-center icon, align-right icon. Same visual treatment as style toggles. Default: center.
  Preview Sample — a small readonly preview box (height 48px, --bg-base, --border, --shadow-sm) that shows the first row's value for this field rendered live with all current style settings applied. Updates in real time as any setting changes. Label above it: "PREVIEW" in --text-secondary, 11px.
  All controls in the panel are separated by 1px solid var(--border) dividers and have 16px of vertical padding between them.
  Person List (below the canvas, left column)
  A panel below the canvas (the canvas and this list share the left column, split vertically — canvas takes priority with a min-height, the list has a fixed height of ~280px with internal scroll).
  Header row:
  Left: "RECIPIENTS" label + a count badge showing "42 / 42 selected" (selected count / total count). The badge is a small pill in --bg-raised with --border.
  Right: a compact search input (icon + placeholder "Search by name or value..."), 200px wide, --bg-raised, --border, --shadow-sm. Filters the list in real time.
  List rows:
  Each row is 44px tall, --bg-raised, 1px solid var(--border) bottom border.
  Left: a sequential index number in --text-disabled (11px, monospace).
  Center: the values of all CSV columns for that row, shown as a single line of text. Primary value (first column) in --text-primary, remaining values concatenated in --text-secondary with a dot separator. e.g. "John Smith · 2024 · Computer Science"
  Right: a minus icon button to deselect/remove this person from the batch. When a person is deselected, the row background becomes --bg-surface (dimmed), the text goes to --text-disabled, and the minus button becomes a plus button to re-add. The minus/plus button is 28x28px, --border, --shadow-sm. Minus button uses --danger icon color on hover. Plus uses --success icon color on hover.
  Micro-interaction: on deselect, the row height does not collapse — it stays in place but visually dims. This preserves the list's spatial structure so the user can easily re-add.
  Hover state for each row: --bg-hover background.
  Preview Certificate button:
  A small "PREVIEW" text button on the right side of each row (appears on row hover only, fading in over 150ms).
  Clicking it opens a modal (described below).
  Preview Modal
  Triggered from any row's "PREVIEW" button.
  A centered modal overlay. Backdrop: rgba(0,0,0,0.75). Modal panel: --bg-surface, --shadow-lg, 1px solid var(--border-strong).
  Modal header: "CERTIFICATE PREVIEW — [PERSON NAME]" in --text-primary, 13px, weight 600. A close button (X) top-right, 32x32px.
  Body: the certificate template image rendered at fit-to-modal size, with all placed fields rendered on top using that specific row's values and each field's typography settings.
  Footer: left/right arrow buttons to cycle through recipients without closing the modal. Center shows "12 / 42" pagination. Arrow buttons are 36x36px with --shadow-sm.
  The modal does not allow editing — it is read-only. A small label at the bottom: "To make changes, close this preview and adjust fields or typography in the editor."
  Step 3 — Export
  Advance to this step via a "CONTINUE TO EXPORT" CTA at the bottom-right of the Position step. This button is only active when at least one field is placed and at least one recipient is selected.
  Export Page Layout:
  A centered summary card (--bg-surface, --shadow-lg, --border, max-width 560px).
  Summary section inside the card:
  Template filename and a small thumbnail.
  "X recipients selected" count.
  "X fields placed" count.
  A listed breakdown of each placed field with its column name and the typography settings applied (font, size, color swatch, style flags) — read-only, for confirmation.
  Bulk Print button:
  A large full-width CTA button, --accent background, --bg-base text, uppercase, weight 600, 48px tall, --shadow-md.
  Label: "GENERATE CERTIFICATES"
  On click, a small dropdown appears directly below the button (not a browser dropdown — a custom panel, --bg-raised, --shadow-md, --border). It contains two options:
  "Export as PNG" — icon + label
  "Export as PDF" — icon + label
  Each option is a 44px tall row, hover state --bg-hover. Clicking either initiates generation.
  Pressing Escape closes the dropdown without selecting.
  The dropdown closes if the user clicks anywhere outside it.
  Generation progress:
  On format selection, the dropdown closes and the button transforms into a progress state: the button background stays --accent, but the label changes to "GENERATING... 0 / 42" and a thin progress bar (4px tall, --bg-base background, --accent fill) animates below the button, tracking certificate generation progress.
  Each certificate is generated client-side using the Canvas API (for PNG) or jsPDF (for PDF).
  When complete: the button label changes to "DOWNLOAD ZIP", the progress bar fills completely, and a success message appears below: "42 certificates ready." in --success.
  Clicking "DOWNLOAD ZIP" triggers the ZIP download (using JSZip), named certificates_[timestamp].zip. Inside, files are named cert_001.png (or .pdf), cert_002.png, etc.
  After download, a "Start Over" text link appears below in --text-secondary, which resets the entire application state back to Step 1.
  Microinteractions Summary (for the engineer)
  All buttons: 100ms press translate of 2px down + shadow collapses to zero on active state, reverting on release. This simulates physical button press using the hard shadow system.
  Capsule click: same press animation.
  Step advance: stepper number circle animates from number to checkmark with a 200ms scale + opacity transition.
  CSV upload parse: after file is dropped, show a 300ms skeleton shimmer on the zone before collapsing to the confirmed state.
  Row deselect: 200ms background color transition, text fades to disabled.
  Preview modal open: scales from 95% to 100% over 180ms with opacity 0 to 1. Backdrop fades in simultaneously.
  Hover on canvas in placement mode: ghost text follows cursor with zero delay (rendered directly on a transparent overlay canvas element on top of the template).
  Font/size/color changes in the properties panel: the canvas re-renders the placed field text in real time, with no debounce — it should feel instant.
  ZIP generation progress bar: eased fill, not stepped, to feel smooth even if the underlying generation is discrete.
  Tech Stack Guidance (for Cursor)
  React with TypeScript.
  Canvas API for certificate rendering (PNG export).
  jsPDF for PDF export.
  JSZip for ZIP packaging.
  PapaParse for CSV parsing.
  All state managed in a single top-level context (UploadState, FieldState, RecipientState, ExportState).
  No backend. Fully client-side.
  No external UI component libraries — all components built from scratch per the design system above.
  Inter font loaded via Google Fonts.
  The canvas overlay for ghost-text cursor tracking should be a separate absolutely positioned  element layered on top of the template image canvas, so the two rendering contexts do not interfere.
  Field positions stored as { x: number, y: number } as percentage of template natural width/height, converted to pixel coordinates at render time based on current display dimensions.
  Undo/redo implemented as a simple action stack: each action is a plain object with type, fieldId, and payload. Max stack depth: 50.
  the UI which was made in lovable for reference is inside here @certificate-weaver
  I want you take all the NEW UI IN HERE and proceed to implement in our project and make all these improvements
  all the new UI is in @certificate-weaver
  make sure you are confident in deleting existing old UI in our project and integrate this new UI
  just one request the edges for buttons and stuff are sharp for my liking so can you keep in mind of the stuff and add simple rounded corners wherever necessary, also the shadow is literally dark solid black colour please change that to heavy normal shadow
  after everything is done dont give me multiple documents and give me only one summary document telling me if the work is done or not and whats changed in just under 50 lines and thats enough
