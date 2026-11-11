import { useRef, useState } from "react";
import { Upload, Download, FileSpreadsheet, Info, CheckCircle2, X } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { parseCsvPreview } from "../../utils/format";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".txt"];

/**
 * Reusable Apple Light modal for importing master data via CSV or Excel files.
 * Displays an optional template download action, drag-and-drop file picker,
 * first-5-row CSV preview table, and column format guidelines.
 */
export function CsvImportModal({
  isOpen,
  onClose,
  title = "Import Data",
  subtitle = "Unggah berkas CSV atau Excel untuk menambahkan data secara massal",
  templateTitle = "Gunakan Template Resmi",
  templateDescription = "Unduh template CSV agar format kolom dan pemisah data sesuai dengan sistem.",
  columns = [],
  updateNote = "",
  onDownloadTemplate,
  onImport,
  onInvalidFile,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setSelectedFile(null);
    setPreview(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (importing) return;
    resetState();
    onClose?.();
  };

  const processFile = (file) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isValid = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!isValid) {
      onInvalidFile?.("Format berkas tidak didukung. Harap unggah file CSV atau Excel (.xlsx / .xls).");
      return;
    }

    setSelectedFile(file);

    if (lowerName.endsWith(".csv") || lowerName.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const parsed = parseCsvPreview(event.target?.result, 5);
        if (parsed) {
          setPreview({ type: "csv", ...parsed });
        } else {
          setPreview(null);
        }
      };
      reader.readAsText(file);
    } else {
      setPreview({
        type: "excel",
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1),
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !onImport) return;
    setImporting(true);
    try {
      const completed = await onImport(selectedFile);
      if (completed !== false) {
        resetState();
        onClose?.();
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      icon={Upload}
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose} disabled={importing}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={importing}
            disabled={!selectedFile || importing}
          >
            {!importing && <Upload className="w-4 h-4" />}
            Mulai Import Data
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {onDownloadTemplate && (
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{templateTitle}</p>
                <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
                  {templateDescription}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDownloadTemplate}
              className="shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template
            </Button>
          </div>
        )}

        {/* Drag & Drop Picker */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => !importing && fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25"
              : selectedFile
              ? "border-emerald-300 dark:border-emerald-800 bg-[#F9F9FB] dark:bg-slate-900/50"
              : "border-[#D2D2D7] dark:border-slate-700 hover:border-emerald-400 hover:bg-[#F9F9FB] dark:hover:bg-slate-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) processFile(e.target.files[0]);
            }}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1D1D1F] dark:text-slate-100">
                  {selectedFile.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="p-1 rounded-full text-[#86868B] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  aria-label="Hapus berkas terpilih"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti berkas
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F5F7] dark:bg-slate-800 border border-[#E5E5EA] dark:border-slate-700 text-[#86868B] dark:text-slate-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-[#1D1D1F] dark:text-slate-200">
                Klik untuk memilih berkas atau seret ke area ini
              </p>
              <p className="text-xs text-[#86868B] dark:text-slate-400">
                Mendukung format <span className="font-mono font-medium">.csv</span>,{" "}
                <span className="font-mono font-medium">.xlsx</span>, dan{" "}
                <span className="font-mono font-medium">.xls</span>
              </p>
            </div>
          )}
        </div>

        {/* File Preview */}
        {preview?.type === "csv" && (
          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900/40">
            <div className="px-4 py-2.5 bg-[#F9F9FB] dark:bg-slate-900/70 border-b border-[#E5E5EA] dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200">
                Pratinjau CSV (Delimiter:{" "}
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {preview.delimiter === ";" ? "Titik Koma (;)" : "Koma (,)"}
                </span>
                )
              </span>
              <Badge variant="default">{preview.totalRows} Baris Data</Badge>
            </div>
            <div className="overflow-x-auto max-h-48">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9F9FB] dark:bg-slate-900/40 border-b border-[#F2F2F7] dark:border-slate-800">
                  <tr>
                    {preview.headers.map((head, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 font-semibold text-[#86868B] dark:text-slate-400 whitespace-nowrap"
                      >
                        {head || `Kolom ${idx + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F7] dark:divide-slate-800">
                  {preview.rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {preview.headers.map((_, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-3 py-2 text-[#1D1D1F] dark:text-slate-200 whitespace-nowrap"
                        >
                          {row[colIdx] || <span className="text-[#86868B]">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {preview.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={Math.max(preview.headers.length, 1)}
                        className="px-3 py-4 text-center text-[#86868B]"
                      >
                        Tidak ada baris data di bawah header.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {preview?.type === "excel" && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50/70 dark:bg-blue-950/25 px-4 py-3 flex items-center gap-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Pratinjau tabel otomatis hanya tersedia untuk CSV. Berkas Excel{" "}
              <span className="font-semibold">{preview.fileName}</span> ({preview.fileSize} KB) siap diunggah langsung ke server.
            </p>
          </div>
        )}

        {/* Format Guidelines */}
        {columns.length > 0 && (
          <div className="rounded-xl border border-[#E5E5EA] dark:border-slate-700/70 bg-[#F9F9FB] dark:bg-slate-900/40 p-4 space-y-2.5">
            <p className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#86868B]" />
              Struktur Kolom yang Diharapkan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-white dark:bg-slate-800/80 border border-[#E5E5EA] dark:border-slate-700/60 px-3 py-2 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1D1D1F] dark:text-slate-100 truncate">
                      {col.label}
                    </p>
                    {col.example && (
                      <p className="text-[11px] text-[#86868B] dark:text-slate-400 truncate">
                        Contoh: {col.example}
                      </p>
                    )}
                  </div>
                  <Badge variant={col.required ? "danger" : "default"}>
                    {col.required ? "Wajib" : "Opsional"}
                  </Badge>
                </div>
              ))}
            </div>
            {updateNote && (
              <p className="text-[11px] text-[#86868B] dark:text-slate-400 pt-1">{updateNote}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
