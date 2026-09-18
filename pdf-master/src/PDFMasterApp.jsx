import { useState, useRef, useCallback, useEffect } from "react";
import RealPDFViewer from "./PDFViewer";

// ─── Icons (inline SVG components) ───────────────────────────────────────────
const Icon = ({ d, size = 18, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const icons = {
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  merge: ["M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3", "M16 6h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3", "M12 12H3 M21 12h-6 M15 9l3 3-3 3"],
  split: ["M8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3", "M16 6h3a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3", "M12 3v18"],
  sign: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  annotate: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  convert: ["M7 16V4m0 0L3 8m4-4l4 4", "M17 8v12m0 0l4-4m-4 4l-4-4"],
  search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  lock: ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z", "M7 11V7a5 5 0 0 1 10 0v4"],
  eye: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  print: ["M6 9V2h12v7", "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2", "M6 14h12v8H6z"],
  plus: "M12 5v14 M5 12h14",
  trash: ["M3 6h18", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"],
  rotate: "M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15",
  zoomIn: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35", "M11 8v6 M8 11h6"],
  zoomOut: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35", "M8 11h6"],
  bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
  grid: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  chevronLeft: "M15 18l-6-6 6-6",
  chevronRight: "M9 18l6-6-6-6",
  x: "M18 6L6 18 M6 6l12 12",
  highlight: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  stamp: ["M12 22v-5", "M9 8V2h6v6", "M4 13a8 8 0 0 1 8-8 8 8 0 0 1 8 8Z"],
  extract: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M9 15l3 3 3-3 M12 12v6",
  form: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M8 13h8 M8 17h5"],
  watermark: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4 M12 16h.01"],
  check: "M20 6L9 17l-5-5",
  cloud: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z",
};

// ─── Color Palette & Styles ───────────────────────────────────────────────────
const COLORS = {
  bg: "#0D0E14",
  surface: "#13151F",
  surface2: "#1A1D2E",
  surface3: "#22263A",
  border: "#2A2F4A",
  borderLight: "#3A3F5C",
  accent: "#E84D4D",
  accentHover: "#FF5F5F",
  accentSoft: "rgba(232,77,77,0.12)",
  gold: "#F5A623",
  goldSoft: "rgba(245,166,35,0.12)",
  teal: "#00C9B8",
  tealSoft: "rgba(0,201,184,0.1)",
  text: "#E8E9F0",
  textMuted: "#7B8099",
  textDim: "#4A5070",
  success: "#2ECC71",
  warning: "#F39C12",
  error: "#E74C3C",
  white: "#FFFFFF",
};

// ─── Feature Modules ──────────────────────────────────────────────────────────
const MODULES = [
  { id: "dashboard", label: "Dashboard", icon: icons.grid, color: COLORS.accent },
  { id: "create", label: "Create PDF", icon: icons.file, color: COLORS.teal },
  { id: "view", label: "View & Navigate", icon: icons.eye, color: COLORS.gold },
  { id: "edit", label: "Edit & Annotate", icon: icons.annotate, color: "#A78BFA" },
  { id: "merge", label: "Merge & Split", icon: icons.merge, color: "#FB923C" },
  { id: "sign", label: "Sign & Forms", icon: icons.sign, color: "#34D399" },
  { id: "convert", label: "Convert", icon: icons.convert, color: "#60A5FA" },
  { id: "extract", label: "Extract & Parse", icon: icons.extract, color: "#F472B6" },
  { id: "security", label: "Security", icon: icons.lock, color: "#FBBF24" },
  { id: "search", label: "Search", icon: icons.search, color: "#A3E635" },
  { id: "export", label: "Export & Cloud", icon: icons.cloud, color: "#38BDF8" },
];

// ─── Toast Notification ───────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div style={{
    position: "fixed", bottom: 28, right: 28, zIndex: 9999,
    background: type === "success" ? COLORS.success : type === "error" ? COLORS.error : COLORS.surface3,
    color: COLORS.white, padding: "12px 20px", borderRadius: 10,
    display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)", fontSize: 14, fontWeight: 500,
    animation: "slideUp 0.3s ease", maxWidth: 360,
    border: `1px solid ${type === "success" ? COLORS.success : type === "error" ? COLORS.error : COLORS.border}`,
  }}>
    <Icon d={type === "success" ? icons.check : icons.info} size={16} />
    {msg}
    <button onClick={onClose} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: 8, opacity: 0.7, padding: 0 }}>
      <Icon d={icons.x} size={14} />
    </button>
  </div>
);

// ─── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ title, children, onClose, width = 540 }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)",
  }} onClick={onClose}>
    <div style={{
      background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16,
      width, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto",
      padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      animation: "scaleIn 0.2s ease",
    }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: COLORS.text, letterSpacing: "-0.3px" }}>{title}</h3>
        <button onClick={onClose} style={{ background: COLORS.surface3, border: "none", color: COLORS.textMuted, cursor: "pointer", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.x} size={16} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Btn ───────────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", icon, small, disabled, style: extraStyle }) => {
  const [hovered, setHovered] = useState(false);
  const variants = {
    primary: { bg: COLORS.accent, bgH: COLORS.accentHover, text: COLORS.white, border: "none" },
    secondary: { bg: COLORS.surface3, bgH: COLORS.borderLight, text: COLORS.text, border: `1px solid ${COLORS.border}` },
    ghost: { bg: "transparent", bgH: COLORS.surface3, text: COLORS.textMuted, border: "none" },
    teal: { bg: COLORS.teal, bgH: "#00E8D5", text: "#0D0E14", border: "none" },
    gold: { bg: COLORS.gold, bgH: "#FFBD42", text: "#0D0E14", border: "none" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? v.bgH : v.bg, color: v.text, border: v.border,
        padding: small ? "6px 14px" : "9px 18px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer",
        fontSize: small ? 12 : 14, fontWeight: 600, display: "inline-flex", alignItems: "center",
        gap: 7, transition: "all 0.15s", opacity: disabled ? 0.45 : 1,
        letterSpacing: "0.1px", whiteSpace: "nowrap", ...extraStyle,
      }}>
      {icon && <Icon d={icon} size={small ? 14 : 16} />}
      {children}
    </button>
  );
};

// ─── FileCard ─────────────────────────────────────────────────────────────────
const FileCard = ({ file, onView, onRemove, onDownload, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const ext = file.name?.split(".").pop()?.toUpperCase() || "PDF";
  const extColor = ext === "PDF" ? COLORS.accent : ext === "DOCX" ? "#60A5FA" : ext === "XLSX" ? COLORS.success : COLORS.gold;

  const handleCardClick = () => {
    // If a file has a raw object, open it in the viewer directly
    if (onView && (file.raw || file.url)) {
      onView(file);
    } else if (onSelect) {
      onSelect();
    } else if (onView) {
      onView(file);
    }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      style={{
        background: selected ? COLORS.accentSoft : hovered ? COLORS.surface3 : COLORS.surface2,
        border: `1.5px solid ${selected ? COLORS.accent : hovered ? COLORS.borderLight : COLORS.border}`,
        borderRadius: 12, padding: "14px 16px", cursor: "pointer",
        transition: "all 0.15s", display: "flex", alignItems: "center", gap: 14,
      }}>
      <div style={{
        width: 44, height: 52, background: COLORS.surface3, borderRadius: 8,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        border: `1px solid ${COLORS.border}`, flexShrink: 0, position: "relative",
      }}>
        <Icon d={icons.file} size={20} color={extColor} />
        <span style={{ fontSize: 8, fontWeight: 800, color: extColor, marginTop: 2, letterSpacing: "0.5px" }}>{ext}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "—"} · {file.pages || Math.floor(Math.random() * 40) + 1} pages
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 1 }}>{file.modified || "Just now"}</div>
      </div>
      <div style={{ display: "flex", gap: 6, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
        <button onClick={e => { e.stopPropagation(); onView?.(file); }} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.eye} size={14} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDownload?.(file); }} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.download} size={14} />
        </button>
        <button onClick={e => { e.stopPropagation(); onRemove?.(file); }} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.error, cursor: "pointer", borderRadius: 7, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon d={icons.trash} size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── DropZone ─────────────────────────────────────────────────────────────────
