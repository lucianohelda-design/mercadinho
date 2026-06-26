-- Mercadinho Oliveira v2.2
-- Pode ser executado novamente no SQL Editor do Supabase sem apagar seus dados.
-- Esta versão reforça o fechamento da venda, corrige totais antigos zerados e mantém relatórios consistentes.
create extension if not exists pgcrypto;

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo_barras text unique,
  preco_custo numeric(12,2) default 0,
  preco_venda numeric(12,2) not null default 0,
  estoque numeric(12,3) default 0,
  estoque_minimo numeric(12,3) default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table produtos add column if not exists nome text;
alter table produtos add column if not exists codigo_barras text;
alter table produtos add column if not exists categoria text;
alter table produtos add column if not exists preco_custo numeric(12,2) default 0;
alter table produtos add column if not exists preco_venda numeric(12,2) default 0;
alter table produtos add column if not exists estoque numeric(12,3) default 0;
alter table produtos add column if not exists estoque_minimo numeric(12,3) default 0;
alter table produtos add column if not exists ativo boolean default true;
alter table produtos add column if not exists created_at timestamptz default now();
alter table produtos add column if not exists updated_at timestamptz default now();

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  created_at timestamptz default now()
);
alter table clientes add column if not exists nome text;
alter table clientes add column if not exists telefone text;
alter table clientes add column if not exists limite_fiado numeric(12,2) default 0;
alter table clientes add column if not exists ativo boolean default true;
alter table clientes add column if not exists created_at timestamptz default now();
alter table clientes add column if not exists updated_at timestamptz default now();

create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  total numeric(12,2) not null default 0,
  forma_pagamento text not null default 'dinheiro',
  cliente_nome text,
  created_at timestamptz default now()
);
alter table vendas add column if not exists total numeric(12,2) default 0;
alter table vendas add column if not exists forma_pagamento text default 'dinheiro';
alter table vendas add column if not exists cliente_nome text;
alter table vendas add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table vendas add column if not exists subtotal numeric(12,2) default 0;
alter table vendas add column if not exists desconto numeric(12,2) default 0;
alter table vendas add column if not exists acrescimo numeric(12,2) default 0;
alter table vendas add column if not exists valor_recebido numeric(12,2) default 0;
alter table vendas add column if not exists troco numeric(12,2) default 0;
alter table vendas add column if not exists lucro_estimado numeric(12,2) default 0;
alter table vendas add column if not exists status text default 'finalizada';
alter table vendas add column if not exists created_at timestamptz default now();

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid references vendas(id) on delete cascade,
  produto_id uuid references produtos(id),
  quantidade numeric(12,3) not null,
  preco_unitario numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz default now()
);
alter table itens_venda add column if not exists venda_id uuid references vendas(id) on delete cascade;
alter table itens_venda add column if not exists produto_id uuid references produtos(id);
alter table itens_venda add column if not exists quantidade numeric(12,3) default 0;
alter table itens_venda add column if not exists preco_unitario numeric(12,2) default 0;
alter table itens_venda add column if not exists subtotal numeric(12,2) default 0;
alter table itens_venda add column if not exists desconto numeric(12,2) default 0;
alter table itens_venda add column if not exists preco_custo_unitario numeric(12,2) default 0;
alter table itens_venda add column if not exists lucro numeric(12,2) default 0;
alter table itens_venda add column if not exists created_at timestamptz default now();

create table if not exists fiados (
  id uuid primary key default gen_random_uuid(),
  cliente_nome text not null,
  valor numeric(12,2) not null default 0,
  status text default 'aberto',
  venda_id uuid references vendas(id) on delete set null,
  created_at timestamptz default now()
);
alter table fiados add column if not exists cliente_nome text;
alter table fiados add column if not exists valor numeric(12,2) default 0;
alter table fiados add column if not exists status text default 'aberto';
alter table fiados add column if not exists venda_id uuid references vendas(id) on delete set null;
alter table fiados add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table fiados add column if not exists valor_original numeric(12,2);
alter table fiados add column if not exists valor_aberto numeric(12,2);
alter table fiados add column if not exists descricao text;
alter table fiados add column if not exists created_at timestamptz default now();
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
create index if not exists idx_itens_venda_venda on itens_venda(venda_id);
create index if not exists idx_fiados_status on fiados(status);
create index if not exists idx_mov_caixa_data on movimentos_caixa(created_at desc);
create index if not exists idx_contas_pagar_status on contas_pagar(status);
create index if not exists idx_contas_receber_status on contas_receber(status);

