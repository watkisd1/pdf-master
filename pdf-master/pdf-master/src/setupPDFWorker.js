// This file configures PDF.js to use a local worker
// so the app never depends on an external CDN
import { GlobalWorkerOptions } from "pdfjs-dist";
import PDFWorker from "pdfjs-dist/build/pdf.worker.entry";

GlobalWorkerOptions.workerSrc = PDFWorker;
