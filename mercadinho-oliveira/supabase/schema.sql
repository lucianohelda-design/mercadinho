create extension if not exists pgcrypto;

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo_barras text unique,
  preco_custo numeric(10,2) default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque numeric(12,3) default 0,
  estoque_minimo numeric(12,3) default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  created_at timestamptz default now()
);

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  total numeric(10,2) not null default 0,
  forma_pagamento text not null,
  cliente_nome text,
  created_at timestamptz default now()
);

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id),
  quantidade numeric(12,3) not null,
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  created_at timestamptz default now()
);

create table if not exists fiados (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  valor numeric(10,2) not null,
  status text default 'aberto',
  venda_id uuid references vendas(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_produtos_codigo on produtos(codigo_barras);
create index if not exists idx_produtos_nome on produtos(nome);
create index if not exists idx_vendas_data on vendas(created_at desc);
create index if not exists idx_fiados_status on fiados(status);

alter table produtos enable row level security;
alter table clientes enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;
alter table fiados enable row level security;

drop policy if exists "usuarios autenticados podem gerenciar produtos" on produtos;
drop policy if exists "usuarios autenticados podem gerenciar clientes" on clientes;
drop policy if exists "usuarios autenticados podem gerenciar vendas" on vendas;
drop policy if exists "usuarios autenticados podem gerenciar itens" on itens_venda;
drop policy if exists "usuarios autenticados podem gerenciar fiados" on fiados;

create policy "usuarios autenticados podem gerenciar produtos" on produtos for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar clientes" on clientes for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar vendas" on vendas for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar itens" on itens_venda for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar fiados" on fiados for all to authenticated using (true) with check (true);

-- Produto de teste. Pode apagar depois.
insert into produtos (nome, codigo_barras, preco_custo, preco_venda, estoque, estoque_minimo)
values ('Produto Teste', '7890000000000', 5.00, 8.00, 10, 2)
on conflict (codigo_barras) do nothing;
