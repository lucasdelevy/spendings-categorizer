import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { api } from "../auth/api";
import { formatYearMonth, type SavedStatementItem } from "../utils";
import { useTheme } from "../theme/ThemeContext";

export default function ManageMonthsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [items, setItems] = useState<SavedStatementItem[]>([]);

  const load = async () => {
    const res = await api.get<{ statements: SavedStatementItem[] }>("/statements");
    setItems(res.statements);
  };

  useEffect(() => {
    load();
  }, []);

  const months = Array.from(new Set(items.map((s) => s.id.split("#")[0]))).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t("app.manageMonths")}</Text>
      {months.map((ym) => {
        const monthItems = items.filter((s) => s.id.startsWith(`${ym}#`));
        return (
          <View key={ym} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.month, { color: colors.text }]}>{formatYearMonth(ym)}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8 }}>
              {monthItems.length} {t("manage.statements", "statements")}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => navigation.navigate("Dashboard" as never)}
                style={[styles.btn, { borderColor: colors.primary }]}
              >
                <Text style={{ color: colors.primary }}>{t("manage.view", "View")}</Text>
              </Pressable>
              {monthItems.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    Alert.alert(t("manage.deleteConfirm", "Delete?"), item.fileName, [
                      { text: t("app.cancel"), style: "cancel" },
                      {
                        text: t("manage.delete", "Delete"),
                        style: "destructive",
                        onPress: async () => {
                          await api.delete(`/statements/${item.id.replace(/#/g, "%23")}`);
                          await load();
                        },
                      },
                    ])
                  }
                  style={[styles.btn, { borderColor: colors.danger }]}
                >
                  <Text style={{ color: colors.danger, fontSize: 12 }}>{t("manage.delete", "Delete")}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10 },
  month: { fontSize: 17, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
});