-- Corrige vendas antigas em que o total ficou zerado, usando a soma dos itens já gravados.
with totais as (
  select venda_id,
         round(sum(coalesce(subtotal,0)), 2) as subtotal_itens,
         round(sum(coalesce(lucro,0)), 2) as lucro_itens
  from itens_venda
  where venda_id is not null
  group by venda_id
)
update vendas v
set subtotal = case when coalesce(v.subtotal,0) = 0 then t.subtotal_itens else v.subtotal end,
    total = case when coalesce(v.total,0) = 0 then greatest(0, round(t.subtotal_itens - coalesce(v.desconto,0) + coalesce(v.acrescimo,0), 2)) else v.total end,
    lucro_estimado = case when coalesce(v.lucro_estimado,0) = 0 then t.lucro_itens else v.lucro_estimado end
from totais t
where v.id = t.venda_id
  and (coalesce(v.total,0) = 0 or coalesce(v.subtotal,0) = 0 or coalesce(v.lucro_estimado,0) = 0);

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
  v_produto record;
  v_preco_venda numeric(12,2);
  v_preco_custo numeric(12,2);
  v_desconto_item numeric(12,2);
  v_subtotal_item numeric(12,2);
  v_lucro_item numeric(12,2);
  v_subtotal_calc numeric(12,2) := 0;
  v_desconto_venda numeric(12,2) := 0;
  v_total_calc numeric(12,2) := 0;
  v_lucro_total numeric(12,2) := 0;
  v_troco_calc numeric(12,2) := 0;
  v_caixa_id uuid;
  v_cliente_nome text;
