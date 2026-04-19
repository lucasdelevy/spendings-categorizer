import { useState, useEffect } from "react";
import type { CategoryConfig } from "../types";

interface Props {
  config: CategoryConfig | null;
  onSave: (config: CategoryConfig) => Promise<void>;
  onBack: () => void;
}

type Tab = "bank" | "card";
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
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
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
  onAdd,
}: {
  placeholder: string;
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
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Adicionar
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
        className="inline-block h-4 w-4 rounded-full border border-gray-300"
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
  const [draft, setDraft] = useState<CategoryConfig | null>(null);
  const [tab, setTab] = useState<Tab>("bank");
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

  const catMap = tab === "bank" ? draft.bankCategories : draft.cardCategories;
  const ignoreList = tab === "bank" ? draft.bankIgnore : draft.cardIgnore;
  const renameMap = tab === "bank" ? draft.bankRename : draft.cardRename;

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
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      if (!bucket[name]) {
        bucket[name] = { keywords: [], color: "#6b7280" };
      }
    });
    setNewCategoryName("");
    setExpandedCat(newCategoryName.trim());
  };

  const deleteCategory = (name: string) => {
    updateDraft((d) => {
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      delete bucket[name];
    });
    if (expandedCat === name) setExpandedCat(null);
  };

  const renameCategory = (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    updateDraft((d) => {
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      if (bucket[newName]) return;
      bucket[newName] = bucket[oldName];
      delete bucket[oldName];
    });
    if (expandedCat === oldName) setExpandedCat(newName);
  };

  const addKeyword = (catName: string, keyword: string) => {
    const lower = keyword.toLowerCase();
    updateDraft((d) => {
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      const entry = bucket[catName];
      if (entry && !entry.keywords.includes(lower)) {
        entry.keywords.push(lower);
      }
    });
  };

  const removeKeyword = (catName: string, keyword: string) => {
    updateDraft((d) => {
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      const entry = bucket[catName];
      if (entry) {
        entry.keywords = entry.keywords.filter((k) => k !== keyword);
      }
    });
  };

  const setCatColor = (catName: string, color: string) => {
    updateDraft((d) => {
      const bucket = tab === "bank" ? d.bankCategories : d.cardCategories;
      if (bucket[catName]) bucket[catName].color = color;
    });
  };

  const addIgnore = (pattern: string) => {
    const lower = pattern.toLowerCase();
    updateDraft((d) => {
      const list = tab === "bank" ? d.bankIgnore : d.cardIgnore;
      if (!list.includes(lower)) list.push(lower);
    });
  };

  const removeIgnore = (pattern: string) => {
    updateDraft((d) => {
      if (tab === "bank") {
        d.bankIgnore = d.bankIgnore.filter((p) => p !== pattern);
      } else {
        d.cardIgnore = d.cardIgnore.filter((p) => p !== pattern);
      }
    });
  };

  const addRename = (raw: string, display: string) => {
    const key = raw.toLowerCase();
    updateDraft((d) => {
      if (tab === "bank") {
        d.bankRename[key] = display;
      } else {
        d.cardRename[key] = display;
      }
    });
  };

  const removeRename = (key: string) => {
    updateDraft((d) => {
      if (tab === "bank") {
        delete d.bankRename[key];
      } else {
        delete d.cardRename[key];
      }
    });
  };

  const tabLabel = (t: Tab) => (t === "bank" ? "Extrato Bancário" : "Fatura Cartão");
  const sectionLabel = (s: Section) =>
    s === "categories" ? "Categorias" : s === "ignore" ? "Ignorar" : "Renomear";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            &larr; Voltar
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Categorias
          </h1>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        )}
      </header>

      {/* Tab selector */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(["bank", "card"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setExpandedCat(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* Section selector */}
      <div className="mb-6 flex gap-2">
        {(["categories", "ignore", "rename"] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              section === s
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {sectionLabel(s)}
          </button>
        ))}
      </div>

      {/* Categories section */}
      {section === "categories" && (
        <div className="space-y-2">
          {Object.entries(catMap)
            .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
            .map(([name, entry]) => {
            const isOpen = expandedCat === name;
            return (
              <div
                key={name}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setExpandedCat(isOpen ? null : name)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <ColorDot
                      color={entry.color}
                      onChange={(c) => setCatColor(name, c)}
                    />
                    <span className="font-medium text-gray-900">{name}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {entry.keywords.length} keywords
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("Renomear categoria:", name);
                        if (newName) renameCategory(name, newName);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Renomear"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir categoria "${name}"?`)) deleteCategory(name);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Excluir"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
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
                          Nenhuma keyword adicionada
                        </span>
                      )}
                    </div>
                    <AddInput
                      placeholder="Nova keyword..."
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
              placeholder="Nova categoria..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <button
              onClick={addCategory}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Criar Categoria
            </button>
          </div>
        </div>
      )}

      {/* Ignore section */}
      {section === "ignore" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Transações que contenham qualquer destes termos serão ignoradas ao processar o CSV.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ignoreList.map((pattern) => (
              <CategoryChip
                key={pattern}
                label={pattern}
                onRemove={() => removeIgnore(pattern)}
              />
            ))}
            {ignoreList.length === 0 && (
              <span className="text-xs text-gray-400">Nenhum filtro de ignorar</span>
            )}
          </div>
          <AddInput
            placeholder="Novo padrão para ignorar..."
            onAdd={addIgnore}
          />
        </div>
      )}

      {/* Rename section */}
      {section === "rename" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Mapeamentos para normalizar nomes de beneficiários/estabelecimentos.
          </p>
          <div className="space-y-2">
            {Object.entries(renameMap).map(([raw, display]) => (
              <div
                key={raw}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="flex-1 truncate text-gray-500">{raw}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="flex-1 truncate font-medium text-gray-800">
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
            {Object.keys(renameMap).length === 0 && (
              <span className="text-xs text-gray-400">Nenhum mapeamento</span>
            )}
          </div>
          <RenameAddForm onAdd={addRename} />
        </div>
      )}
    </div>
  );
}

function RenameAddForm({
  onAdd,
}: {
  onAdd: (raw: string, display: string) => void;
}) {
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
        placeholder="Nome original..."
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <span className="self-center text-gray-400">&rarr;</span>
      <input
        type="text"
        value={display}
        onChange={(e) => setDisplay(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Nome exibido..."
        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button
        onClick={submit}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Adicionar
      </button>
    </div>
  );
}
