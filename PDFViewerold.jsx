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

  // ── Signature state ──────────────────────────────────────────────────────────
  const [showSignPanel, setShowSignPanel] = useState(false);
  const [sigMode, setSigMode]         = useState("draw");   // draw | type
  const [sigDrawing, setSigDrawing]   = useState(false);
  const [sigHas, setSigHas]           = useState(false);
  const [sigColor, setSigColor]       = useState("#1a1a2e");
  const [sigTyped, setSigTyped]       = useState("");
  const [sigFont, setSigFont]         = useState("cursive");
  const [sigPosition, setSigPosition] = useState("bottom-right");
  const [signing, setSigning]         = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
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

  // ── Position → coordinates on the PDF page ───────────────────────────────────
  const getEmbedCoords = (pageW, pageH, sigW, sigH, position) => {
    const m = 28;
    const map = {
      "top-left":      { x: m,                 y: pageH - m - sigH },
      "top-center":    { x: (pageW - sigW) / 2, y: pageH - m - sigH },
      "top-right":     { x: pageW - m - sigW,  y: pageH - m - sigH },
      "center":        { x: (pageW - sigW) / 2, y: (pageH - sigH) / 2 },
      "bottom-left":   { x: m,                 y: m },
      "bottom-center": { x: (pageW - sigW) / 2, y: m },
      "bottom-right":  { x: pageW - m - sigW,  y: m },
    };
    return map[position] || map["bottom-right"];
  };

  // ── Embed signature into PDF and show it immediately ────────────────────────
  const embedSignature = async () => {
    if (!file?.raw) return;
    if (!sigHas)    return;
    setSigning(true);
    setSignSuccess(false);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      // Get PNG bytes from whichever canvas is active
      const activeCanvas = sigMode === "draw" ? sigCanvasRef.current : sigTypeCanvas.current;
      const sigBytes = await new Promise((res, rej) => {
        activeCanvas.toBlob(blob => {
          if (!blob) { rej(new Error("Canvas is empty — please draw or type your signature first.")); return; }
          blob.arrayBuffer().then(res).catch(rej);
        }, "image/png");
      });

      const buffer   = await file.raw.arrayBuffer();
      const pdfDoc   = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font     = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      const sigImage = await pdfDoc.embedPng(sigBytes);

      const pageIdx  = Math.min(Math.max(currentPage - 1, 0), pdfDoc.getPageCount() - 1);
      const page     = pdfDoc.getPage(pageIdx);
      const { width: pageW, height: pageH } = page.getSize();

      // Scale signature image to a reasonable size
      const dims = sigImage.scaleToFit(200, 80);
      const { x, y } = getEmbedCoords(pageW, pageH, dims.width, dims.height, sigPosition);

      // Draw signature image onto page
      page.drawImage(sigImage, { x, y, width: dims.width, height: dims.height });

      // Draw a thin line under the signature
      page.drawLine({
        start: { x, y: y - 3 },
        end:   { x: x + dims.width, y: y - 3 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });

      // Date stamp below the line
      page.drawText(`Signed: ${new Date().toLocaleDateString()}`, {
        x, y: y - 14, font, size: 8, color: rgb(0.5, 0.5, 0.5),
      });

      const signedBytes = await pdfDoc.save();
      const fileName    = file.name.replace(/\.pdf$/i, "") + "_signed.pdf";
      const blob        = new Blob([signedBytes], { type: "application/pdf" });
      const rawFile     = new File([blob], fileName, { type: "application/pdf" });

      // ── Download a copy ──────────────────────────────────────────────────────
      const dlUrl = URL.createObjectURL(blob);
      const a     = document.createElement("a");
      a.href = dlUrl; a.download = fileName; a.click();
      URL.revokeObjectURL(dlUrl);

      // ── Add to workspace ─────────────────────────────────────────────────────
      if (onAddFiles) onAddFiles([rawFile]);

      // ── Reload the viewer with the signed PDF immediately ────────────────────
      // Convert the signed bytes to a data URL and reload PDF.js with it
      const signedBuffer = await rawFile.arrayBuffer();
      const signedDoc    = await pdfjsLib.getDocument({ data: signedBuffer }).promise;
      const meta         = await signedDoc.getMetadata().catch(() => ({}));

      setPdfDoc(signedDoc);
      setNumPages(signedDoc.numPages);
      setCurrentPage(pageIdx + 1); // Stay on the page that was signed
      setPdfInfo({
        title:  meta?.info?.Title || fileName,
        author: meta?.info?.Author || "—",
        pages:  signedDoc.numPages,
      });

      // Update the file reference so downloads use the signed version
      // We do this by mutating the ref used by download/print
      file.name = fileName;
      file.raw  = rawFile;

      // Close the sign panel and show success
      setSigning(false);
      setSignSuccess(true);
      setShowSignPanel(false);
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
        <button style={S.btn(activeTool === "highlight")} onClick={() => setActiveTool(t => t === "highlight" ? "none" : "highlight")}>
          <Ic path={ICO.highlight} size={13} /> Highlight
        </button>
        <button style={S.btn(activeTool === "note")} onClick={() => { setActiveTool(t => t === "note" ? "none" : "note"); setActiveTab("notes"); }}>
          <Ic path={ICO.note} size={13} /> Note
        </button>
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

            {/* Right — position picker + apply */}
            <div style={{ flexShrink: 0, width: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7B8099", letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
                Signature position
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 14 }}>
                {[
                  ["top-left",      "↖"],
                  ["top-center",    "↑"],
                  ["top-right",     "↗"],
                  ["center",        "⊙"],
                  ["bottom-left",   "↙"],
                  ["bottom-center", "↓"],
                  ["bottom-right",  "↘"],
                  ["", ""],
                ].map(([id, icon], idx) => id ? (
                  <button key={id} onClick={() => setSigPosition(id)} style={{
                    background: sigPosition === id ? "rgba(46,204,113,0.2)" : "#22263A",
                    border: `1.5px solid ${sigPosition === id ? "#2ECC71" : "#2A2F4A"}`,
                    borderRadius: 6, padding: "7px 0", cursor: "pointer", fontSize: 16,
                    color: sigPosition === id ? "#2ECC71" : "#7B8099", fontFamily: "inherit",
                    gridColumn: id === "center" ? "2 / 3" : "auto",
                  }} title={id.replace("-", " ")}>{icon}</button>
                ) : <div key={idx} />)}
              </div>

              {/* Apply button */}
              <button
                onClick={embedSignature}
                disabled={!sigHas || signing}
                style={{
                  width: "100%", background: sigHas && !signing ? "#2ECC71" : "#22263A",
                  color: sigHas && !signing ? "#0D0E14" : "#4A5070",
                  border: `1px solid ${sigHas && !signing ? "#2ECC71" : "#2A2F4A"}`,
                  borderRadius: 9, padding: "10px 0", cursor: sigHas && !signing ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "all 0.15s",
                  marginBottom: 8,
                }}>
                {signing ? "Embedding signature…" : sigHas ? "✍ Apply Signature to PDF" : "Draw or type your signature first"}
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
        <div style={S.mainArea} ref={mainRef}>
          {loading && (
            <div style={S.loading}>
              <div style={S.spinner} />
              <div style={{ fontSize: 13 }}>Loading PDF…</div>
            </div>
          )}
          {error && (
            <div style={S.errorBox}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Failed to load PDF</div>
              <div style={{ fontSize: 12, opacity: .8 }}>{error}</div>
            </div>
          )}
          {pdfDoc && !loading && !error && viewMode === "single" && (
            <PageCanvas pdfDoc={pdfDoc} pageNum={currentPage} scale={scale} />
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
