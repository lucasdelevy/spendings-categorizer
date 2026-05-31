import * as DocumentPicker from "expo-document-picker";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { StatementType } from "@aletheia/shared";
import { parseCSV } from "@aletheia/shared";
import { useTheme } from "../theme/ThemeContext";

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
  const { colors } = useTheme();

  const pickFiles = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "text/comma-separated-values",
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const detected: DetectedFile[] = [];
    for (const asset of result.assets) {
      const response = await fetch(asset.uri);
      const text = await response.text();
      const parsed = parseCSV(text);
      detected.push({ name: asset.name, text, type: parsed.type });
    }
    onFilesLoaded([...files, ...detected]);
  }, [files, onFilesLoaded]);

  const bankCount = files.filter((f) => f.type === "bank").length;
  const cardCount = files.filter((f) => f.type === "card").length;

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={pickFiles}>
        <Text style={styles.buttonText}>{t("upload.selectCsv", "Select CSV files")}</Text>
      </Pressable>
      {files.length > 0 && (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {t("upload.filesSelected", "{{count}} file(s)", { count: files.length })}
          {bankCount > 0 ? ` · ${bankCount} bank` : ""}
          {cardCount > 0 ? ` · ${cardCount} card` : ""}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  meta: { marginTop: 10, fontSize: 13, textAlign: "center" },
});