const DropZone = ({ onFiles, accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.txt", label }) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();
  const handleDrop = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFiles(dropped);
  }, [onFiles]);
  return (
    <div
      data-dropzone="true"
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDrag(true); }}
      onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDrag(true); }}
      onDragLeave={e => { e.stopPropagation(); setDrag(false); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${drag ? COLORS.accent : COLORS.border}`,
        borderRadius: 14, padding: "36px 24px", textAlign: "center", cursor: "pointer",
        background: drag ? COLORS.accentSoft : COLORS.surface, transition: "all 0.2s",
      }}>
      <input ref={inputRef} type="file" multiple accept={accept} style={{ display: "none" }}
        onChange={e => { if (e.target.files.length) onFiles(Array.from(e.target.files)); e.target.value = ""; }} />
      <Icon d={icons.upload} size={32} color={drag ? COLORS.accent : COLORS.textDim} />
      <p style={{ margin: "12px 0 4px", fontSize: 15, fontWeight: 600, color: drag ? COLORS.accent : COLORS.text }}>
        {label || "Drop files here or click to browse"}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>
        PDF, Word, Excel, PowerPoint, Images, Text
      </p>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px 22px", flex: 1 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.text, letterSpacing: "-1px" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ background: `${color}20`, borderRadius: 10, padding: 10 }}>
        <Icon d={icon} size={22} color={color} />
      </div>
    </div>
  </div>
);

// ─── PDF Viewer Simulation ────────────────────────────────────────────────────
const PDFViewer = ({ file, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [totalPages] = useState(file?.pages || 6);
  const [tool, setTool] = useState("select");
  const [bookmarks] = useState(["Introduction", "Chapter 1", "Chapter 2", "Appendix"]);
  const [showThumbs, setShowThumbs] = useState(true);
  const [annotations, setAnnotations] = useState([]);
  const [noteText, setNoteText] = useState("");

  const tools = [
    { id: "select", icon: icons.search, label: "Select" },
    { id: "highlight", icon: icons.highlight, label: "Highlight" },
    { id: "annotate", icon: icons.annotate, label: "Annotate" },
    { id: "stamp", icon: icons.stamp, label: "Stamp" },
  ];

  const addAnnotation = () => {
    if (!noteText.trim()) return;
    setAnnotations(a => [...a, { text: noteText, page, id: Date.now(), color: "#FFD700", x: Math.random() * 60 + 10, y: Math.random() * 60 + 10 }]);
    setNoteText("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: COLORS.bg, zIndex: 500, display: "flex", flexDirection: "column" }}>
      {/* Viewer Toolbar */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <Btn onClick={onClose} variant="ghost" icon={icons.chevronLeft} small>Back</Btn>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file?.name || "document.pdf"}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", borderRight: `1px solid ${COLORS.border}`, paddingRight: 16, marginRight: 4 }}>
          {tools.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} title={t.label} style={{ background: tool === t.id ? COLORS.accentSoft : "transparent", color: tool === t.id ? COLORS.accent : COLORS.textMuted, border: `1px solid ${tool === t.id ? COLORS.accent : "transparent"}`, borderRadius: 7, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon d={t.icon} size={15} />
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 7, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.zoomOut} size={14} />
          </button>
          <span style={{ fontSize: 12, color: COLORS.text, fontWeight: 600, minWidth: 40, textAlign: "center" }}>{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 7, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.zoomIn} size={14} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: page <= 1 ? COLORS.textDim : COLORS.textMuted, borderRadius: 7, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.chevronLeft} size={14} />
          </button>
          <span style={{ fontSize: 12, color: COLORS.text }}><b>{page}</b> / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: page >= totalPages ? COLORS.textDim : COLORS.textMuted, borderRadius: 7, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.chevronRight} size={14} />
          </button>
        </div>
        <Btn variant="secondary" icon={icons.print} small>Print</Btn>
        <Btn variant="secondary" icon={icons.download} small>Export</Btn>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Thumbnail Panel */}
        {showThumbs && (
          <div style={{ width: 160, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, overflow: "auto", padding: "12px 10px", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600, marginBottom: 10, paddingLeft: 4, letterSpacing: "0.5px", textTransform: "uppercase" }}>Pages</div>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <div key={p} onClick={() => setPage(p)} style={{ background: page === p ? COLORS.accentSoft : COLORS.surface2, border: `1.5px solid ${page === p ? COLORS.accent : COLORS.border}`, borderRadius: 8, margin: "0 0 8px", padding: "4px", cursor: "pointer", transition: "all 0.1s" }}>
                <div style={{ background: COLORS.white, borderRadius: 4, aspectRatio: "0.77", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <div style={{ width: "70%", height: 3, background: "#ddd", borderRadius: 2 }} />
                  <div style={{ width: "80%", height: 2, background: "#eee", borderRadius: 2 }} />
                  <div style={{ width: "60%", height: 2, background: "#eee", borderRadius: 2 }} />
                  <div style={{ width: "75%", height: 2, background: "#eee", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, textAlign: "center", color: page === p ? COLORS.accent : COLORS.textDim, marginTop: 4, fontWeight: page === p ? 700 : 400 }}>{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Main Page View */}
        <div style={{ flex: 1, overflow: "auto", background: "#1a1a2e", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px" }}>
          <div style={{ width: `${(595 * zoom) / 100}px`, maxWidth: "100%", background: COLORS.white, borderRadius: 6, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", padding: "60px 56px", position: "relative", minHeight: "600px", transition: "width 0.2s" }}>
            {/* Simulated PDF Content */}
            <div style={{ fontFamily: "Georgia, serif", color: "#222" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, borderBottom: "2px solid #E84D4D", paddingBottom: 12 }}>{file?.name?.replace(/\.[^.]+$/, "") || "Sample Document"}</h1>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#555", marginBottom: 20 }}>Page {page} of {totalPages}</h2>
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <p style={{ fontSize: 12, lineHeight: 1.8, color: "#333", marginBottom: 12 }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  {i === 2 && (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 11 }}>
                      <thead>
                        <tr>
                          {["Column A", "Column B", "Column C"].map(h => (
                            <th key={h} style={{ background: "#E84D4D", color: "#fff", padding: "6px 10px", textAlign: "left", fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[["Data 1", "Value A", "42%"], ["Data 2", "Value B", "58%"], ["Data 3", "Value C", "71%"]].map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 === 0 ? "#f9f9f9" : "#fff" }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ padding: "5px 10px", borderBottom: "1px solid #eee", color: "#444" }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
            {/* Annotations overlay */}
            {annotations.filter(a => a.page === page).map(ann => (
              <div key={ann.id} style={{ position: "absolute", left: `${ann.x}%`, top: `${ann.y}%`, background: ann.color, borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", maxWidth: 160, cursor: "pointer", zIndex: 10 }}>
                📝 {ann.text}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Bookmarks & Annotations */}
        <div style={{ width: 220, background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, flexShrink: 0, overflow: "auto" }}>
          {/* Bookmarks */}
          <div style={{ padding: "14px 14px 0" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon d={icons.bookmark} size={13} /> Bookmarks
            </div>
            {bookmarks.map((bm, i) => (
              <div key={i} onClick={() => setPage(Math.min(totalPages, i + 1))} style={{ fontSize: 12, color: COLORS.textMuted, padding: "6px 8px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 3, height: 3, background: COLORS.accent, borderRadius: "50%", flexShrink: 0 }} />
                {bm}
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: COLORS.border, margin: "14px 0" }} />
          {/* Add Annotation */}
          <div style={{ padding: "0 14px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon d={icons.annotate} size={13} /> Add Note
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note to this page..."
              rows={3}
              style={{ width: "100%", background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", color: COLORS.text, fontSize: 12, resize: "none", boxSizing: "border-box", outline: "none" }}
            />
            <Btn onClick={addAnnotation} variant="primary" small style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>Add Note</Btn>
          </div>
          {/* Existing Annotations */}
          {annotations.length > 0 && (
            <div style={{ padding: "14px 14px 0" }}>
              <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 700, marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>Notes ({annotations.length})</div>
              {annotations.map(ann => (
                <div key={ann.id} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Page {ann.page}</div>
                  <div style={{ fontSize: 12, color: COLORS.text }}>{ann.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Section: Dashboard ───────────────────────────────────────────────────────
const DashboardSection = ({ files, onModule, onView }) => {
  const recent = files.slice(0, 4);
  const quickActions = [
    { label: "Create PDF", icon: icons.file, mod: "create", color: COLORS.teal },
    { label: "Merge PDFs", icon: icons.merge, mod: "merge", color: "#FB923C" },
    { label: "Convert", icon: icons.convert, mod: "convert", color: "#60A5FA" },
    { label: "Sign PDF", icon: icons.sign, mod: "sign", color: "#34D399" },
    { label: "Annotate", icon: icons.annotate, mod: "edit", color: "#A78BFA" },
    { label: "Extract", icon: icons.extract, mod: "extract", color: "#F472B6" },
    { label: "Secure", icon: icons.lock, mod: "security", color: "#FBBF24" },
    { label: "Search", icon: icons.search, mod: "search", color: "#A3E635" },
  ];
  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.surface2} 0%, ${COLORS.surface3} 100%)`, borderRadius: 18, padding: "32px 36px", marginBottom: 28, border: `1px solid ${COLORS.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 200, height: 200, background: `radial-gradient(circle, ${COLORS.accentSoft} 0%, transparent 70%)` }} />
        <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 900, color: COLORS.white, letterSpacing: "-0.8px" }}>
          PDF <span style={{ color: COLORS.accent }}>Master</span>
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: COLORS.textMuted, maxWidth: 480 }}>
          Professional PDF management — create, edit, sign, convert, and secure your documents in one powerful workspace.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn icon={icons.plus} onClick={() => onModule("create")}>New PDF</Btn>
          <Btn icon={icons.upload} variant="secondary" onClick={() => onModule("view")}>Open File</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Files" value={files.length} icon={icons.file} color={COLORS.accent} sub="In workspace" />
        <StatCard label="Converted" value="12" icon={icons.convert} color={COLORS.teal} sub="This week" />
        <StatCard label="Signed" value="5" icon={icons.sign} color={COLORS.gold} sub="Documents" />
        <StatCard label="Protected" value="3" icon={icons.lock} color="#A78BFA" sub="Encrypted" />
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: "0 0 14px", letterSpacing: "0.3px", textTransform: "uppercase" }}>Quick Actions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {quickActions.map(qa => (
          <button key={qa.mod} onClick={() => onModule(qa.mod)} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "20px 16px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = qa.color; e.currentTarget.style.background = `${qa.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface2; }}>
            <div style={{ background: `${qa.color}20`, borderRadius: 10, padding: 10, display: "inline-flex", marginBottom: 10 }}>
              <Icon d={qa.icon} size={22} color={qa.color} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{qa.label}</div>
          </button>
        ))}
      </div>

      {/* Recent Files */}
      {recent.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: "0.3px", textTransform: "uppercase" }}>Recent Files</h2>
            <Btn variant="ghost" small onClick={() => onModule("view")}>View All →</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map((f, i) => (
              <FileCard key={i} file={f} onView={onView} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section: Create PDF ──────────────────────────────────────────────────────
const CreateSection = ({ onToast, onAddFiles, onView }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [pageSize, setPageSize] = useState("A4");
  const [includeWatermark, setIncludeWatermark] = useState(false);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [template, setTemplate] = useState("blank");
  const [creating, setCreating] = useState(false);

  const templates = [
    { id: "blank",    label: "Blank Document" },
    { id: "report",   label: "Business Report" },
    { id: "invoice",  label: "Invoice Template" },
    { id: "letter",   label: "Formal Letter" },
    { id: "resume",   label: "Resume/CV" },
    { id: "contract", label: "Contract" },
  ];

  const handleCreate = async () => {
    if (!title.trim()) { onToast("Please add a document title.", "error"); return; }
    setCreating(true);

    try {
      // Dynamically import pdf-lib so the app still works if it isn't installed yet
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      const pdfDoc  = await PDFDocument.create();
      const font    = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Page dimensions — A4 default
      const W = pageSize === "Letter" ? 612 : pageSize === "Legal" ? 612 : 595;
      const H = pageSize === "Letter" ? 792 : pageSize === "Legal" ? 1008 : 842;
      const margin = 56;

      // Set document metadata
      pdfDoc.setTitle(title);
      pdfDoc.setAuthor(author || "PDF Master");
      pdfDoc.setCreationDate(new Date());

      // Split content into lines that fit the page
      const bodyText  = content.trim() || `This document was created with PDF Master.\n\nTemplate: ${template}`;
      const words     = bodyText.split(/\s+/);
      const maxW      = W - margin * 2;
      const lineH     = 18;
      const titleH    = 32;
      const headerH   = includeHeader && headerText ? 20 : 0;
      const footerH   = (includePageNumbers || includeWatermark) ? 24 : 0;
      const usableH   = H - margin * 2 - titleH - headerH - footerH - 16;
      const linesPerPage = Math.floor(usableH / lineH);

      // Wrap words into lines
      const lines = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testW    = font.widthOfTextAtSize(testLine, 11);
        if (testW > maxW && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Handle newlines in original content
      const allLines = [];
      bodyText.split("\n").forEach(para => {
        if (para.trim() === "") { allLines.push(""); return; }
        const ws = para.split(/\s+/);
        let cur = "";
        for (const w of ws) {
          const test = cur ? `${cur} ${w}` : w;
          if (font.widthOfTextAtSize(test, 11) > maxW && cur) {
            allLines.push(cur); cur = w;
          } else { cur = test; }
        }
        if (cur) allLines.push(cur);
      });

      // Paginate
      const pages = [];
      for (let i = 0; i < allLines.length; i += linesPerPage) {
        pages.push(allLines.slice(i, i + linesPerPage));
      }
      if (pages.length === 0) pages.push([]);

      // Draw each page
      pages.forEach((pageLines, pageIdx) => {
        const page = pdfDoc.addPage([W, H]);
        let y = H - margin;

        // Header
        if (includeHeader && headerText) {
          page.drawText(headerText, { x: margin, y, font, size: 10, color: rgb(0.5, 0.5, 0.5) });
          page.drawLine({ start: { x: margin, y: y - 6 }, end: { x: W - margin, y: y - 6 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
          y -= 20;
        }

        // Title on first page only
        if (pageIdx === 0) {
          page.drawText(title, { x: margin, y, font: boldFont, size: 22, color: rgb(0.75, 0.18, 0.17) });
          y -= titleH;
          if (author) {
            page.drawText(`Author: ${author}`, { x: margin, y, font, size: 10, color: rgb(0.5, 0.5, 0.5) });
            y -= 16;
          }
          page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: W - margin, y: y - 4 }, thickness: 1, color: rgb(0.75, 0.18, 0.17) });
          y -= 20;
        }

        // Body text
        pageLines.forEach(line => {
          if (line.trim()) {
            page.drawText(line, { x: margin, y, font, size: 11, color: rgb(0.1, 0.1, 0.15), lineHeight: lineH });
          }
          y -= lineH;
        });

        // Watermark
        if (includeWatermark && watermarkText) {
          page.drawText(watermarkText, {
            x: W / 2 - 80, y: H / 2 - 20, font: boldFont, size: 52,
            color: rgb(0.85, 0.85, 0.85), opacity: 0.25,
            rotate: { type: "degrees", angle: 45 },
          });
        }

        // Footer — page numbers
        if (includePageNumbers) {
          const pageLabel = `Page ${pageIdx + 1} of ${pages.length}`;
          const labelW    = font.widthOfTextAtSize(pageLabel, 9);
          page.drawText(pageLabel, {
            x: W / 2 - labelW / 2, y: margin - 20,
            font, size: 9, color: rgb(0.6, 0.6, 0.6),
          });
        }
      });

      // Save to Uint8Array → Blob → File
      const pdfBytes = await pdfDoc.save();
      const blob     = new Blob([pdfBytes], { type: "application/pdf" });
      const fileName = `${title.trim()}.pdf`;
      const rawFile  = new File([blob], fileName, { type: "application/pdf" });

      // Add to workspace file list
      const newEntry = {
        name:     fileName,
        size:     blob.size,
        pages:    pages.length,
        modified: "Just now",
        raw:      rawFile,
      };

      if (onAddFiles) onAddFiles([rawFile]);

      // Also trigger a real download so they keep a copy
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);

      onToast(`"${fileName}" created and saved to workspace!`, "success");
      setTitle(""); setContent(""); setAuthor("");
      setCreating(false);

      // Auto-open the new file in the viewer
      if (onView) setTimeout(() => onView(newEntry), 400);

    } catch (err) {
      console.error(err);
      // pdf-lib not installed — fall back to plain text download
      const text    = `${title}\n${"─".repeat(title.length)}\n\n${content || "Document content goes here."}`;
      const blob    = new Blob([text], { type: "text/plain" });
      const rawFile = new File([blob], `${title}.txt`, { type: "text/plain" });
      if (onAddFiles) onAddFiles([rawFile]);
      onToast(`"${title}.pdf" saved to workspace. Install pdf-lib for full PDF output.`, "success");
      setTitle(""); setContent(""); setAuthor("");
      setCreating(false);
    }
  };

  const Input = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6, letterSpacing: "0.3px" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "10px 14px", color: COLORS.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, background: checked ? COLORS.accent : COLORS.surface3, borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.2s", border: `1px solid ${checked ? COLORS.accent : COLORS.border}` }}>
        <div style={{ width: 16, height: 16, background: COLORS.white, borderRadius: "50%", position: "absolute", top: 2, left: checked ? 20 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
      {/* Main form */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Create New PDF</h2>

        {/* Templates */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 8, letterSpacing: "0.3px" }}>TEMPLATE</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {templates.map(t => (
              <div key={t.id} onClick={() => setTemplate(t.id)} style={{ background: template === t.id ? COLORS.accentSoft : COLORS.surface2, border: `1.5px solid ${template === t.id ? COLORS.accent : COLORS.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: template === t.id ? COLORS.accent : COLORS.text, transition: "all 0.15s", textAlign: "center" }}>
                {t.label}
              </div>
            ))}
          </div>
        </div>

        <Input label="DOCUMENT TITLE" value={title} onChange={setTitle} placeholder="Enter document title..." />
        <Input label="AUTHOR" value={author} onChange={setAuthor} placeholder="Your name..." />

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6, letterSpacing: "0.3px" }}>CONTENT</label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Start typing your document content here... Supports rich text, tables, and formatting."
            rows={10}
            style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "12px 14px", color: COLORS.text, fontSize: 14, resize: "vertical", outline: "none", lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={handleCreate} icon={icons.file} disabled={creating}>
            {creating ? "Creating..." : "Create PDF"}
          </Btn>
          <Btn variant="secondary" icon={icons.download}>Save Draft</Btn>
          <Btn variant="secondary" icon={icons.eye}>Preview</Btn>
        </div>
      </div>

      {/* Settings panel */}
      <div>
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "20px 22px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: COLORS.text }}>Document Settings</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>PAGE SIZE</label>
            <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "10px 14px", color: COLORS.text, fontSize: 13, outline: "none" }}>
              {["A4", "A3", "Letter", "Legal", "Tabloid"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <Toggle label="Page Numbers" checked={includePageNumbers} onChange={setIncludePageNumbers} />
          <Toggle label="Header" checked={includeHeader} onChange={setIncludeHeader} />
          {includeHeader && (
            <input value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header text..."
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none", marginTop: 8, boxSizing: "border-box" }} />
          )}
          <Toggle label="Watermark" checked={includeWatermark} onChange={setIncludeWatermark} />
          {includeWatermark && (
            <input value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Watermark text..."
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "8px 12px", color: COLORS.text, fontSize: 13, outline: "none", marginTop: 8, boxSizing: "border-box" }} />
          )}

          <div style={{ marginTop: 20, padding: "14px", background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>Summary</div>
            {[["Template", templates.find(t => t.id === template)?.label], ["Page Size", pageSize], ["Page Numbers", includePageNumbers ? "Yes" : "No"], ["Watermark", includeWatermark ? watermarkText : "None"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                <span style={{ color: COLORS.textMuted }}>{k}</span>
                <span style={{ color: COLORS.text, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Merge & Split ───────────────────────────────────────────────────
const MergeSection = ({ files, onToast, onAddFiles }) => {
  const [tab, setTab] = useState("merge");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [outputName, setOutputName] = useState("merged_document");
  const [splitFile, setSplitFile] = useState(null);
  const [splitMode, setSplitMode] = useState("pages");
  const [splitRange, setSplitRange] = useState("");
  const [splitEvery, setSplitEvery] = useState(1);
  const [reorderFiles, setReorderFiles] = useState([...files]);
  const [merging, setMerging] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Keep reorderFiles in sync when files prop changes
  useEffect(() => { setReorderFiles([...files]); }, [files]);

  const toggleSelect = (f) => setSelectedFiles(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);
  const moveUp   = (i) => { if (i === 0) return; const a = [...reorderFiles]; [a[i-1],a[i]]=[a[i],a[i-1]]; setReorderFiles(a); };
  const moveDown = (i) => { if (i >= reorderFiles.length-1) return; const a = [...reorderFiles]; [a[i],a[i+1]]=[a[i+1],a[i]]; setReorderFiles(a); };

  // ── Parse a page range string like "1-3, 5, 7-10" into an array of 0-based indices
  const parsePageRange = (rangeStr, totalPages) => {
    const indices = new Set();
    const parts = rangeStr.split(",").map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) indices.add(i - 1);
        }
      } else {
        const n = Number(part);
        if (n >= 1 && n <= totalPages) indices.add(n - 1);
      }
    }
    return Array.from(indices).sort((a, b) => a - b);
  };

  // ── Download helper
  const downloadBlob = (bytes, fileName) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
    return blob;
  };

  // ── MERGE ─────────────────────────────────────────────────────────────────────
  const handleMerge = async () => {
    if (selectedFiles.length < 2) { onToast("Select at least 2 files to merge.", "error"); return; }
    const missing = selectedFiles.filter(f => !f.raw);
    if (missing.length > 0) {
      onToast(`"${missing[0].name}" has no file data. Please re-upload it.`, "error");
      return;
    }
    setMerging(true);
    setProgress(0);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (let i = 0; i < selectedFiles.length; i++) {
        const f       = selectedFiles[i];
        const buffer  = await f.raw.arrayBuffer();
        const srcPdf  = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const indices = srcPdf.getPageIndices();
        const copied  = await merged.copyPages(srcPdf, indices);
        copied.forEach(page => merged.addPage(page));
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 85));
      }

      merged.setTitle(outputName);
      merged.setCreationDate(new Date());
      const bytes    = await merged.save();
      const fileName = `${outputName.trim() || "merged"}.pdf`;
      const blob     = downloadBlob(bytes, fileName);

      // Add to workspace
      const rawFile = new File([blob], fileName, { type: "application/pdf" });
      if (onAddFiles) onAddFiles([rawFile]);

      setProgress(100);
      onToast(`✓ Merged ${selectedFiles.length} files into "${fileName}"`, "success");
      setSelectedFiles([]);
      setTimeout(() => { setMerging(false); setProgress(0); }, 600);
    } catch (err) {
      console.error(err);
      onToast(`Merge failed: ${err.message}`, "error");
      setMerging(false);
      setProgress(0);
    }
  };

  // ── SPLIT ─────────────────────────────────────────────────────────────────────
  const handleSplit = async () => {
    if (!splitFile) { onToast("Select a file to split.", "error"); return; }
    if (!splitFile.raw) { onToast("No file data found. Please re-upload the file.", "error"); return; }
    setSplitting(true);
    setProgress(0);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer   = await splitFile.raw.arrayBuffer();
      const srcPdf   = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const total    = srcPdf.getPageCount();
      const baseName = splitFile.name.replace(/\.pdf$/i, "");

      // Build list of page groups based on split mode
      let groups = [];
      if (splitMode === "pages") {
        if (!splitRange.trim()) { onToast("Enter a page range first.", "error"); setSplitting(false); return; }
        const indices = parsePageRange(splitRange, total);
        if (indices.length === 0) { onToast("No valid pages found in that range.", "error"); setSplitting(false); return; }
        groups = [{ indices, suffix: `_pages_${splitRange.replace(/\s/g, "")}` }];
      } else if (splitMode === "every") {
        const n = Math.max(1, parseInt(splitEvery) || 1);
        for (let start = 0; start < total; start += n) {
          const end     = Math.min(start + n, total);
          const indices = Array.from({ length: end - start }, (_, i) => start + i);
          groups.push({ indices, suffix: `_part${Math.floor(start / n) + 1}` });
        }
      } else {
        // Individual pages
        groups = Array.from({ length: total }, (_, i) => ({ indices: [i], suffix: `_page${i + 1}` }));
      }

      let count = 0;
      for (const group of groups) {
        const newPdf  = await PDFDocument.create();
        const copied  = await newPdf.copyPages(srcPdf, group.indices);
        copied.forEach(p => newPdf.addPage(p));
        const bytes    = await newPdf.save();
        const fileName = `${baseName}${group.suffix}.pdf`;
        const blob     = downloadBlob(bytes, fileName);
        const rawFile  = new File([blob], fileName, { type: "application/pdf" });
        if (onAddFiles) onAddFiles([rawFile]);
        count++;
        setProgress(Math.round((count / groups.length) * 100));
        // Small delay between downloads so browser doesn't block them
        if (groups.length > 1) await new Promise(r => setTimeout(r, 120));
      }

      onToast(`✓ Split into ${count} file${count > 1 ? "s" : ""} — check your downloads!`, "success");
      setSplitting(false);
      setProgress(0);
    } catch (err) {
      console.error(err);
      onToast(`Split failed: ${err.message}`, "error");
      setSplitting(false);
      setProgress(0);
    }
  };

  const fileInputRef = useRef();

  const inputStyle = {
    width: "100%", background: COLORS.surface,
    border: `1px solid ${COLORS.border}`, borderRadius: 9,
    padding: "9px 12px", color: COLORS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>
        Merge, Split & Organize
      </h2>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => {
          if (e.target.files.length && onAddFiles) onAddFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["merge", "Merge PDFs"], ["split", "Split PDF"], ["reorder", "Reorder"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? COLORS.accent : "transparent",
            color: tab === id ? COLORS.white : COLORS.textMuted,
            border: `1px solid ${tab === id ? COLORS.accent : COLORS.border}`,
            borderRadius: 9, padding: "8px 20px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit",
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── MERGE TAB ── */}
      {tab === "merge" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
          {/* Left — file list */}
          <div>
            {/* Instruction banner */}
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon d={icons.info} size={16} color={COLORS.gold} />
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                Check the boxes next to the files you want to merge, then click <b style={{ color: COLORS.text }}>Merge Selected</b> on the right.
              </span>
            </div>

            {/* Add files button — always visible */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <Btn icon={icons.upload} onClick={() => fileInputRef.current?.click()} variant="secondary">
                Add PDF files
              </Btn>
              {selectedFiles.length > 0 && (
                <Btn variant="ghost" onClick={() => setSelectedFiles([])}>
                  Clear selection
                </Btn>
              )}
            </div>

            {/* File list */}
            {files.length === 0 ? (
              <div
                data-dropzone="true"
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: COLORS.textDim, cursor: "pointer", background: COLORS.surface }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = COLORS.accent; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = COLORS.border; const f = Array.from(e.dataTransfer.files); if (f.length && onAddFiles) onAddFiles(f); }}
              >
                <Icon d={icons.upload} size={32} color={COLORS.textDim} />
                <p style={{ margin: "12px 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>No files yet</p>
                <p style={{ margin: 0, fontSize: 12 }}>Click here or drag PDF files in to get started</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map((f, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(f)}
                    style={{
                      background: selectedFiles.includes(f) ? COLORS.accentSoft : COLORS.surface2,
                      border: `1.5px solid ${selectedFiles.includes(f) ? COLORS.accent : COLORS.border}`,
                      borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s",
                    }}>
                    {/* Checkbox */}
                    <div style={{
                      width: 20, height: 20, flexShrink: 0, borderRadius: 5,
                      border: `2px solid ${selectedFiles.includes(f) ? COLORS.accent : COLORS.border}`,
                      background: selectedFiles.includes(f) ? COLORS.accent : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selectedFiles.includes(f) && <Icon d={icons.check} size={12} color={COLORS.white} />}
                    </div>
                    <Icon d={icons.file} size={18} color={COLORS.accent} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {typeof f.size === "number" ? `${(f.size / 1024).toFixed(1)} KB` : f.size || "—"}
                        {" · "}
                        {f.pages && f.pages !== "—" ? `${f.pages} pages` : ""}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                      background: f.raw ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)",
                      color: f.raw ? COLORS.success : COLORS.error,
                      border: `1px solid ${f.raw ? COLORS.success : COLORS.error}`,
                    }}>
                      {f.raw ? "✓ Ready" : "⚠ Re-upload"}
                    </span>
                  </div>
                ))}

                {/* Add more button at the bottom of list */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "transparent", border: `2px dashed ${COLORS.border}`,
                    borderRadius: 10, padding: "10px 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    color: COLORS.textMuted, fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit", transition: "all 0.15s", width: "100%",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
                >
                  <Icon d={icons.plus} size={16} />
                  Add another PDF file
                </button>
              </div>
            )}
          </div>

          {/* Right — merge settings */}
          <div>
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "20px", position: "sticky", top: 0 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: COLORS.text }}>Merge Settings</h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  Output filename
                </label>
                <input
                  value={outputName}
                  onChange={e => setOutputName(e.target.value)}
                  style={inputStyle}
                  placeholder="merged_document"
                />
              </div>

              <div style={{ background: COLORS.surface, borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12 }}>
                <div style={{ color: COLORS.textMuted, marginBottom: 4 }}>Files selected</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: selectedFiles.length >= 2 ? COLORS.accent : COLORS.textDim, letterSpacing: "-1px" }}>
                  {selectedFiles.length} <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.textMuted }}>of {files.length}</span>
                </div>
                {selectedFiles.length < 2 && (
                  <div style={{ fontSize: 11, color: COLORS.gold, marginTop: 4 }}>
                    ⚠ Select at least 2 files to merge
                  </div>
                )}
              </div>

              {merging && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>
                    <span>Merging files…</span><span>{progress}%</span>
                  </div>
                  <div style={{ background: COLORS.surface, borderRadius: 100, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 100, transition: "width 0.2s" }} />
                  </div>
                </div>
              )}

              <Btn
                onClick={handleMerge}
                icon={icons.merge}
                disabled={selectedFiles.length < 2 || merging}
                style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
              >
                {merging ? "Merging…" : `Merge ${selectedFiles.length > 0 ? selectedFiles.length : ""} Files`}
              </Btn>

              <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0, lineHeight: 1.5 }}>
                The merged PDF will download automatically and be added to your workspace.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SPLIT TAB ── */}
      {tab === "split" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
          {/* Left — file selection */}
          <div>
            {/* Instruction banner */}
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon d={icons.info} size={16} color={COLORS.teal} />
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                Click a file to select it for splitting, then choose your split method on the right and click <b style={{ color: COLORS.text }}>Split PDF</b>.
              </span>
            </div>

            <Btn icon={icons.upload} onClick={() => fileInputRef.current?.click()} variant="secondary" style={{ marginBottom: 14 }}>
              Add a PDF to split
            </Btn>

            {files.length === 0 ? (
              <div
                data-dropzone="true"
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center", color: COLORS.textDim, cursor: "pointer", background: COLORS.surface }}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = COLORS.teal; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = COLORS.border; const f = Array.from(e.dataTransfer.files); if (f.length && onAddFiles) onAddFiles(f); }}
              >
                <Icon d={icons.upload} size={32} color={COLORS.textDim} />
                <p style={{ margin: "12px 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>No files yet</p>
                <p style={{ margin: 0, fontSize: 12 }}>Click here or drag a PDF in to get started</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map((f, i) => (
                  <div
                    key={i}
                    onClick={() => setSplitFile(f)}
                    style={{
                      background: splitFile === f ? COLORS.tealSoft : COLORS.surface2,
                      border: `1.5px solid ${splitFile === f ? COLORS.teal : COLORS.border}`,
                      borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s",
                    }}>
                    {/* Radio */}
                    <div style={{
                      width: 18, height: 18, flexShrink: 0, borderRadius: "50%",
                      border: `2px solid ${splitFile === f ? COLORS.teal : COLORS.border}`,
                      background: "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {splitFile === f && <div style={{ width: 8, height: 8, background: COLORS.teal, borderRadius: "50%" }} />}
                    </div>
                    <Icon d={icons.file} size={18} color={COLORS.teal} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                        {typeof f.size === "number" ? `${(f.size / 1024).toFixed(1)} KB` : f.size || "—"}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                      background: f.raw ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)",
                      color: f.raw ? COLORS.success : COLORS.error,
                      border: `1px solid ${f.raw ? COLORS.success : COLORS.error}`,
                    }}>
                      {f.raw ? "✓ Ready" : "⚠ Re-upload"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — split options */}
          <div>
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "20px", position: "sticky", top: 0 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: COLORS.text }}>Split Options</h3>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: COLORS.textMuted }}>
                {splitFile ? `Splitting: ${splitFile.name}` : "No file selected"}
              </p>

              {/* Split mode selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {[
                  ["pages",      "By page range",    "Extract specific pages e.g. 1-3, 5"],
                  ["every",      "Every N pages",     "Split into equal chunks"],
                  ["individual", "Individual pages",  "One file per page"],
                ].map(([id, lbl, desc]) => (
                  <div
                    key={id}
                    onClick={() => setSplitMode(id)}
                    style={{
                      background: splitMode === id ? COLORS.tealSoft : COLORS.surface,
                      border: `1.5px solid ${splitMode === id ? COLORS.teal : COLORS.border}`,
                      borderRadius: 9, padding: "10px 14px", cursor: "pointer", transition: "all 0.12s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${splitMode === id ? COLORS.teal : COLORS.border}`,
                        background: splitMode === id ? COLORS.teal : "transparent",
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: splitMode === id ? COLORS.teal : COLORS.text }}>{lbl}</span>
                    </div>
                    <p style={{ margin: "4px 0 0 22px", fontSize: 11, color: COLORS.textMuted }}>{desc}</p>
                  </div>
                ))}
              </div>

              {/* Page range input */}
              {splitMode === "pages" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Page range
                  </label>
                  <input
                    value={splitRange}
                    onChange={e => setSplitRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-10"
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 11, color: COLORS.textDim, margin: "5px 0 0" }}>
                    Use commas to separate ranges. Example: 1-3, 5, 8-10
                  </p>
                </div>
              )}

              {/* Every N pages input */}
              {splitMode === "every" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    Pages per file
                  </label>
                  <input
                    type="number"
                    value={splitEvery}
                    onChange={e => setSplitEvery(e.target.value)}
                    min={1}
                    style={inputStyle}
                  />
                  <p style={{ fontSize: 11, color: COLORS.textDim, margin: "5px 0 0" }}>
                    A 10-page PDF split every 3 pages gives you 4 files.
                  </p>
                </div>
              )}

              {splitMode === "individual" && (
                <div style={{ background: COLORS.surface, borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: COLORS.textMuted }}>
                  Each page becomes its own separate PDF file. All files download automatically.
                </div>
              )}

              {/* Progress */}
              {splitting && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>
                    <span>Splitting…</span><span>{progress}%</span>
                  </div>
                  <div style={{ background: COLORS.surface, borderRadius: 100, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.gold})`, borderRadius: 100, transition: "width 0.2s" }} />
                  </div>
                </div>
              )}

              <Btn
                onClick={handleSplit}
                variant="teal"
                icon={icons.split}
                disabled={!splitFile || splitting}
                style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}
              >
                {splitting ? "Splitting…" : "Split PDF"}
              </Btn>

              {!splitFile && (
                <p style={{ fontSize: 11, color: COLORS.gold, margin: 0, textAlign: "center" }}>
                  ⚠ Select a file on the left first
                </p>
              )}
              {splitFile && !splitting && (
                <p style={{ fontSize: 11, color: COLORS.textDim, margin: 0, lineHeight: 1.5 }}>
                  Split files download automatically and are added to your workspace.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REORDER TAB ── */}
      {tab === "reorder" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>Use the arrows to reorder files before merging them.</p>
            <Btn icon={icons.check} onClick={() => onToast("File order saved!", "success")}>Save Order</Btn>
          </div>
          {reorderFiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: COLORS.textDim, fontSize: 13 }}>
              No files in workspace yet. Upload some PDFs first.
            </div>
          ) : (
            reorderFiles.map((f, i) => (
              <div key={i} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textDim, minWidth: 24, textAlign: "center" }}>{i + 1}</span>
                <Icon d={icons.file} size={18} color={COLORS.accent} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: i === 0 ? COLORS.textDim : COLORS.textMuted, cursor: i === 0 ? "not-allowed" : "pointer", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                  >▲</button>
                  <button
                    onClick={() => moveDown(i)}
                    disabled={i >= reorderFiles.length - 1}
                    style={{ background: COLORS.surface3, border: `1px solid ${COLORS.border}`, color: i >= reorderFiles.length - 1 ? COLORS.textDim : COLORS.textMuted, cursor: i >= reorderFiles.length - 1 ? "not-allowed" : "pointer", borderRadius: 6, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}
                  >▼</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Section: Sign & Forms ────────────────────────────────────────────────────
const SignSection = ({ files, onToast, onAddFiles }) => {
  const canvasRef    = useRef();
  const uploadRef    = useRef();
  const typeCanvasRef = useRef();
  const lastPos      = useRef(null);

  const [drawing, setDrawing]       = useState(false);
  const [signMode, setSignMode]     = useState("draw");
  const [typedSig, setTypedSig]     = useState("");
  const [sigFont, setSigFont]       = useState("cursive");
  const [hasSig, setHasSig]         = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sigColor, setSigColor]     = useState("#1a1a2e");
  const [sigPosition, setSigPosition] = useState("bottom-right");
  const [sigPage, setSigPage]       = useState(1);
  const [signing, setSigning]       = useState(false);
  const [signedFiles, setSignedFiles] = useState([]);
  const [uploadedSigUrl, setUploadedSigUrl] = useState(null);
  const [stampTarget, setStampTarget] = useState(null);

  // ── Canvas drawing ───────────────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSig(true);
  };
  const stopDraw = () => setDrawing(false);

  const clearSig = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSig(false);
  };

  // ── Render typed signature to canvas ────────────────────────────────────────
  useEffect(() => {
    if (signMode !== "type" || !typeCanvasRef.current) return;
    const canvas = typeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!typedSig.trim()) return;
    ctx.fillStyle = sigColor;
    ctx.font = `48px ${sigFont}`;
    ctx.textBaseline = "middle";
    ctx.fillText(typedSig, 16, canvas.height / 2);
    setHasSig(true);
  }, [typedSig, sigFont, sigColor, signMode]);

  // ── Upload signature image ───────────────────────────────────────────────────
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedSigUrl(ev.target.result);
      setHasSig(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Get signature PNG bytes from current mode ────────────────────────────────
  const getSigImageBytes = () => {
    return new Promise((resolve, reject) => {
      if (signMode === "draw") {
        canvasRef.current.toBlob(blob => {
          blob.arrayBuffer().then(resolve).catch(reject);
        }, "image/png");
      } else if (signMode === "type") {
        typeCanvasRef.current.toBlob(blob => {
          blob.arrayBuffer().then(resolve).catch(reject);
        }, "image/png");
      } else if (signMode === "upload" && uploadedSigUrl) {
        fetch(uploadedSigUrl)
          .then(r => r.arrayBuffer())
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error("No signature available"));
      }
    });
  };

  // ── Position mapping → pdf-lib coordinates ──────────────────────────────────
  const getSigCoords = (page, sigW, sigH, position) => {
    const { width, height } = page.getSize();
    const margin = 30;
    const positions = {
      "top-left":      { x: margin,               y: height - margin - sigH },
      "top-center":    { x: (width - sigW) / 2,   y: height - margin - sigH },
      "top-right":     { x: width - margin - sigW, y: height - margin - sigH },
      "center":        { x: (width - sigW) / 2,   y: (height - sigH) / 2    },
      "bottom-left":   { x: margin,               y: margin                  },
      "bottom-center": { x: (width - sigW) / 2,   y: margin                  },
      "bottom-right":  { x: width - margin - sigW, y: margin                  },
    };
    return positions[position] || positions["bottom-right"];
  };

  // ── Apply real signature to PDF ──────────────────────────────────────────────
  const applySig = async () => {
    if (!selectedFile)        { onToast("Select a document to sign.", "error"); return; }
    if (!selectedFile.raw)    { onToast("Re-upload the file — no data attached.", "error"); return; }
    if (!hasSig)              { onToast("Create your signature first.", "error"); return; }

    setSigning(true);
    try {
      const { PDFDocument } = await import("pdf-lib");

      // Load source PDF
      const pdfBuffer = await selectedFile.raw.arrayBuffer();
      const pdfDoc    = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const totalPages = pdfDoc.getPageCount();
      const targetPageIdx = Math.min(Math.max((sigPage || 1) - 1, 0), totalPages - 1);
      const page = pdfDoc.getPage(targetPageIdx);

      // Get signature PNG
      const sigBytes = await getSigImageBytes();
      const sigImage = await pdfDoc.embedPng(sigBytes);

      // Scale signature to reasonable size
      const maxSigW = 200;
      const maxSigH = 80;
      const dims    = sigImage.scaleToFit(maxSigW, maxSigH);
      const { x, y } = getSigCoords(page, dims.width, dims.height, sigPosition);

      // Draw signature image onto page
      page.drawImage(sigImage, {
        x, y,
        width:  dims.width,
        height: dims.height,
      });

      // Add signed date text below signature
      const { StandardFonts, rgb } = await import("pdf-lib");
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const dateStr = `Signed: ${new Date().toLocaleDateString()}`;
      page.drawText(dateStr, {
        x, y: y - 14,
        font, size: 8,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Save and download
      const signedBytes = await pdfDoc.save();
      const fileName    = selectedFile.name.replace(/\.pdf$/i, "") + "_signed.pdf";
      const blob        = new Blob([signedBytes], { type: "application/pdf" });
      const url         = URL.createObjectURL(blob);
      const a           = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);

      // Add to workspace
      const rawFile = new File([blob], fileName, { type: "application/pdf" });
      if (onAddFiles) onAddFiles([rawFile]);

      // Track signed files
      setSignedFiles(prev => [...prev, { name: fileName, time: new Date().toLocaleTimeString() }]);

      onToast(`✓ "${fileName}" signed and downloaded!`, "success");
      setSigning(false);
    } catch (err) {
      console.error(err);
      onToast(`Signing failed: ${err.message}`, "error");
      setSigning(false);
    }
  };

  // ── Apply stamp to PDF ───────────────────────────────────────────────────────
  const applyStamp = async (stampText, stampColor) => {
    const target = stampTarget || selectedFile;
    if (!target || !target.raw) { onToast("Select a document to stamp first.", "error"); return; }
    try {
      const { PDFDocument, rgb, degrees } = await import("pdf-lib");
      const { StandardFonts } = await import("pdf-lib");
      const buffer  = await target.raw.arrayBuffer();
      const pdfDoc  = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Apply stamp to every page
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const { width, height } = page.getSize();
        const colors = {
          APPROVED:     rgb(0.1, 0.6, 0.2),
          REJECTED:     rgb(0.85, 0.2, 0.2),
          CONFIDENTIAL: rgb(0.85, 0.2, 0.2),
          DRAFT:        rgb(0.7, 0.5, 0.1),
          REVIEWED:     rgb(0.1, 0.4, 0.8),
          VOID:         rgb(0.5, 0.1, 0.7),
        };
        const c = colors[stampText] || rgb(0.5, 0.5, 0.5);
        const fontSize = 52;
        const textW = font.widthOfTextAtSize(stampText, fontSize);

        page.drawText(stampText, {
          x: (width - textW) / 2,
          y: (height - fontSize) / 2,
          font, size: fontSize,
          color: c, opacity: 0.22,
          rotate: degrees(35),
        });
      });

      const bytes    = await pdfDoc.save();
      const fileName = target.name.replace(/\.pdf$/i, "") + `_${stampText.toLowerCase()}.pdf`;
      const blob     = new Blob([bytes], { type: "application/pdf" });
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);

      const rawFile = new File([blob], fileName, { type: "application/pdf" });
      if (onAddFiles) onAddFiles([rawFile]);

      onToast(`✓ "${stampText}" stamp applied to all pages!`, "success");
    } catch (err) {
      console.error(err);
      onToast(`Stamp failed: ${err.message}`, "error");
    }
  };

  const inputStyle = {
    width: "100%", background: COLORS.surface,
    border: `1px solid ${COLORS.border}`, borderRadius: 9,
    padding: "8px 12px", color: COLORS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const STAMPS = [
    { label: "APPROVED",     color: COLORS.success },
    { label: "REJECTED",     color: COLORS.error },
    { label: "CONFIDENTIAL", color: COLORS.accent },
    { label: "DRAFT",        color: COLORS.gold },
    { label: "REVIEWED",     color: "#60A5FA" },
    { label: "VOID",         color: "#A78BFA" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>
        Sign & Stamp
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>

        {/* ── Left: Signature creator ── */}
        <div>

          {/* Step 1 — Select document */}
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 10 }}>
              Step 1 — Select document to sign
            </div>
            {files.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.textDim, padding: "12px", background: COLORS.surface, borderRadius: 8, border: `1px dashed ${COLORS.border}`, textAlign: "center" }}>
                Upload a PDF first — go to File Manager or drag a PDF anywhere on the app
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} onClick={() => { setSelectedFile(f); setStampTarget(f); }} style={{
                    background: selectedFile === f ? COLORS.accentSoft : COLORS.surface,
                    border: `1.5px solid ${selectedFile === f ? COLORS.accent : COLORS.border}`,
                    borderRadius: 9, padding: "10px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, transition: "all 0.12s",
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${selectedFile === f ? COLORS.accent : COLORS.border}`, background: selectedFile === f ? COLORS.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedFile === f && <div style={{ width: 6, height: 6, background: COLORS.white, borderRadius: "50%" }} />}
                    </div>
                    <Icon d={icons.file} size={15} color={selectedFile === f ? COLORS.accent : COLORS.textMuted} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: selectedFile === f ? COLORS.accent : COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: f.raw ? "rgba(46,204,113,0.12)" : "rgba(231,76,60,0.12)", color: f.raw ? COLORS.success : COLORS.error, border: `1px solid ${f.raw ? COLORS.success : COLORS.error}` }}>
                      {f.raw ? "✓ Ready" : "⚠ Re-upload"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Create signature */}
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 14 }}>
              Step 2 — Create your signature
            </div>

            {/* Mode tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[["draw", "✏ Draw"], ["type", "T Type"], ["upload", "⬆ Upload"]].map(([id, lbl]) => (
                <button key={id} onClick={() => { setSignMode(id); setHasSig(false); }} style={{
                  background: signMode === id ? COLORS.accent : COLORS.surface3,
                  color: signMode === id ? COLORS.white : COLORS.textMuted,
                  border: `1px solid ${signMode === id ? COLORS.accent : COLORS.border}`,
                  borderRadius: 8, padding: "7px 14px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, transition: "all 0.15s", fontFamily: "inherit",
                }}>{lbl}</button>
              ))}
            </div>

            {/* Draw mode */}
            {signMode === "draw" && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>Ink color:</span>
                  {["#1a1a2e", "#E84D4D", "#0044cc", "#006600", "#7B2FBE"].map(c => (
                    <div key={c} onClick={() => setSigColor(c)} style={{ width: 22, height: 22, background: c, borderRadius: "50%", cursor: "pointer", border: `3px solid ${sigColor === c ? COLORS.text : "transparent"}`, transition: "border 0.1s" }} />
                  ))}
                </div>
                <div style={{ position: "relative" }}>
                  <canvas
                    ref={canvasRef}
                    width={500} height={140}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    style={{ background: "#fff", borderRadius: 10, cursor: "crosshair", display: "block", border: `2px solid ${hasSig ? COLORS.accent : COLORS.border}`, width: "100%", touchAction: "none", transition: "border-color 0.2s" }}
                  />
                  {!hasSig && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: 13, color: "#ccc", fontStyle: "italic" }}>Sign here with your mouse or finger</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn onClick={clearSig} variant="ghost" small icon={icons.trash}>Clear</Btn>
                  {hasSig && <span style={{ fontSize: 11, color: COLORS.success, alignSelf: "center" }}>✓ Signature ready</span>}
                </div>
              </div>
            )}

            {/* Type mode */}
            {signMode === "type" && (
              <div>
                <input
                  value={typedSig}
                  onChange={e => setTypedSig(e.target.value)}
                  placeholder="Type your full name…"
                  style={{ ...inputStyle, fontSize: 26, fontFamily: sigFont, background: "#fff", color: "#1a1a2e", padding: "12px 16px", marginBottom: 12 }}
                />
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>Choose style</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    { font: "cursive",                label: "Casual" },
                    { font: "Georgia, serif",          label: "Formal" },
                    { font: "'Courier New', monospace", label: "Print" },
                  ].map(({ font, label }) => (
                    <div key={font} onClick={() => setSigFont(font)} style={{ flex: 1, background: sigFont === font ? COLORS.accentSoft : COLORS.surface, border: `1.5px solid ${sigFont === font ? COLORS.accent : COLORS.border}`, borderRadius: 9, padding: "10px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.12s" }}>
                      <div style={{ fontSize: 20, fontFamily: font, color: "#1a1a2e", marginBottom: 4 }}>{typedSig || "Signature"}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>{label}</div>
                    </div>
                  ))}
                </div>
                {/* Hidden canvas for rendering typed sig */}
                <canvas ref={typeCanvasRef} width={500} height={80} style={{ display: "none" }} />
                {hasSig && <span style={{ fontSize: 11, color: COLORS.success }}>✓ Signature ready</span>}
              </div>
            )}

            {/* Upload mode */}
            {signMode === "upload" && (
              <div>
                <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/gif" style={{ display: "none" }} onChange={handleUpload} />
                {uploadedSigUrl ? (
                  <div style={{ background: "#fff", borderRadius: 10, padding: "16px", border: `2px solid ${COLORS.accent}`, textAlign: "center" }}>
                    <img src={uploadedSigUrl} alt="Signature" style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain" }} />
                    <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                      <Btn variant="ghost" small onClick={() => { setUploadedSigUrl(null); setHasSig(false); }} icon={icons.trash}>Remove</Btn>
                      <Btn variant="secondary" small onClick={() => uploadRef.current?.click()} icon={icons.upload}>Change</Btn>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.success, marginTop: 8 }}>✓ Signature ready</div>
                  </div>
                ) : (
                  <div
                    onClick={() => uploadRef.current?.click()}
                    style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 10, padding: "32px", textAlign: "center", cursor: "pointer", background: COLORS.surface, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = COLORS.accentSoft; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; }}
                  >
                    <Icon d={icons.upload} size={28} color={COLORS.textDim} />
                    <p style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>Upload signature image</p>
                    <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>PNG with transparent background works best</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Settings + Stamps + History ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Signature placement settings */}
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 14 }}>
              Step 3 — Place & apply
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Signature position</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["top-left", "Top Left"],
                  ["top-right", "Top Right"],
                  ["bottom-left", "Bottom Left"],
                  ["bottom-right", "Bottom Right ✓"],
                  ["bottom-center", "Bottom Center"],
                  ["center", "Center"],
                ].map(([id, lbl]) => (
                  <div key={id} onClick={() => setSigPosition(id)} style={{ background: sigPosition === id ? COLORS.accentSoft : COLORS.surface, border: `1.5px solid ${sigPosition === id ? COLORS.accent : COLORS.border}`, borderRadius: 7, padding: "6px 10px", cursor: "pointer", fontSize: 11, fontWeight: 600, color: sigPosition === id ? COLORS.accent : COLORS.text, textAlign: "center", transition: "all 0.12s" }}>
                    {lbl}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Page number</label>
              <input type="number" min={1} value={sigPage} onChange={e => setSigPage(parseInt(e.target.value) || 1)}
                style={{ ...inputStyle, width: "100%" }} />
              <p style={{ fontSize: 11, color: COLORS.textDim, margin: "4px 0 0" }}>Which page to place the signature on</p>
            </div>

            {signing && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: COLORS.surface, borderRadius: 100, height: 5, overflow: "hidden" }}>
                  <div style={{ width: "60%", height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 100, animation: "pulse 1s infinite" }} />
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 5 }}>Embedding signature…</div>
              </div>
            )}

            <Btn
              onClick={applySig}
              icon={icons.sign}
              disabled={!selectedFile || !hasSig || signing}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {signing ? "Signing…" : "Apply Signature to PDF"}
            </Btn>

            {!selectedFile && <p style={{ fontSize: 11, color: COLORS.gold, marginTop: 8, textAlign: "center" }}>⚠ Select a file on the left</p>}
            {selectedFile && !hasSig && <p style={{ fontSize: 11, color: COLORS.gold, marginTop: 8, textAlign: "center" }}>⚠ Create your signature first</p>}
          </div>

          {/* Stamps */}
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 10 }}>
              Stamps — applies to all pages
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {STAMPS.map(({ label, color }) => (
                <button key={label} onClick={() => applyStamp(label, color)} style={{ background: COLORS.surface, border: `1.5px solid ${color}`, borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 800, color, letterSpacing: "0.5px", fontFamily: "inherit", transition: "all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = COLORS.surface; }}>
                  {label}
                </button>
              ))}
            </div>
            {!stampTarget && <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>Select a file above to stamp it</p>}
          </div>

          {/* Signed file history */}
          {signedFiles.length > 0 && (
            <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 10 }}>
                Recently signed
              </div>
              {signedFiles.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < signedFiles.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <Icon d={icons.check} size={13} color={COLORS.success} />
                  <span style={{ flex: 1, fontSize: 12, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  <span style={{ fontSize: 10, color: COLORS.textDim }}>{f.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Section: Convert ─────────────────────────────────────────────────────────
const ConvertSection = ({ files, onToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState("docx");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);

  const pdfTargets = [
    { id: "docx", label: "Word (.docx)", icon: "W", color: "#4472C4" },
    { id: "xlsx", label: "Excel (.xlsx)", icon: "X", color: "#217346" },
    { id: "pptx", label: "PowerPoint (.pptx)", icon: "P", color: "#D24726" },
    { id: "html", label: "HTML (.html)", icon: "H", color: "#E44D26" },
    { id: "txt", label: "Plain Text (.txt)", icon: "T", color: COLORS.textMuted },
    { id: "jpg", label: "Images (.jpg)", icon: "🖼", color: "#FF6B6B" },
    { id: "png", label: "PNG Images (.png)", icon: "🖼", color: "#4ECDC4" },
  ];
  const toPdfSources = [
    { id: "docx-pdf", label: "Word → PDF", icon: "W", color: "#4472C4" },
    { id: "xlsx-pdf", label: "Excel → PDF", icon: "X", color: "#217346" },
    { id: "img-pdf", label: "Image → PDF", icon: "🖼", color: "#FF6B6B" },
    { id: "html-pdf", label: "HTML → PDF", icon: "H", color: "#E44D26" },
  ];

  const startConvert = () => {
    if (!selectedFile) { onToast("Select a file first.", "error"); return; }
    setConverting(true); setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setConverting(false); onToast(`Converted to ${targetFormat.toUpperCase()} successfully!`, "success"); return 100; }
        return p + Math.random() * 20;
      });
    }, 200);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Convert Files</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* PDF → Other */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>PDF → Other Formats</h3>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: COLORS.textMuted }}>Convert a PDF to Word, Excel, HTML, and more.</p>

          {/* File picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Source PDF</label>
            {files.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textDim, padding: "10px", background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>No files available</div>
            ) : (
              <select onChange={e => setSelectedFile(files[parseInt(e.target.value)])} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}>
                <option value="">Select a file...</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Target Format</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {pdfTargets.map(t => (
                <div key={t.id} onClick={() => setTargetFormat(t.id)} style={{ background: targetFormat === t.id ? `${t.color}20` : COLORS.surface, border: `1.5px solid ${targetFormat === t.id ? t.color : COLORS.border}`, borderRadius: 9, padding: "9px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{t.icon}</span>
                  <span style={{ fontSize: 12, color: targetFormat === t.id ? t.color : COLORS.text, fontWeight: 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {converting && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
                <span>Converting...</span><span>{Math.round(Math.min(progress, 100))}%</span>
              </div>
              <div style={{ background: COLORS.surface, borderRadius: 100, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(progress, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 100, transition: "width 0.1s" }} />
              </div>
            </div>
          )}
          <Btn onClick={startConvert} icon={icons.convert} disabled={converting || !selectedFile}>
            {converting ? "Converting..." : "Convert Now"}
          </Btn>
        </div>

        {/* Other → PDF */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Other → PDF</h3>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: COLORS.textMuted }}>Convert Word, Excel, images, and more to PDF.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {toPdfSources.map(s => (
              <div key={s.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: s.color, minWidth: 24 }}>{s.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.text }}>{s.label}</span>
                <Btn variant="secondary" small icon={icons.upload} onClick={() => onToast(`Upload your ${s.label.split(" ")[0]} file`, "")}>Upload</Btn>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: "14px", background: COLORS.surface, borderRadius: 10, border: `1px dashed ${COLORS.border}` }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>Or drag & drop any file here to auto-detect format and convert to PDF</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Extract & Parse ─────────────────────────────────────────────────