begin
  if p_itens is null or jsonb_array_length(p_itens) = 0 then
    raise exception 'Carrinho vazio';
  end if;

  if p_forma_pagamento not in ('dinheiro','pix','cartao_debito','cartao_credito','fiado') then
    raise exception 'Forma de pagamento inválida';
  end if;

  if p_forma_pagamento = 'fiado' and p_cliente_id is null then
    raise exception 'Escolha o cliente para venda fiado';
  end if;

  if p_cliente_id is not null then
    select nome into v_cliente_nome from clientes where id = p_cliente_id;
  end if;
  v_cliente_nome := coalesce(v_cliente_nome, p_cliente_nome);

  insert into vendas (cliente_id, cliente_nome, forma_pagamento, subtotal, desconto, total, valor_recebido, troco, status, lucro_estimado)
  values (p_cliente_id, v_cliente_nome, p_forma_pagamento, 0, 0, 0, coalesce(p_valor_recebido,0), 0, 'finalizada', 0)
  returning id into v_venda_id;

  for v_item in
    select * from jsonb_to_recordset(p_itens) as x(
      produto_id uuid,
      nome text,
      quantidade numeric,
      preco_unitario numeric,
      preco_custo_unitario numeric,
      desconto numeric,
      subtotal numeric
    )
  loop
    if v_item.produto_id is null then
      raise exception 'Produto inválido na venda';
    end if;
    if coalesce(v_item.quantidade,0) <= 0 then
      raise exception 'Quantidade inválida para o produto %', coalesce(v_item.nome, v_item.produto_id::text);
    end if;

    select * into v_produto from produtos where id = v_item.produto_id for update;
    if not found then
      raise exception 'Produto não encontrado: %', coalesce(v_item.nome, v_item.produto_id::text);
    end if;
    if coalesce(v_produto.ativo,true) = false then
      raise exception 'Produto inativo: %', v_produto.nome;
    end if;
    if coalesce(v_produto.estoque,0) < v_item.quantidade then
      raise exception 'Estoque insuficiente para o produto %. Estoque atual: %', v_produto.nome, coalesce(v_produto.estoque,0);
    end if;

    v_preco_venda := round(coalesce(nullif(v_item.preco_unitario,0), v_produto.preco_venda, 0), 2);
    v_preco_custo := round(coalesce(nullif(v_item.preco_custo_unitario,0), v_produto.preco_custo, 0), 2);
    v_desconto_item := least(round(v_item.quantidade * v_preco_venda, 2), greatest(0, round(coalesce(v_item.desconto,0), 2)));
    v_subtotal_item := round(greatest(0, (v_item.quantidade * v_preco_venda) - v_desconto_item), 2);
    v_lucro_item := round(v_subtotal_item - (v_item.quantidade * v_preco_custo), 2);

    update produtos
      set estoque = estoque - v_item.quantidade, updated_at = now()
      where id = v_item.produto_id;

    insert into itens_venda (venda_id, produto_id, quantidade, preco_unitario, preco_custo_unitario, desconto, subtotal, lucro)
    values (v_venda_id, v_item.produto_id, v_item.quantidade, v_preco_venda, v_preco_custo, v_desconto_item, v_subtotal_item, v_lucro_item);

    v_subtotal_calc := v_subtotal_calc + v_subtotal_item;
    v_lucro_total := v_lucro_total + v_lucro_item;
  end loop;

  v_desconto_venda := least(v_subtotal_calc, greatest(0, round(coalesce(p_desconto,0), 2)));
  v_total_calc := round(greatest(0, v_subtotal_calc - v_desconto_venda), 2);

  if p_forma_pagamento = 'dinheiro' and coalesce(p_valor_recebido,0) < v_total_calc then
    raise exception 'Valor recebido menor que o total da venda';
  end if;

  v_troco_calc := round(greatest(0, coalesce(p_valor_recebido,0) - v_total_calc), 2);

  update vendas
    set subtotal = v_subtotal_calc,
        desconto = v_desconto_venda,
        total = v_total_calc,
        valor_recebido = coalesce(p_valor_recebido,0),
        troco = v_troco_calc,
        lucro_estimado = v_lucro_total,
        status = 'finalizada'
    where id = v_venda_id;

  select id into v_caixa_id from caixas where status = 'aberto' order by aberto_em desc limit 1;
  if v_caixa_id is not null and p_forma_pagamento <> 'fiado' then
    insert into movimentos_caixa (caixa_id, tipo, valor, descricao, venda_id)
    values (v_caixa_id, 'venda', v_total_calc, 'Venda ' || p_forma_pagamento, v_venda_id);
  end if;

  if p_forma_pagamento = 'fiado' then
    insert into fiados (cliente_id, cliente_nome, valor, valor_original, valor_aberto, status, venda_id, descricao)
    values (p_cliente_id, v_cliente_nome, v_total_calc, v_total_calc, v_total_calc, 'aberto', v_venda_id, 'Venda fiado');

    insert into contas_receber (descricao, valor, status, venda_id, cliente_id)
    values ('Fiado - ' || coalesce(v_cliente_nome, 'cliente'), v_total_calc, 'aberta', v_venda_id, p_cliente_id);
  end if;

  return jsonb_build_object('venda_id', v_venda_id, 'subtotal', v_subtotal_calc, 'desconto', v_desconto_venda, 'total', v_total_calc, 'troco', v_troco_calc, 'lucro_estimado', v_lucro_total);
end;
$$;

grant execute on function finalizar_venda(uuid,text,text,numeric,numeric,numeric,numeric,numeric,jsonb) to authenticated;

insert into produtos (nome, codigo_barras, categoria, preco_custo, preco_venda, estoque, estoque_minimo)
values ('Produto Teste', '7890000000000', 'Geral', 5.00, 8.00, 10, 2)
on conflict (codigo_barras) do nothing;
