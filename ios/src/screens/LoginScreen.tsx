import { useTranslation } from "react-i18next";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { TextField } from "../components/ui";
import { useTheme } from "../theme/ThemeContext";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, mode } = useTheme();
  const { login, loginWithApple, loginWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<"apple" | "google" | "email" | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const busy = busyKind !== null;

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.authentication?.idToken;
    if (!idToken) {
      setError(t("login.googleFailed"));
      return;
    }
    setBusyKind("google");
    setError(null);
    login(idToken)
      .catch((e) => setError(e instanceof Error ? e.message : t("login.googleFailed")))
      .finally(() => setBusyKind(null));
  }, [response, login, t]);

  async function handleEmail() {
    if (busy) return;
    setBusyKind("email");
    setError(null);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.emailFailed"));
    } finally {
      setBusyKind(null);
    }
  }

  async function handleApple() {
    if (busy) return;
    setBusyKind("apple");
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setError(t("login.appleFailed"));
        return;
      }
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();
      await loginWithApple(credential.identityToken, fullName || undefined);
    } catch (e) {
      if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      setError(e instanceof Error ? e.message : t("login.appleFailed"));
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>{t("app.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t("login.subtitle")}</Text>

        {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

        {appleAvailable && (
          busyKind === "apple" ? (
            <View style={[styles.appleBusy, { backgroundColor: mode === "dark" ? "#fff" : "#000" }]}>
              <ActivityIndicator color={mode === "dark" ? "#000" : "#fff"} />
            </View>
          ) : (
            <View pointerEvents={busy ? "none" : "auto"} style={busy ? styles.dimmed : undefined}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={
                  mode === "dark"
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={10}
                style={styles.appleButton}
                onPress={() => void handleApple()}
              />
            </View>
          )
        )}

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }, (!request || busy) && styles.buttonDisabled]}
          disabled={!request || busy}
          onPress={() => promptAsync()}
        >
          {busyKind === "google" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("login.googleSignIn")}</Text>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Text style={[styles.or, { color: colors.textMuted }]}>{t("login.orEmail")}</Text>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.emailForm}>
          <TextField
            label={t("login.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            editable={!busy}
          />
          <TextField
            label={t("login.password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            editable={!busy}
            onSubmitEditing={() => {
              void handleEmail();
            }}
          />
          <Pressable
            style={[
              styles.button,
              { backgroundColor: colors.primary, marginTop: 8 },
              (busy || !email.trim() || !password) && styles.buttonDisabled,
            ]}
            disabled={busy || !email.trim() || !password}
            onPress={() => {
              void handleEmail();
            }}
          >
            {busyKind === "email" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("login.emailSignIn")}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  appleButton: { width: 280, height: 48, marginBottom: 12 },
  appleBusy: {
    width: 280,
    height: 48,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dimmed: { opacity: 0.6 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 220,
    width: 280,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  divider: {
    width: 280,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 20,
  },
  rule: { flex: 1, height: 1 },
  or: { fontSize: 12, fontWeight: "600" },
  emailForm: { width: 280, gap: 10 },
});
