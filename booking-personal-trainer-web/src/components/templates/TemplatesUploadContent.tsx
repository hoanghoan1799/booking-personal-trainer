"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { APP_ROUTES } from "@/lib/route.constants";
import { importTemplatesCsv } from "@/services/templates/templates.service";

const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function createClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

type PendingUploadFile = {
  id: string;
  file: File;
};

export default function TemplatesUploadContent() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleImportFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const nextErrors: string[] = [];
    const accepted: PendingUploadFile[] = [];
    files.forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const isCsv = lowerName.endsWith(".csv") || file.type === "text/csv";
      if (!isCsv) {
        nextErrors.push(`Unsupported file: ${file.name}. Only CSV files are allowed.`);
        return;
      }
      if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
        nextErrors.push(
          `File is too large (${file.name}: ${formatBytes(file.size)}). Max allowed is ${formatBytes(
            MAX_CSV_FILE_SIZE_BYTES,
          )}.`,
        );
        return;
      }
      accepted.push({ id: createClientId(), file });
    });
    setPendingFiles((prev) => [...accepted, ...prev]);
    setErrors((prev) => [...nextErrors, ...prev]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await handleImportFiles(Array.from(files));
  };

  const handleRemovePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearErrors = () => {
    setErrors([]);
  };

  const handleSave = async () => {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);
    setErrors([]);
    try {
      for (const item of pendingFiles) {
        await importTemplatesCsv(item.file);
      }
      setPendingFiles([]);
      router.push(APP_ROUTES.TEMPLATES);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setErrors([message]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPendingFiles([]);
    setErrors([]);
    router.push(APP_ROUTES.TEMPLATES);
  };
  const isSaveDisabled = pendingFiles.length === 0 || isUploading;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Import templates</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a CSV file containing your templates and template items.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
            accept="text/csv,.csv"
            aria-label="Select CSV files to import templates"
          />
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel import"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled} aria-label="Upload CSV templates">
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV templates (drag and drop or click)"
        onClick={handlePickFiles}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          handlePickFiles();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
            const lowerName = f.name.toLowerCase();
            return lowerName.endsWith(".csv") || f.type === "text/csv";
          });
          await handleImportFiles(droppedFiles);
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center outline-none transition
          ${isDragging ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"}
          focus:ring-2 focus:ring-brand-500 dark:bg-white/[0.03]
        `}
      >
        <div className="mx-auto max-w-xl space-y-2">
          <p className="text-base font-semibold text-gray-800 dark:text-white/90">
            Drag & drop CSV files here
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Or{" "}
            <span className="font-medium text-brand-600 underline-offset-2 group-hover:underline dark:text-brand-400">
              click to browse
            </span>{" "}
            to import templates.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Supported: .csv (templates + items)
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">How it works</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This page uploads CSV to the backend and imports templates server-side. Required column: <span className="font-medium">name</span>.
            Optional template columns: <span className="font-medium">description</span>, <span className="font-medium">templateType</span> (SYSTEM/TRAINER/PUBLIC).
            Optional item columns: <span className="font-medium">exerciseId</span>, <span className="font-medium">notes</span>, <span className="font-medium">sets</span>, <span className="font-medium">reps</span>, <span className="font-medium">restSeconds</span>, <span className="font-medium">order</span>.
          </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Max file size: <span className="font-medium">{formatBytes(MAX_CSV_FILE_SIZE_BYTES)}</span>.
            </p>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-xl border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-error-700 dark:text-error-200">Upload issues</p>
              <ul className="mt-2 space-y-1">
                {errors.map((message, idx) => (
                  <li key={`${idx}-${message}`} className="text-sm text-error-700/80 dark:text-error-200/80">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearErrors}
              aria-label="Clear errors"
              className="ring-error-500/30 text-error-700 hover:bg-error-50 dark:hover:bg-error-500/10"
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Files to upload</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pendingFiles.length} file(s)</p>
        </div>
        <div className="mt-3 space-y-2">
          {pendingFiles.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No files selected yet.</p>
          ) : (
            pendingFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(item.file.size)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemovePendingFile(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="ring-error-500/30 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

