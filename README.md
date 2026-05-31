# Meu Extrato (Aletheia)

Categorize automaticamente seus extratos bancários e faturas de cartão do Nubank.

## Funcionalidades

- Upload de CSV (arraste ou selecione)
- Detecção automática: extrato bancário vs fatura de cartão
- Categorização automática por palavra-chave
- Gráfico de pizza com distribuição de gastos
- Tabela agrupada por categoria com subtotais
- Resumo: entradas, saídas e saldo

## Desenvolvimento

```bash
cd web
npm install
npm run dev
```

## Deploy

Push para `main` — GitHub Actions faz deploy automático do app web no GitHub Pages (alterações em `web/**`).

Epics e tarefas planejadas: [`docs/epics/`](docs/epics/).
