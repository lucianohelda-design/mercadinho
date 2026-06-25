-- Mercadinho Oliveira v2.0
-- Pode ser executado novamente no SQL Editor do Supabase sem apagar seus dados.
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

alter table produtos add column if not exists categoria text;
alter table produtos add column if not exists updated_at timestamptz default now();

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  created_at timestamptz default now()
);
alter table clientes add column if not exists limite_fiado numeric(12,2) default 0;
alter table clientes add column if not exists ativo boolean default true;
alter table clientes add column if not exists updated_at timestamptz default now();

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  total numeric(10,2) not null default 0,
  forma_pagamento text not null,
  cliente_nome text,
  created_at timestamptz default now()
);
alter table vendas add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table vendas add column if not exists subtotal numeric(12,2) default 0;
alter table vendas add column if not exists desconto numeric(12,2) default 0;
alter table vendas add column if not exists acrescimo numeric(12,2) default 0;
alter table vendas add column if not exists valor_recebido numeric(12,2) default 0;
alter table vendas add column if not exists troco numeric(12,2) default 0;
alter table vendas add column if not exists lucro_estimado numeric(12,2) default 0;
alter table vendas add column if not exists status text default 'finalizada';

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id),
  quantidade numeric(12,3) not null,
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  created_at timestamptz default now()
);
alter table itens_venda add column if not exists desconto numeric(12,2) default 0;
alter table itens_venda add column if not exists preco_custo_unitario numeric(12,2) default 0;
alter table itens_venda add column if not exists lucro numeric(12,2) default 0;

create table if not exists fiados (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  valor numeric(10,2) not null,
  status text default 'aberto',
  venda_id uuid references vendas(id) on delete set null,
  created_at timestamptz default now()
);
alter table fiados add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table fiados add column if not exists valor_original numeric(12,2);
alter table fiados add column if not exists valor_aberto numeric(12,2);
alter table fiados add column if not exists descricao text;
alter table fiados add column if not exists updated_at timestamptz default now();
update fiados set valor_original = coalesce(valor_original, valor), valor_aberto = coalesce(valor_aberto, valor) where valor_original is null or valor_aberto is null;

