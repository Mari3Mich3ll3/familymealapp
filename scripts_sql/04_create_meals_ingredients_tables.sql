-- Table des catégories de repas
CREATE TABLE IF NOT EXISTS meal_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les catégories par défaut
INSERT INTO meal_categories (nom, description) VALUES
    ('petit-dejeuner', 'Repas du matin'),
    ('dejeuner', 'Repas du midi'),
    ('diner', 'Repas du soir'),
    ('collation', 'Encas entre les repas'),
    ('dessert', 'Desserts et sucreries')
ON CONFLICT (nom) DO NOTHING;

-- Table des ingrédients
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    unite_mesure VARCHAR(20) NOT NULL DEFAULT 'piece',
    prix_unitaire DECIMAL(10,2) DEFAULT 0,
    photo_url TEXT,
    categorie VARCHAR(50) DEFAULT 'autre',
    valeurs_nutritionnelles JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT ingredients_prix_check CHECK (prix_unitaire >= 0)
);

-- Table des repas
CREATE TABLE IF NOT EXISTS meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    categorie VARCHAR(50) DEFAULT 'dejeuner',
    photo_url TEXT,
    temps_preparation INTEGER DEFAULT 0,
    difficulte VARCHAR(20) DEFAULT 'facile' CHECK (difficulte IN ('facile', 'moyen', 'difficile')),
    portions INTEGER DEFAULT 4,
    recette TEXT,
    instructions JSONB DEFAULT '[]',
    valeurs_nutritionnelles JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    est_favori BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT meals_temps_check CHECK (temps_preparation >= 0),
    CONSTRAINT meals_portions_check CHECK (portions > 0)
);

-- Table de liaison repas-ingrédients
CREATE TABLE IF NOT EXISTS meal_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantite DECIMAL(10,2) NOT NULL DEFAULT 1,
    unite VARCHAR(20) DEFAULT 'piece',
    optionnel BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT meal_ingredients_quantite_check CHECK (quantite > 0),
    CONSTRAINT unique_meal_ingredient UNIQUE (meal_id, ingredient_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_ingredients_family_id ON ingredients(family_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_categorie ON ingredients(categorie);
CREATE INDEX IF NOT EXISTS idx_meals_family_id ON meals(family_id);
CREATE INDEX IF NOT EXISTS idx_meals_categorie ON meals(categorie);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal_id ON meal_ingredients(meal_id);

-- RLS pour toutes les tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ingredients ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ingredients
CREATE POLICY "Users can manage their family ingredients" ON ingredients
    FOR ALL USING (
        family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
    );

-- Politiques RLS pour meals
CREATE POLICY "Users can manage their family meals" ON meals
    FOR ALL USING (
        family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
    );

-- Politiques RLS pour meal_ingredients
CREATE POLICY "Users can manage their meal ingredients" ON meal_ingredients
    FOR ALL USING (
        meal_id IN (
            SELECT m.id FROM meals m 
            JOIN families f ON m.family_id = f.id 
            WHERE f.user_id = auth.uid()
        )
    );
