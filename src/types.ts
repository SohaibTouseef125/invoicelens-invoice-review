export interface BBox {
  x: number; // % from left
  y: number; // % from top
  w: number; // % width
  h: number; // % height
}

export type FieldStatus = "pending" | "approved" | "edited";

export interface InvoiceField {
  id: string;
  label: string;
  value: string;
  originalValue: string;
  confidence: number; // 0-100 extraction confidence
  bbox: BBox;
  status: FieldStatus;
  custom?: boolean;
}

export type LogAction = "edit" | "approve" | "unapprove" | "add" | "revert" | "upload" | "reset";

export interface LogEntry {
  id: number;
  time: string;
  fieldLabel: string;
  action: LogAction;
  detail: string;
}

export type DocKind = "sample" | "image" | "pdf";
