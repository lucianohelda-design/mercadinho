# Mercadinho Oliveira

Sistema PWA mobile-first para mercadinho, preparado para publicar no **Render.com** e usar banco no **Supabase**.

## O que já vem pronto

- Login com Supabase Auth
- Dashboard
- Cadastro de produtos
- PDV com carrinho
- Leitura de código de barras pela câmera do celular
- Cadastro de clientes
- Venda no fiado
- Controle básico de estoque
- Relatórios simples
- PWA para instalar no Android
- Arquivo `render.yaml` para deploy no Render
- SQL pronto em `supabase/schema.sql`

## Estrutura

```txt
mercadinho-oliveira/
├── app/
│   ├── page.tsx              # Login
│   ├── app/page.tsx          # Dashboard
│   ├── produtos/page.tsx     # Produtos
│   ├── pdv/page.tsx          # Venda/PDV
│   ├── clientes/page.tsx     # Clientes e fiado
│   └── relatorios/page.tsx   # Relatórios
├── components/
│   ├── Nav.tsx
│   └── Scanner.tsx
├── lib/supabase.ts
├── public/icons/
├── supabase/schema.sql
├── render.yaml
├── package.json
└── .env.example
```

## 1. Criar o banco no Supabase

1. Acesse https://supabase.com
2. Crie um projeto gratuito
3. Vá em **SQL Editor**
4. Abra o arquivo `supabase/schema.sql`
5. Copie tudo e execute no Supabase

## 2. Criar usuário de login

No Supabase:

1. Vá em **Authentication**
2. Clique em **Users**
3. Clique em **Add user**
4. Informe e-mail e senha
5. Marque o e-mail como confirmado, se aparecer essa opção

## 3. Configurar as chaves

No Supabase:

1. Vá em **Project Settings > API**
2. Copie:
   - Project URL
   - anon public key

Use essas chaves no Render.

## 4. Publicar no Render.com

1. Crie uma conta em https://render.com
2. Envie esta pasta para um repositório no GitHub
3. No Render, clique em **New +**
4. Selecione **Blueprint** se quiser usar o `render.yaml`, ou **Web Service** manualmente
5. Conecte o repositório GitHub
6. Configure:

```txt
Build Command: npm install && npm run build
Start Command: npm start
```

7. Em **Environment Variables**, adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_public_do_supabase
NODE_VERSION=20
```

8. Clique em **Deploy**

Depois o sistema ficará em um link parecido com:

```txt
https://mercadinho-oliveira.onrender.com
```

## 5. Usar no celular

1. Abra o link do Render no Chrome do Android
2. Faça login com o usuário criado no Supabase
3. Cadastre produtos
4. Use o PDV
5. Para instalar como app: menu ⋮ > **Adicionar à tela inicial**

## Observações importantes

- A leitura pela câmera precisa de HTTPS. O Render fornece HTTPS no link `.onrender.com`.
- No plano gratuito do Render, o sistema pode dormir após tempo sem uso e demorar para abrir na primeira vez.
- Este MVP não emite NFC-e. Ele serve para controle interno de vendas, estoque, clientes e fiado.
- Para produção real, recomenda-se melhorar permissões por usuário, backup automático e finalização de venda por função transacional no banco.
