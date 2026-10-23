import type { InvoiceField } from "./types";

/**
 * Demo extraction result. In production these fields + bounding boxes come
 * from an OCR / document-AI API (e.g. Azure Document Intelligence, AWS
 * Textract, Google Document AI). Bounding boxes are percentages of the
 * document width/height so they scale with zoom and screen size.
 */
export const initialFields: InvoiceField[] = [
  {
    id: "vendor",
    label: "Vendor Name",
    value: "Vertex Supplies Inc.",
    originalValue: "Vertex Supplies Inc.",
    confidence: 98,
    bbox: { x: 6, y: 13, w: 38, h: 10 },
    status: "pending",
  },
  {
    id: "billTo",
    label: "Bill To",
    value: "Offset Inc. — Finance Dept.",
    originalValue: "Offset Inc. — Finance Dept.",
    confidence: 92,
    bbox: { x: 6, y: 26, w: 38, h: 10 },
    status: "pending",
  },
  {
    id: "invoiceNumber",
    label: "Invoice Number",
    value: "INV-2026-0847",
    originalValue: "INV-2026-0847",
    confidence: 99,
    bbox: { x: 62, y: 13, w: 32, h: 6 },
    status: "pending",
  },
  {
    id: "invoiceDate",
    label: "Invoice Date",
    value: "21 Oct 2026",
    originalValue: "21 Oct 2026",
    confidence: 96,
    bbox: { x: 62, y: 20, w: 32, h: 6 },
    status: "pending",
  },
  {
    id: "dueDate",
    label: "Due Date",
    value: "20 Nov 2026",
    originalValue: "20 Nov 2026",
    confidence: 94,
    bbox: { x: 62, y: 27, w: 32, h: 6 },
    status: "pending",
  },
  {
    id: "poNumber",
    label: "PO Number",
    value: "PO-5531",
    originalValue: "PO-5531",
    confidence: 89,
    bbox: { x: 62, y: 34, w: 32, h: 6 },
    status: "pending",
  },
  {
    id: "paymentTerms",
    label: "Payment Terms",
    value: "Net 30 · Bank transfer",
    originalValue: "Net 30 · Bank transfer",
    confidence: 90,
    bbox: { x: 6, y: 69, w: 44, h: 12 },
    status: "pending",
  },
  {
    id: "subtotal",
    label: "Subtotal",
    value: "$ 4,250.00",
    originalValue: "$ 4,250.00",
    confidence: 97,
    bbox: { x: 56, y: 69, w: 38, h: 5.5 },
    status: "pending",
  },
  {
    id: "tax",
    label: "Tax (8%)",
    value: "$ 340.00",
    originalValue: "$ 340.00",
    confidence: 95,
    bbox: { x: 56, y: 75.5, w: 38, h: 5.5 },
    status: "pending",
  },
  {
    id: "total",
    label: "Total Due",
    value: "$ 4,590.00",
    originalValue: "$ 4,590.00",
    confidence: 99,
    bbox: { x: 56, y: 82, w: 38, h: 7 },
    status: "pending",
  },
];

export const lineItems = [
  { desc: "Cloud hosting — October (prod)", qty: "1", rate: "$ 1,800.00", amount: "$ 1,800.00" },
  { desc: "Design system consulting (16 hrs)", qty: "16", rate: "$ 95.00", amount: "$ 1,520.00" },
  { desc: "API integration support", qty: "1", rate: "$ 650.00", amount: "$ 650.00" },
  { desc: "Team training workshop", qty: "2", rate: "$ 140.00", amount: "$ 280.00" },
];
