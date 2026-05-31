import { useCallback, useState } from "react";
import type { CategoryConfig, StatementResult } from "@aletheia/shared";
import {
  parseCSV,
  processBankCSV,
  processCardCSV,
  processFamilyStatements,
  toEngineConfig,
} from "@aletheia/shared";
import type { DetectedFile } from "../components/FamilyUploader";

export function buildFamilyResult(
  files: DetectedFile[],
  catConfig: CategoryConfig | null,
): StatementResult | null {
  const engineConfig = catConfig ? toEngineConfig(catConfig) : undefined;
  const bankResults: StatementResult[] = [];
  const cardResults: StatementResult[] = [];

  for (const f of files) {
    const parsed = parseCSV(f.text);
    if (f.type === "bank") {
      bankResults.push(processBankCSV(parsed.headers, parsed.rows, engineConfig));
    } else {
      cardResults.push(processCardCSV(parsed.headers, parsed.rows, engineConfig));
    }
  }

  if (bankResults.length === 0 && cardResults.length === 0) return null;
  return processFamilyStatements(bankResults, cardResults);
}

export function useLocalPreview(catConfig: CategoryConfig | null) {
  const [familyFiles, setFamilyFiles] = useState<DetectedFile[]>([]);
  const [localResult, setLocalResult] = useState<StatementResult | null>(null);

  const handleFamilyFiles = useCallback(
    (files: DetectedFile[]) => {
      setFamilyFiles(files);
      setLocalResult(buildFamilyResult(files, catConfig));
    },
    [catConfig],
  );

  const clearLocal = useCallback(() => {
    setFamilyFiles([]);
    setLocalResult(null);
  }, []);

  return { familyFiles, localResult, handleFamilyFiles, clearLocal, setFamilyFiles };
}
