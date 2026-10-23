import { useState } from "react";
import {
  Check, CheckCheck, PencilLine, RotateCcw, Download, History,
  ListChecks, CircleAlert, Plus, X, Undo2,
} from "lucide-react";
import type { BBox, InvoiceField, LogEntry } from "../types";

interface Props {
  fields: InvoiceField[];
  log: LogEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCommitEdit: (id: string, value: string) => void;
  onApprove: (id: string) => void;
  onUnapprove: (id: string) => void;
  onRevert: (id: string) => void;
  onApproveAll: () => void;
  onReset: () => void;
  onExport: () => void;
  pendingBbox: BBox | null;
  onAddCustomField: (label: string, value: string) => void;
  onCancelCustomField: () => void;
}

const actionIcon = (a: LogEntry["action"]) => {
  switch (a) {
    case "approve": return <Check size={13} />;
    case "edit": return <PencilLine size={13} />;
    case "add": return <Plus size={13} />;
    case "revert": return <Undo2 size={13} />;
    default: return <History size={13} />;
  }
};

export default function ReviewPanel(p: Props) {
  const [tab, setTab] = useState<"fields" | "log">("fields");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "edited">("all");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const approved = p.fields.filter((f) => f.status === "approved").length;
  const edited = p.fields.filter((f) => f.status === "edited").length;
  const pct = p.fields.length ? Math.round((approved / p.fields.length) * 100) : 0;
  const visible = p.fields.filter((f) => filter === "all" || f.status === filter);
  const allDone = approved === p.fields.length && p.fields.length > 0;

  return (
    <aside className="panel">
      <div className="panel-summary">
        <div className="progress-ring" style={{ ["--pct" as string]: pct }}>
          <span>{pct}%</span>
        </div>
        <div className="summary-text">
          <div className="summary-title">{allDone ? "Review complete" : "Review in progress"}</div>
          <div className="summary-sub">{approved} of {p.fields.length} fields approved{edited > 0 ? ` · ${edited} edited` : ""}</div>
          <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      {allDone && (
        <div className="complete-banner">
          <CheckCheck size={16} /> All fields approved — this invoice is ready to export.
        </div>
      )}

      {p.pendingBbox && (
        <div className="add-field-card">
          <div className="add-field-head">
            <span><Plus size={14} /> New field from drawn box</span>
            <button className="icon-btn" onClick={p.onCancelCustomField} title="Cancel"><X size={14} /></button>
          </div>
          <input placeholder="Field name (e.g. Bank Account)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <input placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
          <button
            className="btn btn-primary btn-sm"
            disabled={!newLabel.trim()}
            onClick={() => { p.onAddCustomField(newLabel.trim(), newValue.trim()); setNewLabel(""); setNewValue(""); }}
          >
            Add field
          </button>
        </div>
      )}

      <div className="tabs">
        <button className={tab === "fields" ? "tab tab-active" : "tab"} onClick={() => setTab("fields")}>
          <ListChecks size={15} /> Fields
        </button>
        <button className={tab === "log" ? "tab tab-active" : "tab"} onClick={() => setTab("log")}>
          <History size={15} /> Change Log
          {p.log.length > 0 && <span className="tab-badge">{p.log.length}</span>}
        </button>
      </div>

      {tab === "fields" ? (
        <>
          <div className="filter-row">
            {(["all", "pending", "edited", "approved"] as const).map((f) => (
              <button key={f} className={filter === f ? "chip chip-active" : "chip"} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="field-list">
            {visible.map((f) => (
              <FieldCard key={f.id} f={f} selected={p.selectedId === f.id} {...p} />
            ))}
            {visible.length === 0 && <div className="empty">No fields with this status.</div>}
          </div>
        </>
      ) : (
        <div className="log-list">
          {p.log.length === 0 && (
            <div className="empty">
              <CircleAlert size={18} />
              <p>No changes yet. Edits, approvals and new fields will appear here as an audit trail.</p>
            </div>
          )}
          {[...p.log].reverse().map((e) => (
            <div key={e.id} className={`log-entry log-${e.action}`}>
              <span className="log-icon">{actionIcon(e.action)}</span>
              <div className="log-body">
                <div className="log-top"><strong>{e.fieldLabel}</strong><time>{e.time}</time></div>
                <div className="log-detail">{e.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel-footer">
        <button className="btn btn-primary" onClick={p.onApproveAll}><CheckCheck size={15} /> Approve all</button>
        <button className="btn btn-ghost" onClick={p.onReset}><RotateCcw size={15} /> Reset</button>
        <button className="btn btn-dark" onClick={p.onExport}><Download size={15} /> Export JSON</button>
      </div>
    </aside>
  );
}

function FieldCard(props: Props & { f: InvoiceField; selected: boolean }) {
  const { f } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? f.value;

  const commit = () => {
    if (draft !== null && draft !== f.value) props.onCommitEdit(f.id, draft);
    setDraft(null);
  };

  return (
    <div
      className={`field-card fc-${f.status} ${props.selected ? "fc-selected" : ""}`}
      onClick={() => props.onSelect(f.id)}
    >
      <div className="fc-head">
        <span className="fc-label">{f.label}{f.custom ? " · custom" : ""}</span>
        <span className={`conf ${f.confidence < 92 ? "conf-low" : ""}`} title="Extraction confidence">{f.confidence}%</span>
        <span className={`status-pill sp-${f.status}`}>{f.status}</span>
      </div>
      <div className="fc-input-row">
        <input
          value={value}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          onClick={(e) => e.stopPropagation()}
          aria-label={f.label}
        />
        {f.status === "approved" ? (
          <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); props.onUnapprove(f.id); }} title="Move back to pending">
            <Undo2 size={13} /> Undo
          </button>
        ) : (
          <button className="btn btn-approve btn-sm" onClick={(e) => { e.stopPropagation(); commit(); props.onApprove(f.id); }} title="Approve this field">
            <Check size={13} /> Approve
          </button>
        )}
        {f.value !== f.originalValue && (
          <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setDraft(null); props.onRevert(f.id); }} title={`Revert to extracted value: ${f.originalValue}`}>
            <RotateCcw size={13} />
          </button>
        )}
      </div>
      {f.value !== f.originalValue && (
        <div className="fc-original">Extracted: <s>{f.originalValue}</s></div>
      )}
    </div>
  );
}
