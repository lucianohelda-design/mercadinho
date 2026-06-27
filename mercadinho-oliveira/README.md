# Mercadinho Oliveira v2.3.1

Versão corrigida para Render + Supabase.

## Correção desta versão

- Removido o `package-lock.json` que apontava para um registro interno inacessível no Render.
- Adicionado `.npmrc` apontando para o registro oficial do NPM.
- Node fixado em `20.x` para evitar instabilidade com versões muito novas.
- Mantidas as correções da v2.3: PDV, vendas por código de barras, totais nos relatórios, baixa de estoque e lucro.

## Render

Se o projeto estiver dentro da pasta `mercadinho-oliveira`, use:

Root Directory:
```
mercadinho-oliveira
```

Build Command:
```
npm install && npm run build
```

Start Command:
```
npm start
```

Se os arquivos estiverem direto na raiz do GitHub, deixe o Root Directory vazio.

## Supabase

Execute o arquivo:

```
supabase/schema.sql
```

no SQL Editor do Supabase.

## Variáveis de ambiente

No Render, configure:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publishable_ou_anon_public
```
