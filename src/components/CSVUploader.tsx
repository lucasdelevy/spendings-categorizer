import { useCallback, useState } from "react";

interface Props {
  onFileLoaded: (text: string, fileName: string) => void;
}

export default function CSVUploader({ onFileLoaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          onFileLoaded(text, file.name);
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [onFileLoaded],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
        px-6 py-10 text-center transition-colors
        ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white hover:border-gray-400"}
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

      {fileName ? (
        <p className="text-sm text-gray-700">
          <span className="font-medium text-indigo-600">{fileName}</span>{" "}
          carregado
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            Arraste seu arquivo CSV aqui ou{" "}
            <label className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-500">
              selecione
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={onInputChange}
              />
            </label>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Extrato Nubank (.csv)
          </p>
        </>
      )}
    </div>
  );
}
