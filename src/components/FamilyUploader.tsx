import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { StatementType } from "../types";
import { parseCSV } from "../engine/csvParser";

export interface DetectedFile {
  name: string;
  text: string;
  type: StatementType;
}

interface Props {
  files: DetectedFile[];
  onFilesLoaded: (files: DetectedFile[]) => void;
}

export default function FamilyUploader({ files, onFilesLoaded }: Props) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback(
    (incoming: FileList) => {
      const csvFiles = Array.from(incoming).filter((f) =>
        f.name.toLowerCase().endsWith(".csv"),
      );
      if (csvFiles.length === 0) return;

      const pending = csvFiles.map(
        (file) =>
          new Promise<DetectedFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target?.result;
              if (typeof text !== "string") {
                reject(new Error(t("error.readFile", { fileName: file.name })));
                return;
              }
              try {
                const parsed = parseCSV(text);
                resolve({ name: file.name, text, type: parsed.type });
              } catch (err) {
                reject(err);
              }
            };
            reader.readAsText(file, "utf-8");
          }),
      );

      Promise.all(pending).then((detected) => {
        onFilesLoaded([...files, ...detected]);
      });
    },
    [files, onFilesLoaded, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
    },
    [processFiles],
  );

  const bankFiles = files.filter((f) => f.type === "bank");
  const cardFiles = files.filter((f) => f.type === "card");
  const hasFiles = files.length > 0;

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`
          relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
          px-6 py-10 text-center transition-colors
          ${dragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950" : "border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"}
        `}
      >
        <svg
          className="mb-3 h-10 w-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("uploader.dragOrSelect")}{" "}
          <label className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            {t("uploader.select")}
            <input
              type="file"
              accept=".csv"
              multiple
              className="sr-only"
              onChange={onInputChange}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {t("uploader.autoDetect")}
        </p>
      </div>

      {hasFiles && (
        <div className="flex flex-wrap gap-2">
          {bankFiles.map((f) => (
            <FileBadge key={f.name} name={f.name} type="bank" />
          ))}
          {cardFiles.map((f) => (
            <FileBadge key={f.name} name={f.name} type="card" />
          ))}
        </div>
      )}
    </div>
  );
}

function FileBadge({ name, type }: { name: string; type: StatementType }) {
  const { t } = useTranslation();
  const isBank = type === "bank";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        isBank
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isBank ? "bg-indigo-500" : "bg-amber-500"}`}
      />
      {name}
      <span className="text-[10px] opacity-60">
        {isBank ? t("uploader.bank") : t("uploader.card")}
      </span>
    </span>
  );
}
