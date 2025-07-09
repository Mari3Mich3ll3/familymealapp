-- =====================================================
-- FAMILYMEAL DATABASE SCHEMA
-- =====================================================
-- Description: Script de création complète de la base de données pour l'application FamilyMeal
-- Version: 1.0
-- Date: 2024-12-09
-- Tables: users, families, family_members, allergies, diseases, dishes, ingredients, etc.
-- =====================================================

-- =====================================================
-- TABLE: users
-- =====================================================
-- Description: Table principale des utilisateurs de l'application
create table public.users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    username text unique,
    full_name text not null,
    profile_photo_url text,
    bio text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.users is 'Table des utilisateurs principaux de l''application FamilyMeal';
comment on column public.users.profile_photo_url is 'URL de la photo de profil (stockage base64 ou Supabase Storage)';
comment on column public.users.bio is 'Biographie de l''utilisateur pour les paramètres';

-- Activer RLS sur la table users
alter table public.users enable row level security;

-- Politique RLS pour users - SELECT
create policy "Users can view their own profile" on public.users
    for select using (auth.uid() = id);

-- Politique RLS pour users - INSERT
create policy "Users can insert their own profile" on public.users
    for insert with check (auth.uid() = id);

-- Politique RLS pour users - UPDATE
create policy "Users can update their own profile" on public.users
    for update using (auth.uid() = id);

