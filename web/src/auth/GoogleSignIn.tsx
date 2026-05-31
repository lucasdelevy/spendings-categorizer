import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleSignIn() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(!!window.google);

  useEffect(() => {
    if (window.google) {
      setScriptReady(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.google) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        await login(response.credential);
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280,
    });
  }, [scriptReady, login]);

  if (!scriptReady) {
    return (
      <div className="flex justify-center py-2 text-sm text-gray-400">
        {t("login.loading")}
      </div>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
