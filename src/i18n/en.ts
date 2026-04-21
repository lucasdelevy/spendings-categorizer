const en = {
  app: {
    title: "Aletheia",
    subtitle: "Reveal what was concealed",
    categories: "Categories",
    family: "Family",
    manageMonths: "Manage Months",
    logout: "Sign Out",
    uploadStatements: "Upload my statements",
    uploadOverlayDescription:
      "Upload your statements for this month. They will be combined with other members' statements.",
    cancel: "Cancel",
    spendingByCategory: "Spending by Category",
    transactions: "Transactions",
  },

  error: {
    processCsv: "Error processing CSV",
    delete: "Error deleting",
    recategorize: "Error recategorizing",
    rename: "Error renaming",
    ignoreTransaction: "Error ignoring transaction",
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
  },

  table: {
    date: "Date",
    source: "Source",
    payee: "Payee",
    merchant: "Merchant",
    installment: "Installment",
    amount: "Amount",
    actions: "Actions",
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

  sidebar: {
    settings: "Settings",
    language: "Language",
    darkMode: "Dark mode",
    navigation: "Navigation",
  },

  filters: {
    title: "Filters",
    clear: "Clear filters",
    amount: "Amount (R$)",
    min: "Min",
    max: "Max",
    date: "Date",
    member: "Member",
  },
} as const;

export default en;
