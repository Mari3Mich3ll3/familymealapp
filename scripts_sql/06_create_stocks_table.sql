-- Création de la table stocks
CREATE TABLE IF NOT EXISTS stocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantite DECIMAL(10,2) NOT NULL DEFAULT 0,
    unite_mesure VARCHAR(20) DEFAULT 'piece',
    date_expiration DATE,
    lieu_conservation VARCHAR(50) DEFAULT 'placard',
    prix_achat DECIMAL(10,2) DEFAULT 0,
    date_achat DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT stocks_quantite_check CHECK (quantite >= 0),
    CONSTRAINT stocks_prix_check CHECK (prix_achat >= 0)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stocks_family_id ON stocks(family_id);
CREATE INDEX IF NOT EXISTS idx_stocks_ingredient_id ON stocks(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stocks_date_expiration ON stocks(date_expiration);

-- RLS
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their stocks" ON stocks
    FOR ALL USING (
        family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
    );
