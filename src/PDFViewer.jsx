import { useState, useRef, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

// ── PDF.js worker setup ────────────────────────────────────────────────────────
// The worker file is copied into /public during postinstall (see package.json).
// This avoids CDN failures and works on any network including offline.
pdfjsLib.GlobalWorkerOptions.workerSrc = process.env.PUBLIC_URL + "/pdf.worker.min.js";

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  wrap: {
    position: "fixed", inset: 0, background: "#0D0E14",
    zIndex: 500, display: "flex", flexDirection: "column",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  topbar: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 16px", height: 52, background: "#13151F",
    borderBottom: "1px solid #2A2F4A", flexShrink: 0,
  },
  btn: (active) => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 7, fontSize: 12,
    fontWeight: 600, cursor: "pointer", border: "none",
    background: active ? "#E84D4D" : "#22263A",
    color: active ? "#fff" : "#7B8099",
    transition: "all .12s", fontFamily: "inherit",
  }),
  iconBtn: {
    background: "#22263A", border: "1px solid #2A2F4A",
    color: "#7B8099", borderRadius: 7, width: 30, height: 30,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontSize: 14, transition: "all .12s",
  },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  sidebar: {
    width: 156, background: "#13151F",
    borderRight: "1px solid #2A2F4A",
    display: "flex", flexDirection: "column",
    overflow: "hidden", flexShrink: 0,
  },
  thumbScroll: { flex: 1, overflowY: "auto", padding: "0 8px 8px" },
  thumb: (active) => ({
    border: `2px solid ${active ? "#E84D4D" : "#2A2F4A"}`,
    borderRadius: 6, marginBottom: 8, cursor: "pointer",
    overflow: "hidden", background: "#1A1D2E",
    transition: "border-color .12s",
  }),
  thumbNum: (active) => ({
    fontSize: 10, textAlign: "center", padding: "3px 0",
    color: active ? "#E84D4D" : "#4A5070", fontWeight: active ? 700 : 400,
  }),
  canvas: { display: "block", width: "100%" },
  mainArea: {
    flex: 1, overflow: "auto", background: "#1a1a2e",
    display: "flex", flexDirection: "column",
    alignItems: "center", padding: "24px 16px", gap: 16,
  },
  pageWrap: {
    background: "#fff", borderRadius: 4,
    boxShadow: "0 4px 24px rgba(0,0,0,.5)",
    overflow: "hidden", position: "relative",
  },
  rightPanel: {
    width: 210, background: "#13151F",
    borderLeft: "1px solid #2A2F4A",
    display: "flex", flexDirection: "column",
    flexShrink: 0, overflow: "auto",
  },
  rightSec: { padding: "12px 14px", borderBottom: "1px solid #2A2F4A" },
  rightTitle: {
    fontSize: 10, fontWeight: 700, color: "#4A5070",
    letterSpacing: ".6px", textTransform: "uppercase",
    marginBottom: 8,
  },
  noteItem: {
    background: "#1A1D2E", border: "1px solid #2A2F4A",
    borderRadius: 7, padding: "8px 10px", marginBottom: 6,
  },
  noteText: { fontSize: 12, color: "#E8E9F0", lineHeight: 1.5 },
  noteMeta: { fontSize: 10, color: "#4A5070", marginTop: 3 },
  textarea: {
    width: "100%", background: "#0D0E14",
    border: "1px solid #2A2F4A", borderRadius: 7,
    padding: "7px 9px", color: "#E8E9F0", fontSize: 12,
    resize: "none", fontFamily: "inherit", outline: "none",
    boxSizing: "border-box",
  },
  loading: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    minHeight: 300, gap: 14, color: "#7B8099",
  },
  spinner: {
    width: 36, height: 36, border: "3px solid #2A2F4A",
    borderTop: "3px solid #E84D4D", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "rgba(232,77,77,0.1)", border: "1px solid #E84D4D",
    borderRadius: 10, padding: "20px 24px", textAlign: "center",
    color: "#E84D4D", fontSize: 13, maxWidth: 380,
  },
  chip: {
    fontSize: 10, fontWeight: 700, background: "rgba(232,77,77,0.12)",
    color: "#E84D4D", border: "1px solid rgba(232,77,77,0.3)",
    borderRadius: 100, padding: "2px 8px",
  },
  searchInput: {
    border: "none", background: "transparent",
    color: "#E8E9F0", fontSize: 12, outline: "none",
    width: "100%", fontFamily: "inherit",
  },
  searchResult: {
    padding: "5px 8px", borderRadius: 5, cursor: "pointer",
    fontSize: 12, color: "#7B8099", transition: "background .1s",
  },
};

// ── Tiny SVG icons ─────────────────────────────────────────────────────────────
const Ic = ({ path, size = 15, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(path)
      ? path.map((p, i) => <path key={i} d={p} />)
      : <path d={path} />}
  </svg>
);

const ICO = {
  back:      "M15 18l-6-6 6-6",
  zoomIn:    ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35","M11 8v6 M8 11h6"],
  zoomOut:   ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z","M21 21l-4.35-4.35","M8 11h6"],
  prev:      "M15 18l-6-6 6-6",
  next:      "M9 18l6-6-6-6",
  download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  print:     ["M6 9V2h12v7","M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2","M6 14h12v8H6z"],
  highlight: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  note:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  underline: "M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3 M4 21h16",
  strike:    ["M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.1 2.5 2.3 3.2M21 12H3", "M11.6 19.1c2.3.6 4.4 1 6.2.9 2.7 0 5.3-.7 5.3-3.6 0-1.5-1.1-2.5-2.3-3.2"],
  pen:       "M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586 M11 11l-4 4",
  eraser:    ["M20 20H7L3 16l10-10 7 7-2.5 2.5", "M6.0001 10.0001l4 4"],
  save:      "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8",
  search:    "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  rotate:    "M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15",
  plus:      "M12 5v14 M5 12h14",
};

