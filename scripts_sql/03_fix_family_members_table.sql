-- Corriger la table family_members
DROP TABLE IF EXISTS family_members CASCADE;

CREATE TABLE family_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    sexe VARCHAR(10) CHECK (sexe IN ('homme', 'femme', 'autre')) DEFAULT 'autre',
    age INTEGER CHECK (age > 0 AND age < 150),
    email VARCHAR(255),
    photo_url TEXT,
    allergies TEXT[] DEFAULT '{}',
    maladies TEXT[] DEFAULT '{}',
    est_malade BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);

-- RLS (Row Level Security)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can manage their family members" ON family_members
    FOR ALL USING (
        family_id IN (
            SELECT id FROM families WHERE user_id = auth.uid()
        )
    );
