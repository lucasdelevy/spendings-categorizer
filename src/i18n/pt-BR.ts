const ptBR = {
  app: {
    title: "Aletheia",
    subtitle: "Revele o que estava oculto",
    categories: "Categorias",
    family: "Família",
    manageMonths: "Gerenciar Meses",
    logout: "Sair",
    uploadStatements: "Enviar meus extratos",
    uploadOverlayDescription:
      "Envie seus extratos para este mês. Eles serão combinados com os dos outros membros.",
    cancel: "Cancelar",
    spendingByCategory: "Gastos por Categoria",
    dailySpending: "Gastos Diários",
    cumulative: "Acumulado",
    tabCategory: "Por Categoria",
    tabDaily: "Por Dia",
    transactions: "Transações",
  },

  error: {
    processCsv: "Erro ao processar CSV",
    delete: "Erro ao excluir",
    recategorize: "Erro ao recategorizar",
    rename: "Erro ao renomear",
    ignoreTransaction: "Erro ao ignorar transação",
    save: "Erro ao salvar",
    createFamily: "Erro ao criar família",
    addMember: "Erro ao adicionar membro",
    removeMember: "Erro ao remover membro",
    readFile: "Falha ao ler {{fileName}}",
  },

  login: {
    subtitle: "Faça login para salvar e visualizar seus extratos",
    loading: "Carregando...",
  },

  categories: {
    title: "Categorias",
    back: "← Voltar",
    saving: "Salvando...",
    saveChanges: "Salvar Alterações",
    add: "Adicionar",
    sectionCategories: "Categorias",
    sectionIgnore: "Ignorar",
    sectionRename: "Renomear",
    renamePrompt: "Renomear categoria:",
    renameTitle: "Renomear",
    deleteTitle: "Excluir",
    deleteConfirm: 'Excluir categoria "{{name}}"?',
    noKeywords: "Nenhuma keyword adicionada",
    newKeyword: "Nova keyword...",
    newCategory: "Nova categoria...",
    createCategory: "Criar Categoria",
    keywordsCount: "{{count}} keywords",
    ignoreDescription:
      "Transações que contenham qualquer destes termos serão ignoradas ao processar o CSV.",
    noIgnoreFilters: "Nenhum filtro de ignorar",
    newIgnorePattern: "Novo padrão para ignorar...",
    renameDescription:
      "Mapeamentos para normalizar nomes de beneficiários/estabelecimentos.",
    noMappings: "Nenhum mapeamento",
    originalName: "Nome original...",
    displayName: "Nome exibido...",
  },

  family: {
    title: "Família",
    back: "Voltar",
    created: "Família criada!",
    inviteSent: "Convite enviado para {{email}}",
    memberRemoved: "Membro removido",
    createTitle: "Criar uma família",
    createDescription:
      "Crie uma família para compartilhar gastos com outras pessoas. Cada membro pode enviar seus próprios extratos e todos verão um resumo combinado.",
    namePlaceholder: "Nome da família (ex: Casa)",
    create: "Criar",
    members: "Membros ({{count}})",
    pending: "Pendente",
    owner: "Dono",
    removeTitle: "Remover",
    addMember: "Adicionar membro",
    addMemberDescription:
      "O membro será vinculado automaticamente na próxima vez que fizer login com o Google.",
    emailPlaceholder: "Email do membro",
    addButton: "Adicionar",
  },

  manage: {
    title: "Gerenciar Meses",
    back: "Voltar",
    noStatements: "Nenhum extrato salvo ainda.",
    period: "Período",
    owner: "Dono",
    date: "Data",
    expenses: "Gastos",
    transactions: "Transações",
    file: "Arquivo",
    view: "Visualizar",
    deleteTitle: "Excluir",
  },

  month: {
    new: "(novo)",
  },

  uploader: {
    dragOrSelect: "Arraste todos os CSVs de uma vez ou",
    select: "selecione",
    autoDetect:
      "Extratos bancários e faturas de cartão — detectados automaticamente",
    bank: "Banco",
    card: "Cartão",
    loaded: "carregado",
    dragCsv: "Arraste seu arquivo CSV aqui ou",
    nubankCsv: "Extrato Nubank (.csv)",
  },

  save: {
    detectedMonth: "Mês detectado:",
    saving: "Salvando...",
    save: "Salvar",
  },

  summary: {
    totalExpenses: "Total Gastos",
    credits: "Créditos",
    totalBill: "Total Fatura",
    transactionsCount: "{{count}} transações",
    income: "Entradas",
    expenses: "Saídas",
    balance: "Saldo",
    transactions: "Transações",
  },

  table: {
    date: "Data",
    source: "Origem",
    payee: "Beneficiário",
    merchant: "Estabelecimento",
    installment: "Parcela",
    amount: "Valor",
    actions: "Ações",
    bank: "Banco",
    card: "Cartão",
    noResults: "Nenhuma transação encontrada com os filtros selecionados.",
  },

  modal: {
    recategorize: "Recategorizar",
    rename: "Renomear",
    ignore: "Ignorar",
    applyToSimilar: "Aplicar a transações similares",
    createNewCategory: "+ Criar nova categoria",
    categoryName: "Nome da categoria",
    createAndMove: "Criar e mover",
    originalDescription: "Descrição original",
    newDisplayName: "Novo nome de exibição",
    renameHint:
      "Importações futuras com a mesma descrição usarão este nome.",
    renameButton: "Renomear",
    ignoreWarning:
      "Ao ignorar, esta transação será removida do extrato salvo e a descrição será adicionada à lista de ignorados. Importações futuras com a mesma descrição serão automaticamente ignoradas.",
    descriptionToIgnore: "Descrição a ignorar",
    confirmAndRemove: "Confirmar e remover",
  },

  sidebar: {
    settings: "Configurações",
    language: "Idioma",
    darkMode: "Modo escuro",
    navigation: "Navegação",
  },

  filters: {
    title: "Filtros",
    clear: "Limpar filtros",
    amount: "Valor (R$)",
    min: "Mín",
    max: "Máx",
    date: "Data",
    member: "Membro",
  },
} as const;

export default ptBR;
