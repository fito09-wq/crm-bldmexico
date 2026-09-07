-- Ejecuta este script completo en Supabase: Panel de tu proyecto > SQL Editor > New query > pegar y correr.

create table if not exists crm_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table crm_state enable row level security;

create policy "Permitir lectura" on crm_state
  for select using (true);

create policy "Permitir insercion" on crm_state
  for insert with check (true);

create policy "Permitir actualizacion" on crm_state
  for update using (true);
