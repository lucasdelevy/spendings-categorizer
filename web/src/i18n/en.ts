const en = {
  app: {
    title: "Aletheia",
    categories: "Categories",
    accounts: "Accounts & Cards",
    reminders: "Payment Reminders",
    family: "Family",
    manageMonths: "Manage Months",
    about: "About Aletheia",
    dashboard: "Dashboard",
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
    makeAdmin: "Error promoting member",
    deleteFamily: "Error deleting family",
    readFile: "Failed to read {{fileName}}",
    createAccount: "Error creating account",
    updateAccount: "Error updating account",
    deleteAccount: "Error deleting account",
    assignAccount: "Error assigning account",
  },

  login: {
    subtitle: "Sign in to save and view your statements",
    loading: "Loading...",
    googleSignIn: "Sign in with Google",
    googleFailed: "Google sign-in failed",
    appleFailed: "Apple sign-in failed",
    orEmail: "or email",
    email: "Email",
    password: "Password",
    emailSignIn: "Sign in with email",
    emailFailed: "Invalid email or password",
  },

  account: {
    delete: "Delete account",
    deleteTitle: "Delete your account?",
    deleteConfirm: "Delete account",
    deleteCancel: "Cancel",
    deleteFailed: "Could not delete account",
    deleteConfirmBody:
      "This permanently deletes your profile, statements, categories, accounts, and device tokens. If you own a family and someone else is in it, they become the owner. If you are the only member, the family is removed. This cannot be undone.",
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
    deleteConfirmTitle: 'Delete category "{{name}}"?',
    deleteConfirmBody:
      "This will remove the category from your config. The deletion takes effect when you click Save Changes.",
    deleteConfirmRecategorize:
      "All transactions currently in this category will be re-evaluated against the remaining keywords. Anything that no longer matches will fall back to \"Sem Categoria\".",
    deleteCancel: "Cancel",
    deleteConfirmAction: "Delete",
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
    alertThreshold: "Alert at % of limit",
    alertThresholdHint:
      "You'll get a push on iOS when a category with a spending limit reaches this percent. Default is 80.",
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
    admin: "Admin",
    member: "Member",
    makeAdmin: "Make admin",
    madeAdmin: "{{email}} is now an admin",
    swipeHint: "Swipe right on a member to make them admin, or left to remove them.",
    managersOnly: "Only family owners and admins can edit this.",
    deleteFamily: "Delete family",
    deleteFamilyConfirm:
      "This permanently deletes the family for everyone: shared statements, categories, and accounts. Members keep their own accounts. Continue?",
    deleted: "Family deleted",
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
    tabBank: "Bank Statements",
    tabCard: "Card Statements",
    tabOpenFinance: "Open Finance",
    noStatements: "No saved statements yet.",
    period: "Period",
    owner: "Owner",
    date: "Date",
    expenses: "Expenses",
    transactions: "Transactions",
    file: "File",
    account: "Account",
    unassigned: "— Unassigned —",
    noMatchingAccount: "No matching account",
    mixedAccounts: "Mixed",
    mixedAccountsHint:
      "This statement contains transactions tied to more than one account. Reassign with care — all transactions will move to the chosen account.",
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
    assignAccounts: "Assign each file to an account",
    noAccount: "— No account —",
    noAccountsHint: "Add accounts in 'Accounts & Cards' to enable per-account tagging.",
    noMatchingAccount: "No {{type}} account configured",
    closingDayShort: "closes day {{day}}",
  },

  accounts: {
    title: "Accounts & Cards",
    back: "← Back",
    intro:
      "Manage your bank accounts and credit cards. Optionally store an Open Finance API key per account to keep transactions in sync automatically. For credit cards, set the closing day so the dashboard groups transactions by the right monthly bill.",
    loading: "Loading accounts…",
    empty: "No accounts yet — add a bank account or card to get started.",
    addNew: "Add account or card",
    newTitle: "New account or card",
    nameLabel: "Name",
    namePlaceholder: "e.g. Nubank Roxinho",
    typeLabel: "Type",
    type: {
      bank: "Bank",
      card: "Card",
    },
    closingDayLabel: "Closing day",
    closingDayHint:
      "Day of the month when the credit card statement closes. Transactions made after this day roll into the next month's bill. Defaults to 30.",
    apiKeyLabel: "Open Finance API key",
    apiKeyHint:
      "Stored encrypted (AES-256-GCM). Used only by the sync worker; never returned in API responses.",
    apiKeyPlaceholder: "Paste your provider key (e.g. Pierre Finance)",
    apiKeyKeepCurrent: "Leave empty to keep current key",
    apiKeyConfigured: "configured",
    apiKeyNotSet: "not set",
    apiKeyRemove: "Remove key",
    apiKeyExpired: "expired",
    apiKeyActive: "active",
    apiKeyAppliesToExpired: "This Pierre key will be saved on all expired Open Finance accounts.",
    apiKeyExpiredBanner: "Open Finance key expired",
    apiKeyExpiredBody:
      "Sync has stopped for {{names}}. Generate a new Pierre API key, then paste it on the account.",
    getNewPierreKey: "Get new Pierre key",
    pasteKeyOnAccount: "Paste key on account",
    saveKey: "Save key",
    edit: "Edit",
    delete: "Delete",
    save: "Save changes",
    cancel: "Cancel",
    create: "Create",
    deleteConfirm: 'Delete "{{name}}"? This will not remove past transactions.',
  },

  reminders: {
    title: "Payment Reminders",
    back: "Back",
    intro:
      "Upcoming bills for this month and the next eleven. Anyone can mark an occurrence as paid. You get a push on the due day at the time you choose.",
    formIntro:
      "Pick the first due date and how often it repeats. Monthly and yearly dates on the 31st fall on the last day of shorter months.",
    loading: "Loading reminders…",
    empty: "No upcoming bills — add rent, utilities, or a one-off payment.",
    notifyTime: "Notification time",
    notifyTimeHint: "America/São Paulo. Applies to every reminder on its due day.",
    saveTime: "Save time",
    paid: "Paid",
    unpaid: "Unpaid",
    paidOn: "Paid ({{who}})",
    name: "Name",
    startDate: "First due date",
    recurrence: "Repeats",
    recurrenceOnce: "Once",
    recurrenceMonthly: "Monthly",
    recurrenceYearly: "Yearly",
    edit: "Edit",
    editSeries: "Edit reminder",
    editTitle: "Edit reminder",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    create: "Add reminder",
    newTitle: "New reminder",
    namePlaceholder: "e.g. Rent",
    deleteConfirm: 'Delete "{{name}}"? All upcoming occurrences and payment history will be removed.',
    saveFailed: "Could not save reminder",
    membersReadOnly: "Only family admins can add or edit reminders.",
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
      phase14Title: "Bank Accounts & Cards Management",
      phase14Desc:
        "First-class accounts and cards: each transaction can be tied to a bank account or credit card. Cards have a closing day (vencimento, default 30) so transactions are bucketed into the correct monthly bill window. Per-account Open Finance API keys are stored encrypted with AES-256-GCM and only decrypted inside the sync worker — the frontend only ever sees a last-4 hint. Pierre sync iterates every account with a key, supporting multiple banks and cards in parallel.",
      phase15Title: "Open Finance Key Reconnect",
      phase15Desc:
        "When Pierre reports an expired or invalid API key, the account is flagged and a dashboard banner asks you to generate a new key on Pierre and paste it back into Accounts. Saving a new key clears the flag and resumes the 5-minute sync.",
      phase16Title: "Limit Breach Push Notifications",
      phase16Desc:
        "The iOS app can alert you when a category with a spending limit reaches a threshold you choose (default 80%). Pierre's 5-minute sync checks current spend and sends a push once per category per month, so you are not spammed while it stays over the line.",
      phase17Title: "Unmatched Transactions Stay Uncategorized",
      phase17Desc:
        "Open Finance categories from Pierre are no longer imported as new Aletheia categories. If a transaction does not match one of your keyword rules, it stays in Sem Categoria. Opening a month re-applies the rules so older Pierre labels collapse into that bucket unless a keyword matches.",
      phase18Title: "Account Deletion & Sign in with Apple",
      phase18Desc:
        "iOS offers Sign in with Apple next to Google (App Store Guideline 4.8). Google and Apple logins that share an email become one Aletheia user. You can permanently delete your account from the side menu: personal data is removed, and a family you own is transferred to another member or dissolved.",
      phase19Title: "Family Admins",
      phase19Desc:
        "Owners and admins can invite or remove members, edit categories, hide transactions, and manage accounts. Swipe right on a member in the iOS family list (or tap Make admin on the web) to promote them. Only the owner can delete the family.",
      phase20Title: "Email Sign-In for App Review",
      phase20Desc:
        "The login screen accepts email and password in addition to Apple and Google. A demo account is seeded with sample months so App Review can open the dashboard without an OAuth account. Everyday users still sign in with Apple or Google; email login is not a public sign-up.",
      phase21Title: "Payment Reminders",
      phase21Desc:
        "Family admins can add recurring bills with a name and day of the month. Everyone can mark a month as paid, and history stays available. On the due day you get a push at the time you choose.",
      phase22Title: "Reminder Recurrence",
      phase22Desc:
        "Reminders now have a first due date and repeat once, every month, or every year. The list shows each upcoming occurrence across the next months so you can mark that date paid. Creating or editing a reminder is a separate screen from the occurrence list.",
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
