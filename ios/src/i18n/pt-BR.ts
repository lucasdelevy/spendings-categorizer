const ptBR = {
  app: {
    title: "Aletheia",
    categories: "Categorias",
    accounts: "Contas e Cartões",
    reminders: "Lembretes de pagamento",
    family: "Família",
    manageMonths: "Gerenciar Meses",
    about: "Sobre Aletheia",
    dashboard: "Painel",
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
    makeAdmin: "Erro ao promover membro",
    deleteFamily: "Erro ao excluir família",
    readFile: "Falha ao ler {{fileName}}",
    createAccount: "Erro ao criar conta",
    updateAccount: "Erro ao atualizar conta",
    deleteAccount: "Erro ao excluir conta",
    assignAccount: "Erro ao associar conta",
  },

  login: {
    subtitle: "Faça login para salvar e visualizar seus extratos",
    loading: "Carregando...",
    googleSignIn: "Entrar com o Google",
    googleFailed: "Falha no login do Google",
    appleFailed: "Falha no login da Apple",
    orEmail: "ou e-mail",
    email: "E-mail",
    password: "Senha",
    emailSignIn: "Entrar com e-mail",
    emailFailed: "E-mail ou senha inválidos",
  },

  account: {
    delete: "Excluir conta",
    deleteTitle: "Excluir sua conta?",
    deleteConfirm: "Excluir conta",
    deleteCancel: "Cancelar",
    deleteFailed: "Não foi possível excluir a conta",
    deleteConfirmBody:
      "Isso apaga de forma permanente seu perfil, extratos, categorias, contas e tokens de dispositivo. Se você for dono de uma família e houver outro membro, ele vira o dono. Se você for o único membro, a família é removida. Não dá para desfazer.",
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
    deleteConfirmTitle: 'Excluir categoria "{{name}}"?',
    deleteConfirmBody:
      "A categoria será removida da sua configuração. A exclusão é aplicada quando você clica em Salvar Alterações.",
    deleteConfirmRecategorize:
      "Todas as transações atualmente nesta categoria serão reavaliadas com as keywords restantes. O que não corresponder mais cairá em \"Sem Categoria\".",
    deleteCancel: "Cancelar",
    deleteConfirmAction: "Excluir",
    noKeywords: "Nenhuma keyword adicionada",
    newKeyword: "Nova keyword...",
    newCategory: "Nova categoria...",
    createCategory: "Criar Categoria",
    keywordsCount: "{{count}} keywords",
    color: "Cor",
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
    alertThreshold: "Alertar em % do limite",
    alertThresholdHint:
      "Você receberá um push quando uma categoria com limite de gasto atingir este percentual. O padrão é 80.",
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
    admin: "Admin",
    member: "Membro",
    makeAdmin: "Tornar admin",
    madeAdmin: "{{email}} agora é admin",
    swipeHint: "Deslize para a direita em um membro para torná-lo admin, ou para a esquerda para removê-lo.",
    managersOnly: "Somente donos e admins da família podem editar isto.",
    deleteFamily: "Excluir família",
    deleteFamilyConfirm:
      "Isso apaga a família para todos: extratos, categorias e contas compartilhados. Os membros mantêm as contas pessoais. Continuar?",
    deleted: "Família excluída",
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
    tabBank: "Extratos Bancários",
    tabCard: "Faturas de Cartão",
    tabOpenFinance: "Open Finance",
    noStatements: "Nenhum extrato salvo ainda.",
    period: "Período",
    owner: "Dono",
    date: "Data",
    expenses: "Gastos",
    transactions: "Transações",
    file: "Arquivo",
    account: "Conta",
    unassigned: "— Sem conta —",
    noMatchingAccount: "Nenhuma conta compatível",
    mixedAccounts: "Misto",
    mixedAccountsHint:
      "Este extrato contém transações vinculadas a mais de uma conta. Reatribua com cuidado — todas as transações irão para a conta escolhida.",
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
    assignAccounts: "Associe cada arquivo a uma conta",
    noAccount: "— Sem conta —",
    noAccountsHint:
      "Cadastre contas em 'Contas e Cartões' para habilitar a associação por conta.",
    noMatchingAccount: "Nenhuma conta de {{type}} cadastrada",
    closingDayShort: "fecha dia {{day}}",
  },

  accounts: {
    title: "Contas e Cartões",
    back: "← Voltar",
    intro:
      "Gerencie suas contas bancárias e cartões de crédito. Opcionalmente armazene uma chave de API de Open Finance por conta para manter as transações sincronizadas automaticamente. Para cartões, defina o dia de fechamento para que o painel agrupe as transações pela fatura correta do mês.",
    loading: "Carregando contas…",
    empty:
      "Nenhuma conta cadastrada — adicione uma conta bancária ou cartão para começar.",
    addNew: "Adicionar conta ou cartão",
    newTitle: "Nova conta ou cartão",
    nameLabel: "Nome",
    namePlaceholder: "ex: Nubank Roxinho",
    typeLabel: "Tipo",
    type: {
      bank: "Banco",
      card: "Cartão",
    },
    closingDayLabel: "Dia de fechamento",
    closingDayHint:
      "Dia do mês em que o cartão fecha a fatura. Compras feitas após este dia entram na fatura do mês seguinte. Padrão: 30.",
    apiKeyLabel: "Chave de API Open Finance",
    apiKeyHint:
      "Armazenada criptografada (AES-256-GCM). Usada apenas pelo worker de sincronização; nunca retornada nas respostas da API.",
    apiKeyPlaceholder: "Cole a chave do provedor (ex: Pierre Finance)",
    apiKeyKeepCurrent: "Deixe vazio para manter a chave atual",
    apiKeyConfigured: "configurada",
    apiKeyNotSet: "não definida",
    apiKeyRemove: "Remover chave",
    apiKeyExpired: "expirada",
    apiKeyActive: "ativa",
    apiKeyAppliesToExpired: "Esta chave Pierre será salva em todas as contas Open Finance expiradas.",
    apiKeyExpiredBanner: "Chave Open Finance expirada",
    apiKeyExpiredBody:
      "A sincronização parou para {{names}}. Gere uma nova chave na Pierre e cole-a na conta.",
    getNewPierreKey: "Gerar nova chave Pierre",
    pasteKeyOnAccount: "Colar chave na conta",
    saveKey: "Salvar chave",
    edit: "Editar",
    delete: "Excluir",
    save: "Salvar alterações",
    cancel: "Cancelar",
    create: "Criar",
    deleteConfirm:
      'Excluir "{{name}}"? Isso não removerá as transações já importadas.',
  },

  reminders: {
    title: "Lembretes de pagamento",
    back: "Voltar",
    intro:
      "Acompanhe contas recorrentes pelo dia do mês. Admins da família criam e editam lembretes. Qualquer membro pode marcar o mês como pago. O aviso chega no dia do vencimento, no horário que você escolher.",
    loading: "Carregando lembretes…",
    empty: "Nenhum lembrete ainda — adicione aluguel, contas ou assinaturas.",
    notifyTime: "Horário da notificação",
    notifyTimeHint: "Horário de Brasília. Vale para todos os lembretes no dia do vencimento.",
    saveTime: "Salvar horário",
    month: "Mês",
    paid: "Pago",
    unpaid: "Em aberto",
    paidOn: "Pago ({{who}})",
    dayLabel: "Vence no dia {{day}}",
    dayOfMonth: "Dia do mês",
    edit: "Editar",
    delete: "Excluir",
    save: "Salvar",
    cancel: "Cancelar",
    create: "Adicionar lembrete",
    newTitle: "Novo lembrete",
    namePlaceholder: "ex. Aluguel",
    deleteConfirm: 'Excluir "{{name}}"? O histórico deste lembrete será apagado.',
    showHistory: "Ver meses anteriores",
    hideHistory: "Ocultar meses anteriores",
    saveFailed: "Não foi possível salvar o lembrete",
    membersReadOnly: "Só admins da família podem criar ou editar lembretes.",
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
    tag: "Categorizar",
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
      phase14Title: "Gerenciamento de Contas e Cartões",
      phase14Desc:
        "Contas e cartões agora são entidades de primeira classe: cada transação pode ser vinculada a uma conta bancária ou cartão de crédito. Cartões têm um dia de fechamento (vencimento, padrão 30) para que as transações sejam agrupadas na fatura mensal correta. Chaves de API Open Finance por conta são armazenadas criptografadas com AES-256-GCM e descriptografadas apenas dentro do worker de sincronização — o frontend só vê os últimos 4 caracteres como dica. A sincronização Pierre itera por todas as contas com chave, suportando múltiplos bancos e cartões em paralelo.",
      phase15Title: "Reconexão da chave Open Finance",
      phase15Desc:
        "Quando a Pierre informa que a chave de API expirou ou é inválida, a conta é marcada e um aviso no dashboard pede para gerar uma nova chave no site da Pierre e colá-la em Contas. Salvar a chave nova limpa o aviso e retoma a sincronização a cada 5 minutos.",
      phase16Title: "Notificações de limite de gasto",
      phase16Desc:
        "O app iOS pode avisar quando uma categoria com limite de gasto atinge um percentual que você escolhe (padrão 80%). A sincronização da Pierre a cada 5 minutos confere o gasto atual e envia um push uma vez por categoria por mês, para não repetir o alerta enquanto o gasto continuar acima da linha.",
      phase17Title: "Sem match fica Sem Categoria",
      phase17Desc:
        "As categorias da Open Finance da Pierre deixam de ser importadas como categorias novas no Aletheia. Se a transação não casar com uma keyword sua, ela fica em Sem Categoria. Abrir o mês reaplica as regras, então rótulos antigos da Pierre caem nesse bucket a menos que uma keyword case.",
      phase18Title: "Exclusão de conta e Sign in with Apple",
      phase18Desc:
        "No iOS, o Sign in with Apple aparece junto com o Google (diretriz 4.8 da App Store). Logins Google e Apple com o mesmo e-mail viram o mesmo usuário no Aletheia. Você pode excluir a conta de forma permanente no menu lateral: os dados pessoais são apagados, e uma família da qual você é dono é transferida para outro membro ou dissolvida.",
      phase19Title: "Admins da família",
      phase19Desc:
        "Donos e admins podem convidar ou remover membros, editar categorias, ocultar transações e gerenciar contas. No iOS, deslize para a direita em um membro na lista da família (ou toque em Tornar admin na web) para promovê-lo. Só o dono pode excluir a família.",
      phase20Title: "Login por e-mail para a App Review",
      phase20Desc:
        "A tela de login aceita e-mail e senha além de Apple e Google. Uma conta de demonstração já vem com meses de exemplo para a App Review abrir o dashboard sem OAuth. No dia a dia o login continua sendo Apple ou Google; e-mail não é cadastro público.",
      phase21Title: "Lembretes de pagamento",
      phase21Desc:
        "Admins da família cadastram contas recorrentes com nome e dia do mês. Qualquer membro marca o mês como pago, e o histórico fica guardado. No vencimento chega um push no horário que você escolher.",
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
