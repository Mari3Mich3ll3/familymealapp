-- Table de planification des repas
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
    date_repas DATE NOT NULL,
    categorie VARCHAR(50) NOT NULL DEFAULT 'dejeuner',
    statut VARCHAR(20) DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_preparation', 'termine', 'annule')),
    portions_prevues INTEGER DEFAULT 4,
    notes TEXT,
    cout_estime DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT meal_plans_portions_check CHECK (portions_prevues > 0),
    CONSTRAINT meal_plans_cout_check CHECK (cout_estime >= 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_meal_plans_family_id ON meal_plans(family_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans(date_repas);
CREATE INDEX IF NOT EXISTS idx_meal_plans_statut ON meal_plans(statut);

-- RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their meal plans" ON meal_plans
    FOR ALL USING (
        family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
    );
