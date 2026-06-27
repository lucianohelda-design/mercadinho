# Mercadinho Oliveira v2.3

Versão corrigida do PDV para evitar que a venda fique carregando sem finalizar.

## O que mudou

- Finalização da venda passou a gravar diretamente nas tabelas do Supabase, sem depender apenas da função RPC.
- O botão não fica carregando para sempre: se houver erro ou demora, o sistema mostra a mensagem na tela.
- Revalidação de estoque no banco antes de concluir.
- Grava venda, itens, baixa no estoque, fiado/contas a receber e movimento do caixa.
- Mantém os relatórios com total e lucro estimado da venda.

## Como aplicar

1. Substitua os arquivos antigos no GitHub por estes arquivos.
2. Faça commit.
3. No Render, use **Manual Deploy → Deploy latest commit**.
4. Depois que ficar Live, abra o sistema e teste uma venda pequena.

## Supabase

Se você ainda não executou o SQL da v2.2, execute o arquivo `supabase/schema.sql` no SQL Editor. Se já executou, não precisa executar novamente para esta correção visual/lógica do PDV.
