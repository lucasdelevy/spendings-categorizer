const en = {
  app: {
    title: "Aletheia",
    categories: "Categories",
    family: "Family",
    manageMonths: "Manage Months",
    about: "About Aletheia",
    logout: "Sign Out",
    uploadStatements: "Upload my statements",
    uploadOverlayDescription:
      "Upload your statements for this month. They will be combined with other members' statements.",
    cancel: "Cancel",
    spendingByCategory: "Spending by Category",
    dailySpending: "Daily Spending",
    cumulative: "Accumulated",
    tabCategory: "By Category",
    tabDaily: "By Day",
    tabAllTransactions: "All",
    tabByCategory: "By Category",
    transactions: "Transactions",
  },

  error: {
    processCsv: "Error processing CSV",
    delete: "Error deleting",
    recategorize: "Error recategorizing",
    rename: "Error renaming",
    ignoreTransaction: "Error ignoring transaction",
    hideTransaction: "Error toggling transaction visibility",
    save: "Error saving",
    createFamily: "Error creating family",
    addMember: "Error adding member",
    removeMember: "Error removing member",
    readFile: "Failed to read {{fileName}}",
  },

  login: {
    subtitle: "Sign in to save and view your statements",
    loading: "Loading...",
  },

  categories: {
    title: "Categories",
    back: "← Back",
    saving: "Saving...",
    saveChanges: "Save Changes",
    add: "Add",
    sectionCategories: "Categories",
    sectionIgnore: "Ignore",
    sectionRename: "Rename",
    renamePrompt: "Rename category:",
    renameTitle: "Rename",
    deleteTitle: "Delete",
    deleteConfirm: 'Delete category "{{name}}"?',
    noKeywords: "No keywords added",
    newKeyword: "New keyword...",
    newCategory: "New category...",
    createCategory: "Create Category",
    keywordsCount: "{{count}} keywords",
    ignoreDescription:
      "Transactions containing any of these terms will be ignored when processing the CSV.",
    noIgnoreFilters: "No ignore filters",
    newIgnorePattern: "New pattern to ignore...",
    renameDescription: "Mappings to normalize payee/merchant names.",
    noMappings: "No mappings",
    originalName: "Original name...",
    displayName: "Display name...",
    limit: "Spending Limit",
    limitAmount: "Limit amount",
    limitPeriod: "Period",
    limitDaily: "Daily",
    limitWeekly: "Weekly",
    limitMonthly: "Monthly",
    setLimit: "Set limit",
    removeLimit: "Remove limit",
    limitPerDay: "{{amount}}/day",
    limitPerWeek: "{{amount}}/week",
    limitPerMonth: "{{amount}}/month",
  },

  family: {
    title: "Family",
    back: "Back",
    created: "Family created!",
    inviteSent: "Invite sent to {{email}}",
    memberRemoved: "Member removed",
    createTitle: "Create a family",
    createDescription:
      "Create a family to share expenses with others. Each member can upload their own statements and everyone will see a combined summary.",
    namePlaceholder: "Family name (e.g. Home)",
    create: "Create",
    members: "Members ({{count}})",
    pending: "Pending",
    owner: "Owner",
    removeTitle: "Remove",
    addMember: "Add member",
    addMemberDescription:
      "The member will be linked automatically the next time they sign in with Google.",
    emailPlaceholder: "Member email",
    addButton: "Add",
  },

  manage: {
    title: "Manage Months",
    back: "Back",
    noStatements: "No saved statements yet.",
    period: "Period",
    owner: "Owner",
    date: "Date",
    expenses: "Expenses",
    transactions: "Transactions",
    file: "File",
    view: "View",
    deleteTitle: "Delete",
  },

  month: {
    new: "(new)",
  },

  uploader: {
    dragOrSelect: "Drag all CSVs at once or",
    select: "select",
    autoDetect:
      "Bank statements and credit card bills — detected automatically",
    bank: "Bank",
    card: "Card",
    loaded: "loaded",
    dragCsv: "Drag your CSV file here or",
    nubankCsv: "Bank statement (.csv)",
  },

  save: {
    detectedMonth: "Detected month:",
    saving: "Saving...",
    save: "Save",
  },

  summary: {
    totalExpenses: "Total Expenses",
    credits: "Credits",
    totalBill: "Total Bill",
    transactionsCount: "{{count}} transactions",
    income: "Income",
    expenses: "Expenses",
    balance: "Balance",
    transactions: "Transactions",
    hidden: "Hidden",
    limitsExceeded: "Limits Exceeded",
  },

  table: {
    date: "Date",
    source: "Source",
    payee: "Payee",
    merchant: "Merchant",
    category: "Category",
    installment: "Installment",
    amount: "Amount",
    actions: "Actions",
    hide: "Hide",
    unhide: "Unhide",
    bank: "Bank",
    card: "Card",
    noResults: "No transactions found matching the selected filters.",
  },

  modal: {
    recategorize: "Recategorize",
    rename: "Rename",
    ignore: "Ignore",
    applyToSimilar: "Apply to similar transactions",
    createNewCategory: "+ Create new category",
    categoryName: "Category name",
    createAndMove: "Create and move",
    originalDescription: "Original description",
    newDisplayName: "New display name",
    renameHint:
      "Future imports with the same description will use this name.",
    renameButton: "Rename",
    ignoreWarning:
      "By ignoring, this transaction will be removed from the saved statement and the description will be added to the ignore list. Future imports with the same description will be automatically ignored.",
    descriptionToIgnore: "Description to ignore",
    confirmAndRemove: "Confirm and remove",
  },

  about: {
    title: "About Aletheia",
    back: "← Back",
    nameTitle: "Why \"Aletheia\"?",
    nameExplanation:
      "In Greek mythology, Aletheia (ἀλήθεια) is the spirit of truth and disclosure — literally \"un-concealment.\" The word comes from a-lethe: the negation of Lethe, the river of forgetfulness in the underworld. To reach Aletheia is to remember what was forgotten, to reveal what was hidden.",
    nameQuote:
      "This app reveals the spending patterns concealed in bank statements and credit card bills — truths that, left unexamined, slip into the waters of Lethe.",
    featureLogTitle: "Feature Log",
    phase: "Phase {{number}}",
    features: {
      phase1Title: "Python Scripts",
      phase1Desc:
        "CLI scripts for categorizing Nubank bank and credit card CSVs with keyword matching, ignore lists, and payee renaming.",
      phase2Title: "React Static App",
      phase2Desc:
        "Migrated to a React + Vite web app on GitHub Pages. All processing client-side with pie charts and transaction tables.",
      phase3Title: "Cloud Backend",
      phase3Desc:
        "Added AWS Lambda + DynamoDB backend with Google Sign-In. Statements persist across sessions with upsert-friendly storage.",
      phase31Title: "Soft-Delete & Month Management",
      phase31Desc:
        "Statements are soft-deleted instead of removed. Added a Manage Months page for viewing, navigating, and deleting saved periods.",
      phase4Title: "Family Sharing",
      phase4Desc:
        "Multiple users share combined spendings via a Family entity. Per-user uploads merged at read time with avatar attribution.",
      phase5Title: "Category Management",
      phase5Desc:
        "Categories, ignore lists, and rename maps stored per-family in DynamoDB. In-table recategorization auto-learns new keywords.",
      phase6Title: "Transaction Filters",
      phase6Desc:
        "Collapsible filter bar with amount range, date range, and member multi-select. Filters recompute totals in real time.",
      phase7Title: "Dark Mode & i18n",
      phase7Desc:
        "Class-based Tailwind dark mode with system preference detection. Full EN and PT-BR translations via react-i18next.",
      phase8Title: "Sidebar Navigation & Rebrand",
      phase8Desc:
        "Hamburger side menu, dot-grid background, custom favicon. Rebranded to Aletheia with mirrored Greek script reflection.",
      phase9Title: "Hide/Unhide Transactions",
      phase9Desc:
        "Per-transaction hide toggle that grays out rows and excludes them from totals, charts, and category subtotals. Hidden count shown in category headers and summary bar.",
      phase10Title: "Month Navigator Redesign",
      phase10Desc:
        "Replaced the dropdown with a centered month title, chevron arrows, and a dot timeline. Supports trackpad swipe, touch gestures, and keyboard arrows. In-memory cache for instant month switching.",
      phase11Title: "Pierre Open Finance Integration",
      phase11Desc:
        "Automatic transaction sync via Pierre Finance API every 5 minutes. Cross-source deduplication prevents double-counting between CSV uploads and Open Finance data. Each transaction shows its origin (API or CSV).",
      phase12Title: "Category Spending Limits",
      phase12Desc:
        "Set daily, weekly, or monthly spending limits per category. Progress bars on category headers show spend vs budget with color-coded warnings (green/amber/red). Dashboard banner alerts when limits are breached.",
      phase13Title: "Flat Transactions View & Date-Sort Fix",
      phase13Desc:
        "New default \"All\" tab on the dashboard lists every transaction for the month in a single table sorted by date (newest first), with a category column. The existing \"By Category\" accordion is one click away. Also fixed per-category sorting that was placing older transactions above newer ones when bank (DD/MM/YYYY) and card (YYYY-MM-DD) dates were merged.",
    },
  },

  sidebar: {
    settings: "Settings",
    language: "Language",
    darkMode: "Dark mode",
    navigation: "Navigation",
  },

  limits: {
    ofLimit: "of {{limit}}",
    exceeded: "exceeded",
    breachBanner: "{{count}} category limit(s) exceeded this month",
    monthlyBudget: "Monthly budget: {{amount}}",
  },

  filters: {
    title: "Filters",
    clear: "Clear filters",
    amount: "Amount (R$)",
    min: "Min",
    max: "Max",
    date: "Date",
    custom: "Custom",
    member: "Member",
  },
} as const;

export default en;
