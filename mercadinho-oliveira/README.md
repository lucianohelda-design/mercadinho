# Mercadinho Oliveira v2.0

Sistema próprio para uso no celular com Render.com + Supabase.

## O que esta versão inclui

### PDV
- Venda por código de barras ou nome.
- Carrinho estilo supermercado.
- Alteração de quantidade.
- Desconto por item e desconto geral da venda.
- Cancelamento de item.
- Troco automático.
- Venda rápida.
- Venda fiado vinculada ao cliente.

### Dashboard
- Vendas do dia.
- Faturamento do mês.
- Lucro estimado.
- Produtos em falta e estoque baixo.
- Clientes devendo.
- Gráfico simples de vendas.

### Financeiro
- Caixa diário.
- Abertura e fechamento de caixa.
- Sangria.
- Suprimento.
- Contas a pagar.
- Contas a receber.
- Fluxo de caixa do dia.

### Clientes
- Cadastro de clientes.
- Controle de fiado.
- Histórico de compras.
- Quitação de fiados.

## Atualização no Supabase

Antes de usar a versão v2.0, abra o Supabase:

1. Vá em **SQL Editor**.
2. Abra o arquivo `supabase/schema.sql` deste projeto.
3. Copie tudo.
4. Cole no SQL Editor.
5. Clique em **Run**.

O SQL foi feito para atualizar seu banco sem apagar os dados antigos.

## Atualização no Render

1. Extraia este ZIP.
2. Substitua os arquivos no seu repositório do GitHub.
3. Faça commit e push.
4. No Render, clique em **Manual Deploy → Clear build cache & deploy**.

## Variáveis do Render

No Render, mantenha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://argisvpfarosasxpmdyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publishable_ou_anon_public
```

Nunca coloque `sb_secret_...` no frontend ou no GitHub.

## Observações

- Para a câmera funcionar, use o link HTTPS do Render.
- Para vender fiado, cadastre o cliente antes.
- Para o caixa registrar vendas, abra o caixa na tela Financeiro antes de começar o dia.
- O Render gratuito pode demorar a abrir se o serviço estiver dormindo.