// ── Thumbnail canvas ──────────────────────────────────────────────────────────
const ThumbCanvas = ({ pdfDoc, pageNum, active, onClick }) => {
  const ref = useRef();
  useEffect(() => {
    if (!pdfDoc || !ref.current) return;
    let cancelled = false;
    pdfDoc.getPage(pageNum).then(page => {
      if (cancelled) return;
      const vp = page.getViewport({ scale: 0.25 });
      const canvas = ref.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, pageNum]);

  return (
    <div style={S.thumb(active)} onClick={onClick} title={`Page ${pageNum}`}>
      <canvas ref={ref} style={S.canvas} />
      <div style={S.thumbNum(active)}>pg {pageNum}</div>
    </div>
  );
};

// ── Page canvas ───────────────────────────────────────────────────────────────
const PageCanvas = ({ pdfDoc, pageNum, scale }) => {
  const ref = useRef();
  const [dims, setDims] = useState({ w: 600, h: 800 });

  useEffect(() => {
    if (!pdfDoc || !ref.current) return;
    let cancelled = false;
    let task = null;
    pdfDoc.getPage(pageNum).then(page => {
      if (cancelled) return;
      const vp = page.getViewport({ scale });
      const canvas = ref.current;
      canvas.width = vp.width;
      canvas.height = vp.height;
      setDims({ w: vp.width, h: vp.height });
      task = page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
    });
    return () => {
      cancelled = true;
      task && task.cancel && task.cancel();
    };
  }, [pdfDoc, pageNum, scale]);

  return (
    <div style={{ ...S.pageWrap, width: dims.w, minHeight: dims.h }}>
      <canvas ref={ref} style={{ display: "block" }} />
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function RealPDFViewer({ file, onClose, onAddFiles }) {
  const [pdfDoc, setPdfDoc]           = useState(null);
  const [numPages, setNumPages]       = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale]             = useState(1.4);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [viewMode, setViewMode]       = useState("single");
  const [activeTool, setActiveTool]   = useState("none");
  const [notes, setNotes]             = useState([]);
  const [noteText, setNoteText]       = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab]     = useState("thumbs");

  // ── Annotation state ─────────────────────────────────────────────────────────
  const [annotations, setAnnotations]     = useState([]);    // all annotations across pages
  const [annotColor, setAnnotColor]       = useState("#FFD700");
  const [annotDrawing, setAnnotDrawing]   = useState(false);
  const [annotStart, setAnnotStart]       = useState(null);  // {x,y} for rect tools
  const [annotCurrent, setAnnotCurrent]   = useState(null);  // live rect while dragging
  const [pendingNote, setPendingNote]     = useState(null);  // {x,y} where note will drop
  const [noteInputText, setNoteInputText] = useState("");
  const [savingAnnots, setSavingAnnots]   = useState(false);
  const [annotSaved, setAnnotSaved]       = useState(false);
  const annotCanvasRef = useRef();        // overlay canvas on the page
  const annotLastPos   = useRef(null);
  const annotPathRef   = useRef([]);      // current freehand path points

  // ── Signature state ──────────────────────────────────────────────────────────
  const [showSignPanel, setShowSignPanel] = useState(false);
  const [sigMode, setSigMode]         = useState("draw");
  const [sigDrawing, setSigDrawing]   = useState(false);
  const [sigHas, setSigHas]           = useState(false);
  const [sigColor, setSigColor]       = useState("#1a1a2e");
  const [sigTyped, setSigTyped]       = useState("");
  const [sigFont, setSigFont]         = useState("cursive");
  const [signing, setSigning]         = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  // Click-to-place state
  const [placingMode, setPlacingMode] = useState(false);   // crosshair cursor, waiting for click
  const [sigPreview, setSigPreview]   = useState(null);    // { x, y, w, h } in page pixels
  const [sigDragging, setSigDragging] = useState(false);
  const [sigDragOffset, setSigDragOffset] = useState({ x: 0, y: 0 });
  const [sigImageUrl, setSigImageUrl] = useState(null);    // data URL for preview img
  const pageWrapRef   = useRef();    // ref on the page wrapper div for click coords
  const sigCanvasRef  = useRef();
  const sigTypeCanvas = useRef();
  const sigLastPos    = useRef(null);
  const [pdfInfo, setPdfInfo]         = useState({});
  const mainRef = useRef();

  // ── Load PDF ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPdfDoc(null);

    const load = async () => {
      try {
        // Guard — only attempt to load actual PDF files
        const name = file?.name?.toLowerCase() || "";
        const isPDF = name.endsWith(".pdf") ||
          (file?.raw instanceof File && file.raw.type === "application/pdf");

        if (!isPDF) {
          const ext = name.split(".").pop()?.toUpperCase() || "this file";
          let hint = "";
          if (/\.(xlsx?|docx?|pptx?)$/i.test(name)) {
            hint = "Go to the Convert section to turn it into a PDF first, then open it here.";
          } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(name)) {
            hint = "Go to Convert → Images to PDF to turn it into a viewable PDF.";
          } else {
            hint = "Only PDF files can be opened in the viewer.";
          }
          setError(`Cannot open ${ext} file in the PDF viewer.\n\n${hint}`);
          setLoading(false);
          return;
        }

        let source;
        if (file.raw instanceof File) {
          const buffer = await file.raw.arrayBuffer();
          source = { data: buffer };
        } else if (typeof file.url === "string") {
          source = { url: file.url };
        } else {
          throw new Error("No valid file source. Please upload a PDF file.");
        }

        const doc = await pdfjsLib.getDocument(source).promise;
        const meta = await doc.getMetadata().catch(() => ({}));

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setPdfInfo({
          title:  meta?.info?.Title  || file.name,
          author: meta?.info?.Author || "—",
          pages:  doc.numPages,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message || "Failed to load PDF.");
        setLoading(false);
      }
    };
    load();
  }, [file]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(numPages, p + 1));
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale(s => Math.min(3, +(s + 0.15).toFixed(2)));
      if (e.key === "-") setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)));
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [numPages, onClose]);

  const goPage = (n) => {
    setCurrentPage(n);
    if (viewMode === "continuous" && mainRef.current) {
      mainRef.current.querySelectorAll("[data-page]")[n - 1]
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes(n => [...n, { id: Date.now(), text: noteText.trim(), page: currentPage, time: new Date().toLocaleTimeString() }]);
    setNoteText("");
    setActiveTab("notes");
  };

  const doSearch = useCallback(async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    const results = [];
    for (let i = 1; i <= numPages; i++) {
      const page    = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text    = content.items.map(it => it.str).join(" ");
      if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
        const idx     = text.toLowerCase().indexOf(searchQuery.toLowerCase());
        const snippet = text.substring(Math.max(0, idx - 40), idx + 80);
        results.push({ page: i, snippet });
      }
    }
    setSearchResults(results);
  }, [pdfDoc, searchQuery, numPages]);

  // ── Annotation canvas sync — resize overlay to match rendered page ────────────
  useEffect(() => {
    const canvas = annotCanvasRef.current;
    if (!canvas || !pageWrapRef.current) return;
    const pageDiv = pageWrapRef.current.querySelector("canvas");
    if (!pageDiv) return;
    canvas.width  = pageDiv.width;
    canvas.height = pageDiv.height;
    canvas.style.width  = pageDiv.style.width  || pageDiv.width  + "px";
    canvas.style.height = pageDiv.style.height || pageDiv.height + "px";
    redrawAnnotCanvas();
  }, [currentPage, scale, pdfDoc]);

  // ── Redraw all annotations for current page onto the overlay canvas ──────────
  const redrawAnnotCanvas = () => {
    const canvas = annotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pageAnnots = annotations.filter(a => a.page === currentPage);
    pageAnnots.forEach(a => drawAnnot(ctx, a));
  };

  const drawAnnot = (ctx, a) => {
    ctx.save();
    if (a.type === "highlight") {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = a.color;
      ctx.fillRect(a.x, a.y, a.w, a.h);
    } else if (a.type === "underline") {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + a.h);
      ctx.lineTo(a.x + a.w, a.y + a.h);
      ctx.stroke();
    } else if (a.type === "strikethrough") {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + a.h / 2);
      ctx.lineTo(a.x + a.w, a.y + a.h / 2);
      ctx.stroke();
    } else if (a.type === "freehand") {
      if (!a.points || a.points.length < 2) return;
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.points[0].x, a.points[0].y);
      a.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    } else if (a.type === "note") {
      // Draw sticky note icon
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = a.color;
      ctx.fillRect(a.x, a.y, 24, 24);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.font = "12px sans-serif";
      ctx.fillText("📝", a.x + 2, a.y + 17);
    }
    ctx.restore();
  };

  // Redraw whenever annotations or page changes
  useEffect(() => {
    redrawAnnotCanvas();
  }, [annotations, currentPage]);

  // ── Get mouse/touch position relative to annotation canvas ──────────────────
  const getAnnotPos = (e) => {
    const canvas = annotCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top)  * sy,
    };
  };

  // ── Annotation canvas mouse handlers ────────────────────────────────────────
  const onAnnotMouseDown = (e) => {
    if (!["highlight", "underline", "strikethrough", "freehand", "note"].includes(activeTool)) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getAnnotPos(e);

    if (activeTool === "note") {
      setPendingNote(pos);
      setNoteInputText("");
      return;
    }
    if (activeTool === "freehand") {
      setAnnotDrawing(true);
      annotPathRef.current = [pos];
      annotLastPos.current = pos;
      return;
    }
    setAnnotDrawing(true);
    setAnnotStart(pos);
    setAnnotCurrent(pos);
  };

  const onAnnotMouseMove = (e) => {
    if (!annotDrawing) return;
    e.preventDefault();
    const pos = getAnnotPos(e);

    if (activeTool === "freehand") {
      const ctx = annotCanvasRef.current?.getContext("2d");
      if (ctx && annotLastPos.current) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = annotColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(annotLastPos.current.x, annotLastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      annotPathRef.current.push(pos);
      annotLastPos.current = pos;
      return;
    }
    if (annotStart) {
      setAnnotCurrent(pos);
      // Draw live preview
      const canvas = annotCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      redrawAnnotCanvas();
      const x = Math.min(annotStart.x, pos.x);
      const y = Math.min(annotStart.y, pos.y);
      const w = Math.abs(pos.x - annotStart.x);
      const h = Math.abs(pos.y - annotStart.y) || 18;
      drawAnnot(ctx, { type: activeTool, x, y, w, h, color: annotColor, page: currentPage });
    }
  };

  const onAnnotMouseUp = (e) => {
    if (!annotDrawing) return;
    e.preventDefault();
    const pos = getAnnotPos(e);

    if (activeTool === "freehand") {
      setAnnotDrawing(false);
      if (annotPathRef.current.length > 1) {
        const newAnnot = { id: Date.now(), type: "freehand", points: [...annotPathRef.current], color: annotColor, page: currentPage };
        setAnnotations(prev => [...prev, newAnnot]);
      }
      annotPathRef.current = [];
      return;
    }
    if (annotStart) {
      const x = Math.min(annotStart.x, pos.x);
      const y = Math.min(annotStart.y, pos.y);
      const w = Math.abs(pos.x - annotStart.x) || 80;
      const h = Math.abs(pos.y - annotStart.y) || 18;
      if (w > 4) {
        const newAnnot = { id: Date.now(), type: activeTool, x, y, w, h, color: annotColor, page: currentPage };
        setAnnotations(prev => [...prev, newAnnot]);
      }
    }
    setAnnotDrawing(false);
    setAnnotStart(null);
    setAnnotCurrent(null);
  };

  // ── Save all annotations permanently into the PDF ───────────────────────────
  const saveAnnotations = async () => {
    if (!file?.raw || annotations.length === 0) return;
    setSavingAnnots(true);
    setAnnotSaved(false);
    try {
      const { PDFDocument, rgb } = await import("pdf-lib");
      const buffer  = await file.raw.arrayBuffer();
      const pdfDoc  = await PDFDocument.load(buffer, { ignoreEncryption: true });

      for (const annot of annotations) {
        const pageIdx = Math.min(Math.max((annot.page || 1) - 1, 0), pdfDoc.getPageCount() - 1);
        const page    = pdfDoc.getPage(pageIdx);
        const { width: pageW, height: pageH } = page.getSize();

        // Convert canvas coords → PDF coords
        const canvas = annotCanvasRef.current;
        const cw = canvas?.width  || 600;
        const ch = canvas?.height || 800;
        const sx = pageW / cw;
        const sy = pageH / ch;

        // Parse hex color to pdf-lib rgb
        const hexToRgb = (hex) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return rgb(r, g, b);
        };
        const color = hexToRgb(annot.color || "#FFD700");

        if (annot.type === "highlight") {
          const pdfX = annot.x * sx;
          const pdfY = pageH - (annot.y + annot.h) * sy;
          page.drawRectangle({ x: pdfX, y: pdfY, width: annot.w * sx, height: annot.h * sy, color, opacity: 0.35 });

        } else if (annot.type === "underline") {
          const pdfX  = annot.x * sx;
          const pdfY  = pageH - (annot.y + annot.h) * sy;
          page.drawLine({ start: { x: pdfX, y: pdfY }, end: { x: (annot.x + annot.w) * sx, y: pdfY }, thickness: 1.5, color, opacity: 0.9 });

        } else if (annot.type === "strikethrough") {
          const pdfX  = annot.x * sx;
          const midY  = pageH - (annot.y + annot.h / 2) * sy;
          page.drawLine({ start: { x: pdfX, y: midY }, end: { x: (annot.x + annot.w) * sx, y: midY }, thickness: 1.5, color, opacity: 0.9 });

        } else if (annot.type === "freehand" && annot.points?.length > 1) {
          for (let i = 0; i < annot.points.length - 1; i++) {
            const p1 = annot.points[i];
            const p2 = annot.points[i + 1];
            page.drawLine({
              start: { x: p1.x * sx, y: pageH - p1.y * sy },
              end:   { x: p2.x * sx, y: pageH - p2.y * sy },
              thickness: 1.5, color, opacity: 0.85,
            });
          }

        } else if (annot.type === "note") {
          const { StandardFonts } = await import("pdf-lib");
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const pdfX = annot.x * sx;
          const pdfY = pageH - annot.y * sy - 30;
          // Yellow box
          page.drawRectangle({ x: pdfX, y: pdfY, width: 120, height: 40, color: rgb(1, 0.95, 0.5), opacity: 0.85 });
          // Note text
          const noteWords = (annot.text || "Note").substring(0, 60);
          page.drawText(noteWords, { x: pdfX + 4, y: pdfY + 14, font, size: 8, color: rgb(0.1, 0.1, 0.1) });
        }
      }

      const annotatedBytes = await pdfDoc.save();
      const fileName = file.name.replace(/\.pdf$/i, "") + "_annotated.pdf";
      const blob     = new Blob([annotatedBytes], { type: "application/pdf" });
      const rawFile  = new File([blob], fileName, { type: "application/pdf" });

      // Download
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);

      // Add to workspace and reload viewer
      if (onAddFiles) onAddFiles([rawFile]);
      const reloaded = await pdfjsLib.getDocument({ data: await rawFile.arrayBuffer() }).promise;
      setPdfDoc(reloaded);
      setNumPages(reloaded.numPages);
      file.name = fileName;
      file.raw  = rawFile;

      setAnnotations([]);
      setSavingAnnots(false);
      setAnnotSaved(true);
      setTimeout(() => setAnnotSaved(false), 5000);
    } catch (err) {
      console.error(err);
      setSavingAnnots(false);
      alert(`Failed to save annotations: ${err.message}`);
    }
  };

  const downloadPDF = () => {
    if (!file?.raw) return;
    const url = URL.createObjectURL(file.raw);
    const a = document.createElement("a");
    a.href = url; a.download = file.name; a.click();
    URL.revokeObjectURL(url);
  };

  const printPDF = () => {
    if (!file?.raw) return;
    const url = URL.createObjectURL(file.raw);
    const win = window.open(url);
    win?.addEventListener("load", () => win.print());
  };

  // ── Signature drawing helpers ────────────────────────────────────────────────
  const getSigPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    if (e.touches) return {
      x: (e.touches[0].clientX - rect.left) * sx,
      y: (e.touches[0].clientY - rect.top)  * sy,
    };
    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top)  * sy,
    };
  };

  const sigStartDraw = (e) => {
    e.preventDefault();
    setSigDrawing(true);
    sigLastPos.current = getSigPos(e, sigCanvasRef.current);
  };
  const sigDraw = (e) => {
    e.preventDefault();
    if (!sigDrawing) return;
    const ctx = sigCanvasRef.current.getContext("2d");
    const pos = getSigPos(e, sigCanvasRef.current);
    ctx.beginPath();
    ctx.moveTo(sigLastPos.current.x, sigLastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    sigLastPos.current = pos;
    setSigHas(true);
  };
  const sigStopDraw = () => setSigDrawing(false);

  const clearSigCanvas = () => {
    const ctx = sigCanvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
    setSigHas(false);
  };

  // Re-render typed sig onto hidden canvas whenever text/font/color changes
  useEffect(() => {
    if (!showSignPanel || sigMode !== "type" || !sigTypeCanvas.current) return;
    const canvas = sigTypeCanvas.current;
    const ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!sigTyped.trim()) { setSigHas(false); return; }
    ctx.fillStyle   = sigColor;
    ctx.font        = `52px ${sigFont}`;
    ctx.textBaseline = "middle";
    ctx.fillText(sigTyped, 10, canvas.height / 2);
    setSigHas(true);
  }, [sigTyped, sigFont, sigColor, sigMode, showSignPanel]);

  // ── Get PNG bytes from active signature canvas ───────────────────────────────
  const getSigBytes = () => new Promise((res, rej) => {
    const canvas = sigMode === "draw" ? sigCanvasRef.current : sigTypeCanvas.current;
    if (!canvas) { rej(new Error("No canvas")); return; }
    canvas.toBlob(blob => {
      if (!blob) { rej(new Error("Canvas is empty — draw or type your signature first.")); return; }
      blob.arrayBuffer().then(res).catch(rej);
    }, "image/png");
  });

  // ── Generate a data URL from the active canvas for the draggable preview ────
  const buildSigImageUrl = () => new Promise(res => {
    const canvas = sigMode === "draw" ? sigCanvasRef.current : sigTypeCanvas.current;
    if (!canvas) { res(null); return; }
    res(canvas.toDataURL("image/png"));
  });

  // ── Step 1: User clicks "Place on page" ──────────────────────────────────────
  // Captures the signature image, enters placing mode (crosshair cursor)
  const startPlacing = async () => {
    if (!sigHas) return;
    const url = await buildSigImageUrl();
    setSigImageUrl(url);
    setShowSignPanel(false);   // close panel so page is fully visible
    setPlacingMode(true);      // cursor becomes crosshair
    setSigPreview(null);       // clear any previous preview
  };

  // ── Step 2: User clicks on the page ─────────────────────────────────────────
  // Drops the draggable signature preview at that exact spot
  const handlePageClick = (e) => {
    if (!placingMode) return;
    const rect = pageWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const previewW = 200;
    const previewH = 70;
    setSigPreview({
      x: Math.max(0, Math.min(x - previewW / 2, rect.width  - previewW)),
      y: Math.max(0, Math.min(y - previewH / 2, rect.height - previewH)),
      w: previewW,
      h: previewH,
    });
    setPlacingMode(false);   // crosshair off — now in drag-to-reposition mode
  };

  // ── Step 3: User drags the preview to fine-tune ──────────────────────────────
  const onPreviewMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sigPreview || !pageWrapRef.current) return;
    const rect = pageWrapRef.current.getBoundingClientRect();
    setSigDragging(true);
    setSigDragOffset({
      x: e.clientX - rect.left - sigPreview.x,
      y: e.clientY - rect.top  - sigPreview.y,
    });
  };

  // ── Attach drag handlers to window so drag never breaks on fast moves ────────
  useEffect(() => {
    const onMove = (e) => {
      if (!sigDragging || !sigPreview || !pageWrapRef.current) return;
      const rect = pageWrapRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = clientX - rect.left - sigDragOffset.x;
      const ny = clientY - rect.top  - sigDragOffset.y;
      setSigPreview(prev => ({
        ...prev,
        x: Math.max(0, Math.min(nx, rect.width  - prev.w)),
        y: Math.max(0, Math.min(ny, rect.height - prev.h)),
      }));
    };
    const onUp = () => setSigDragging(false);

    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mouseup",    onUp);
    window.addEventListener("touchmove",  onMove, { passive: false });
    window.addEventListener("touchend",   onUp);

    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onUp);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("touchend",   onUp);
    };
  }, [sigDragging, sigPreview, sigDragOffset]);

  // ── Step 4: Convert preview screen position → PDF coordinate ────────────────
  // The page is rendered at `scale` so we divide by scale to get PDF points
  const previewToPdfCoords = (preview, pageW, pageH) => {
    const pdfX  =  preview.x / scale;
    // PDF y=0 is at the bottom; screen y=0 is at the top
    const pdfY  = pageH - (preview.y / scale) - (preview.h / scale);
    return { x: pdfX, y: pdfY };
  };

  // ── Step 5: Embed signature at the preview position ─────────────────────────
  const embedSignature = async () => {
    if (!file?.raw || !sigPreview) return;
    setSigning(true);
    setSignSuccess(false);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      const sigBytes = await getSigBytes();
      const buffer   = await file.raw.arrayBuffer();
      const pdfDoc   = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font     = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const sigImage = await pdfDoc.embedPng(sigBytes);

      const pageIdx  = Math.min(Math.max(currentPage - 1, 0), pdfDoc.getPageCount() - 1);
      const page     = pdfDoc.getPage(pageIdx);
      const { width: pageW, height: pageH } = page.getSize();

      // Scale to a sensible size
      const dims  = sigImage.scaleToFit(sigPreview.w / scale, sigPreview.h / scale);
      const { x, y } = previewToPdfCoords(sigPreview, pageW, pageH);

      // Draw signature
      page.drawImage(sigImage, { x, y, width: dims.width, height: dims.height });

      // Thin underline
      page.drawLine({
        start: { x, y: y - 2 },
        end:   { x: x + dims.width, y: y - 2 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Date stamp
      page.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x, y: y - 13, font, size: 8, color: rgb(0.5, 0.5, 0.5),
      });

      // Save
      const signedBytes = await pdfDoc.save();
      const fileName    = file.name.replace(/\.pdf$/i, "") + "_signed.pdf";
      const blob        = new Blob([signedBytes], { type: "application/pdf" });
      const rawFile     = new File([blob], fileName, { type: "application/pdf" });

      // Download
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl; a.download = fileName; a.click();
      URL.revokeObjectURL(dlUrl);

      // Add to workspace
      if (onAddFiles) onAddFiles([rawFile]);

      // Reload viewer with signed PDF
      const signedBuffer = await rawFile.arrayBuffer();
      const signedDoc    = await pdfjsLib.getDocument({ data: signedBuffer }).promise;
      const meta         = await signedDoc.getMetadata().catch(() => ({}));
      setPdfDoc(signedDoc);
      setNumPages(signedDoc.numPages);
      setCurrentPage(pageIdx + 1);
      setPdfInfo({
        title:  meta?.info?.Title || fileName,
        author: meta?.info?.Author || "—",
        pages:  signedDoc.numPages,
      });
      file.name = fileName;
      file.raw  = rawFile;

      // Reset
      setSigning(false);
      setSignSuccess(true);
      setSigPreview(null);
      setSigImageUrl(null);
      setSigHas(false);
      clearSigCanvas();
      setSigTyped("");
      setTimeout(() => setSignSuccess(false), 5000);

    } catch (err) {
      console.error(err);
      setSigning(false);
      alert(`Signing failed: ${err.message}`);
    }
  };

  const zoomPct = Math.round(scale * 100);

  return (
    <div style={{ ...S.wrap, position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ihov:hover { background: #2A2F4A !important; color: #E8E9F0 !important; }
        .sres:hover  { background: #1A1D2E !important; color: #E8E9F0 !important; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0D0E14; }
        ::-webkit-scrollbar-thumb { background: #2A2F4A; border-radius: 3px; }
      `}</style>

      {/* Top bar */}
      <div style={S.topbar}>
        <button className="ihov" style={S.btn(false)} onClick={onClose}>
          <Ic path={ICO.back} size={14} /> Back
        </button>
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#E8E9F0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file?.name || "document.pdf"}
        </span>
        {pdfDoc && <span style={S.chip}>{numPages} pages</span>}
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />

        {/* Zoom */}
        <button className="ihov" style={S.iconBtn} onClick={() => setScale(s => Math.max(0.4, +(s - 0.15).toFixed(2)))} title="Zoom out (-)">
          <Ic path={ICO.zoomOut} size={14} />
        </button>
        <span style={{ fontSize: 12, color: "#E8E9F0", fontWeight: 600, minWidth: 42, textAlign: "center" }}>{zoomPct}%</span>
        <button className="ihov" style={S.iconBtn} onClick={() => setScale(s => Math.min(3, +(s + 0.15).toFixed(2)))} title="Zoom in (+)">
          <Ic path={ICO.zoomIn} size={14} />
        </button>
        <button className="ihov" style={{ ...S.iconBtn, width: "auto", padding: "0 10px", fontSize: 11 }} onClick={() => setScale(1.4)}>
          Fit
        </button>
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />

        {/* Page nav */}
        <button className="ihov" style={S.iconBtn} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}>
          <Ic path={ICO.prev} size={14} />
        </button>
        <span style={{ fontSize: 12, color: "#E8E9F0", fontWeight: 500, minWidth: 60, textAlign: "center" }}>
          {loading ? "—" : `${currentPage} / ${numPages}`}
        </span>
        <button className="ihov" style={S.iconBtn} onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages}>
          <Ic path={ICO.next} size={14} />
        </button>
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />

        {/* View mode */}
        <button style={S.btn(viewMode === "single")}     onClick={() => setViewMode("single")}>Single</button>
        <button style={S.btn(viewMode === "continuous")} onClick={() => setViewMode("continuous")}>Scroll</button>
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />

        {/* Tools */}
        <button style={S.btn(activeTool === "highlight")} onClick={() => setActiveTool(t => t === "highlight" ? "none" : "highlight")} title="Highlight — drag to select area">
          🟡 Highlight
        </button>
        <button style={S.btn(activeTool === "underline")} onClick={() => setActiveTool(t => t === "underline" ? "none" : "underline")} title="Underline — drag to select area">
          <Ic path={ICO.underline} size={13} /> Underline
        </button>
        <button style={S.btn(activeTool === "strikethrough")} onClick={() => setActiveTool(t => t === "strikethrough" ? "none" : "strikethrough")} title="Strikethrough — drag to select area">
          <Ic path={ICO.strike} size={13} /> Strike
        </button>
        <button style={S.btn(activeTool === "freehand")} onClick={() => setActiveTool(t => t === "freehand" ? "none" : "freehand")} title="Freehand pen — draw freely">
          <Ic path={ICO.pen} size={13} /> Draw
        </button>
        <button style={S.btn(activeTool === "note")} onClick={() => { setActiveTool(t => t === "note" ? "none" : "note"); setActiveTab("notes"); }} title="Sticky note — click to place">
          <Ic path={ICO.note} size={13} /> Note
        </button>
        {/* Annotation color picker */}
        {["highlight","underline","strikethrough","freehand","note"].includes(activeTool) && (
          <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "0 4px", borderLeft: "1px solid #2A2F4A", paddingLeft: 10 }}>
            {["#FFD700","#FF6B6B","#4ECDC4","#A78BFA","#34D399","#FB923C"].map(c => (
              <div key={c} onClick={() => setAnnotColor(c)} style={{ width: 18, height: 18, background: c, borderRadius: "50%", cursor: "pointer", border: `3px solid ${annotColor === c ? "#fff" : "transparent"}`, transition: "border 0.1s", flexShrink: 0 }} />
            ))}
          </div>
        )}
        {annotations.filter(a => a.page === currentPage).length > 0 && (
          <>
            <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />
            <button style={{ ...S.btn(false), background: savingAnnots ? "#22263A" : "#E84D4D", color: "#fff", border: "none" }} onClick={saveAnnotations} disabled={savingAnnots} title="Save annotations permanently into the PDF">
              <Ic path={ICO.save} size={13} /> {savingAnnots ? "Saving…" : `Save (${annotations.filter(a => a.page === currentPage).length})`}
            </button>
            <button style={{ ...S.btn(false), fontSize: 11 }} onClick={() => setAnnotations([])} title="Clear all annotations">
              ✕ Clear all
            </button>
          </>
        )}
        <button style={{ ...S.btn(showSignPanel), background: showSignPanel ? "#2ECC71" : S.btn(false).background }} onClick={() => setShowSignPanel(v => !v)}>
          ✍ Sign
        </button>
        <div style={{ width: 1, height: 20, background: "#2A2F4A" }} />

        <button className="ihov" style={S.iconBtn} onClick={downloadPDF} title="Download">
          <Ic path={ICO.download} size={14} />
        </button>
        <button className="ihov" style={S.iconBtn} onClick={printPDF} title="Print">
          <Ic path={ICO.print} size={14} />
        </button>
      </div>

      <div style={S.body}>

        {/* ── Sign success banner ── */}
        {signSuccess && (
          <div style={{
            position: "absolute", top: 52, left: 0, right: 0, zIndex: 300,
            background: "rgba(46,204,113,0.95)", padding: "12px 20px",
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0D0E14" }}>
                Document signed successfully!
              </div>
              <div style={{ fontSize: 12, color: "#1a4a2a", marginTop: 2 }}>
                The signed PDF is now open in the viewer. A copy was downloaded to your computer and saved to your workspace.
              </div>
            </div>
            <button onClick={() => setSignSuccess(false)} style={{ marginLeft: "auto", background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: "#0D0E14", fontWeight: 700 }}>✕</button>
          </div>
        )}
        {showSignPanel && (
          <div style={{
            position: "absolute", top: 52, left: 0, right: 0, zIndex: 200,
            background: "#13151F", borderBottom: "2px solid #2ECC71",
            padding: "16px 20px", display: "flex", gap: 24, alignItems: "flex-start",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}>
            {/* Left — draw/type tabs */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2ECC71", letterSpacing: ".6px", textTransform: "uppercase", marginBottom: 10 }}>
                Sign this document — Page {currentPage}
              </div>

              {/* Mode tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[["draw", "✏ Draw"], ["type", "T Type"]].map(([id, lbl]) => (
                  <button key={id} onClick={() => { setSigMode(id); setSigHas(false); }} style={{
                    background: sigMode === id ? "#2ECC71" : "#22263A",
                    color: sigMode === id ? "#0D0E14" : "#7B8099",
                    border: `1px solid ${sigMode === id ? "#2ECC71" : "#2A2F4A"}`,
                    borderRadius: 7, padding: "5px 14px", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                  }}>{lbl}</button>
                ))}
                {/* Ink colors */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 10 }}>
                  {["#1a1a2e", "#E84D4D", "#0044cc", "#006600"].map(c => (
                    <div key={c} onClick={() => setSigColor(c)} style={{ width: 20, height: 20, background: c, borderRadius: "50%", cursor: "pointer", border: `3px solid ${sigColor === c ? "#fff" : "transparent"}`, transition: "border 0.1s" }} />
                  ))}
                </div>
              </div>

              {/* Draw canvas */}
              {sigMode === "draw" && (
                <div style={{ position: "relative" }}>
                  <canvas
                    ref={sigCanvasRef}
                    width={480} height={90}
                    onMouseDown={sigStartDraw} onMouseMove={sigDraw}
                    onMouseUp={sigStopDraw}    onMouseLeave={sigStopDraw}
                    onTouchStart={sigStartDraw} onTouchMove={sigDraw} onTouchEnd={sigStopDraw}
                    style={{ background: "#fff", borderRadius: 8, cursor: "crosshair", display: "block", border: `2px solid ${sigHas ? "#2ECC71" : "#2A2F4A"}`, width: "100%", maxWidth: 480, touchAction: "none", transition: "border-color 0.2s" }}
                  />
                  {!sigHas && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontSize: 13, color: "#bbb", fontStyle: "italic" }}>Draw your signature here</span>
                    </div>
                  )}
                  <button onClick={clearSigCanvas} style={{ marginTop: 6, background: "transparent", border: "none", color: "#7B8099", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                    ✕ Clear
                  </button>
                </div>
              )}

              {/* Type mode */}
              {sigMode === "type" && (
                <div>
                  <input
                    value={sigTyped}
                    onChange={e => setSigTyped(e.target.value)}
                    placeholder="Type your name…"
                    style={{ background: "#fff", border: `2px solid ${sigHas ? "#2ECC71" : "#2A2F4A"}`, borderRadius: 8, padding: "8px 14px", color: "#1a1a2e", fontSize: 28, fontFamily: sigFont, outline: "none", width: "100%", maxWidth: 480, boxSizing: "border-box", transition: "border-color 0.2s" }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    {[{ f: "cursive", l: "Cursive" }, { f: "Georgia,serif", l: "Serif" }, { f: "'Courier New',monospace", l: "Print" }].map(({ f, l }) => (
                      <button key={f} onClick={() => setSigFont(f)} style={{ background: sigFont === f ? "rgba(46,204,113,0.15)" : "#22263A", border: `1px solid ${sigFont === f ? "#2ECC71" : "#2A2F4A"}`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontFamily: f, color: "#E8E9F0", fontSize: 14, fontFamily: "inherit" }}>
                        <span style={{ fontFamily: f }}>{sigTyped || l}</span>
                      </button>
                    ))}
                  </div>
                  {/* Hidden canvas for type rendering */}
                  <canvas ref={sigTypeCanvas} width={480} height={80} style={{ display: "none" }} />
                </div>
              )}
            </div>

            {/* Right — place + apply */}
            <div style={{ flexShrink: 0, width: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7B8099", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>
                How to place
              </div>

              <div style={{ background: "#0D0E14", border: "1px solid #2A2F4A", borderRadius: 8, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "#7B8099", lineHeight: 1.6 }}>
                1. Draw or type your signature<br />
                2. Click <b style={{ color: "#2ECC71" }}>Place on page</b><br />
                3. Click anywhere on the PDF<br />
                4. Drag to fine-tune position<br />
                5. Click <b style={{ color: "#2ECC71" }}>Confirm & Sign</b>
              </div>

              <button
                onClick={startPlacing}
                disabled={!sigHas}
                style={{
                  width: "100%",
                  background: sigHas ? "rgba(46,204,113,0.15)" : "#22263A",
                  color: sigHas ? "#2ECC71" : "#4A5070",
                  border: `1.5px solid ${sigHas ? "#2ECC71" : "#2A2F4A"}`,
                  borderRadius: 9, padding: "10px 0", cursor: sigHas ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                  transition: "all 0.15s", marginBottom: 8,
                }}>
                {sigHas ? "👆 Place on page" : "Create signature first"}
              </button>

              <button onClick={() => { setShowSignPanel(false); setSigHas(false); clearSigCanvas(); setSigTyped(""); }} style={{ width: "100%", background: "transparent", border: "1px solid #2A2F4A", borderRadius: 9, padding: "7px 0", cursor: "pointer", fontSize: 12, color: "#7B8099", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Left sidebar */}
        <div style={S.sidebar}>
          <div style={{ display: "flex", borderBottom: "1px solid #2A2F4A", flexShrink: 0 }}>
            {[["thumbs","Pages"],["notes","Notes"],["search","Find"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                flex: 1, background: "transparent", border: "none",
                borderBottom: `2px solid ${activeTab === id ? "#E84D4D" : "transparent"}`,
                color: activeTab === id ? "#E84D4D" : "#4A5070",
                padding: "8px 4px", cursor: "pointer", fontSize: 10,
                fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px",
                fontFamily: "inherit",
              }}>{lbl}</button>
            ))}
          </div>

          {activeTab === "thumbs" && (
            <div style={S.thumbScroll}>
              {pdfDoc
                ? Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
                    <ThumbCanvas key={n} pdfDoc={pdfDoc} pageNum={n} active={currentPage === n} onClick={() => goPage(n)} />
                  ))
                : <div style={{ padding: "20px 8px", textAlign: "center", color: "#4A5070", fontSize: 11 }}>No document loaded</div>
              }
            </div>
          )}

          {activeTab === "notes" && (
            <div style={{ flex: 1, overflow: "auto", padding: "8px" }}>
              {notes.length === 0
                ? <div style={{ padding: "16px 4px", textAlign: "center", color: "#4A5070", fontSize: 11 }}>No notes yet.</div>
                : notes.map(n => (
                    <div key={n.id} style={S.noteItem}>
                      <div style={S.noteText}>{n.text}</div>
                      <div style={S.noteMeta}>Page {n.page} · {n.time}</div>
                    </div>
                  ))
              }
            </div>
          )}

          {activeTab === "search" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0D0E14", border: "1px solid #2A2F4A", borderRadius: 7, padding: "5px 9px", margin: "8px" }}>
                <Ic path={ICO.search} size={13} color="#4A5070" />
                <input style={S.searchInput} value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  placeholder="Search text…" />
              </div>
              <button onClick={doSearch} style={{ ...S.btn(true), margin: "0 8px 8px", justifyContent: "center", background: "#E84D4D", color: "#fff" }}>
                Search
              </button>
              <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
                {searchResults.length === 0 && searchQuery && (
                  <div style={{ fontSize: 11, color: "#4A5070", textAlign: "center", padding: "12px 0" }}>No results</div>
                )}
                {searchResults.map((r, i) => (
                  <div key={i} className="sres" style={S.searchResult} onClick={() => goPage(r.page)}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#E84D4D", marginBottom: 2 }}>Page {r.page}</div>
                    <div style={{ fontSize: 11, color: "#7B8099", lineHeight: 1.4 }}>…{r.snippet}…</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main page view */}
        <div
          style={{ ...S.mainArea, cursor: placingMode ? "crosshair" : "default" }}
          ref={mainRef}
        >
          {/* Placing mode instruction banner */}
          {placingMode && (
            <div style={{
              position: "sticky", top: 0, zIndex: 50,
              background: "rgba(46,204,113,0.92)", padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 12,
              borderRadius: 8, marginBottom: 12, width: "100%", boxSizing: "border-box",
            }}>
              <span style={{ fontSize: 18 }}>👆</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0D0E14" }}>
                Click anywhere on the page below to place your signature
              </div>
              <button onClick={() => { setPlacingMode(false); setShowSignPanel(true); }} style={{ marginLeft: "auto", background: "rgba(0,0,0,0.2)", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#0D0E14", fontWeight: 600, fontFamily: "inherit" }}>
                ← Back
              </button>
            </div>
          )}

          {loading && (
            <div style={S.loading}>
              <div style={S.spinner} />
              <div style={{ fontSize: 13 }}>Loading PDF…</div>
            </div>
          )}
          {error && (
            <div style={S.errorBox}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                {error.includes("Cannot open") ? "Wrong file type" : "Failed to load PDF"}
              </div>
              {error.split("\n").filter(Boolean).map((line, i) => (
                <div key={i} style={{ fontSize: 12, opacity: i === 0 ? 1 : 0.75, marginBottom: 4, lineHeight: 1.5 }}>{line}</div>
              ))}
              <button onClick={onClose} style={{ marginTop: 16, background: "#E84D4D", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                ← Go back
              </button>
            </div>
          )}

          {pdfDoc && !loading && !error && viewMode === "single" && (
            <div
              ref={pageWrapRef}
              style={{ position: "relative", display: "inline-block" }}
              onClick={handlePageClick}
            >
              <PageCanvas pdfDoc={pdfDoc} pageNum={currentPage} scale={scale} />

              {/* ── Annotation overlay canvas ── */}
              {["highlight","underline","strikethrough","freehand","note"].includes(activeTool) && (
                <canvas
                  ref={annotCanvasRef}
                  onMouseDown={onAnnotMouseDown}
                  onMouseMove={onAnnotMouseMove}
                  onMouseUp={onAnnotMouseUp}
                  onMouseLeave={onAnnotMouseUp}
                  onTouchStart={onAnnotMouseDown}
                  onTouchMove={onAnnotMouseMove}
                  onTouchEnd={onAnnotMouseUp}
                  style={{
                    position: "absolute", inset: 0,
                    cursor: activeTool === "freehand" ? "crosshair"
                          : activeTool === "note"     ? "cell"
                          : "text",
                    zIndex: 10,
                    touchAction: "none",
                  }}
                />
              )}

              {/* ── Read-only annotation overlay when no tool selected ── */}
              {!["highlight","underline","strikethrough","freehand","note"].includes(activeTool) && annotations.some(a => a.page === currentPage) && (
                <canvas
                  ref={annotCanvasRef}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}
                />
              )}

              {/* ── Sticky note input popup ── */}
              {pendingNote && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: Math.min(pendingNote.x, (annotCanvasRef.current?.width || 600) - 220),
                    top:  pendingNote.y,
                    zIndex: 200,
                    background: "#FFF9C4",
                    border: "2px solid #FFD700",
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
                    width: 220,
                  }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#666", marginBottom: 6 }}>
                    📝 Add sticky note
                  </div>
                  <textarea
                    autoFocus
                    value={noteInputText}
                    onChange={e => setNoteInputText(e.target.value)}
                    rows={3}
                    placeholder="Type your note…"
                    style={{ width: "100%", border: "1px solid #FFD700", borderRadius: 6, padding: "6px 8px", fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", background: "#FFFDE7", boxSizing: "border-box" }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        if (noteInputText.trim()) {
                          setAnnotations(prev => [...prev, { id: Date.now(), type: "note", x: pendingNote.x, y: pendingNote.y, color: annotColor, text: noteInputText.trim(), page: currentPage }]);
                        }
                        setPendingNote(null);
                        setNoteInputText("");
                      }
                      if (e.key === "Escape") { setPendingNote(null); setNoteInputText(""); }
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => {
                        if (noteInputText.trim()) {
                          setAnnotations(prev => [...prev, { id: Date.now(), type: "note", x: pendingNote.x, y: pendingNote.y, color: annotColor, text: noteInputText.trim(), page: currentPage }]);
                        }
                        setPendingNote(null);
                        setNoteInputText("");
                      }}
                      style={{ flex: 1, background: "#FFD700", border: "none", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                      Add note
                    </button>
                    <button onClick={() => { setPendingNote(null); setNoteInputText(""); }} style={{ background: "transparent", border: "1px solid #ccc", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                      Cancel
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 6 }}>Ctrl+Enter to save · Esc to cancel</div>
                </div>
              )}

              {/* ── Annotation saved success banner ── */}
              {annotSaved && (
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 300, background: "rgba(46,204,113,0.95)", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#0D0E14", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
                  ✓ Annotations saved into PDF!
                </div>
              )}

              {/* Draggable signature preview */}
              {sigPreview && sigImageUrl && (
                <div
                  onMouseDown={onPreviewMouseDown}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!sigPreview || !pageWrapRef.current) return;
                    const rect = pageWrapRef.current.getBoundingClientRect();
                    setSigDragging(true);
                    setSigDragOffset({
                      x: e.touches[0].clientX - rect.left - sigPreview.x,
                      y: e.touches[0].clientY - rect.top  - sigPreview.y,
                    });
                  }}
                  style={{
                    position: "absolute",
                    left: sigPreview.x,
                    top: sigPreview.y,
                    width: sigPreview.w,
                    height: sigPreview.h,
                    cursor: sigDragging ? "grabbing" : "grab",
                    border: "2px dashed #2ECC71",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.92)",
                    boxShadow: sigDragging
                      ? "0 8px 32px rgba(46,204,113,0.6)"
                      : "0 4px 20px rgba(46,204,113,0.35)",
                    display: "flex",
                    flexDirection: "column",
                    userSelect: "none",
                    zIndex: 100,
                    overflow: "hidden",
                    transition: sigDragging ? "none" : "box-shadow 0.15s",
                  }}
                >
                  {/* Drag handle bar */}
                  <div style={{
                    background: sigDragging ? "#27AE60" : "#2ECC71",
                    padding: "4px 8px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0, cursor: sigDragging ? "grabbing" : "grab",
                    transition: "background 0.1s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {/* Grip dots */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                        {[...Array(6)].map((_, i) => (
                          <div key={i} style={{ width: 3, height: 3, background: "rgba(0,0,0,0.35)", borderRadius: "50%" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0D0E14", letterSpacing: ".3px" }}>
                        {sigDragging ? "Dragging…" : "Drag to move"}
                      </span>
                    </div>
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => {
                        e.stopPropagation();
                        setSigPreview(null);
                        setSigImageUrl(null);
                        setShowSignPanel(true);
                      }}
                      style={{ background: "rgba(0,0,0,0.15)", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, color: "#0D0E14", fontWeight: 700, lineHeight: 1, padding: "2px 6px", fontFamily: "inherit" }}
                    >✕ Cancel</button>
                  </div>

                  {/* Signature image preview */}
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
                    <img src={sigImageUrl} alt="Signature preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                </div>
              )}

              {/* Confirm & Sign button — floats below the preview */}
              {sigPreview && !signing && (
                <div style={{
                  position: "absolute",
                  left: sigPreview.x,
                  top: sigPreview.y + sigPreview.h + 8,
                  zIndex: 101,
                  display: "flex",
                  gap: 6,
                }}>
                  <button
                    onClick={e => { e.stopPropagation(); embedSignature(); }}
                    style={{
                      background: "#2ECC71", color: "#0D0E14",
                      border: "none", borderRadius: 7,
                      padding: "7px 16px", cursor: "pointer",
                      fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                      boxShadow: "0 2px 10px rgba(46,204,113,0.5)",
                    }}>
                    ✍ Confirm & Sign
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setSigPreview(null); setSigImageUrl(null); setShowSignPanel(true); }}
                    style={{
                      background: "rgba(0,0,0,0.6)", color: "#fff",
                      border: "none", borderRadius: 7,
                      padding: "7px 12px", cursor: "pointer",
                      fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    }}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Signing in progress */}
              {signing && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 200, borderRadius: 4,
                }}>
                  <div style={{ background: "#13151F", border: "1px solid #2ECC71", borderRadius: 12, padding: "20px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>✍</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#2ECC71" }}>Embedding signature…</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {pdfDoc && !loading && !error && viewMode === "continuous" && (
            Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
              <div key={n} data-page={n}>
                <div style={{ fontSize: 11, color: "#4A5070", marginBottom: 6, textAlign: "center" }}>Page {n}</div>
                <PageCanvas pdfDoc={pdfDoc} pageNum={n} scale={scale} />
              </div>
            ))
          )}
        </div>

        {/* Right panel */}
        <div style={S.rightPanel}>
          {pdfDoc && (
            <div style={S.rightSec}>
              <div style={S.rightTitle}>Document info</div>
              {[["Title", pdfInfo.title], ["Author", pdfInfo.author], ["Pages", pdfInfo.pages]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
                  <span style={{ color: "#4A5070" }}>{k}</span>
                  <span style={{ color: "#E8E9F0", fontWeight: 500, maxWidth: 110, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {annotations.length > 0 && (
            <div style={S.rightSec}>
              <div style={S.rightTitle}>Annotations</div>
              <div style={{ fontSize: 11, color: "#7B8099", marginBottom: 8 }}>
                {annotations.length} total · {annotations.filter(a => a.page === currentPage).length} on this page
              </div>
              {["highlight","underline","strikethrough","freehand","note"].map(type => {
                const count = annotations.filter(a => a.type === type).length;
                if (!count) return null;
                const labels = { highlight: "🟡 Highlights", underline: "Underlines", strikethrough: "Strikethroughs", freehand: "✏ Drawings", note: "📝 Notes" };
                return (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: "1px solid #2A2F4A" }}>
                    <span style={{ color: "#7B8099" }}>{labels[type]}</span>
                    <span style={{ color: "#E8E9F0", fontWeight: 600 }}>{count}</span>
                  </div>
                );
              })}
              <button onClick={saveAnnotations} disabled={savingAnnots} style={{ ...S.btn(true), marginTop: 10, width: "100%", justifyContent: "center", background: "#E84D4D", color: "#fff", border: "none" }}>
                <Ic path={ICO.save} size={13} color="#fff" /> {savingAnnots ? "Saving…" : "Save to PDF"}
              </button>
              <button onClick={() => setAnnotations([])} style={{ ...S.btn(false), marginTop: 6, width: "100%", justifyContent: "center", fontSize: 11 }}>
                ✕ Clear all
              </button>
            </div>
          )}

          <div style={S.rightSec}>
            <div style={S.rightTitle}>Shortcuts</div>
            {[["← →","Navigate"],["+ −","Zoom"],["Esc","Close"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 11 }}>
                <span style={{ background: "#22263A", border: "1px solid #2A2F4A", borderRadius: 4, padding: "1px 6px", color: "#E8E9F0", fontFamily: "monospace", fontSize: 10 }}>{k}</span>
                <span style={{ color: "#4A5070" }}>{v}</span>
              </div>
            ))}
          </div>

          {activeTool === "note" && (
            <div style={S.rightSec}>
              <div style={S.rightTitle}>Add note — Page {currentPage}</div>
              <textarea style={S.textarea} rows={3} value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.ctrlKey && addNote()}
                placeholder="Type your note… (Ctrl+Enter to save)" />
              <button onClick={addNote} style={{ ...S.btn(true), marginTop: 7, width: "100%", justifyContent: "center", background: "#E84D4D", color: "#fff" }}>
                <Ic path={ICO.plus} size={13} /> Add note
              </button>
            </div>
          )}

          {pdfDoc && (
            <div style={S.rightSec}>
              <div style={S.rightTitle}>Go to page</div>
              <input type="number" min={1} max={numPages} defaultValue={1}
                onKeyDown={e => { if (e.key === "Enter") { const n = parseInt(e.target.value); if (n >= 1 && n <= numPages) goPage(n); }}}
                style={{ ...S.textarea, resize: "none", padding: "5px 8px" }} />
              <div style={{ fontSize: 10, color: "#4A5070", marginTop: 4 }}>Press Enter to jump</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