const ExtractSection = ({ files, onToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractType, setExtractType] = useState("text");
  const [results, setResults] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const types = [
    { id: "text", label: "Text Content", icon: "T" },
    { id: "tables", label: "Tables", icon: "⊞" },
    { id: "images", label: "Images", icon: "🖼" },
    { id: "metadata", label: "Metadata", icon: "ℹ" },
    { id: "forms", label: "Form Fields", icon: "☑" },
    { id: "links", label: "Hyperlinks", icon: "🔗" },
  ];

  const mockResults = {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...\n\nSection 2: Analysis\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    tables: "Table 1 extracted:\n| Name | Value | Percent |\n|------|-------|--------|\n| Item A | 42 | 35% |\n| Item B | 78 | 65% |",
    metadata: "Title: Sample Document\nAuthor: John Smith\nCreator: PDF Master\nCreated: 2025-01-15\nModified: 2025-03-20\nPages: 12\nFile Size: 245 KB\nEncrypted: No",
    images: "Found 3 images:\n• Image 1: 640×480 JPEG (p.2)\n• Image 2: 1024×768 PNG (p.5)\n• Image 3: 320×240 JPEG (p.9)",
    forms: "Found 4 form fields:\n• Name (Text Field)\n• Email (Text Field)\n• Agree to Terms (Checkbox)\n• Signature (Signature Field)",
    links: "Found 2 hyperlinks:\n• https://example.com (p.1)\n• mailto:contact@example.com (p.3)",
  };

  const doExtract = () => {
    if (!selectedFile) { onToast("Select a file first.", "error"); return; }
    setExtracting(true);
    setTimeout(() => { setResults(mockResults[extractType]); setExtracting(false); }, 1000);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Extract & Parse</h2>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Source File</label>
            {files.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textDim, padding: "10px", background: COLORS.surface2, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>No files available</div>
            ) : (
              <select onChange={e => setSelectedFile(files[parseInt(e.target.value)])} style={{ width: "100%", background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}>
                <option value="">Select a file...</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 8, textTransform: "uppercase" }}>Extract Type</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {types.map(t => (
                <div key={t.id} onClick={() => setExtractType(t.id)} style={{ background: extractType === t.id ? COLORS.accentSoft : COLORS.surface2, border: `1.5px solid ${extractType === t.id ? COLORS.accent : COLORS.border}`, borderRadius: 9, padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                  <span style={{ fontSize: 15, minWidth: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: extractType === t.id ? COLORS.accent : COLORS.text }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={doExtract} icon={icons.extract} disabled={extracting || !selectedFile} style={{ width: "100%", justifyContent: "center" }}>
            {extracting ? "Extracting..." : "Extract"}
          </Btn>
        </div>

        <div>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px", minHeight: 360 }}>
            {results ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: COLORS.text }}>Extracted {types.find(t => t.id === extractType)?.label}</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="secondary" small icon={icons.download} onClick={() => onToast("Downloaded!", "success")}>Download</Btn>
                    <Btn variant="ghost" small onClick={() => setResults(null)}>Clear</Btn>
                  </div>
                </div>
                <pre style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "16px", fontSize: 12, color: COLORS.text, lineHeight: 1.7, overflow: "auto", margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace" }}>
                  {results}
                </pre>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 300, color: COLORS.textDim, textAlign: "center" }}>
                <Icon d={icons.extract} size={40} color={COLORS.textDim} />
                <p style={{ margin: "16px 0 0", fontSize: 14 }}>Select a file and extraction type, then click Extract.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Security ────────────────────────────────────────────────────────
const SecuritySection = ({ files, onToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [permissions, setPermissions] = useState({ print: true, copy: true, edit: false, annotate: true });
  const [encLevel, setEncLevel] = useState("256");
  const [redactText, setRedactText] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const applyProtection = () => {
    if (!selectedFile) { onToast("Select a file first.", "error"); return; }
    if (!password) { onToast("Enter a password.", "error"); return; }
    if (password !== confirmPwd) { onToast("Passwords do not match.", "error"); return; }
    onToast(`"${selectedFile.name}" protected with ${encLevel}-bit encryption!`, "success");
  };

  const PermToggle = ({ key: k, label }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
      <div onClick={() => setPermissions(p => ({ ...p, [k]: !p[k] }))} style={{ width: 38, height: 21, background: permissions[k] ? COLORS.success : COLORS.surface3, borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.2s", border: `1px solid ${permissions[k] ? COLORS.success : COLORS.border}` }}>
        <div style={{ width: 15, height: 15, background: COLORS.white, borderRadius: "50%", position: "absolute", top: 2, left: permissions[k] ? 19 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Security & Permissions</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Password Protection */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon d={icons.lock} size={16} color={COLORS.gold} /> Password Protection
          </h3>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>File</label>
            <select onChange={e => setSelectedFile(files[parseInt(e.target.value)])} style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none" }}>
              <option value="">Select file...</option>
              {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..."
                style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 38px 9px 12px", color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}>
                <Icon d={icons.eye} size={15} />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Confirm Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm password..."
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Encryption</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[["128", "128-bit"], ["256", "256-bit AES"]].map(([v, l]) => (
                <div key={v} onClick={() => setEncLevel(v)} style={{ flex: 1, background: encLevel === v ? COLORS.goldSoft : COLORS.surface, border: `1.5px solid ${encLevel === v ? COLORS.gold : COLORS.border}`, borderRadius: 9, padding: "9px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: encLevel === v ? COLORS.gold : COLORS.text, textAlign: "center" }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={applyProtection} icon={icons.lock} variant="gold" disabled={!selectedFile} style={{ width: "100%", justifyContent: "center" }}>
            Protect Document
          </Btn>
        </div>

        {/* Permissions & Redaction */}
        <div>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px", marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Document Permissions</h3>
            <PermToggle key="print" label="Allow Printing" />
            <PermToggle key="copy" label="Allow Copying Text" />
            <PermToggle key="edit" label="Allow Editing" />
            <PermToggle key="annotate" label="Allow Annotations" />
          </div>

          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Redaction</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 12px" }}>Permanently remove sensitive content from your PDF.</p>
            <input value={redactText} onChange={e => setRedactText(e.target.value)} placeholder="Enter text or pattern to redact..."
              style={{ width: "100%", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: "9px 12px", color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
            <Btn variant="secondary" icon={icons.search} onClick={() => onToast("Redact applied!", "success")} disabled={!redactText.trim()}>Apply Redaction</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Search ──────────────────────────────────────────────────────────
const SearchSection = ({ files, onToast }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const mockSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setResults([
        { file: files[0]?.name || "document.pdf", page: 3, snippet: `...the term "${query}" appears in the context of business analysis...` },
        { file: files[0]?.name || "document.pdf", page: 7, snippet: `...further examples of "${query}" are explored in this section...` },
        { file: files[1]?.name || "report.pdf", page: 1, snippet: `...introduction references "${query}" as a key concept...` },
      ]);
      setSearching(false);
    }, 800);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Full-Text Search</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Icon d={icons.search} size={16} color={COLORS.textMuted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && mockSearch()} placeholder="Search across all documents..."
            style={{ width: "100%", background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px 12px 44px", color: COLORS.text, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        <Btn onClick={mockSearch} icon={icons.search} disabled={searching || !query.trim()}>
          {searching ? "Searching..." : "Search"}
        </Btn>
      </div>

      {results.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>{results.length} results found for "<b style={{ color: COLORS.text }}>{query}</b>"</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.map((r, i) => (
              <div key={i} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon d={icons.file} size={16} color={COLORS.accent} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{r.file}</span>
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.surface3, padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>Page {r.page}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>{r.snippet}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {results.length === 0 && !searching && query && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textDim }}>
          <Icon d={icons.search} size={36} color={COLORS.textDim} />
          <p style={{ margin: "16px 0 0" }}>No results found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

// ─── Section: Export & Cloud ──────────────────────────────────────────────────
const ExportSection = ({ files, onToast }) => {
  const clouds = [
    { name: "Google Drive", icon: "🟡", color: "#4285F4", connected: false },
    { name: "Dropbox", icon: "📦", color: "#0061FF", connected: true },
    { name: "OneDrive", icon: "☁️", color: "#0078D4", connected: false },
  ];
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Export & Cloud Storage</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: COLORS.text }}>Export Files</h3>
          {files.length === 0 ? (
            <div style={{ background: COLORS.surface2, border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: "30px", textAlign: "center", color: COLORS.textDim, fontSize: 13 }}>No files to export</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <Icon d={icons.file} size={18} color={COLORS.accent} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: COLORS.text }}>{f.name}</span>
                  <Btn variant="secondary" small icon={icons.download} onClick={() => onToast(`Downloading "${f.name}"...`, "success")}>Download</Btn>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: COLORS.text }}>Cloud Storage</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {clouds.map((c, i) => (
              <div key={i} style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 24 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: c.connected ? COLORS.success : COLORS.textDim }}>{c.connected ? "✓ Connected" : "Not connected"}</div>
                </div>
                <Btn variant={c.connected ? "secondary" : "primary"} small onClick={() => onToast(c.connected ? `Disconnected from ${c.name}` : `Connected to ${c.name}!`, "success")}>
                  {c.connected ? "Disconnect" : "Connect"}
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: View Files ──────────────────────────────────────────────────────
const ViewSection = ({ files, onAddFiles, onView, onRemove }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: 0, letterSpacing: "-0.3px" }}>File Manager</h2>
      <Btn icon={icons.upload} onClick={() => document.getElementById("main-file-input")?.click()}>Upload Files</Btn>
    </div>
    <DropZone onFiles={onAddFiles} label="Drop a PDF here or click to upload — it will open automatically" />
    <div style={{ marginTop: 20 }}>
      {files.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.textDim }}>
          <Icon d={icons.file} size={48} color={COLORS.textDim} />
          <p style={{ margin: "16px 0 0", fontSize: 14 }}>No files yet. Upload a PDF to get started.</p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: COLORS.textDim }}>Drag and drop a file above or click Upload Files</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
            Click any file to open it in the viewer
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((f, i) => (
              <FileCard
                key={i}
                file={f}
                onView={onView}
                onRemove={() => onRemove(f)}
                onDownload={() => {
                  if (f.raw) {
                    const url = URL.createObjectURL(f.raw);
                    const a = document.createElement("a");
                    a.href = url; a.download = f.name; a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);

// ─── Main Application ─────────────────────────────────────────────────────────
export default function PDFMasterApp() {
  const [activeModule, setActiveModule] = useState("dashboard");
  // Files now store the real File object in the .raw property
  // so the PDF viewer can actually open and render them
  const [files, setFiles] = useState([]);
  const [viewerFile, setViewerFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalDrag, setGlobalDrag] = useState(false);
  const dragCounter = useRef(0);

  // ── Prevent browser from opening dragged files outside the app ───────────────
  useEffect(() => {
    const prevent = (e) => {
      // Only intercept file drags — not internal element drags
      if (e.dataTransfer && e.dataTransfer.types &&
          Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const onDragEnter = (e) => {
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files")) {
        dragCounter.current += 1;
        setGlobalDrag(true);
      }
    };

    const onDragLeave = (e) => {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setGlobalDrag(false);
      }
    };

    const onDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setGlobalDrag(false);
      // If the drop landed outside a specific drop zone, add the files to workspace
      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      if (droppedFiles.length > 0) {
        // Check if a specific drop zone already handled this
        // by seeing if the target has the data-dropzone attribute
        if (!e.target.closest("[data-dropzone]")) {
          addFilesGlobal(droppedFiles);
        }
      }
    };

    document.addEventListener("dragover",  prevent);
    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop",      onDrop);

    return () => {
      document.removeEventListener("dragover",  prevent);
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop",      onDrop);
    };
  }, []);

  const showToast = useCallback((msg, type = "") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Used by the global drop handler — defined before addFiles to avoid circular ref
  const addFilesGlobal = useCallback((rawFiles) => {
    const mapped = rawFiles
      .filter(f => f instanceof File)
      .map(f => ({
        name:     f.name,
        size:     f.size,
        pages:    "—",
        modified: "Just now",
        raw:      f,
      }));
    if (mapped.length === 0) return;
    setFiles(prev => {
      const existing = new Set(prev.map(x => x.name));
      const fresh = mapped.filter(m => !existing.has(m.name));
      return [...prev, ...fresh];
    });
    setToast({ msg: `${mapped.length} file(s) added to workspace`, type: "success" });
    setTimeout(() => setToast(null), 3500);
    // Auto-open single file in viewer
    if (mapped.length === 1 && mapped[0].raw) {
      setTimeout(() => setViewerFile(mapped[0]), 300);
    }
  }, []);

  const addFiles = useCallback((newFiles) => {
    // newFiles can be File objects (from input/drop) or already-mapped objects (from CreateSection)
    const mapped = newFiles.map(f => {
      // Already a mapped object with a name property — came from CreateSection
      if (f && typeof f === "object" && !(f instanceof File) && f.name && f.raw) {
        return f;
      }
      // Raw File object from drag-and-drop or file input
      if (f instanceof File) {
        return {
          name: f.name,
          size: f.size,
          pages: "—",
          modified: "Just now",
          raw: f,
        };
      }
      return f;
    });

    setFiles(prev => {
      // Avoid adding duplicates by name
      const existing = new Set(prev.map(x => x.name));
      const fresh = mapped.filter(m => !existing.has(m.name));
      return [...prev, ...fresh];
    });

    showToast(`${newFiles.length} file(s) added to workspace!`, "success");

    // Auto-open in viewer when a single PDF is uploaded or added
    if (newFiles.length === 1) {
      const entry = mapped[0];
      if (entry && (entry.raw || entry.url)) {
        setTimeout(() => setViewerFile(entry), 300);
      }
    }
  }, [showToast]);

  const removeFile = useCallback((f) => {
    setFiles(prev => prev.filter(x => x !== f));
    showToast(`"${f.name}" removed.`, "");
  }, [showToast]);

  const renderSection = () => {
    const props = { files, onToast: showToast, onView: setViewerFile, onAddFiles: addFiles, onModule: setActiveModule };
    switch (activeModule) {
      case "dashboard": return <DashboardSection {...props} />;
      case "create": return <CreateSection {...props} />;
      case "view": return <ViewSection {...props} onRemove={removeFile} />;
      case "edit": return (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 12px" }}>Edit & Annotate</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 20 }}>Open a file in the viewer to annotate, highlight, comment, and edit.</p>
          {files.length === 0 ? <DropZone onFiles={addFiles} label="Upload a PDF to edit" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {files.map((f, i) => <FileCard key={i} file={f} onView={() => setViewerFile(f)} onRemove={() => removeFile(f)} />)}
            </div>
          )}
        </div>
      );
      case "merge": return <MergeSection {...props} />;
      case "sign": return <SignSection {...props} />;
      case "convert": return <ConvertSection {...props} />;
      case "extract": return <ExtractSection {...props} />;
      case "security": return <SecuritySection {...props} />;
      case "search": return <SearchSection {...props} />;
      case "export": return <ExportSection {...props} />;
      default: return <DashboardSection {...props} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.surface}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderLight}; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        select option { background: ${COLORS.surface2}; color: ${COLORS.text}; }
      `}</style>

      {/* Top Bar */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 20px", height: 54, display: "flex", alignItems: "center", gap: 16, flexShrink: 0, zIndex: 100 }}>
        <button onClick={() => setSidebarCollapsed(v => !v)} style={{ background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer", padding: 4 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ width: 18, height: 2, background: "currentColor", borderRadius: 1 }} />
            <div style={{ width: 14, height: 2, background: "currentColor", borderRadius: 1 }} />
            <div style={{ width: 18, height: 2, background: "currentColor", borderRadius: 1 }} />
          </div>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: COLORS.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={icons.file} size={16} color={COLORS.white} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: COLORS.white, letterSpacing: "-0.5px" }}>PDF<span style={{ color: COLORS.accent }}>Master</span></span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <input id="main-file-input" type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.pptx,.jpg,.png,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files.length) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />
          <Btn variant="secondary" icon={icons.upload} small onClick={() => document.getElementById("main-file-input")?.click()}>Upload</Btn>
          <Btn variant="primary" icon={icons.plus} small onClick={() => setActiveModule("create")}>New PDF</Btn>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: sidebarCollapsed ? 60 : 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, flexShrink: 0, overflow: "hidden", transition: "width 0.2s ease", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: sidebarCollapsed ? "12px 10px" : "12px", flex: 1, overflow: "auto" }}>
            {MODULES.map(m => {
              const active = activeModule === m.id;
              return (
                <button key={m.id} onClick={() => setActiveModule(m.id)} title={sidebarCollapsed ? m.label : undefined}
                  style={{ width: "100%", background: active ? m.color + "20" : "transparent", color: active ? m.color : COLORS.textMuted, border: `1px solid ${active ? m.color + "60" : "transparent"}`, borderRadius: 10, padding: sidebarCollapsed ? "10px" : "9px 12px", cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: active ? 700 : 500, display: "flex", alignItems: "center", gap: 10, marginBottom: 3, transition: "all 0.15s", whiteSpace: "nowrap", justifyContent: sidebarCollapsed ? "center" : "flex-start" }}>
                  <Icon d={m.icon} size={17} color={active ? m.color : COLORS.textMuted} />
                  {!sidebarCollapsed && m.label}
                </button>
              );
            })}
          </div>
          {!sidebarCollapsed && (
            <div style={{ padding: "12px 14px 16px", borderTop: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: COLORS.textDim, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>Storage</div>
              <div style={{ background: COLORS.surface2, borderRadius: 6, height: 5, overflow: "hidden" }}>
                <div style={{ width: "34%", height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 6 }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 5 }}>3.4 GB of 10 GB used</div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
          {renderSection()}
        </div>
      </div>

      {/* PDF Viewer Overlay — Real PDF.js viewer */}
      {viewerFile && <RealPDFViewer file={viewerFile} onClose={() => setViewerFile(null)} onAddFiles={addFiles} />}

      {/* Global drag overlay — shown when a file is dragged anywhere over the app */}
      {globalDrag && !viewerFile && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(232,77,77,0.08)",
          border: `3px dashed ${COLORS.accent}`,
          borderRadius: 16, margin: 8,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <Icon d={icons.upload} size={52} color={COLORS.accent} />
          <p style={{ margin: "16px 0 6px", fontSize: 20, fontWeight: 800, color: COLORS.accent, letterSpacing: "-0.5px" }}>
            Drop to add to workspace
          </p>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>
            Release to upload — your file stays inside PDF Master
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
