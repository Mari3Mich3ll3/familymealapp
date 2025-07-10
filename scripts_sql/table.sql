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

create table public.families (
    id bigint generated always as identity primary key,
    name text not null,
    created_by uuid references public.users(id) on delete cascade,
    member_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
create table public.allergies (
    id bigint generated always as identity primary key,
    name text unique not null,
    description text,
    is_common boolean default true,
    created_at timestamp with time zone default now()
);

create table public.diseases (
    id bigint generated always as identity primary key,
    name text unique not null,
    description text,
    dietary_restrictions text,
    created_at timestamp with time zone default now()
);

create table public.member_allergies (
    id bigint generated always as identity primary key,
    member_id bigint references public.family_members(id) on delete cascade,
    allergy_id bigint references public.allergies(id) on delete cascade,
    severity text check (severity in ('mild', 'moderate', 'severe')),
    notes text,
    created_at timestamp with time zone default now(),
    unique(member_id, allergy_id)
);
create table public.member_diseases (
    id bigint generated always as identity primary key,
    member_id bigint references public.family_members(id) on delete cascade,
    disease_id bigint references public.diseases(id) on delete cascade,
    diagnosed_date date,
    notes text,
    created_at timestamp with time zone default now(),
    unique(member_id, disease_id)
);