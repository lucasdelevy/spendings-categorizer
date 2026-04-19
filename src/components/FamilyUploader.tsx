import { useCallback } from "react";

interface FileSlot {
  label: string;
  id: string;
  fileName: string | null;
}

interface Props {
  slots: FileSlot[];
  onFileLoaded: (slotId: string, text: string, fileName: string) => void;
}

export default function FamilyUploader({ slots, onFileLoaded }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {slots.map((slot) => (
        <SlotCard
          key={slot.id}
          slot={slot}
          onFileLoaded={onFileLoaded}
        />
      ))}
    </div>
  );
}

function SlotCard({
  slot,
  onFileLoaded,
}: {
  slot: FileSlot;
  onFileLoaded: (slotId: string, text: string, fileName: string) => void;
}) {
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          onFileLoaded(slot.id, text, file.name);
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [onFileLoaded, slot.id],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const isBank = slot.id.startsWith("bank");

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      className={`
        flex flex-col items-center justify-center rounded-lg border-2 border-dashed
        px-4 py-6 text-center transition-colors
        ${slot.fileName ? "border-green-300 bg-green-50" : "border-gray-300 bg-white hover:border-gray-400"}
      `}
    >
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
          isBank ? "bg-indigo-500" : "bg-amber-500"
        }`}
      >
        {isBank ? "B" : "C"}
      </div>

      <p className="text-sm font-medium text-gray-700">{slot.label}</p>

      {slot.fileName ? (
        <p className="mt-1 text-xs text-green-600">{slot.fileName}</p>
      ) : (
        <label className="mt-1 cursor-pointer text-xs text-indigo-600 hover:text-indigo-500">
          Selecionar arquivo
          <input
            type="file"
            accept=".csv"
            className="sr-only"
            onChange={onChange}
          />
        </label>
      )}
    </div>
  );
}
