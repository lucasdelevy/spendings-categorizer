import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../auth/api";

interface FamilyMember {
  email: string;
  name: string;
  picture: string;
  role: "owner" | "member";
  status: "active" | "pending";
  joinedAt: string;
}

interface FamilyData {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  members: FamilyMember[];
}

interface Props {
  onBack: () => void;
}

export default function FamilyPage({ onBack }: Props) {
  const { t } = useTranslation();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
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
    loadFamily();
  }, [loadFamily]);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setError(null);
    try {
      await api.post("/families", { name: familyName.trim() });
      setSuccess(t("family.created"));
      setFamilyName("");
      await loadFamily();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.createFamily"));
    }
  };

  const handleAddMember = async () => {
    if (!newEmail.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      await api.post("/families/members", { email: newEmail.trim() });
      setSuccess(t("family.inviteSent", { email: newEmail.trim() }));
      setNewEmail("");
      await loadFamily();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.addMember"));
    }
  };

  const handleRemove = async (email: string) => {
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/families/members/${encodeURIComponent(email)}`);
      setSuccess(t("family.memberRemoved"));
      await loadFamily();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error.removeMember"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("family.title")}
        </h1>
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("family.back")}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          {success}
        </div>
      )}

      {!family ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("family.createTitle")}
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {t("family.createDescription")}
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t("family.namePlaceholder")}
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500"
            />
            <button
              onClick={handleCreate}
              disabled={!familyName.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {t("family.create")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
              {t("family.title")}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{family.name}</h2>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("family.members", { count: family.members.length })}
            </h3>
            <div className="space-y-3">
              {family.members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    {member.picture ? (
                      <img
                        src={member.picture}
                        alt={member.name}
                        className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-600"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {member.email[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.status === "pending" && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        {t("family.pending")}
                      </span>
                    )}
                    {member.role === "owner" ? (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {t("family.owner")}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemove(member.email)}
                        className="text-red-400 transition hover:text-red-600"
                        title={t("family.removeTitle")}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("family.addMember")}
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              {t("family.addMemberDescription")}
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder={t("family.emailPlaceholder")}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:placeholder-gray-500"
              />
              <button
                onClick={handleAddMember}
                disabled={!newEmail.trim()}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {t("family.addButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
