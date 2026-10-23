# InvoiceLens — AI Invoice Review

A professional invoice-review web app built with **React + TypeScript (Vite)**.
Upload an invoice (PDF or image), review the fields an AI/OCR extractor found,
verify them against **bounding-box highlights** drawn directly on the document,
**approve or edit** each field in the side panel, and keep a complete
**change log** (audit trail) of everything that was touched. When every field
is approved, the reviewed result can be exported as JSON.

## Features

- **Upload & display** — drag-and-drop or browse for a PDF / PNG / JPG.
  PDFs are rendered in the browser with PDF.js (page 1), images are shown
  directly. Files never leave the browser.
- **Bounding-box highlights** — every extracted field is drawn on the document
  at its `bbox` coordinates (percent-based, so boxes scale with zoom and
  screen size). Box colour encodes status: indigo = pending, green = approved,
  amber = edited. Hovering/clicking a box shows its label + confidence and
  selects the field in the panel.
- **Review panel** — per-field editor with extraction confidence, status pill,
  approve / undo-approve, one-click revert to the extracted value, status
  filters, a progress ring, and Approve-all / Reset actions.
- **Change log** — every edit, approval, revert, upload and custom field is
  recorded with a timestamp and an old → new diff, as a visible audit trail.
- **Draw-a-box (bonus)** — switch to *Draw box* mode, drag a rectangle on the
  document, and turn it into a new custom field.
- **Zoom controls & highlight toggle**, sample invoice included so the app can
  be evaluated instantly without a file.
- **Export JSON** — downloads the reviewed fields (values, statuses,
  confidences, bboxes) together with the full change log.

## How it maps to the brief

| Requirement | Implementation |
| --- | --- |
| React website | React + TypeScript + Vite |
| Upload invoice & show it | `App.tsx` upload pipeline; PDF.js renders PDFs to a canvas image |
| Highlight boxes on the invoice | `DocumentViewer.tsx` renders `fields[].bbox` as overlay buttons |
| Side panel: approve / edit | `ReviewPanel.tsx` field cards with inputs + Approve/Undo/Revert |
| Change log | `ReviewPanel.tsx` Change Log tab fed by the `log` state in `App.tsx` |
| Bonus: manual boxes | Draw mode in `DocumentViewer.tsx` → custom field form in the panel |

## Data model

Fields and boxes live in `src/data.ts` / `src/types.ts`:

```ts
interface InvoiceField {
  id: string;
  label: string;
  value: string;          // current (possibly edited) value
  originalValue: string;  // as extracted
  confidence: number;     // 0-100
  bbox: { x: number; y: number; w: number; h: number }; // % of document
  status: "pending" | "approved" | "edited";
}
```

In production these would come from a document-AI API (Azure Document
Intelligence, AWS Textract, Google Document AI). The demo ships with a
realistic extracted field set for the sample invoice, and reuses that field
set when a file is uploaded — swapping in a real OCR endpoint only means
replacing `freshFields()` with an API response.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Tech

React · TypeScript · Vite · PDF.js (lazy-loaded, kept out of the initial
bundle) · Lucide icons · hand-rolled CSS design system (no UI framework).

## Author

Sohaib Touseef — Full Stack AI Developer
GitHub: https://github.com/SohaibTouseef125
