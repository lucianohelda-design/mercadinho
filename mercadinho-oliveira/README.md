# Mercadinho Oliveira v2.2

Sistema próprio para uso no celular com Render.com + Supabase.

## O que foi corrigido nesta versão

- Correção da finalização de venda feita por código de barras.
- O total da venda agora é recalculado no banco, usando os itens vendidos.
- O relatório passa a recuperar vendas antigas que ficaram com total zerado.
- O SQL corrige vendas antigas em que apareceu lucro, mas não apareceu o valor total da venda.
- Scanner com proteção contra leitura duplicada do mesmo código.
- Validação de estoque, preço, quantidade, desconto e forma de pagamento.
- Correção no cliente Supabase para evitar erro de build quando as variáveis ainda não estão preenchidas localmente.

## Como atualizar

1. Extraia este ZIP.
2. Substitua os arquivos antigos no seu repositório do GitHub.
3. No Supabase, abra **SQL Editor**.
4. Copie todo o conteúdo de `supabase/schema.sql` e execute.
5. No Render, clique em **Manual Deploy → Clear build cache & deploy**.

## Variáveis no Render

No Render, mantenha estas variáveis em **Environment**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://argisvpfarosasxpmdyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wF9tzJBU3qNPft-hrsnyqg_REI97Yej
```

Não use chave `sb_secret` no Render público do frontend.

## Build Command

```bash
npm install && npm run build
```

## Start Command

```bash
npm start
```

## Observação importante

Execute o arquivo `supabase/schema.sql` desta versão. Ele não apaga seus dados; ele apenas cria/atualiza tabelas, recria a função de finalizar venda e corrige vendas antigas com total zerado.
