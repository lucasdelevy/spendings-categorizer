const ptBR = {
  app: {
    title: "Aletheia",
    categories: "Categorias",
    family: "Família",
    manageMonths: "Gerenciar Meses",
    about: "Sobre Aletheia",
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
    tabAllTransactions: "Todas",
    tabByCategory: "Por Categoria",
    transactions: "Transações",
  },

  error: {
    processCsv: "Erro ao processar CSV",
    delete: "Erro ao excluir",
    recategorize: "Erro ao recategorizar",
    rename: "Erro ao renomear",
    ignoreTransaction: "Erro ao ignorar transação",
    hideTransaction: "Erro ao ocultar transação",
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
    limit: "Limite de Gasto",
    limitAmount: "Valor limite",
    limitPeriod: "Período",
    limitDaily: "Diário",
    limitWeekly: "Semanal",
    limitMonthly: "Mensal",
    setLimit: "Definir limite",
    removeLimit: "Remover limite",
    limitPerDay: "{{amount}}/dia",
    limitPerWeek: "{{amount}}/semana",
    limitPerMonth: "{{amount}}/mês",
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
    hidden: "Ocultas",
    limitsExceeded: "Limites Excedidos",
  },

  table: {
    date: "Data",
    source: "Origem",
    payee: "Beneficiário",
    merchant: "Estabelecimento",
    category: "Categoria",
    installment: "Parcela",
    amount: "Valor",
    actions: "Ações",
    hide: "Ocultar",
    unhide: "Mostrar",
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

  about: {
    title: "Sobre a Aletheia",
    back: "← Voltar",
    nameTitle: "Por que \"Aletheia\"?",
    nameExplanation:
      "Na mitologia grega, Aletheia (ἀλήθεια) é o espírito da verdade e da revelação — literalmente \"des-ocultamento.\" A palavra vem de a-lethe: a negação de Lete, o rio do esquecimento no submundo. Alcançar Aletheia é lembrar o que foi esquecido, revelar o que estava oculto.",
    nameQuote:
      "Este app revela os padrões de gastos ocultos em extratos bancários e faturas de cartão — verdades que, sem exame, deslizam para as águas do Lete.",
    featureLogTitle: "Histórico de Funcionalidades",
    phase: "Fase {{number}}",
    features: {
      phase1Title: "Scripts Python",
      phase1Desc:
        "Scripts CLI para categorizar CSVs do Nubank (banco e cartão) com matching por keyword, listas de ignorar e renomeação de beneficiários.",
      phase2Title: "App React Estático",
      phase2Desc:
        "Migrado para app React + Vite no GitHub Pages. Todo processamento no cliente com gráficos de pizza e tabela de transações.",
      phase3Title: "Backend na Nuvem",
      phase3Desc:
        "Backend com AWS Lambda + DynamoDB e login com Google. Extratos persistem entre sessões com armazenamento por upsert.",
      phase31Title: "Soft-Delete e Gerenciamento de Meses",
      phase31Desc:
        "Extratos são excluídos logicamente (soft-delete). Adicionada página de Gerenciar Meses para visualizar, navegar e excluir períodos salvos.",
      phase4Title: "Compartilhamento Familiar",
      phase4Desc:
        "Múltiplos usuários compartilham gastos combinados via entidade Família. Uploads por usuário mesclados na leitura com atribuição por avatar.",
      phase5Title: "Gerenciamento de Categorias",
      phase5Desc:
        "Categorias, listas de ignorar e mapeamentos de renomeação armazenados por família no DynamoDB. Recategorização na tabela aprende keywords automaticamente.",
      phase6Title: "Filtros de Transações",
      phase6Desc:
        "Barra de filtros retrátil com faixa de valor, período e multi-seleção de membro. Filtros recalculam totais em tempo real.",
      phase7Title: "Modo Escuro e i18n",
      phase7Desc:
        "Modo escuro via classes Tailwind com detecção de preferência do sistema. Traduções completas em EN e PT-BR via react-i18next.",
      phase8Title: "Menu Lateral e Rebranding",
      phase8Desc:
        "Menu hamburger lateral, fundo com padrão de pontos, favicon customizado. Rebatizado para Aletheia com reflexo em grego espelhado.",
      phase9Title: "Ocultar/Mostrar Transações",
      phase9Desc:
        "Botão por transação que oculta a linha e a exclui dos totais, gráficos e subtotais por categoria. Contagem de ocultas exibida nos cabeçalhos de categoria e no resumo.",
      phase10Title: "Redesign do Navegador de Meses",
      phase10Desc:
        "Dropdown substituído por título centralizado do mês, setas de navegação e linha do tempo com pontos. Suporte a swipe no trackpad, gestos touch e setas do teclado. Cache em memória para troca instantânea de mês.",
      phase11Title: "Integração Pierre Open Finance",
      phase11Desc:
        "Sincronização automática de transações via API Pierre Finance a cada 5 minutos. Deduplicação entre fontes evita duplicação entre uploads CSV e dados do Open Finance. Cada transação exibe sua origem (API ou CSV).",
      phase12Title: "Limites de Gasto por Categoria",
      phase12Desc:
        "Defina limites de gasto diários, semanais ou mensais por categoria. Barras de progresso nos cabeçalhos de categoria mostram gasto vs orçamento com indicadores coloridos (verde/âmbar/vermelho). Banner no dashboard alerta quando limites são excedidos.",
      phase13Title: "Visão de Transações Plana & Correção de Ordenação",
      phase13Desc:
        "Nova aba \"Todas\" (padrão) no dashboard lista todas as transações do mês em uma única tabela ordenada por data (mais recentes primeiro), com coluna de categoria. A visão por categoria continua a um clique de distância. Também corrigida a ordenação por categoria que colocava transações antigas acima das mais recentes ao mesclar datas do banco (DD/MM/AAAA) e cartão (AAAA-MM-DD).",
      phase14Title: "Layout Mobile da Página de Categorias",
      phase14Desc:
        "Linhas da lista de categorias agora empilham verticalmente no mobile, dando largura total ao nome da categoria e à contagem de palavras-chave, enquanto os controles de limite e botões de ação ocupam uma segunda linha. Em telas maiores o layout permanece em linha única.",
    },
  },

  sidebar: {
    settings: "Configurações",
    language: "Idioma",
    darkMode: "Modo escuro",
    navigation: "Navegação",
  },

  limits: {
    ofLimit: "de {{limit}}",
    exceeded: "excedido",
    breachBanner: "{{count}} limite(s) de categoria excedido(s) neste mês",
    monthlyBudget: "Orçamento mensal: {{amount}}",
  },

  filters: {
    title: "Filtros",
    clear: "Limpar filtros",
    amount: "Valor (R$)",
    min: "Mín",
    max: "Máx",
    date: "Data",
    custom: "Personalizado",
    member: "Membro",
  },
} as const;

export default ptBR;