create table if not exists pagamentos_fiado (
  id uuid primary key default gen_random_uuid(),
  fiado_id uuid references fiados(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  valor numeric(12,2) not null default 0,
  forma_pagamento text default 'dinheiro',
  created_at timestamptz default now()
);

create table if not exists caixas (
  id uuid primary key default gen_random_uuid(),
  status text default 'aberto',
  saldo_inicial numeric(12,2) default 0,
  saldo_final_informado numeric(12,2),
  saldo_final_sistema numeric(12,2),
  diferenca numeric(12,2),
  aberto_em timestamptz default now(),
  fechado_em timestamptz,
  created_at timestamptz default now()
);

create table if not exists movimentos_caixa (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid references caixas(id) on delete set null,
  tipo text not null,
  valor numeric(12,2) not null default 0,
  descricao text,
  venda_id uuid references vendas(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists contas_pagar (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12,2) not null default 0,
  vencimento date,
  status text default 'aberta',
  pago_em timestamptz,
  created_at timestamptz default now()
);

create table if not exists contas_receber (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12,2) not null default 0,
  vencimento date,
  status text default 'aberta',
  pago_em timestamptz,
  venda_id uuid references vendas(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_produtos_codigo on produtos(codigo_barras);
create index if not exists idx_produtos_nome on produtos(nome);
create index if not exists idx_produtos_categoria on produtos(categoria);
create index if not exists idx_vendas_data on vendas(created_at desc);
create index if not exists idx_vendas_cliente on vendas(cliente_id);
create index if not exists idx_fiados_status on fiados(status);
create index if not exists idx_mov_caixa_data on movimentos_caixa(created_at desc);
create index if not exists idx_contas_pagar_status on contas_pagar(status);
create index if not exists idx_contas_receber_status on contas_receber(status);

alter table produtos enable row level security;
alter table clientes enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;
alter table fiados enable row level security;
alter table pagamentos_fiado enable row level security;
alter table caixas enable row level security;
alter table movimentos_caixa enable row level security;
alter table contas_pagar enable row level security;
alter table contas_receber enable row level security;

drop policy if exists "usuarios autenticados podem gerenciar produtos" on produtos;
drop policy if exists "usuarios autenticados podem gerenciar clientes" on clientes;
drop policy if exists "usuarios autenticados podem gerenciar vendas" on vendas;
drop policy if exists "usuarios autenticados podem gerenciar itens" on itens_venda;
drop policy if exists "usuarios autenticados podem gerenciar fiados" on fiados;
drop policy if exists "usuarios autenticados podem gerenciar pagamentos fiado" on pagamentos_fiado;
drop policy if exists "usuarios autenticados podem gerenciar caixas" on caixas;
drop policy if exists "usuarios autenticados podem gerenciar movimentos caixa" on movimentos_caixa;
drop policy if exists "usuarios autenticados podem gerenciar contas pagar" on contas_pagar;
drop policy if exists "usuarios autenticados podem gerenciar contas receber" on contas_receber;

create policy "usuarios autenticados podem gerenciar produtos" on produtos for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar clientes" on clientes for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar vendas" on vendas for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar itens" on itens_venda for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar fiados" on fiados for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar pagamentos fiado" on pagamentos_fiado for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar caixas" on caixas for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar movimentos caixa" on movimentos_caixa for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar contas pagar" on contas_pagar for all to authenticated using (true) with check (true);
create policy "usuarios autenticados podem gerenciar contas receber" on contas_receber for all to authenticated using (true) with check (true);

create or replace function finalizar_venda(
  p_cliente_id uuid,
  p_cliente_nome text,
  p_forma_pagamento text,
  p_subtotal numeric,
  p_desconto numeric,
  p_total numeric,
  p_valor_recebido numeric,
  p_troco numeric,
  p_itens jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venda_id uuid;
  v_item record;
  v_saldo numeric;
  v_lucro_item numeric;
  v_lucro_total numeric := 0;
  v_caixa_id uuid;
  v_cliente_nome text;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Carrinho vazio';
  end if;

  if p_forma_pagamento = 'fiado' and p_cliente_id is null then
    raise exception 'Escolha o cliente para venda fiado';
  end if;

  if p_cliente_id is not null then
    select nome into v_cliente_nome from clientes where id = p_cliente_id;
  end if;
  v_cliente_nome := coalesce(v_cliente_nome, p_cliente_nome);

  insert into vendas (cliente_id, cliente_nome, forma_pagamento, subtotal, desconto, total, valor_recebido, troco, status)
  values (p_cliente_id, v_cliente_nome, p_forma_pagamento, p_subtotal, p_desconto, p_total, p_valor_recebido, p_troco, 'finalizada')
  returning id into v_venda_id;

  for v_item in select * from jsonb_to_recordset(p_itens) as x(produto_id uuid, nome text, quantidade numeric, preco_unitario numeric, preco_custo_unitario numeric, desconto numeric, subtotal numeric)
  loop
    update produtos
      set estoque = estoque - v_item.quantidade, updated_at = now()
      where id = v_item.produto_id and coalesce(estoque,0) >= v_item.quantidade
      returning estoque into v_saldo;

    if not found then
      raise exception 'Estoque insuficiente para o produto %', coalesce(v_item.nome, v_item.produto_id::text);
    end if;

    v_lucro_item := coalesce(v_item.subtotal,0) - (coalesce(v_item.quantidade,0) * coalesce(v_item.preco_custo_unitario,0));
    v_lucro_total := v_lucro_total + v_lucro_item;

    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario, preco_custo_unitario, desconto, subtotal, lucro)
    values (v_venda_id, v_item.produto_id, v_item.quantidade, v_item.preco_unitario, v_item.preco_custo_unitario, coalesce(v_item.desconto,0), v_item.subtotal, v_lucro_item);
  end loop;

  update vendas set lucro_estimado = v_lucro_total where id = v_venda_id;

  select id into v_caixa_id from caixas where status = 'aberto' order by aberto_em desc limit 1;
  if v_caixa_id is not null and p_forma_pagamento <> 'fiado' then
    insert into movimentos_caixa (caixa_id, tipo, valor, descricao, venda_id)
    values (v_caixa_id, 'venda', p_total, 'Venda ' || p_forma_pagamento, v_venda_id);
  end if;

  if p_forma_pagamento = 'fiado' then
    insert into fiados (cliente_id, cliente_nome, valor, valor_original, valor_aberto, status, venda_id, descricao)
    values (p_cliente_id, v_cliente_nome, p_total, p_total, p_total, 'aberto', v_venda_id, 'Venda fiado');

    insert into contas_receber (descricao, valor, status, venda_id, cliente_id)
    values ('Fiado - ' || coalesce(v_cliente_nome, 'cliente'), p_total, 'aberta', v_venda_id, p_cliente_id);
  end if;

  return jsonb_build_object('venda_id', v_venda_id, 'total', p_total, 'lucro_estimado', v_lucro_total);
end;
$$;

grant execute on function finalizar_venda(uuid,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) to authenticated;

insert into produtos (nome, codigo_barras, categoria, preco_custo, preco_venda, estoque, estoque_minimo)
values ('Produto Teste', '7890000000000', 'Geral', 5.00, 8.00, 10, 2)
on conflict (codigo_barras) do nothing;
