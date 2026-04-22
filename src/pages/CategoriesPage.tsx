import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CategoryConfig, LimitPeriod } from "../types";

interface Props {
  config: CategoryConfig | null;
  onSave: (config: CategoryConfig) => Promise<void>;
  onBack: () => void;
}

type Section = "categories" | "ignore" | "rename";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function CategoryChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-gray-400 hover:text-red-500"
      >
        &times;
      </button>
    </span>
  );
}

function AddInput({
  placeholder,
  buttonLabel,
  onAdd,
}: {
  placeholder: string;
  buttonLabel: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function ColorDot({
  color,
  onChange,
}: {
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <label className="relative cursor-pointer">
      <span
        className="inline-block h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
        style={{ backgroundColor: color }}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-0 w-0 opacity-0"
      />
    </label>
  );
}

export default function CategoriesPage({ config, onSave, onBack }: Props) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState<CategoryConfig | null>(null);
  const [section, setSection] = useState<Section>("categories");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (config) setDraft(deepClone(config));
  }, [config]);

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const updateDraft = (fn: (d: CategoryConfig) => void) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = deepClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(draft);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    updateDraft((d) => {
      if (!d.categories[name]) {
        d.categories[name] = { keywords: [], color: "#6b7280" };
      }
    });
    setNewCategoryName("");
    setExpandedCat(newCategoryName.trim());
  };

  const deleteCategory = (name: string) => {
    updateDraft((d) => {
      delete d.categories[name];
    });
    if (expandedCat === name) setExpandedCat(null);
  };

  const renameCategory = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    updateDraft((d) => {
      if (d.categories[newName]) return;
      d.categories[newName] = d.categories[oldName];
      delete d.categories[oldName];
    });
    if (expandedCat === oldName) setExpandedCat(newName);
  };

  const addKeyword = (catName: string, keyword: string) => {
    const lower = keyword.toLowerCase();
    updateDraft((d) => {
      const entry = d.categories[catName];
      if (entry && !entry.keywords.includes(lower)) {
        entry.keywords.push(lower);
      }
    });
  };

  const removeKeyword = (catName: string, keyword: string) => {
    updateDraft((d) => {
      const entry = d.categories[catName];
      if (entry) {
        entry.keywords = entry.keywords.filter((k) => k !== keyword);
      }
    });
  };

  const setCatColor = (catName: string, color: string) => {
    updateDraft((d) => {
      if (d.categories[catName]) d.categories[catName].color = color;
    });
  };

  const addIgnore = (pattern: string) => {
    const lower = pattern.toLowerCase();
    updateDraft((d) => {
      if (!d.ignore.includes(lower)) d.ignore.push(lower);
    });
  };

  const removeIgnore = (pattern: string) => {
    updateDraft((d) => {
      d.ignore = d.ignore.filter((p) => p !== pattern);
    });
  };

  const addRename = (raw: string, display: string) => {
    const key = raw.toLowerCase();
    updateDraft((d) => {
      d.rename[key] = display;
    });
  };

  const removeRename = (key: string) => {
    updateDraft((d) => {
      delete d.rename[key];
    });
  };

  const sectionLabels: Record<Section, string> = {
    categories: t("categories.sectionCategories"),
    ignore: t("categories.sectionIgnore"),
    rename: t("categories.sectionRename"),
  };

  const sortLocale = i18n.language.startsWith("pt") ? "pt-BR" : "en";

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("categories.back")}
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t("categories.title")}
          </h1>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? t("categories.saving") : t("categories.saveChanges")}
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        {(["categories", "ignore", "rename"] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              section === s
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {sectionLabels[s]}
          </button>
        ))}
      </div>

      {section === "categories" && (
        <div className="space-y-2">
          {Object.entries(draft.categories)
            .sort(([a], [b]) => a.localeCompare(b, sortLocale))
            .map(([name, entry]) => {
              const isOpen = expandedCat === name;
              return (
                <div
                  key={name}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2 px-4 py-3">
                    <button
                      onClick={() => setExpandedCat(isOpen ? null : name)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <ColorDot
                        color={entry.color}
                        onChange={(c) => setCatColor(name, c)}
                      />
                      <span className="truncate font-medium text-gray-900 dark:text-gray-100">{name}</span>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {t("categories.keywordsCount", { count: entry.keywords.length })}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {entry.limit ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500">R$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.limit.amount || ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              updateDraft((d) => {
                                const cat = d.categories[name];
                                if (cat?.limit) cat.limit.amount = raw === "" ? 0 : Math.max(0, parseFloat(raw) || 0);
                              });
                            }}
                            className="w-20 rounded border border-gray-200 px-1.5 py-1 text-xs tabular-nums focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          />
                          <select
                            value={entry.limit.period}
                            onChange={(e) =>
                              updateDraft((d) => {
                                const cat = d.categories[name];
                                if (cat?.limit) cat.limit.period = e.target.value as LimitPeriod;
                              })
                            }
                            className="rounded border border-gray-200 py-1 pl-1 pr-5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="daily">/{t("categories.limitDaily").toLowerCase()}</option>
                            <option value="weekly">/{t("categories.limitWeekly").toLowerCase()}</option>
                            <option value="monthly">/{t("categories.limitMonthly").toLowerCase()}</option>
                          </select>
                          <button
                            onClick={() =>
                              updateDraft((d) => {
                                const cat = d.categories[name];
                                if (cat) delete cat.limit;
                              })
                            }
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                            title={t("categories.removeLimit")}
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            updateDraft((d) => {
                              const cat = d.categories[name];
                              if (cat) cat.limit = { amount: 0, period: "monthly" };
                            })
                          }
                          className="rounded border border-dashed border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
                        >
                          {t("categories.setLimit")}
                        </button>
                      )}

                      <div className="ml-1 flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
                        <button
                          onClick={() => {
                            const newName = prompt(t("categories.renamePrompt"), name);
                            if (newName) renameCategory(name, newName);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-200"
                          title={t("categories.renameTitle")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t("categories.deleteConfirm", { name }))) deleteCategory(name);
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                          title={t("categories.deleteTitle")}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setExpandedCat(isOpen ? null : name)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <svg
                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 py-3 space-y-3 dark:border-gray-700">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.keywords.map((kw) => (
                          <CategoryChip
                            key={kw}
                            label={kw}
                            onRemove={() => removeKeyword(name, kw)}
                          />
                        ))}
                        {entry.keywords.length === 0 && (
                          <span className="text-xs text-gray-400">
                            {t("categories.noKeywords")}
                          </span>
                        )}
                      </div>
                      <AddInput
                        placeholder={t("categories.newKeyword")}
                        buttonLabel={t("categories.add")}
                        onAdd={(v) => addKeyword(name, v)}
                      />
                    </div>
                  )}
                </div>
              );
            })}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder={t("categories.newCategory")}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
            />
            <button
              onClick={addCategory}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t("categories.createCategory")}
            </button>
          </div>
        </div>
      )}

      {section === "ignore" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("categories.ignoreDescription")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {draft.ignore.map((pattern) => (
              <CategoryChip
                key={pattern}
                label={pattern}
                onRemove={() => removeIgnore(pattern)}
              />
            ))}
            {draft.ignore.length === 0 && (
              <span className="text-xs text-gray-400">{t("categories.noIgnoreFilters")}</span>
            )}
          </div>
          <AddInput
            placeholder={t("categories.newIgnorePattern")}
            buttonLabel={t("categories.add")}
            onAdd={addIgnore}
          />
        </div>
      )}

      {section === "rename" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("categories.renameDescription")}
          </p>
          <div className="space-y-2">
            {Object.entries(draft.rename).map(([raw, display]) => (
              <div
                key={raw}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                <span className="flex-1 truncate text-gray-500 dark:text-gray-400">{raw}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="flex-1 truncate font-medium text-gray-800 dark:text-gray-200">
                  {display}
                </span>
                <button
                  onClick={() => removeRename(raw)}
                  className="text-gray-400 hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
            {Object.keys(draft.rename).length === 0 && (
              <span className="text-xs text-gray-400">{t("categories.noMappings")}</span>
            )}
          </div>
          <RenameAddForm onAdd={addRename} />
        </div>
      )}
    </>
  );
}

function RenameAddForm({
  onAdd,
}: {
  onAdd: (raw: string, display: string) => void;
}) {
  const { t } = useTranslation();
  const [raw, setRaw] = useState("");
  const [display, setDisplay] = useState("");

  const submit = () => {
    if (!raw.trim() || !display.trim()) return;
    onAdd(raw.trim(), display.trim());
    setRaw("");
    setDisplay("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder={t("categories.originalName")}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
      />
      <span className="self-center text-gray-400">&rarr;</span>
      <input
        type="text"
        value={display}
        onChange={(e) => setDisplay(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("categories.displayName")}
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {t("categories.add")}
      </button>
    </div>
  );
}