-- =====================================================
-- TABLE: families
-- =====================================================
-- Description: Table des familles créées par les utilisateurs
create table public.families (
    id bigint generated always as identity primary key,
    name text not null,
    created_by uuid references public.users(id) on delete cascade,
    member_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.families is 'Table des familles avec leurs informations de base';
comment on column public.families.member_count is 'Nombre de membres dans la famille (calculé automatiquement)';

-- Activer RLS sur la table families
alter table public.families enable row level security;

-- Politique RLS pour families - SELECT
create policy "Users can view their own families" on public.families
    for select using (auth.uid() = created_by);

-- Politique RLS pour families - INSERT
create policy "Users can create families" on public.families
    for insert with check (auth.uid() = created_by);

-- Politique RLS pour families - UPDATE
create policy "Users can update their own families" on public.families
    for update using (auth.uid() = created_by);

-- Politique RLS pour families - DELETE
create policy "Users can delete their own families" on public.families
    for delete using (auth.uid() = created_by);

-- =====================================================
-- TABLE: allergies
-- =====================================================
-- Description: Table de référence des allergies courantes
create table public.allergies (
    id bigint generated always as identity primary key,
    name text unique not null,
    description text,
    is_common boolean default true,
    created_at timestamp with time zone default now()
);

comment on table public.allergies is 'Table de référence des allergies courantes et personnalisées';
comment on column public.allergies.is_common is 'Indique si l''allergie fait partie des allergies courantes prédéfinies';

-- Activer RLS sur la table allergies
alter table public.allergies enable row level security;

-- Politique RLS pour allergies - SELECT (public)
create policy "Anyone can view allergies" on public.allergies
    for select using (true);

-- Politique RLS pour allergies - INSERT (utilisateurs authentifiés)
create policy "Authenticated users can add custom allergies" on public.allergies
    for insert with check (auth.role() = 'authenticated');

-- =====================================================
-- TABLE: diseases
-- =====================================================
-- Description: Table de référence des maladies
create table public.diseases (
    id bigint generated always as identity primary key,
    name text unique not null,
    description text,
    dietary_restrictions text,
    created_at timestamp with time zone default now()
);

comment on table public.diseases is 'Table de référence des maladies avec leurs restrictions alimentaires';
comment on column public.diseases.dietary_restrictions is 'Restrictions alimentaires liées à cette maladie';

-- Activer RLS sur la table diseases
alter table public.diseases enable row level security;

-- Politique RLS pour diseases - SELECT (public)
create policy "Anyone can view diseases" on public.diseases
    for select using (true);

-- Politique RLS pour diseases - INSERT (utilisateurs authentifiés)
create policy "Authenticated users can add diseases" on public.diseases
    for insert with check (auth.role() = 'authenticated');

-- =====================================================
-- TABLE: family_members
-- =====================================================
-- Description: Table des membres de chaque famille
create table public.family_members (
    id bigint generated always as identity primary key,
    family_id bigint references public.families(id) on delete cascade,
    name text not null,
    gender text check (gender in ('male', 'female', 'other')),
    age integer check (age > 0 and age < 150),
    photo_url text,
    email text,
    is_sick boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.family_members is 'Table des membres de chaque famille avec leurs informations personnelles';
comment on column public.family_members.photo_url is 'URL de la photo du membre (stockage base64 ou Supabase Storage)';
comment on column public.family_members.is_sick is 'Indique si le membre a des maladies déclarées';

-- Activer RLS sur la table family_members
alter table public.family_members enable row level security;

-- Politique RLS pour family_members - SELECT
create policy "Users can view their family members" on public.family_members
    for select using (
        exists (
            select 1 from public.families 
            where id = family_members.family_id 
            and created_by = auth.uid()
        )
    );

-- Politique RLS pour family_members - INSERT
create policy "Users can add members to their families" on public.family_members
    for insert with check (
        exists (
            select 1 from public.families 
            where id = family_members.family_id 
            and created_by = auth.uid()
        )
    );

-- Politique RLS pour family_members - UPDATE
create policy "Users can update their family members" on public.family_members
    for update using (
        exists (
            select 1 from public.families 
            where id = family_members.family_id 
            and created_by = auth.uid()
        )
    );

-- Politique RLS pour family_members - DELETE
create policy "Users can delete their family members" on public.family_members
    for delete using (
        exists (
            select 1 from public.families 
            where id = family_members.family_id 
            and created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: member_allergies
-- =====================================================
-- Description: Table de liaison entre membres et allergies (relation many-to-many)
create table public.member_allergies (
    id bigint generated always as identity primary key,
    member_id bigint references public.family_members(id) on delete cascade,
    allergy_id bigint references public.allergies(id) on delete cascade,
    severity text check (severity in ('mild', 'moderate', 'severe')),
    notes text,
    created_at timestamp with time zone default now(),
    unique(member_id, allergy_id)
);

comment on table public.member_allergies is 'Table de liaison entre les membres de famille et leurs allergies';
comment on column public.member_allergies.severity is 'Niveau de sévérité de l''allergie pour ce membre';

-- Activer RLS sur la table member_allergies
alter table public.member_allergies enable row level security;

-- Politique RLS pour member_allergies - SELECT
create policy "Users can view their family members allergies" on public.member_allergies
    for select using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_allergies.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_allergies - INSERT
create policy "Users can add allergies to their family members" on public.member_allergies
    for insert with check (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_allergies.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_allergies - UPDATE
create policy "Users can update their family members allergies" on public.member_allergies
    for update using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_allergies.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_allergies - DELETE
create policy "Users can delete their family members allergies" on public.member_allergies
    for delete using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_allergies.member_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: member_diseases
-- =====================================================
-- Description: Table de liaison entre membres et maladies (relation many-to-many)
create table public.member_diseases (
    id bigint generated always as identity primary key,
    member_id bigint references public.family_members(id) on delete cascade,
    disease_id bigint references public.diseases(id) on delete cascade,
    diagnosed_date date,
    notes text,
    created_at timestamp with time zone default now(),
    unique(member_id, disease_id)
);

comment on table public.member_diseases is 'Table de liaison entre les membres de famille et leurs maladies';
comment on column public.member_diseases.diagnosed_date is 'Date de diagnostic de la maladie';

-- Activer RLS sur la table member_diseases
alter table public.member_diseases enable row level security;

-- Politique RLS pour member_diseases - SELECT
create policy "Users can view their family members diseases" on public.member_diseases
    for select using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_diseases.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_diseases - INSERT
create policy "Users can add diseases to their family members" on public.member_diseases
    for insert with check (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_diseases.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_diseases - UPDATE
create policy "Users can update their family members diseases" on public.member_diseases
    for update using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_diseases.member_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour member_diseases - DELETE
create policy "Users can delete their family members diseases" on public.member_diseases
    for delete using (
        exists (
            select 1 from public.family_members fm
            join public.families f on fm.family_id = f.id
            where fm.id = member_diseases.member_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: ingredients
-- =====================================================
-- Description: Table des ingrédients utilisés dans les plats
create table public.ingredients (
    id bigint generated always as identity primary key,
    name text not null,
    photo_url text,
    unit_of_measure text not null check (unit_of_measure in ('kg', 'g', 'l', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'other')),
    price_per_unit decimal(10,2),
    description text,
    category text check (category in ('meat', 'vegetable', 'fruit', 'dairy', 'grain', 'spice', 'other')),
    created_by uuid references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.ingredients is 'Table des ingrédients avec leurs informations nutritionnelles et prix';
comment on column public.ingredients.unit_of_measure is 'Unité de mesure (kg, g, l, ml, pièce, etc.)';
comment on column public.ingredients.price_per_unit is 'Prix pour une unité de mesure';
comment on column public.ingredients.category is 'Catégorie de l''ingrédient pour le classement';

-- Activer RLS sur la table ingredients
alter table public.ingredients enable row level security;

-- Politique RLS pour ingredients - SELECT
create policy "Users can view their own ingredients" on public.ingredients
    for select using (auth.uid() = created_by);

-- Politique RLS pour ingredients - INSERT
create policy "Users can create ingredients" on public.ingredients
    for insert with check (auth.uid() = created_by);

-- Politique RLS pour ingredients - UPDATE
create policy "Users can update their own ingredients" on public.ingredients
    for update using (auth.uid() = created_by);

-- Politique RLS pour ingredients - DELETE
create policy "Users can delete their own ingredients" on public.ingredients
    for delete using (auth.uid() = created_by);

-- =====================================================
-- TABLE: dishes
-- =====================================================
-- Description: Table des plats/repas configurés par l'utilisateur
create table public.dishes (
    id bigint generated always as identity primary key,
    name text not null,
    photo_url text,
    description text,
    category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack')),
    preparation_time integer, -- en minutes
    cooking_time integer, -- en minutes
    servings integer default 1,
    created_by uuid references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.dishes is 'Table des plats/repas avec leurs informations de base';
comment on column public.dishes.category is 'Catégorie du repas (petit-déjeuner, déjeuner, dîner, collation)';
comment on column public.dishes.preparation_time is 'Temps de préparation en minutes';
comment on column public.dishes.cooking_time is 'Temps de cuisson en minutes';
comment on column public.dishes.servings is 'Nombre de portions que produit cette recette';

-- Activer RLS sur la table dishes
alter table public.dishes enable row level security;

-- Politique RLS pour dishes - SELECT
create policy "Users can view their own dishes" on public.dishes
    for select using (auth.uid() = created_by);

-- Politique RLS pour dishes - INSERT
create policy "Users can create dishes" on public.dishes
    for insert with check (auth.uid() = created_by);

-- Politique RLS pour dishes - UPDATE
create policy "Users can update their own dishes" on public.dishes
    for update using (auth.uid() = created_by);

-- Politique RLS pour dishes - DELETE
create policy "Users can delete their own dishes" on public.dishes
    for delete using (auth.uid() = created_by);

-- =====================================================
-- TABLE: dish_ingredients
-- =====================================================
-- Description: Table de liaison entre plats et ingrédients avec quantités
create table public.dish_ingredients (
    id bigint generated always as identity primary key,
    dish_id bigint references public.dishes(id) on delete cascade,
    ingredient_id bigint references public.ingredients(id) on delete cascade,
    quantity decimal(10,3) not null,
    notes text,
    created_at timestamp with time zone default now(),
    unique(dish_id, ingredient_id)
);

comment on table public.dish_ingredients is 'Table de liaison entre plats et ingrédients avec les quantités nécessaires';
comment on column public.dish_ingredients.quantity is 'Quantité d''ingrédient nécessaire pour ce plat';
comment on column public.dish_ingredients.notes is 'Notes spéciales pour cet ingrédient dans ce plat';

-- Activer RLS sur la table dish_ingredients
alter table public.dish_ingredients enable row level security;

-- Politique RLS pour dish_ingredients - SELECT
create policy "Users can view their dish ingredients" on public.dish_ingredients
    for select using (
        exists (
            select 1 from public.dishes d
            where d.id = dish_ingredients.dish_id 
            and d.created_by = auth.uid()
        )
    );

-- Politique RLS pour dish_ingredients - INSERT
create policy "Users can add ingredients to their dishes" on public.dish_ingredients
    for insert with check (
        exists (
            select 1 from public.dishes d
            where d.id = dish_ingredients.dish_id 
            and d.created_by = auth.uid()
        )
    );

-- Politique RLS pour dish_ingredients - UPDATE
create policy "Users can update their dish ingredients" on public.dish_ingredients
    for update using (
        exists (
            select 1 from public.dishes d
            where d.id = dish_ingredients.dish_id 
            and d.created_by = auth.uid()
        )
    );

-- Politique RLS pour dish_ingredients - DELETE
create policy "Users can delete their dish ingredients" on public.dish_ingredients
    for delete using (
        exists (
            select 1 from public.dishes d
            where d.id = dish_ingredients.dish_id 
            and d.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: meal_calendar
-- =====================================================
-- Description: Table du calendrier des repas planifiés
create table public.meal_calendar (
    id bigint generated always as identity primary key,
    family_id bigint references public.families(id) on delete cascade,
    dish_id bigint references public.dishes(id) on delete cascade,
    meal_date date not null,
    meal_category text not null check (meal_category in ('breakfast', 'lunch', 'dinner', 'snack')),
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.meal_calendar is 'Table du calendrier des repas planifiés pour chaque famille';
comment on column public.meal_calendar.meal_date is 'Date du repas planifié';
comment on column public.meal_calendar.meal_category is 'Catégorie du repas (petit-déjeuner, déjeuner, dîner)';

-- Index pour améliorer les performances des requêtes par date
create index idx_meal_calendar_date on public.meal_calendar(meal_date);
create index idx_meal_calendar_family_date on public.meal_calendar(family_id, meal_date);

-- Activer RLS sur la table meal_calendar
alter table public.meal_calendar enable row level security;

-- Politique RLS pour meal_calendar - SELECT
create policy "Users can view their family meal calendar" on public.meal_calendar
    for select using (
        exists (
            select 1 from public.families f
            where f.id = meal_calendar.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour meal_calendar - INSERT
create policy "Users can add meals to their family calendar" on public.meal_calendar
    for insert with check (
        exists (
            select 1 from public.families f
            where f.id = meal_calendar.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour meal_calendar - UPDATE
create policy "Users can update their family meal calendar" on public.meal_calendar
    for update using (
        exists (
            select 1 from public.families f
            where f.id = meal_calendar.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour meal_calendar - DELETE
create policy "Users can delete meals from their family calendar" on public.meal_calendar
    for delete using (
        exists (
            select 1 from public.families f
            where f.id = meal_calendar.family_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: shopping_lists
-- =====================================================
-- Description: Table des listes de courses générées
create table public.shopping_lists (
    id bigint generated always as identity primary key,
    family_id bigint references public.families(id) on delete cascade,
    name text not null,
    total_estimated_cost decimal(10,2) default 0,
    status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.shopping_lists is 'Table des listes de courses générées pour les familles';
comment on column public.shopping_lists.total_estimated_cost is 'Coût total estimé de la liste de courses';
comment on column public.shopping_lists.status is 'Statut de la liste (en attente, en cours, terminée)';

-- Activer RLS sur la table shopping_lists
alter table public.shopping_lists enable row level security;

-- Politique RLS pour shopping_lists - SELECT
create policy "Users can view their family shopping lists" on public.shopping_lists
    for select using (
        exists (
            select 1 from public.families f
            where f.id = shopping_lists.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_lists - INSERT
create policy "Users can create shopping lists for their family" on public.shopping_lists
    for insert with check (
        exists (
            select 1 from public.families f
            where f.id = shopping_lists.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_lists - UPDATE
create policy "Users can update their family shopping lists" on public.shopping_lists
    for update using (
        exists (
            select 1 from public.families f
            where f.id = shopping_lists.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_lists - DELETE
create policy "Users can delete their family shopping lists" on public.shopping_lists
    for delete using (
        exists (
            select 1 from public.families f
            where f.id = shopping_lists.family_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: shopping_list_items
-- =====================================================
-- Description: Table des articles dans chaque liste de courses
create table public.shopping_list_items (
    id bigint generated always as identity primary key,
    shopping_list_id bigint references public.shopping_lists(id) on delete cascade,
    ingredient_id bigint references public.ingredients(id) on delete cascade,
    quantity_needed decimal(10,3) not null,
    quantity_in_stock decimal(10,3) default 0,
    quantity_to_buy decimal(10,3) generated always as (quantity_needed - quantity_in_stock) stored,
    estimated_cost decimal(10,2),
    is_purchased boolean default false,
    comments text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.shopping_list_items is 'Table des articles individuels dans chaque liste de courses';
comment on column public.shopping_list_items.quantity_needed is 'Quantité totale nécessaire pour les repas';
comment on column public.shopping_list_items.quantity_in_stock is 'Quantité disponible en stock à la maison';
comment on column public.shopping_list_items.quantity_to_buy is 'Quantité à acheter (calculée automatiquement)';
comment on column public.shopping_list_items.comments is 'Commentaires sur l''article (ex: "acheter chez Rosa")';

-- Activer RLS sur la table shopping_list_items
alter table public.shopping_list_items enable row level security;

-- Politique RLS pour shopping_list_items - SELECT
create policy "Users can view their shopping list items" on public.shopping_list_items
    for select using (
        exists (
            select 1 from public.shopping_lists sl
            join public.families f on sl.family_id = f.id
            where sl.id = shopping_list_items.shopping_list_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_list_items - INSERT
create policy "Users can add items to their shopping lists" on public.shopping_list_items
    for insert with check (
        exists (
            select 1 from public.shopping_lists sl
            join public.families f on sl.family_id = f.id
            where sl.id = shopping_list_items.shopping_list_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_list_items - UPDATE
create policy "Users can update their shopping list items" on public.shopping_list_items
    for update using (
        exists (
            select 1 from public.shopping_lists sl
            join public.families f on sl.family_id = f.id
            where sl.id = shopping_list_items.shopping_list_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour shopping_list_items - DELETE
create policy "Users can delete their shopping list items" on public.shopping_list_items
    for delete using (
        exists (
            select 1 from public.shopping_lists sl
            join public.families f on sl.family_id = f.id
            where sl.id = shopping_list_items.shopping_list_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: stocks
-- =====================================================
-- Description: Table de gestion des stocks d'ingrédients à la maison
create table public.stocks (
    id bigint generated always as identity primary key,
    family_id bigint references public.families(id) on delete cascade,
    ingredient_id bigint references public.ingredients(id) on delete cascade,
    quantity decimal(10,3) not null,
    expiration_date date,
    storage_location text,
    purchase_date date,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    unique(family_id, ingredient_id)
);

comment on table public.stocks is 'Table de gestion des stocks d''ingrédients disponibles à la maison';
comment on column public.stocks.quantity is 'Quantité disponible en stock';
comment on column public.stocks.expiration_date is 'Date d''expiration pour les produits périssables';
comment on column public.stocks.storage_location is 'Lieu de conservation (frigo, placard, etc.)';

-- Index pour les requêtes d'expiration
create index idx_stocks_expiration on public.stocks(expiration_date) where expiration_date is not null;

-- Activer RLS sur la table stocks
alter table public.stocks enable row level security;

-- Politique RLS pour stocks - SELECT
create policy "Users can view their family stocks" on public.stocks
    for select using (
        exists (
            select 1 from public.families f
            where f.id = stocks.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour stocks - INSERT
create policy "Users can add stocks for their family" on public.stocks
    for insert with check (
        exists (
            select 1 from public.families f
            where f.id = stocks.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour stocks - UPDATE
create policy "Users can update their family stocks" on public.stocks
    for update using (
        exists (
            select 1 from public.families f
            where f.id = stocks.family_id 
            and f.created_by = auth.uid()
        )
    );

-- Politique RLS pour stocks - DELETE
create policy "Users can delete their family stocks" on public.stocks
    for delete using (
        exists (
            select 1 from public.families f
            where f.id = stocks.family_id 
            and f.created_by = auth.uid()
        )
    );

-- =====================================================
-- TABLE: recipes
-- =====================================================
-- Description: Table des recettes générées par l'IA
create table public.recipes (
    id bigint generated always as identity primary key,
    dish_id bigint references public.dishes(id) on delete cascade,
    title text not null,
    instructions text not null,
    generated_by_ai boolean default true,
    ai_model_used text,
    created_by uuid references public.users(id) on delete cascade,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.recipes is 'Table des recettes générées par l''IA ou créées manuellement';
comment on column public.recipes.instructions is 'Instructions détaillées de préparation de la recette';
comment on column public.recipes.generated_by_ai is 'Indique si la recette a été générée par l''IA';
comment on column public.recipes.ai_model_used is 'Modèle d''IA utilisé pour générer la recette';

-- Activer RLS sur la table recipes
alter table public.recipes enable row level security;

-- Politique RLS pour recipes - SELECT
create policy "Users can view their own recipes" on public.recipes
    for select using (auth.uid() = created_by);

-- Politique RLS pour recipes - INSERT
create policy "Users can create recipes" on public.recipes
    for insert with check (auth.uid() = created_by);

-- Politique RLS pour recipes - UPDATE
create policy "Users can update their own recipes" on public.recipes
    for update using (auth.uid() = created_by);

-- Politique RLS pour recipes - DELETE
create policy "Users can delete their own recipes" on public.recipes
    for delete using (auth.uid() = created_by);

-- =====================================================
-- TABLE: ai_conversations
-- =====================================================
-- Description: Table pour stocker les conversations avec l'assistant IA
create table public.ai_conversations (
    id bigint generated always as identity primary key,
    user_id uuid references public.users(id) on delete cascade,
    family_id bigint references public.families(id) on delete cascade,
    conversation_title text,
    messages jsonb not null default '[]',
    context_data jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

comment on table public.ai_conversations is 'Table pour stocker les conversations avec l''assistant IA';
comment on column public.ai_conversations.messages is 'Historique des messages de la conversation au format JSON';
comment on column public.ai_conversations.context_data is 'Données contextuelles utilisées par l''IA (infos famille, etc.)';

-- Activer RLS sur la table ai_conversations
alter table public.ai_conversations enable row level security;

-- Politique RLS pour ai_conversations - SELECT
create policy "Users can view their own AI conversations" on public.ai_conversations
    for select using (auth.uid() = user_id);

-- Politique RLS pour ai_conversations - INSERT
create policy "Users can create AI conversations" on public.ai_conversations
    for insert with check (auth.uid() = user_id);

-- Politique RLS pour ai_conversations - UPDATE
create policy "Users can update their own AI conversations" on public.ai_conversations
    for update using (auth.uid() = user_id);

-- Politique RLS pour ai_conversations - DELETE
create policy "Users can delete their own AI conversations" on public.ai_conversations
    for delete using (auth.uid() = user_id);

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers pour updated_at sur toutes les tables concernées
create trigger handle_updated_at_users
    before update on public.users
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_families
    before update on public.families
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_family_members
    before update on public.family_members
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_ingredients
    before update on public.ingredients
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_dishes
    before update on public.dishes
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_meal_calendar
    before update on public.meal_calendar
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_shopping_lists
    before update on public.shopping_lists
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_shopping_list_items
    before update on public.shopping_list_items
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_stocks
    before update on public.stocks
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_recipes
    before update on public.recipes
    for each row execute function public.handle_updated_at();

create trigger handle_updated_at_ai_conversations
    before update on public.ai_conversations
    for each row execute function public.handle_updated_at();

-- Fonction pour mettre à jour le nombre de membres dans une famille
create or replace function public.update_family_member_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update public.families 
        set member_count = member_count + 1 
        where id = new.family_id;
        return new;
    elsif tg_op = 'DELETE' then
        update public.families 
        set member_count = member_count - 1 
        where id = old.family_id;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

-- Trigger pour mettre à jour automatiquement le nombre de membres
create trigger update_family_member_count_trigger
    after insert or delete on public.family_members
    for each row execute function public.update_family_member_count();

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insertion des allergies courantes
insert into public.allergies (name, description, is_common) values
('Arachides', 'Allergie aux cacahuètes et produits dérivés', true),
('Fruits à coque', 'Allergie aux noix, amandes, noisettes, etc.', true),
('Lait', 'Allergie aux protéines du lait de vache', true),
('Œufs', 'Allergie aux protéines d''œuf', true),
('Poisson', 'Allergie aux poissons et produits de la mer', true),
('Crustacés', 'Allergie aux crevettes, crabes, homards, etc.', true),
('Soja', 'Allergie au soja et produits dérivés', true),
('Gluten', 'Allergie au gluten (blé, orge, seigle)', true),
('Sésame', 'Allergie aux graines de sésame', true),
('Sulfites', 'Allergie aux sulfites (conservateurs)', true);

-- Insertion des maladies courantes avec restrictions alimentaires
insert into public.diseases (name, description, dietary_restrictions) values
('Diabète Type 1', 'Diabète insulino-dépendant', 'Contrôler les glucides, éviter les sucres rapides'),
('Diabète Type 2', 'Diabète non insulino-dépendant', 'Régime pauvre en sucres, contrôle des glucides'),
('Hypertension', 'Tension artérielle élevée', 'Réduire le sel, éviter les aliments transformés'),
('Maladie cœliaque', 'Intolérance au gluten', 'Régime strictement sans gluten'),
('Maladie de Crohn', 'Maladie inflammatoire intestinale', 'Éviter les fibres insolubles, les épices fortes'),
('Insuffisance rénale', 'Dysfonctionnement des reins', 'Limiter les protéines, le phosphore et le potassium'),
('Hypercholestérolémie', 'Taux de cholestérol élevé', 'Réduire les graisses saturées et trans'),
('Gastrite', 'Inflammation de l''estomac', 'Éviter les aliments acides et épicés'),
('Anémie', 'Manque de fer dans le sang', 'Augmenter les aliments riches en fer'),
('Ostéoporose', 'Fragilité osseuse', 'Augmenter le calcium et la vitamine D');

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue pour obtenir les informations complètes des membres avec leurs allergies et maladies
create view public.family_members_complete as
select 
    fm.*,
    f.name as family_name,
    f.created_by as family_owner,
    coalesce(
        json_agg(
            json_build_object(
                'allergy_name', a.name,
                'severity', ma.severity,
                'notes', ma.notes
            )
        ) filter (where a.id is not null), 
        '[]'::json
    ) as allergies,
    coalesce(
        json_agg(
            json_build_object(
                'disease_name', d.name,
                'diagnosed_date', md.diagnosed_date,
                'dietary_restrictions', d.dietary_restrictions,
                'notes', md.notes
            )
        ) filter (where d.id is not null), 
        '[]'::json
    ) as diseases
from public.family_members fm
join public.families f on fm.family_id = f.id
left join public.member_allergies ma on fm.id = ma.member_id
left join public.allergies a on ma.allergy_id = a.id
left join public.member_diseases md on fm.id = md.member_id
left join public.diseases d on md.disease_id = d.id
group by fm.id, f.name, f.created_by;

-- Vue pour obtenir les plats avec leurs ingrédients
create view public.dishes_with_ingredients as
select 
    d.*,
    coalesce(
        json_agg(
            json_build_object(
                'ingredient_name', i.name,
                'quantity', di.quantity,
                'unit', i.unit_of_measure,
                'price_per_unit', i.price_per_unit,
                'total_cost', di.quantity * i.price_per_unit,
                'notes', di.notes
            )
        ) filter (where i.id is not null), 
        '[]'::json
    ) as ingredients
from public.dishes d
left join public.dish_ingredients di on d.id = di.dish_id
left join public.ingredients i on di.ingredient_id = i.id
group by d.id;

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================
-- Ce script crée une base de données complète pour l'application FamilyMeal
-- Toutes les tables ont RLS activé pour la sécurité
-- Les triggers automatisent la mise à jour des timestamps et compteurs
-- Les vues facilitent les requêtes complexes
-- Les données initiales incluent les allergies et maladies courantes
-- =====================================================