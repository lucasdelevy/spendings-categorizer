import { useState } from "react";
import { useTranslation } from "react-i18next";
import GoogleSignIn from "../auth/GoogleSignIn";
import { useAuth } from "../auth/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useTranslation();
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmail = async () => {
    if (!email.trim() || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.emailFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-900/50">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t("app.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("login.subtitle")}
          </p>
        </div>
        <GoogleSignIn />
        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
          <span className="text-xs font-medium text-gray-400">{t("login.orEmail")}</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
        </div>
        {error && (
          <p className="mb-3 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleEmail();
          }}
        >
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("login.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
            {t("login.password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? t("login.loading") : t("login.emailSignIn")}
          </button>
        </form>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
