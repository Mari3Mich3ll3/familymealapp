-- Création de la table families
CREATE TABLE IF NOT EXISTS families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom_famille VARCHAR(100) NOT NULL,
    nombre_membres INTEGER DEFAULT 1,
    budget_mensuel DECIMAL(10,2) DEFAULT 0,
    preferences_culinaires TEXT[] DEFAULT '{}',
    restrictions_alimentaires TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT families_nombre_membres_check CHECK (nombre_membres > 0),
    CONSTRAINT families_budget_check CHECK (budget_mensuel >= 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);

-- RLS (Row Level Security)
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Politiques RLS avec gestion d'erreurs
CREATE POLICY "Users can view their own families" ON families
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own families" ON families
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own families" ON families
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own families" ON families
    FOR DELETE USING (auth.uid() = user_id);
