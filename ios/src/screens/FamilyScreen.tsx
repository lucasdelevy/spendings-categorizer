import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";
import { useAuth } from "../auth/AuthContext";
import { canManageFamily, isFamilyOwner } from "../auth/permissions";
import { useTheme } from "../theme/ThemeContext";

interface FamilyMember {
  email: string;
  name: string;
  role: "owner" | "admin" | "member";
  status: "active" | "pending";
}

interface FamilyData {
  id: string;
  name: string;
  myRole?: FamilyMember["role"];
  members: FamilyMember[];
}

function roleKey(role: FamilyMember["role"]): "family.owner" | "family.admin" | "family.member" {
  if (role === "owner") return "family.owner";
  if (role === "admin") return "family.admin";
  return "family.member";
}

function SwipeAction({
  label,
  icon,
  backgroundColor,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.swipeAction, { backgroundColor }]}>
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.swipeLabel}>{label}</Text>
    </View>
  );
}

function MemberCard({
  member,
  canPromote,
  canRemove,
  onPromote,
  onRemove,
}: {
  member: FamilyMember;
  canPromote: boolean;
  canRemove: boolean;
  onPromote: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  const canSwipe = canPromote || canRemove;

  const body = (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.text, fontWeight: "600" }}>{member.name || member.email}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>
        {t(roleKey(member.role))}
        {member.status === "pending" ? ` · ${t("family.pending")}` : ""}
      </Text>
    </View>
  );

  if (!canSwipe) return <View style={styles.cardSwipe}>{body}</View>;

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootFriction={8}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      activeOffsetX={[-15, 15]}
      failOffsetY={[-12, 12]}
      containerStyle={styles.cardSwipe}
      renderLeftActions={
        canPromote
          ? () => (
              <SwipeAction
                label={t("family.makeAdmin")}
                icon="shield-checkmark-outline"
                backgroundColor={colors.primary}
              />
            )
          : undefined
      }
      renderRightActions={
        canRemove
          ? () => (
              <SwipeAction
                label={t("family.removeTitle")}
                icon="trash-outline"
                backgroundColor={colors.danger}
              />
            )
          : undefined
      }
      onSwipeableOpen={(direction) => {
        if (direction === "left" && canPromote) {
          swipeableRef.current?.close();
          onPromote();
          return;
        }
        if (direction === "right" && canRemove) {
          swipeableRef.current?.close();
          onRemove();
        }
      }}
    >
      {body}
    </Swipeable>
  );
}

export default function FamilyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canManage = canManageFamily(user);
  const owner = isFamilyOwner(user);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ family: FamilyData | null }>("/families/mine");
      setFamily(res.family);
      await refreshUser();
    } catch {
      setFamily(null);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handlePromote = async (email: string) => {
    setError(null);
    try {
      await api.put(`/families/members/${encodeURIComponent(email)}`, { role: "admin" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.makeAdmin"));
    }
  };

  const handleRemove = (email: string) => {
    Alert.alert(t("family.removeTitle"), email, [
      { text: t("app.cancel"), style: "cancel" },
      {
        text: t("family.removeTitle"),
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await api.delete(`/families/members/${encodeURIComponent(email)}`);
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : t("error.removeMember"));
          }
        },
      },
    ]);
  };

  const handleDeleteFamily = () => {
    Alert.alert(t("family.deleteFamily"), t("family.deleteFamilyConfirm"), [
      { text: t("app.cancel"), style: "cancel" },
      {
        text: t("family.deleteFamily"),
        style: "destructive",
        onPress: async () => {
          setError(null);
          try {
            await api.delete("/families");
            await refreshUser();
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : t("error.deleteFamily"));
          }
        },
      },
    ]);
  };

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
              await refreshUser();
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
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {t("family.members", { count: family.members.length })}
      </Text>
      {canManage && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>{t("family.swipeHint")}</Text>
      )}
      {family.members.map((m) => (
        <MemberCard
          key={m.email}
          member={m}
          canPromote={
            canManage &&
            m.status === "active" &&
            m.role === "member" &&
            m.email !== user?.email
          }
          canRemove={canManage && m.role !== "owner" && m.email !== user?.email}
          onPromote={() => {
            void handlePromote(m.email);
          }}
          onRemove={() => handleRemove(m.email)}
        />
      ))}
      {canManage && (
        <>
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
        </>
      )}
      {owner && (
        <Pressable
          style={[styles.button, styles.dangerButton, { borderColor: colors.danger }]}
          onPress={handleDeleteFamily}
        >
          <Text style={[styles.buttonText, { color: colors.danger }]}>{t("family.deleteFamily")}</Text>
        </Pressable>
      )}
      {error && <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  sub: { marginBottom: 4, fontWeight: "600" },
  hint: { fontSize: 12, marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 8, padding: 10 },
  cardSwipe: { marginBottom: 8 },
  swipeAction: {
    width: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    gap: 4,
  },
  swipeLabel: { color: "#fff", fontSize: 11, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 8 },
  dangerButton: { backgroundColor: "transparent", borderWidth: 1, marginTop: 16 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
