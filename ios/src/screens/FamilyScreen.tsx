import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";
import { useTheme } from "../theme/ThemeContext";

interface FamilyMember {
  email: string;
  name: string;
  role: string;
  status: string;
}

interface FamilyData {
  id: string;
  name: string;
  members: FamilyMember[];
}

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ family: FamilyData | null }>("/families/mine");
      setFamily(res.family);
    } catch {
      setFamily(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!family) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.heading, { color: colors.text }]}>{t("app.family")}</Text>
        <TextInput
          value={familyName}
          onChangeText={setFamilyName}
          placeholder={t("family.namePlaceholder", "Family name")}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        />
        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={async () => {
            try {
              await api.post("/families", { name: familyName.trim() });
              setFamilyName("");
              await load();
            } catch (e) {
              setError(e instanceof Error ? e.message : t("error.createFamily"));
            }
          }}
        >
          <Text style={styles.buttonText}>{t("family.create", "Create family")}</Text>
        </Pressable>
        {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{family.name}</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>{t("family.members", "Members")}</Text>
      {family.members.map((m) => (
        <View key={m.email} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{m.name || m.email}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {m.role} · {m.status}
          </Text>
        </View>
      ))}
      <TextInput
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder={t("family.emailPlaceholder", "Invite by email")}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: 12 }]}
      />
      <Pressable
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={async () => {
          try {
            await api.post("/families/members", { email: newEmail.trim() });
            setNewEmail("");
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : t("error.addMember"));
          }
        }}
      >
        <Text style={styles.buttonText}>{t("family.invite", "Invite")}</Text>
      </Pressable>
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  sub: { marginBottom: 8, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { padding: 12, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
