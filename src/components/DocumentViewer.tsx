import { useRef, useState } from "react";
import { MousePointer2, PenBox, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import type { BBox, DocKind, InvoiceField } from "../types";
import { lineItems } from "../data";

interface Props {
  fields: InvoiceField[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  docKind: DocKind;
  docUrl: string | null;
  docName: string;
  showBoxes: boolean;
  onToggleBoxes: () => void;
  drawMode: boolean;
  onToggleDraw: () => void;
  onDrawComplete: (bbox: BBox) => void;
}

function boxStyle(b: BBox): React.CSSProperties {
  return { left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` };
}

export default function DocumentViewer(p: Props) {
  const [zoom, setZoom] = useState(1);
  const [draft, setDraft] = useState<BBox | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const toPct = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!p.drawMode) return;
    const s = toPct(e);
    startRef.current = s;
    setDraft({ x: s.x, y: s.y, w: 0, h: 0 });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!p.drawMode || !startRef.current) return;
    const c = toPct(e);
    const s = startRef.current;
    setDraft({ x: Math.min(s.x, c.x), y: Math.min(s.y, c.y), w: Math.abs(c.x - s.x), h: Math.abs(c.y - s.y) });
  };
  const onPointerUp = () => {
    if (!p.drawMode || !draft) return;
    if (draft.w > 2 && draft.h > 1.5) p.onDrawComplete(draft);
    setDraft(null);
    startRef.current = null;
  };

  const renderBoxes = (insidePaper: boolean) =>
    p.showBoxes &&
    p.fields.map((f) => (
      <button
        key={f.id}
        type="button"
        className={`bbox bbox-${f.status} ${p.selectedId === f.id ? "bbox-selected" : ""} ${insidePaper ? "bbox-in-paper" : ""}`}
        style={boxStyle(f.bbox)}
        onClick={(e) => {
          e.stopPropagation();
          p.onSelect(f.id);
        }}
        title={`${f.label}: ${f.value}`}
      >
        <span className="bbox-chip">
          {f.label} · {f.confidence}%
        </span>
      </button>
    ));

  return (
    <section className="viewer">
      <div className="viewer-toolbar">
        <div className="viewer-file">
          <span className="file-badge">{p.docKind === "pdf" ? "PDF" : p.docKind === "image" ? "IMG" : "DEMO"}</span>
          <span className="file-name" title={p.docName}>{p.docName}</span>
        </div>
        <div className="viewer-tools">
          <button className={`tool-btn ${!p.drawMode ? "tool-active" : ""}`} onClick={p.drawMode ? p.onToggleDraw : undefined} title="Select mode">
            <MousePointer2 size={15} /> Select
          </button>
          <button className={`tool-btn ${p.drawMode ? "tool-active" : ""}`} onClick={p.onToggleDraw} title="Draw a box on the document to add a custom field">
            <PenBox size={15} /> Draw box
          </button>
          <span className="tool-sep" />
          <button className="tool-btn tool-icon" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))} title="Zoom out"><ZoomOut size={15} /></button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="tool-btn tool-icon" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))} title="Zoom in"><ZoomIn size={15} /></button>
          <button className="tool-btn tool-icon" onClick={() => setZoom(1)} title="Fit"><Maximize size={15} /></button>
          <span className="tool-sep" />
          <label className="toggle">
            <input type="checkbox" checked={p.showBoxes} onChange={p.onToggleBoxes} />
            <span>Highlights</span>
          </label>
        </div>
      </div>

      {p.drawMode && <div className="draw-hint">Draw mode: click and drag on the document to mark a new field region.</div>}

      <div className="viewer-scroll">
        <div className="stage-scale" style={{ transform: `scale(${zoom})` }}>
          {p.docKind === "sample" ? (
            <div
              className={`paper ${p.drawMode ? "paper-drawing" : ""}`}
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* header decor */}
              <div className="paper-accent" />
              <div className="paper-head-left">
                <div className="paper-logo">V</div>
                <div>
                  <div className="paper-brand">VERTEX</div>
                  <div className="paper-brand-sub">SUPPLIES INC.</div>
                </div>
              </div>
              <div className="paper-title">INVOICE</div>

              {/* field content blocks (positions match their bboxes) */}
              <div className="paper-field" style={boxStyle(p.fields.find((f) => f.id === "vendor")!.bbox)}>
                <div className="pf-label">FROM</div>
                <div className="pf-strong">{p.fields.find((f) => f.id === "vendor")!.value}</div>
                <div className="pf-small">440 Market Street, San Francisco, CA</div>
                <div className="pf-small">billing@vertexsupplies.com</div>
              </div>
              <div className="paper-field" style={boxStyle(p.fields.find((f) => f.id === "billTo")!.bbox)}>
                <div className="pf-label">BILL TO</div>
                <div className="pf-strong">{p.fields.find((f) => f.id === "billTo")!.value}</div>
                <div className="pf-small">1 Market Plaza, San Francisco, CA</div>
                <div className="pf-small">ap@offset.example</div>
              </div>

              {(["invoiceNumber", "invoiceDate", "dueDate", "poNumber"] as const).map((id) => {
                const f = p.fields.find((x) => x.id === id)!;
                return (
                  <div key={id} className="paper-field paper-meta" style={boxStyle(f.bbox)}>
                    <span className="pf-label">{f.label.toUpperCase()}</span>
                    <span className="pf-meta-value">{f.value}</span>
                  </div>
                );
              })}

              {/* line items decor */}
              <div className="paper-items">
                <table>
                  <thead>
                    <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <tr key={li.desc}><td>{li.desc}</td><td>{li.qty}</td><td>{li.rate}</td><td>{li.amount}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="paper-field" style={boxStyle(p.fields.find((f) => f.id === "paymentTerms")!.bbox)}>
                <div className="pf-label">PAYMENT TERMS</div>
                <div className="pf-strong-sm">{p.fields.find((f) => f.id === "paymentTerms")!.value}</div>
                <div className="pf-small">Please reference the invoice number on your payment.</div>
              </div>

              {(["subtotal", "tax"] as const).map((id) => {
                const f = p.fields.find((x) => x.id === id)!;
                return (
                  <div key={id} className="paper-field paper-total-row" style={boxStyle(f.bbox)}>
                    <span>{f.label}</span><span>{f.value}</span>
                  </div>
                );
              })}
              <div className="paper-field paper-grand-total" style={boxStyle(p.fields.find((f) => f.id === "total")!.bbox)}>
                <span>Total Due</span>
                <span>{p.fields.find((f) => f.id === "total")!.value}</span>
              </div>

              <div className="paper-foot">Thank you for your business · Vertex Supplies Inc. · Tax ID 94-XXXXXXX</div>

              {renderBoxes(true)}
              {draft && <div className="bbox-draft" style={boxStyle(draft)} />}
            </div>
          ) : (
            <div
              className={`paper paper-image ${p.drawMode ? "paper-drawing" : ""}`}
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {p.docUrl && <img src={p.docUrl} alt={p.docName} className="doc-img" draggable={false} />}
              {renderBoxes(false)}
              {draft && <div className="bbox-draft" style={boxStyle(draft)} />}
            </div>
          )}
        </div>
      </div>

      <div className="legend">
        <span><i className="dot dot-pending" /> Pending review</span>
        <span><i className="dot dot-approved" /> Approved</span>
        <span><i className="dot dot-edited" /> Edited</span>
        <span className="legend-note">Click any highlight to jump to its field</span>
      </div>
    </section>
  );
}
