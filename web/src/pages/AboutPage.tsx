import { useTranslation } from "react-i18next";

interface Props {
  onBack: () => void;
}

interface FeatureEntry {
  phase: string;
  title: string;
  description: string;
}

const featureLog: FeatureEntry[] = [
  {
    phase: "14",
    title: "about.features.phase14Title",
    description: "about.features.phase14Desc",
  },
  {
    phase: "13",
    title: "about.features.phase13Title",
    description: "about.features.phase13Desc",
  },
  {
    phase: "12",
    title: "about.features.phase12Title",
    description: "about.features.phase12Desc",
  },
  {
    phase: "11",
    title: "about.features.phase11Title",
    description: "about.features.phase11Desc",
  },
  {
    phase: "10",
    title: "about.features.phase10Title",
    description: "about.features.phase10Desc",
  },
  {
    phase: "9",
    title: "about.features.phase9Title",
    description: "about.features.phase9Desc",
  },
  {
    phase: "8",
    title: "about.features.phase8Title",
    description: "about.features.phase8Desc",
  },
  {
    phase: "7",
    title: "about.features.phase7Title",
    description: "about.features.phase7Desc",
  },
  {
    phase: "6",
    title: "about.features.phase6Title",
    description: "about.features.phase6Desc",
  },
  {
    phase: "5",
    title: "about.features.phase5Title",
    description: "about.features.phase5Desc",
  },
  {
    phase: "4",
    title: "about.features.phase4Title",
    description: "about.features.phase4Desc",
  },
  {
    phase: "3.1",
    title: "about.features.phase31Title",
    description: "about.features.phase31Desc",
  },
  {
    phase: "3",
    title: "about.features.phase3Title",
    description: "about.features.phase3Desc",
  },
  {
    phase: "2",
    title: "about.features.phase2Title",
    description: "about.features.phase2Desc",
  },
  {
    phase: "1",
    title: "about.features.phase1Title",
    description: "about.features.phase1Desc",
  },
];

export default function AboutPage({ onBack }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        {t("about.back")}
      </button>

      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("about.title")}
      </h2>

      {/* Name explanation */}
      <section className="mb-10 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t("about.nameTitle")}
        </h3>
        <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">
          {t("about.nameExplanation")}
        </p>
        <blockquote className="border-l-4 border-indigo-300 pl-4 italic text-gray-500 dark:border-indigo-600 dark:text-gray-400">
          {t("about.nameQuote")}
        </blockquote>
      </section>

      {/* Feature log */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t("about.featureLogTitle")}
        </h3>
        <div className="relative space-y-0">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-indigo-200 dark:bg-indigo-700" />

          {featureLog.map((entry) => (
            <div key={entry.phase} className="relative flex gap-4 pb-6">
              {/* Timeline dot */}
              <div className="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-indigo-500 bg-white dark:bg-gray-900" style={{ marginLeft: "10px" }} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                    {t("about.phase", { number: entry.phase })}
                  </span>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t(entry.title)}
                  </h4>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t(entry.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
