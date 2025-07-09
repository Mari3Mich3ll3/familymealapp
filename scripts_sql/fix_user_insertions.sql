-- =====================================================
-- CORRECTION: Auto-insertion des utilisateurs
-- =====================================================

-- Fonction pour créer automatiquement un profil utilisateur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Supprimer le trigger s'il existe déjà
drop trigger if exists on_auth_user_created on auth.users;

-- Créer le trigger pour auto-insertion
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Politique RLS pour permettre l'insertion automatique
drop policy if exists "Enable insert for authenticated users only" on public.users;
create policy "Enable insert for authenticated users only" on public.users
  for insert with check (auth.uid() = id);
