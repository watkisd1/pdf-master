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
  const isPDF = ext === "PDF";
  const extColor = isPDF ? COLORS.accent
    : ext === "DOCX" || ext === "DOC"  ? "#60A5FA"
    : ext === "XLSX" || ext === "XLS"  ? COLORS.success
    : ext === "PPTX" || ext === "PPT"  ? "#FB923C"
    : ext === "JPG"  || ext === "JPEG" || ext === "PNG" ? COLORS.teal
    : COLORS.gold;

  const handleCardClick = () => {
    if (!isPDF) {
      // Non-PDF files can't be opened in the viewer
      // Just select them for use in merge/convert panels
      if (onSelect) onSelect();
      return;
    }
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
          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : "—"} · {file.pages && file.pages !== "—" ? `${file.pages} pages` : ext}
        </div>
        <div style={{ fontSize: 11, marginTop: 2 }}>
          {isPDF
            ? <span style={{ color: COLORS.textDim }}>{file.modified || "Just now"}</span>
            : <span style={{ color: COLORS.gold, fontWeight: 600 }}>⚠ Convert to PDF to view</span>
          }
        </div>
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
const ConvertSection = ({ files, onToast, onAddFiles }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState("jpg");
  const [converting, setConverting]     = useState(false);
  const [progress, setProgress]         = useState(0);
  const [progressMsg, setProgressMsg]   = useState("");
  const [results, setResults]           = useState([]); // converted file blobs
  const [imgQuality, setImgQuality]     = useState(0.92);
  const [imgScale, setImgScale]         = useState(2.0);
  const [pageRange, setPageRange]       = useState("all");
  const [toPdfFiles, setToPdfFiles]     = useState([]);
  const toPdfRef = useRef();

  // Formats that work entirely in the browser
  const browserFormats = [
    { id: "jpg",  label: "JPEG Images",   icon: "\uD83D\uDDBC", color: "#FF6B6B", desc: "One image per page, great for sharing" },
    { id: "png",  label: "PNG Images",    icon: "\uD83D\uDDBC", color: "#4ECDC4", desc: "Lossless, transparent background support" },
    { id: "txt",  label: "Plain Text",    icon: "T",            color: "#7B8099", desc: "Extracted text content, no formatting" },
    { id: "html", label: "HTML Document", icon: "H",            color: "#E44D26", desc: "Web-ready with basic layout preserved" },
  ];

  const inputStyle = {
    width: "100%", background: COLORS.surface,
    border: `1px solid ${COLORS.border}`, borderRadius: 9,
    padding: "8px 12px", color: COLORS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  // ── Parse page range string into array of 1-based page numbers ──────────────
  const parseRange = (str, total) => {
    if (!str || str === "all") return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set();
    str.split(",").forEach(part => {
      part = part.trim();
      if (part.includes("-")) {
        const [s, e] = part.split("-").map(Number);
        for (let i = s; i <= Math.min(e, total); i++) pages.add(i);
      } else {
        const n = Number(part);
        if (n >= 1 && n <= total) pages.add(n);
      }
    });
    return Array.from(pages).sort((a, b) => a - b);
  };

  // ── Download a blob ──────────────────────────────────────────────────────────
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Main conversion function ─────────────────────────────────────────────────
  const startConvert = async () => {
    if (!selectedFile)     { onToast("Select a file first.", "error"); return; }
    if (!selectedFile.raw) { onToast("Re-upload the file — no data found.", "error"); return; }
    setConverting(true); setResults([]); setProgress(0);
    setProgressMsg("Loading PDF\u2026");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        (window.location.origin || "") + "/pdf.worker.min.js";

      const buffer  = await selectedFile.raw.arrayBuffer();
      const pdfDoc  = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total   = pdfDoc.numPages;
      const pages   = parseRange(pageRange, total);
      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      const converted = [];

      // ── JPG / PNG: render each page to canvas → blob ───────────────────────
      if (targetFormat === "jpg" || targetFormat === "png") {
        const mime = targetFormat === "jpg" ? "image/jpeg" : "image/png";
        const ext  = targetFormat;

        for (let idx = 0; idx < pages.length; idx++) {
          const pageNum = pages[idx];
          setProgressMsg(`Rendering page ${pageNum} of ${total}\u2026`);
          setProgress(Math.round(((idx + 1) / pages.length) * 90));

          const page = await pdfDoc.getPage(pageNum);
          const vp   = page.getViewport({ scale: imgScale });
          const canvas = document.createElement("canvas");
          canvas.width  = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;

          const blob = await new Promise(res =>
            canvas.toBlob(res, mime, imgQuality)
          );
          const filename = pages.length === 1
            ? `${baseName}.${ext}`
            : `${baseName}_page${pageNum}.${ext}`;
          converted.push({ blob, filename, pageNum });

          // Download each page image
          downloadBlob(blob, filename);

          // Small delay between downloads so browser doesn't block them
          if (pages.length > 1) await new Promise(r => setTimeout(r, 80));
        }

        setResults(converted);
        setProgress(100);
        setProgressMsg("");
        onToast(`\u2713 Converted ${pages.length} page(s) to ${ext.toUpperCase()}!`, "success");

      // ── Plain text: extract text from each page ────────────────────────────
      } else if (targetFormat === "txt") {
        let fullText = `${baseName}\n${"=".repeat(baseName.length)}\n\n`;

        for (let idx = 0; idx < pages.length; idx++) {
          const pageNum = pages[idx];
          setProgressMsg(`Extracting page ${pageNum} of ${total}\u2026`);
          setProgress(Math.round(((idx + 1) / pages.length) * 90));
          const page    = await pdfDoc.getPage(pageNum);
          const content = await page.getTextContent();
          const text    = content.items.map(item => item.str).join(" ").trim();
          fullText += `--- Page ${pageNum} ---\n${text || "(no text on this page)"}\n\n`;
        }

        const blob     = new Blob([fullText], { type: "text/plain" });
        const filename = `${baseName}.txt`;
        downloadBlob(blob, filename);
        setResults([{ blob, filename }]);
        setProgress(100);
        setProgressMsg("");
        onToast(`\u2713 Extracted text from ${pages.length} page(s)!`, "success");

      // ── HTML: render each page to canvas, embed as img tags in HTML ────────
      } else if (targetFormat === "html") {
        setProgressMsg("Building HTML document\u2026");
        let imgTags = "";
        const thumbScale = Math.min(imgScale, 1.5);

        for (let idx = 0; idx < pages.length; idx++) {
          const pageNum = pages[idx];
          setProgressMsg(`Rendering page ${pageNum} for HTML\u2026`);
          setProgress(Math.round(((idx + 1) / pages.length) * 85));
          const page   = await pdfDoc.getPage(pageNum);
          const vp     = page.getViewport({ scale: thumbScale });
          const canvas = document.createElement("canvas");
          canvas.width  = vp.width;
          canvas.height = vp.height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          imgTags += `
  <div class="page">
    <div class="page-label">Page ${pageNum}</div>
    <img src="${dataUrl}" alt="Page ${pageNum}" style="width:100%;height:auto;display:block;" />
  </div>`;
        }

        // Also extract text for searchability
        setProgressMsg("Adding text layer\u2026");
        let textContent = "";
        for (const pageNum of pages) {
          const page    = await pdfDoc.getPage(pageNum);
          const content = await page.getTextContent();
          textContent  += content.items.map(i => i.str).join(" ") + "\n";
        }

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${baseName}</title>
  <style>
    body { margin: 0; background: #555; font-family: sans-serif; }
    .header { background: #C0392B; color: #fff; padding: 16px 24px; font-size: 18px; font-weight: 700; }
    .pages  { max-width: 900px; margin: 24px auto; display: flex; flex-direction: column; gap: 16px; padding: 0 16px 40px; }
    .page   { background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.4); border-radius: 4px; overflow: hidden; }
    .page-label { background: #f0f0f0; padding: 6px 12px; font-size: 11px; color: #666; font-weight: 600; }
    .text-layer { display: none; }
  </style>
</head>
<body>
  <div class="header">\uD83D\uDCC4 ${baseName}</div>
  <div class="pages">${imgTags}
  </div>
  <div class="text-layer">${textContent.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
</body>
</html>`;

        const blob     = new Blob([html], { type: "text/html" });
        const filename = `${baseName}.html`;
        downloadBlob(blob, filename);
        setResults([{ blob, filename }]);
        setProgress(100);
        setProgressMsg("");
        onToast(`\u2713 Converted to HTML (${pages.length} pages)!`, "success");
      }

      setConverting(false);
    } catch (err) {
      console.error(err);
      setConverting(false);
      setProgressMsg("");
      onToast(`Conversion failed: ${err.message}`, "error");
    }
  };

  // ── Images → PDF conversion ──────────────────────────────────────────────────
  const convertImagesToPdf = async () => {
    if (toPdfFiles.length === 0) { onToast("Add image files first.", "error"); return; }
    setConverting(true); setProgress(0);
    setProgressMsg("Building PDF from images\u2026");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < toPdfFiles.length; i++) {
        const file = toPdfFiles[i];
        setProgressMsg(`Adding image ${i + 1} of ${toPdfFiles.length}\u2026`);
        setProgress(Math.round(((i + 1) / toPdfFiles.length) * 90));
        const buffer = await file.arrayBuffer();
        const ext    = file.name.split(".").pop().toLowerCase();
        let   img;
        if (ext === "png") {
          img = await pdfDoc.embedPng(buffer);
        } else {
          img = await pdfDoc.embedJpg(buffer);
        }
        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }

      const bytes    = await pdfDoc.save();
      const blob     = new Blob([bytes], { type: "application/pdf" });
      const filename = "images_converted.pdf";
      downloadBlob(blob, filename);

      const rawFile = new File([blob], filename, { type: "application/pdf" });
      if (onAddFiles) onAddFiles([rawFile]);

      setProgress(100); setProgressMsg("");
      setToPdfFiles([]);
      onToast(`\u2713 ${toPdfFiles.length} image(s) converted to PDF!`, "success");
      setConverting(false);
    } catch (err) {
      console.error(err);
      setConverting(false); setProgressMsg("");
      onToast(`Conversion failed: ${err.message}`, "error");
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>
        Convert Files
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── PDF → Other ── */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>PDF \u2192 Other formats</h3>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: COLORS.textMuted }}>All conversions run in the browser \u2014 no upload required.</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Source PDF</label>
            {files.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textDim, padding: "12px", background: COLORS.surface, borderRadius: 8, border: `1px dashed ${COLORS.border}`, textAlign: "center" }}>Upload a PDF first</div>
            ) : (
              <select onChange={e => { setSelectedFile(files[parseInt(e.target.value)]); setResults([]); }} style={inputStyle}>
                <option value="">Select a file\u2026</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>Target format</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {browserFormats.map(f => (
                <div key={f.id} onClick={() => { setTargetFormat(f.id); setResults([]); }} style={{ background: targetFormat === f.id ? `${f.color}18` : COLORS.surface, border: `1.5px solid ${targetFormat === f.id ? f.color : COLORS.border}`, borderRadius: 9, padding: "10px 14px", cursor: "pointer", transition: "all 0.12s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, minWidth: 22 }}>{f.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: targetFormat === f.id ? f.color : COLORS.text }}>{f.label}</span>
                  </div>
                  {targetFormat === f.id && <p style={{ margin: "4px 0 0 30px", fontSize: 11, color: COLORS.textMuted }}>{f.desc}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Image quality options */}
          {(targetFormat === "jpg" || targetFormat === "png") && (
            <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".4px" }}>Scale</label>
                <select value={imgScale} onChange={e => setImgScale(parseFloat(e.target.value))} style={inputStyle}>
                  <option value="1.0">1x — Screen (fast)</option>
                  <option value="1.5">1.5x — Good</option>
                  <option value="2.0">2x — High quality</option>
                  <option value="3.0">3x — Print quality</option>
                </select>
              </div>
              {targetFormat === "jpg" && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".4px" }}>Quality</label>
                  <select value={imgQuality} onChange={e => setImgQuality(parseFloat(e.target.value))} style={inputStyle}>
                    <option value="0.6">60% — Small file</option>
                    <option value="0.8">80% — Balanced</option>
                    <option value="0.92">92% — High</option>
                    <option value="1.0">100% — Maximum</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Page range */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".4px" }}>Page range</label>
            <input value={pageRange} onChange={e => setPageRange(e.target.value)} placeholder="all  or  1-3, 5, 7-10" style={inputStyle} />
          </div>

          {/* Progress */}
          {converting && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>
                <span>{progressMsg || "Converting\u2026"}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: COLORS.surface, borderRadius: 100, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 100, transition: "width 0.2s" }} />
              </div>
            </div>
          )}

          <Btn
            onClick={startConvert}
            icon={icons.convert}
            disabled={converting || !selectedFile}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {converting ? "Converting\u2026" : `Convert to ${browserFormats.find(f => f.id === targetFormat)?.label}`}
          </Btn>

          {/* Results */}
          {results.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.success, marginBottom: 8 }}>
                \u2713 {results.length} file(s) ready \u2014 check your Downloads folder
              </div>
              {results.slice(0, 5).map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: COLORS.surface, borderRadius: 7, marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: COLORS.success }}>\u2713</span>
                  <span style={{ flex: 1, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.filename}</span>
                  <button onClick={() => downloadBlob(r.blob, r.filename)} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" }}>
                    Re-download
                  </button>
                </div>
              ))}
              {results.length > 5 && (
                <div style={{ fontSize: 11, color: COLORS.textDim }}>+{results.length - 5} more files in Downloads</div>
              )}
            </div>
          )}

          {/* Capability note for formats that need a backend */}
          <div style={{ marginTop: 14, background: COLORS.surface, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: COLORS.textDim, lineHeight: 1.6 }}>
            \uD83D\uDCA1 <b style={{ color: COLORS.text }}>Word, Excel, PowerPoint</b> conversion requires a server-side service (Adobe PDF Services, CloudConvert, or pdf.co). The formats above work entirely in your browser.
          </div>
        </div>

        {/* ── Images → PDF ── */}
        <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Images \u2192 PDF</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: COLORS.textMuted }}>Combine one or more JPG or PNG images into a single PDF. Each image becomes one page.</p>

          <input
            ref={toPdfRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp"
            style={{ display: "none" }}
            onChange={e => {
              setToPdfFiles(prev => [...prev, ...Array.from(e.target.files)]);
              e.target.value = "";
            }}
          />

          {toPdfFiles.length === 0 ? (
            <div
              data-dropzone="true"
              onClick={() => toPdfRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = COLORS.accent; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border; }}
              onDrop={e => {
                e.preventDefault(); e.stopPropagation();
                e.currentTarget.style.borderColor = COLORS.border;
                const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
                if (dropped.length) setToPdfFiles(prev => [...prev, ...dropped]);
              }}
              style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: COLORS.surface, marginBottom: 14, transition: "border-color 0.15s" }}
            >
              <Icon d={icons.upload} size={30} color={COLORS.textDim} />
              <p style={{ margin: "10px 0 4px", fontSize: 14, fontWeight: 600, color: COLORS.text }}>Drop images here</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>JPG, PNG, WebP \u2014 each image becomes one page</p>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{toPdfFiles.length} image(s) selected</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" small onClick={() => toPdfRef.current?.click()} icon={icons.plus}>Add more</Btn>
                  <Btn variant="ghost" small onClick={() => setToPdfFiles([])}>Clear all</Btn>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                {toPdfFiles.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: COLORS.surface, borderRadius: 8, padding: "7px 12px" }}>
                    <span style={{ fontSize: 16 }}>\uD83D\uDDBC</span>
                    <span style={{ flex: 1, fontSize: 12, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button onClick={() => setToPdfFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: COLORS.error, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>\u00d7</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Btn
            onClick={convertImagesToPdf}
            variant="teal"
            icon={icons.file}
            disabled={converting || toPdfFiles.length === 0}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {converting ? progressMsg || "Converting\u2026" : `Convert ${toPdfFiles.length > 0 ? toPdfFiles.length + " image(s)" : "images"} to PDF`}
          </Btn>

          {toPdfFiles.length > 0 && !converting && (
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 10, lineHeight: 1.5 }}>
              Images will appear in the order listed above. Each becomes one full page in the PDF.
            </p>
          )}

          <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: COLORS.text }}>Other conversions</h4>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 10px", lineHeight: 1.6 }}>
              These formats require a free external API. The most reliable option is <b style={{ color: COLORS.text }}>CloudConvert</b> or <b style={{ color: COLORS.text }}>pdf.co</b>.
            </p>
            {[
              { label: "Word (.docx) \u2192 PDF", note: "Upload to CloudConvert" },
              { label: "Excel (.xlsx) \u2192 PDF", note: "Upload to CloudConvert" },
              { label: "PowerPoint (.pptx) \u2192 PDF", note: "Upload to CloudConvert" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: COLORS.surface, borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{item.label}</span>
                <a href="https://cloudconvert.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, textDecoration: "none" }}>
                  Open \u2192
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Extract & Parse ─────────────────────────────────────────────────
const ExtractSection = ({ files, onToast }) => {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [extractType, setExtractType]     = useState("text");
  const [results, setResults]             = useState(null);
  const [extracting, setExtracting]       = useState(false);
  const [progress, setProgress]           = useState(0);
  const [progressMsg, setProgressMsg]     = useState("");
  const [ocrEnabled, setOcrEnabled]       = useState(false);
  const [pageRange, setPageRange]         = useState("all");

  const types = [
    { id: "text",     label: "Text Content",  icon: "T",  desc: "Extract all readable text from every page" },
    { id: "metadata", label: "Metadata",      icon: "ℹ",  desc: "Title, author, dates, creator, file info" },
    { id: "links",    label: "Hyperlinks",    icon: "🔗", desc: "All URLs and mailto links in the document" },
    { id: "pages",    label: "Page Info",     icon: "📄", desc: "Page count, dimensions, rotation per page" },
    { id: "ocr",      label: "OCR (Scanned)", icon: "🔍", desc: "Read text from scanned or image-based PDFs" },
  ];

  // ── Download helper ──────────────────────────────────────────────────────────
  const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Real extraction using PDF.js ─────────────────────────────────────────────
  const doExtract = async () => {
    if (!selectedFile)      { onToast("Select a file first.", "error"); return; }
    if (!selectedFile.raw)  { onToast("Re-upload this file — no data found.", "error"); return; }
    setExtracting(true);
    setResults(null);
    setProgress(0);
    setProgressMsg("Loading PDF…");

    try {
      // Dynamically import PDF.js
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        (window.location.origin || "") + "/pdf.worker.min.js";

      const buffer = await selectedFile.raw.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const total  = pdfDoc.numPages;

      // ── Text extraction ────────────────────────────────────────────────────
      if (extractType === "text") {
        let fullText = "";
        const pagesToProcess = pageRange === "all"
          ? Array.from({ length: total }, (_, i) => i + 1)
          : pageRange.split(",").flatMap(part => {
              const [s, e] = part.trim().split("-").map(Number);
              return e ? Array.from({ length: e - s + 1 }, (_, i) => s + i) : [s];
            }).filter(n => n >= 1 && n <= total);

        for (let i = 0; i < pagesToProcess.length; i++) {
          const pageNum = pagesToProcess[i];
          setProgressMsg(`Extracting page ${pageNum} of ${total}…`);
          setProgress(Math.round(((i + 1) / pagesToProcess.length) * 90));
          const page    = await pdfDoc.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          if (pageText.trim()) {
            fullText += `\n─── Page ${pageNum} ───\n${pageText}\n`;
          } else {
            fullText += `\n─── Page ${pageNum} ─── (no extractable text — try OCR)\n`;
          }
        }
        setResults({ type: "text", content: fullText.trim() || "No text found.", pages: pagesToProcess.length });

      // ── Metadata extraction ────────────────────────────────────────────────
      } else if (extractType === "metadata") {
        setProgressMsg("Reading metadata…");
        setProgress(40);
        const meta   = await pdfDoc.getMetadata().catch(() => ({}));
        const info   = meta?.info || {};
        const lines  = [
          `Title:        ${info.Title        || "—"}`,
          `Author:       ${info.Author       || "—"}`,
          `Subject:      ${info.Subject      || "—"}`,
          `Keywords:     ${info.Keywords     || "—"}`,
          `Creator:      ${info.Creator      || "—"}`,
          `Producer:     ${info.Producer     || "—"}`,
          `Created:      ${info.CreationDate || "—"}`,
          `Modified:     ${info.ModDate      || "—"}`,
          `PDF Version:  ${info.PDFFormatVersion || "—"}`,
          ``,
          `Pages:        ${total}`,
          `File size:    ${(selectedFile.size / 1024).toFixed(1)} KB`,
          `Encrypted:    ${info.IsEncrypted  ? "Yes" : "No"}`,
          `Form fields:  ${info.IsAcroFormPresent ? "Yes" : "No"}`,
          `Tagged PDF:   ${info.IsTaggedPDF  ? "Yes" : "No"}`,
        ];
        setProgress(100);
        setResults({ type: "metadata", content: lines.join("\n") });

      // ── Hyperlink extraction ───────────────────────────────────────────────
      } else if (extractType === "links") {
        let allLinks = [];
        for (let p = 1; p <= total; p++) {
          setProgressMsg(`Scanning page ${p} of ${total} for links…`);
          setProgress(Math.round((p / total) * 90));
          const page        = await pdfDoc.getPage(p);
          const annotations = await page.getAnnotations();
          annotations.forEach(ann => {
            if (ann.subtype === "Link") {
              if (ann.url) {
                allLinks.push(`• [Page ${p}] ${ann.url}`);
              } else if (ann.dest) {
                allLinks.push(`• [Page ${p}] Internal link → ${JSON.stringify(ann.dest)}`);
              } else if (ann.action?.URI) {
                allLinks.push(`• [Page ${p}] ${ann.action.URI}`);
              }
            }
          });
        }
        setProgress(100);
        setResults({
          type: "links",
          content: allLinks.length > 0
            ? `Found ${allLinks.length} link(s):\n\n${allLinks.join("\n")}`
            : "No hyperlinks found in this document.",
        });

      // ── Page info ──────────────────────────────────────────────────────────
      } else if (extractType === "pages") {
        let info = `PDF contains ${total} page(s)\n\n`;
        for (let p = 1; p <= total; p++) {
          setProgressMsg(`Reading page ${p} info…`);
          setProgress(Math.round((p / total) * 90));
          const page = await pdfDoc.getPage(p);
          const vp   = page.getViewport({ scale: 1 });
          const rot  = page.rotate || 0;
          info += `Page ${p}: ${Math.round(vp.width)} × ${Math.round(vp.height)} pts`;
          info += ` (${(vp.width * 0.0352778).toFixed(1)} × ${(vp.height * 0.0352778).toFixed(1)} cm)`;
          if (rot) info += ` — rotated ${rot}°`;
          info += "\n";
        }
        setProgress(100);
        setResults({ type: "pages", content: info.trim() });

      // ── OCR using Tesseract.js ─────────────────────────────────────────────
      } else if (extractType === "ocr") {
        setProgressMsg("Loading OCR engine…");
        setProgress(5);

        let Tesseract;
        try {
          Tesseract = await import("tesseract.js");
        } catch {
          setResults({
            type: "ocr",
            content: "Tesseract.js is not installed.\n\nRun this command in your pdf-master folder:\n\n  npm install tesseract.js\n\nThen restart the app and try again.",
            error: true,
          });
          setExtracting(false);
          return;
        }

        const worker = await Tesseract.createWorker("eng", 1, {
          logger: m => {
            if (m.status === "recognizing text") {
              setProgress(10 + Math.round(m.progress * 85));
              setProgressMsg(`OCR page ${m.jobId || 1}… ${Math.round(m.progress * 100)}%`);
            }
          },
        });

        let ocrText = "";
        const pagesToOCR = Math.min(total, 5); // OCR up to 5 pages (can be slow)

        for (let p = 1; p <= pagesToOCR; p++) {
          setProgressMsg(`Rendering page ${p} for OCR…`);
          const page = await pdfDoc.getPage(p);
          const vp   = page.getViewport({ scale: 2.0 }); // higher scale = better OCR
          const canvas = document.createElement("canvas");
          canvas.width  = vp.width;
          canvas.height = vp.height;
          await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;

          setProgressMsg(`Running OCR on page ${p}…`);
          const { data: { text } } = await worker.recognize(canvas);
          ocrText += `\n─── Page ${p} (OCR) ───\n${text.trim()}\n`;
        }

        await worker.terminate();
        setProgress(100);

        const suffix = pagesToOCR < total ? `\n\n(Showing first ${pagesToOCR} of ${total} pages — OCR can be slow)` : "";
        setResults({ type: "ocr", content: (ocrText.trim() || "No text detected.") + suffix });
      }

      setProgress(100);
      setProgressMsg("");
      setExtracting(false);
      onToast(`Extraction complete!`, "success");

    } catch (err) {
      console.error(err);
      setExtracting(false);
      setProgressMsg("");
      onToast(`Extraction failed: ${err.message}`, "error");
      setResults({ type: extractType, content: `Error: ${err.message}`, error: true });
    }
  };

  const inputStyle = {
    width: "100%", background: COLORS.surface,
    border: `1px solid ${COLORS.border}`, borderRadius: 9,
    padding: "8px 12px", color: COLORS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>
        Extract & OCR
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>

        {/* ── Left: Controls ── */}
        <div>
          {/* File picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>
              Source file
            </label>
            {files.length === 0 ? (
              <div style={{ fontSize: 12, color: COLORS.textDim, padding: "12px", background: COLORS.surface2, borderRadius: 8, border: `1px dashed ${COLORS.border}`, textAlign: "center" }}>
                Upload a PDF first
              </div>
            ) : (
              <select
                onChange={e => setSelectedFile(files[parseInt(e.target.value)])}
                style={{ ...inputStyle }}
              >
                <option value="">Select a file…</option>
                {files.map((f, i) => (
                  <option key={i} value={i}>{f.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Extraction type */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>
              Extract type
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {types.map(t => (
                <div
                  key={t.id}
                  onClick={() => setExtractType(t.id)}
                  style={{
                    background: extractType === t.id ? COLORS.accentSoft : COLORS.surface2,
                    border: `1.5px solid ${extractType === t.id ? COLORS.accent : COLORS.border}`,
                    borderRadius: 9, padding: "10px 14px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, minWidth: 22 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: extractType === t.id ? COLORS.accent : COLORS.text }}>
                      {t.label}
                    </span>
                    {t.id === "ocr" && (
                      <span style={{ fontSize: 10, background: COLORS.gold + "30", color: COLORS.gold, border: `1px solid ${COLORS.gold}`, borderRadius: 100, padding: "1px 7px", fontWeight: 700 }}>
                        Tesseract
                      </span>
                    )}
                  </div>
                  {extractType === t.id && (
                    <p style={{ margin: "4px 0 0 30px", fontSize: 11, color: COLORS.textMuted }}>{t.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Page range — only for text */}
          {extractType === "text" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>
                Page range
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {[["all", "All pages"], ["range", "Custom range"]].map(([id, lbl]) => (
                  <div key={id} onClick={() => setPageRange(id === "all" ? "all" : "")} style={{ flex: 1, background: (pageRange === "all") === (id === "all") ? COLORS.accentSoft : COLORS.surface2, border: `1.5px solid ${(pageRange === "all") === (id === "all") ? COLORS.accent : COLORS.border}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: (pageRange === "all") === (id === "all") ? COLORS.accent : COLORS.text, textAlign: "center" }}>
                    {lbl}
                  </div>
                ))}
              </div>
              {pageRange !== "all" && (
                <input
                  value={pageRange}
                  onChange={e => setPageRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  style={inputStyle}
                />
              )}
            </div>
          )}

          {/* OCR note */}
          {extractType === "ocr" && (
            <div style={{ background: COLORS.goldSoft, border: `1px solid ${COLORS.gold}`, borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: COLORS.gold, lineHeight: 1.6 }}>
              <b>OCR requires tesseract.js</b><br />
              Run <code style={{ background: "rgba(0,0,0,0.1)", borderRadius: 4, padding: "1px 5px" }}>npm install tesseract.js</code> if you haven't already. OCR is slow — up to 5 pages at a time.
            </div>
          )}

          {/* Extract button */}
          {extracting ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>
                <span>{progressMsg || "Processing…"}</span>
                <span>{progress}%</span>
              </div>
              <div style={{ background: COLORS.surface, borderRadius: 100, height: 6, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`, borderRadius: 100, transition: "width 0.3s" }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.textDim, textAlign: "center" }}>Please wait…</div>
            </div>
          ) : (
            <Btn
              onClick={doExtract}
              icon={icons.extract}
              disabled={!selectedFile}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Extract {types.find(t => t.id === extractType)?.label}
            </Btn>
          )}
        </div>

        {/* ── Right: Results ── */}
        <div>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px", minHeight: 400 }}>
            {results ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: results.error ? COLORS.error : COLORS.text }}>
                      {results.error ? "⚠ Error" : `✓ ${types.find(t => t.id === results.type)?.label}`}
                    </h3>
                    {results.pages && (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>
                        {results.pages} page(s) processed · {results.content.length.toLocaleString()} characters
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="secondary"
                      small
                      icon={icons.download}
                      onClick={() => downloadText(results.content, `${selectedFile?.name?.replace(".pdf","") || "extracted"}_${results.type}.txt`)}
                    >
                      Download .txt
                    </Btn>
                    <Btn variant="ghost" small onClick={() => setResults(null)}>Clear</Btn>
                  </div>
                </div>

                {/* Result preview */}
                <pre style={{
                  background: COLORS.surface,
                  border: `1px solid ${results.error ? COLORS.error : COLORS.border}`,
                  borderRadius: 10, padding: "16px", fontSize: 12,
                  color: results.error ? COLORS.error : COLORS.text,
                  lineHeight: 1.7, overflow: "auto", margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "'Courier New', Consolas, monospace",
                  maxHeight: 520,
                }}>
                  {results.content}
                </pre>

                {/* Word/character count */}
                {!results.error && (
                  <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 11, color: COLORS.textDim }}>
                    <span>📝 {results.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
                    <span>🔤 {results.content.length.toLocaleString()} characters</span>
                    <span>📄 {results.content.split("\n").length.toLocaleString()} lines</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 340, color: COLORS.textDim, textAlign: "center" }}>
                <Icon d={icons.extract} size={44} color={COLORS.textDim} />
                <p style={{ margin: "16px 0 6px", fontSize: 15, fontWeight: 600, color: COLORS.text }}>
                  Ready to extract
                </p>
                <p style={{ margin: 0, fontSize: 13, maxWidth: 280, lineHeight: 1.6 }}>
                  Select a file and extraction type on the left, then click Extract.
                </p>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", background: COLORS.surface, borderRadius: 10, padding: "14px 18px", fontSize: 12, color: COLORS.textMuted }}>
                  <span>📄 <b style={{ color: COLORS.text }}>Text</b> — works on any searchable PDF</span>
                  <span>ℹ <b style={{ color: COLORS.text }}>Metadata</b> — always available</span>
                  <span>🔗 <b style={{ color: COLORS.text }}>Links</b> — finds all URLs</span>
                  <span>🔍 <b style={{ color: COLORS.text }}>OCR</b> — for scanned / image PDFs</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section: Security ────────────────────────────────────────────────────────
const SecuritySection = ({ files, onToast, onAddFiles }) => {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [userPwd, setUserPwd]             = useState("");
  const [ownerPwd, setOwnerPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]       = useState("");
  const [showUserPwd, setShowUserPwd]     = useState(false);
  const [showOwnerPwd, setShowOwnerPwd]   = useState(false);
  const [encLevel, setEncLevel]           = useState("128");
  const [protecting, setProtecting]       = useState(false);
  const [unlocking, setUnlocking]         = useState(false);
  const [unlockPwd, setUnlockPwd]         = useState("");
  const [unlockFile, setUnlockFile]       = useState(null);
  const [redactText, setRedactText]       = useState("");
  const [redacting, setRedacting]         = useState(false);
  const [tab, setTab]                     = useState("protect");
  const [permissions, setPermissions]     = useState({
    printing:     true,
    modifying:    false,
    copying:      true,
    annotating:   true,
    fillingForms: true,
  });

  const inputStyle = {
    width: "100%", background: COLORS.surface,
    border: `1px solid ${COLORS.border}`, borderRadius: 9,
    padding: "9px 12px", color: COLORS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const Toggle = ({ label, desc, k }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <div>
        <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{desc}</div>}
      </div>
      <div
        onClick={() => setPermissions(p => ({ ...p, [k]: !p[k] }))}
        style={{ width: 40, height: 22, background: permissions[k] ? COLORS.success : COLORS.surface3, borderRadius: 11, position: "relative", cursor: "pointer", transition: "background 0.2s", border: `1px solid ${permissions[k] ? COLORS.success : COLORS.border}`, flexShrink: 0, marginLeft: 16 }}>
        <div style={{ width: 16, height: 16, background: COLORS.white, borderRadius: "50%", position: "absolute", top: 2, left: permissions[k] ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );

  const pwdStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: COLORS.border };
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: "Weak",   color: COLORS.error };
    if (score <= 3) return { score, label: "Fair",   color: COLORS.gold };
    return                { score, label: "Strong",  color: COLORS.success };
  };
  const strength = pwdStrength(userPwd);

  const applyProtection = async () => {
    if (!selectedFile)          { onToast("Select a file first.", "error"); return; }
    if (!selectedFile.raw)      { onToast("Re-upload the file.", "error"); return; }
    if (!userPwd)               { onToast("Enter a user password.", "error"); return; }
    if (userPwd !== confirmPwd) { onToast("Passwords do not match.", "error"); return; }
    if (userPwd.length < 4)     { onToast("Password must be at least 4 characters.", "error"); return; }
    setProtecting(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await selectedFile.raw.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const permFlags = {
        printing:             permissions.printing     ? "highResolution" : "none",
        modifying:            permissions.modifying,
        copying:              permissions.copying,
        annotating:           permissions.annotating,
        fillingForms:         permissions.fillingForms,
        contentAccessibility: true,
        documentAssembly:     false,
      };
      const encryptedBytes = await pdfDoc.save({
        userPassword:  userPwd,
        ownerPassword: ownerPwd || userPwd + "_owner",
        permissions:   permFlags,
      });
      const fileName = selectedFile.name.replace(/\.pdf$/i, "") + "_protected.pdf";
      const blob     = new Blob([encryptedBytes], { type: "application/pdf" });
      const rawFile  = new File([blob], fileName, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      if (onAddFiles) onAddFiles([rawFile]);
      onToast(`\u2713 "${fileName}" protected successfully!`, "success");
      setUserPwd(""); setConfirmPwd(""); setOwnerPwd("");
      setProtecting(false);
    } catch (err) {
      console.error(err);
      setProtecting(false);
      onToast(`Protection failed: ${err.message}`, "error");
    }
  };

  const removeProtection = async () => {
    if (!unlockFile)     { onToast("Select a file.", "error"); return; }
    if (!unlockFile.raw) { onToast("Re-upload the file.", "error"); return; }
    if (!unlockPwd)      { onToast("Enter the password.", "error"); return; }
    setUnlocking(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buffer = await unlockFile.raw.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { password: unlockPwd });
      const bytes  = await pdfDoc.save();
      const fileName = unlockFile.name.replace(/(_protected)?\.pdf$/i, "") + "_unlocked.pdf";
      const blob   = new Blob([bytes], { type: "application/pdf" });
      const rawFile = new File([blob], fileName, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      if (onAddFiles) onAddFiles([rawFile]);
      onToast(`\u2713 Password removed \u2014 "${fileName}" is unlocked!`, "success");
      setUnlockPwd(""); setUnlocking(false);
    } catch (err) {
      console.error(err);
      setUnlocking(false);
      const msg = err.message?.toLowerCase();
      if (msg?.includes("password") || msg?.includes("decrypt")) {
        onToast("Wrong password \u2014 could not unlock this PDF.", "error");
      } else {
        onToast(`Unlock failed: ${err.message}`, "error");
      }
    }
  };

  const applyRedaction = async () => {
    if (!selectedFile)      { onToast("Select a file first.", "error"); return; }
    if (!selectedFile.raw)  { onToast("Re-upload the file.", "error"); return; }
    if (!redactText.trim()) { onToast("Enter text to redact.", "error"); return; }
    setRedacting(true);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = (window.location.origin || "") + "/pdf.worker.min.js";
      const buffer   = await selectedFile.raw.arrayBuffer();
      const pdfDoc   = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pdfJsDoc = await pdfjsLib.getDocument({ data: buffer.slice(0) }).promise;
      const total    = pdfDoc.getPageCount();
      let   count    = 0;
      for (let p = 0; p < total; p++) {
        const page   = pdfDoc.getPage(p);
        const { height: pageH } = page.getSize();
        const jsPage = await pdfJsDoc.getPage(p + 1);
        const content = await jsPage.getTextContent();
        content.items.forEach(item => {
          if (!item.str?.toLowerCase().includes(redactText.toLowerCase())) return;
          const tx = item.transform;
          const x  = tx[4];
          const y  = pageH - tx[5] - (item.height || 10);
          const w  = item.width  || 60;
          const h  = (item.height || 10) + 2;
          page.drawRectangle({ x: x - 2, y, width: w + 4, height: h + 2, color: rgb(0, 0, 0) });
          count++;
        });
      }
      if (count === 0) { onToast(`"${redactText}" not found in this document.`, "error"); setRedacting(false); return; }
      const bytes    = await pdfDoc.save();
      const fileName = selectedFile.name.replace(/\.pdf$/i, "") + "_redacted.pdf";
      const blob     = new Blob([bytes], { type: "application/pdf" });
      const rawFile  = new File([blob], fileName, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      if (onAddFiles) onAddFiles([rawFile]);
      onToast(`\u2713 Redacted ${count} instance(s) of "${redactText}"!`, "success");
      setRedactText(""); setRedacting(false);
    } catch (err) {
      console.error(err);
      setRedacting(false);
      onToast(`Redaction failed: ${err.message}`, "error");
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, margin: "0 0 20px", letterSpacing: "-0.3px" }}>Security & Permissions</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[["protect","\uD83D\uDD12 Protect"],["unlock","\uD83D\uDD13 Unlock"],["redact","\u2B1B Redact"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: tab === id ? COLORS.gold : "transparent", color: tab === id ? "#0D0E14" : COLORS.textMuted, border: `1px solid ${tab === id ? COLORS.gold : COLORS.border}`, borderRadius: 9, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.15s", fontFamily: "inherit" }}>{lbl}</button>
        ))}
      </div>

      {tab === "protect" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: COLORS.text, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon d={icons.lock} size={16} color={COLORS.gold} /> Password Protection
            </h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>File to protect</label>
              <select onChange={e => setSelectedFile(files[parseInt(e.target.value)])} style={inputStyle}>
                <option value="">Select file\u2026</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>User password</label>
              <div style={{ position: "relative" }}>
                <input type={showUserPwd ? "text" : "password"} value={userPwd} onChange={e => setUserPwd(e.target.value)} placeholder="Enter password\u2026" style={{ ...inputStyle, paddingRight: 38 }} />
                <button onClick={() => setShowUserPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><Icon d={icons.eye} size={15} /></button>
              </div>
              {userPwd && (
                <div style={{ marginTop: 7 }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : COLORS.border }} />)}
                  </div>
                  <div style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Confirm password</label>
              <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm password\u2026" style={{ ...inputStyle, borderColor: confirmPwd && confirmPwd !== userPwd ? COLORS.error : COLORS.border }} />
              {confirmPwd && confirmPwd !== userPwd && <div style={{ fontSize: 11, color: COLORS.error, marginTop: 4 }}>\u26a0 Passwords do not match</div>}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Owner password <span style={{ color: COLORS.textDim, fontWeight: 400 }}>(optional)</span></label>
              <div style={{ position: "relative" }}>
                <input type={showOwnerPwd ? "text" : "password"} value={ownerPwd} onChange={e => setOwnerPwd(e.target.value)} placeholder="Leave blank to auto-generate\u2026" style={{ ...inputStyle, paddingRight: 38 }} />
                <button onClick={() => setShowOwnerPwd(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: COLORS.textMuted, cursor: "pointer" }}><Icon d={icons.eye} size={15} /></button>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".4px" }}>Encryption level</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["128","RC4 128-bit","Widely supported"],["256","AES 256-bit","Strongest, PDF 1.7+"]].map(([v, l, d]) => (
                  <div key={v} onClick={() => setEncLevel(v)} style={{ flex: 1, background: encLevel === v ? COLORS.goldSoft : COLORS.surface, border: `1.5px solid ${encLevel === v ? COLORS.gold : COLORS.border}`, borderRadius: 9, padding: "10px 12px", cursor: "pointer" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: encLevel === v ? COLORS.gold : COLORS.text }}>{l}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
            <Btn onClick={applyProtection} icon={icons.lock} variant="gold" disabled={!selectedFile || !userPwd || userPwd !== confirmPwd || protecting} style={{ width: "100%", justifyContent: "center" }}>
              {protecting ? "Encrypting\u2026" : "Protect Document"}
            </Btn>
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 10, lineHeight: 1.5 }}>Downloads automatically and is added to your workspace. Keep your password safe \u2014 it cannot be recovered.</p>
          </div>

          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "22px" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Document Permissions</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 16px" }}>Set what users can do after opening with the password.</p>
            <Toggle k="printing"     label="Allow printing"     desc="Users can print the document" />
            <Toggle k="copying"      label="Allow copying text" desc="Users can copy text to clipboard" />
            <Toggle k="modifying"    label="Allow editing"      desc="Users can modify the document" />
            <Toggle k="annotating"   label="Allow annotations"  desc="Users can add comments" />
            <Toggle k="fillingForms" label="Allow form filling" desc="Users can fill in form fields" />
            <div style={{ marginTop: 16, background: COLORS.surface, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>Summary</div>
              {[["Printing",permissions.printing],["Copying",permissions.copying],["Editing",permissions.modifying],["Annotations",permissions.annotating],["Forms",permissions.fillingForms]].map(([l,v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ color: COLORS.textMuted }}>{l}</span>
                  <span style={{ color: v ? COLORS.success : COLORS.error, fontWeight: 600 }}>{v ? "\u2713 Allowed" : "\u2715 Blocked"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "unlock" && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>\uD83D\uDD13 Remove Password</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>Enter the current password to decrypt the PDF and save an unprotected copy. You must know the password.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Protected file</label>
              <select onChange={e => setUnlockFile(files[parseInt(e.target.value)])} style={inputStyle}>
                <option value="">Select file\u2026</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Current password</label>
              <input type="password" value={unlockPwd} onChange={e => setUnlockPwd(e.target.value)} placeholder="Enter the PDF password\u2026" onKeyDown={e => e.key === "Enter" && removeProtection()} style={inputStyle} />
            </div>
            <Btn onClick={removeProtection} disabled={!unlockFile || !unlockPwd || unlocking} style={{ width: "100%", justifyContent: "center" }}>
              {unlocking ? "Unlocking\u2026" : "\uD83D\uDD13 Remove Password & Download"}
            </Btn>
          </div>
        </div>
      )}

      {tab === "redact" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>\u2B1B Text Redaction</h3>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "0 0 18px", lineHeight: 1.6 }}>Permanently blacks out all instances of the specified text across every page. This is irreversible.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Source file</label>
              <select onChange={e => setSelectedFile(files[parseInt(e.target.value)])} style={inputStyle}>
                <option value="">Select file\u2026</option>
                {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".4px" }}>Text to redact</label>
              <input value={redactText} onChange={e => setRedactText(e.target.value)} placeholder="e.g. John Smith, 555-1234, SSN\u2026" style={inputStyle} />
              <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 5 }}>Case-insensitive. All matching text on all pages is blacked out.</p>
            </div>
            <div style={{ background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: COLORS.accent, lineHeight: 1.5 }}>
              \u26a0\uFE0F <b>Permanent action.</b> Redaction cannot be undone. Always keep a copy of the original.
            </div>
            <Btn onClick={applyRedaction} variant="secondary" disabled={!selectedFile || !redactText.trim() || redacting} style={{ width: "100%", justifyContent: "center" }}>
              {redacting ? "Redacting\u2026" : "\u2B1B Apply Redaction"}
            </Btn>
          </div>
          <div style={{ background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "24px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: COLORS.text }}>Common redaction targets</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["Social Security Numbers","SSN"],["Phone numbers","555-"],["Email addresses","@"],["Names","Full name here"],["Addresses","Street, City"],["Account numbers","Account #"]].map(([label, example]) => (
                <div key={label} onClick={() => setRedactText(example)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", transition: "border-color 0.12s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>Click to use: "{example}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
    const PDF_TYPES   = ["application/pdf"];
    const IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif","image/tiff"];
    const OFFICE_TYPES = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint",
    ];

    // Separate PDFs from other files
    const pdfs   = rawFiles.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    const images = rawFiles.filter(f => IMAGE_TYPES.includes(f.type) || /\.(jpg|jpeg|png|webp|gif|tiff?)$/i.test(f.name));
    const office = rawFiles.filter(f => OFFICE_TYPES.includes(f.type) || /\.(docx?|xlsx?|pptx?)$/i.test(f.name));
    const other  = rawFiles.filter(f => !pdfs.includes(f) && !images.includes(f) && !office.includes(f));

    // Warn about office files
    if (office.length > 0) {
      const names = office.map(f => f.name).join(", ");
      setToast({ msg: `"${names}" can't be opened in the viewer. Go to Convert → Images→PDF or use CloudConvert for Office files.`, type: "error" });
      setTimeout(() => setToast(null), 6000);
    }

    // Add all valid files to workspace (PDFs + images + others)
    const validFiles = [...pdfs, ...images, ...other].filter(f => f instanceof File);
    if (validFiles.length === 0) return;

    const mapped = validFiles.map(f => ({
      name:     f.name,
      size:     f.size,
      pages:    "—",
      modified: "Just now",
      raw:      f,
    }));

    setFiles(prev => {
      const existing = new Set(prev.map(x => x.name));
      const fresh    = mapped.filter(m => !existing.has(m.name));
      return [...prev, ...fresh];
    });

    if (office.length === 0) {
      setToast({ msg: `${validFiles.length} file(s) added to workspace`, type: "success" });
      setTimeout(() => setToast(null), 3500);
    }

    // Auto-open single PDF in viewer
    if (pdfs.length === 1 && validFiles.length === 1) {
      setTimeout(() => setViewerFile(mapped[0]), 300);
    }
  }, []);

  const addFiles = useCallback((newFiles) => {
    const OFFICE_EXTS = /\.(docx?|xlsx?|pptx?)$/i;

    // newFiles can be File objects or already-mapped objects from CreateSection
    const mapped = newFiles.map(f => {
      // Already a mapped object with raw attached — from CreateSection
      if (f && !(f instanceof File) && f.name && f.raw) return f;
      // Raw File object
      if (f instanceof File) {
        // Warn about office files trying to be added as viewable PDFs
        if (OFFICE_EXTS.test(f.name)) {
          showToast(`"${f.name}" is an Office file. Go to Convert to turn it into a PDF first.`, "error");
          return null;
        }
        return {
          name:     f.name,
          size:     f.size,
          pages:    "—",
          modified: "Just now",
          raw:      f,
        };
      }
      return f;
    }).filter(Boolean);

    if (mapped.length === 0) return;

    setFiles(prev => {
      const existing = new Set(prev.map(x => x.name));
      const fresh    = mapped.filter(m => !existing.has(m.name));
      return [...prev, ...fresh];
    });

    // Only show success if we actually added something
    const pdfsAdded = mapped.filter(m => m.name?.toLowerCase().endsWith(".pdf"));
    if (pdfsAdded.length > 0) {
      showToast(`${mapped.length} file(s) added to workspace!`, "success");
    }

    // Auto-open single PDF in viewer
    if (mapped.length === 1 && mapped[0]?.name?.toLowerCase().endsWith(".pdf") && mapped[0].raw) {
      setTimeout(() => setViewerFile(mapped[0]), 300);
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
