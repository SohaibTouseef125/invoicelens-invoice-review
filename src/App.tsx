import { useRef, useState } from "react";
import { ScanText, UploadCloud, FileUp, ShieldCheck } from "lucide-react";
import DocumentViewer from "./components/DocumentViewer";
import ReviewPanel from "./components/ReviewPanel";
import { initialFields } from "./data";
import type { BBox, DocKind, InvoiceField, LogAction, LogEntry } from "./types";

let logId = 0;
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const freshFields = (): InvoiceField[] => initialFields.map((f) => ({ ...f, bbox: { ...f.bbox } }));

export default function App() {
  const [fields, setFields] = useState<InvoiceField[]>(freshFields());
  const [log, setLog] = useState<LogEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [docKind, setDocKind] = useState<DocKind>("sample");
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState("sample-invoice.pdf");
  const [showBoxes, setShowBoxes] = useState(true);
  const [drawMode, setDrawMode] = useState(false);
  const [pendingBbox, setPendingBbox] = useState<BBox | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLog = (action: LogAction, fieldLabel: string, detail: string) =>
    setLog((l) => [...l, { id: ++logId, time: now(), action, fieldLabel, detail }]);

  const loadFile = async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    try {
      if (isPdf) {
        setPdfBusy(true);
        // Lazy-loaded so the PDF engine stays out of the initial bundle.
        const pdfjsLib = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        setDocUrl(canvas.toDataURL("image/png"));
        setDocKind("pdf");
      } else if (file.type.startsWith("image/")) {
        setDocUrl(URL.createObjectURL(file));
        setDocKind("image");
      } else {
        alert("Please upload a PDF or an image file (PNG/JPG).");
        return;
      }
      setDocName(file.name);
      setFields(freshFields());
      setSelectedId(null);
      setPendingBbox(null);
      setLog([]);
      addLog("upload", "Document", `Uploaded "${file.name}" - extraction re-run (demo field set).`);
    } catch {
      alert("Could not read that file. Please try another PDF or image.");
    } finally {
      setPdfBusy(false);
    }
  };

  const loadSample = () => {
    setDocKind("sample");
    setDocUrl(null);
    setDocName("sample-invoice.pdf");
    setFields(freshFields());
    setSelectedId(null);
    setPendingBbox(null);
    setLog([]);
    addLog("upload", "Document", "Sample invoice loaded.");
  };

  const patch = (id: string, fn: (f: InvoiceField) => InvoiceField) =>
    setFields((fs) => fs.map((f) => (f.id === id ? fn(f) : f)));

  const commitEdit = (id: string, value: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f || value === f.value) return;
    patch(id, (x) => ({ ...x, value, status: value === x.originalValue ? "pending" : "edited" }));
    addLog("edit", f.label, `"${f.value}" -> "${value}"`);
  };

  const approve = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f || f.status === "approved") return;
    patch(id, (x) => ({ ...x, status: "approved" }));
    addLog("approve", f.label, `Approved with value "${f.value}".`);
  };

  const unapprove = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    patch(id, (x) => ({ ...x, status: x.value !== x.originalValue ? "edited" : "pending" }));
    addLog("unapprove", f.label, "Approval removed - back to review.");
  };

  const revert = (id: string) => {
    const f = fields.find((x) => x.id === id);
    if (!f) return;
    patch(id, (x) => ({ ...x, value: x.originalValue, status: "pending" }));
    addLog("revert", f.label, `Reverted to extracted value "${f.originalValue}".`);
  };

  const approveAll = () => {
    setFields((fs) => fs.map((f) => ({ ...f, status: "approved" })));
    addLog("approve", "All fields", `All ${fields.length} fields approved in bulk.`);
  };

  const reset = () => {
    setFields(freshFields());
    setSelectedId(null);
    addLog("reset", "Review", "Review reset to the original extraction.");
  };

  const addCustomField = (label: string, value: string) => {
    if (!pendingBbox) return;
    const id = `custom-${Date.now()}`;
    setFields((fs) => [
      ...fs,
      {
        id, label, value: value || "-", originalValue: value || "-",
        confidence: 100, bbox: pendingBbox, status: "pending", custom: true,
      },
    ]);
    addLog("add", label, "Custom field added from a manually drawn box.");
    setPendingBbox(null);
    setSelectedId(id);
  };

  const exportJson = () => {
    const payload = {
      document: docName,
      exportedAt: new Date().toISOString(),
      fields: fields.map(({ label, value, status, confidence, bbox }) => ({ label, value, status, confidence, bbox })),
      changeLog: log,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "invoice-review.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const approvedCount = fields.filter((f) => f.status === "approved").length;

  return (
    <div
      className="app"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) void loadFile(f); }}
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><ScanText size={20} /></div>
          <div>
            <div className="brand-name">InvoiceLens</div>
            <div className="brand-sub">AI Invoice Review</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="secure-note"><ShieldCheck size={14} /> Files never leave your browser</span>
          <span className={`review-pill ${approvedCount === fields.length ? "pill-done" : ""}`}>
            {approvedCount}/{fields.length} approved
          </span>
          <button className="btn btn-ghost" onClick={loadSample}><FileUp size={15} /> Sample invoice</button>
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            <UploadCloud size={15} /> {pdfBusy ? "Reading PDF..." : "Upload invoice"}
          </button>
          <input
            ref={fileRef} type="file" accept=".pdf,image/*" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadFile(f); e.target.value = ""; }}
          />
        </div>
      </header>

      <main className="main">
        <DocumentViewer
          fields={fields}
          selectedId={selectedId}
          onSelect={setSelectedId}
          docKind={docKind}
          docUrl={docUrl}
          docName={docName}
          showBoxes={showBoxes}
          onToggleBoxes={() => setShowBoxes((s) => !s)}
          drawMode={drawMode}
          onToggleDraw={() => setDrawMode((d) => !d)}
          onDrawComplete={(b) => { setPendingBbox(b); setDrawMode(false); }}
        />
        <ReviewPanel
          fields={fields}
          log={log}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCommitEdit={commitEdit}
          onApprove={approve}
          onUnapprove={unapprove}
          onRevert={revert}
          onApproveAll={approveAll}
          onReset={reset}
          onExport={exportJson}
          pendingBbox={pendingBbox}
          onAddCustomField={addCustomField}
          onCancelCustomField={() => setPendingBbox(null)}
        />
      </main>

      {dragging && (
        <div className="drop-overlay">
          <UploadCloud size={40} />
          <p>Drop an invoice PDF or image to review it</p>
        </div>
      )}
    </div>
  );
}
