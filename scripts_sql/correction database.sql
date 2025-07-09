-- =====================================================
-- CORRECTIONS POUR LA BASE DE DONNÉES FAMILYMEAL
-- =====================================================

-- 1. Corriger la contrainte sur ingredients.unit_of_measure
ALTER TABLE public.ingredients 
DROP CONSTRAINT IF EXISTS ingredients_unit_of_measure_check;

ALTER TABLE public.ingredients 
ADD CONSTRAINT ingredients_unit_of_measure_check 
CHECK (unit_of_measure IN ('kg', 'g', 'l', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'other', 'litres', 'kilogrammes', 'grammes', 'morceaux', 'pièces', 'cuillères', 'verres', 'bols'));

-- 2. Créer la table calendar_meals (alias pour meal_calendar)
CREATE OR REPLACE VIEW public.calendar_meals AS
SELECT 
    id,
    family_id,
    dish_id,
    meal_date,
    meal_category,
    notes,
    created_at,
    updated_at
FROM public.meal_calendar;

-- 3. Fonction pour insérer dans calendar_meals
CREATE OR REPLACE FUNCTION public.insert_calendar_meal(
    p_family_id bigint,
    p_dish_id bigint,
    p_meal_date date,
    p_meal_category text,
    p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(
    id bigint,
    family_id bigint,
    dish_id bigint,
    meal_date date,
    meal_category text,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.meal_calendar (family_id, dish_id, meal_date, meal_category)
    VALUES (p_family_id, p_dish_id, p_meal_date, p_meal_category)
    RETURNING 
        meal_calendar.id,
        meal_calendar.family_id,
        meal_calendar.dish_id,
        meal_calendar.meal_date,
        meal_calendar.meal_category,
        meal_calendar.notes,
        meal_calendar.created_at,
        meal_calendar.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ajouter des maladies de test
INSERT INTO public.diseases (name, description, dietary_restrictions) VALUES
('Diabète', 'Diabète sucré', 'Contrôler les glucides'),
('Hypertension', 'Tension artérielle élevée', 'Réduire le sel'),
('Allergie alimentaire', 'Allergie générale', 'Éviter les allergènes'),
('Intolérance lactose', 'Intolérance au lactose', 'Éviter les produits laitiers'),
('Maladie cœliaque', 'Intolérance au gluten', 'Régime sans gluten')
ON CONFLICT (name) DO NOTHING;

-- 5. Politiques RLS pour calendar_meals/meal_calendar
DROP POLICY IF EXISTS "Users can insert calendar meals" ON public.meal_calendar;
CREATE POLICY "Users can insert calendar meals" ON public.meal_calendar
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.families f
            WHERE f.id = meal_calendar.family_id 
            AND f.created_by = auth.uid()
        )
    );

-- 6. Fonction pour gérer les maladies de texte libre
CREATE OR REPLACE FUNCTION public.handle_member_diseases(
    p_member_id bigint,
    p_diseases_text text
)
RETURNS void AS $$
DECLARE
    disease_name text;
    disease_id bigint;
BEGIN
    -- Supprimer les anciennes maladies
    DELETE FROM public.member_diseases WHERE member_id = p_member_id;
    
    -- Si pas de maladies, sortir
    IF p_diseases_text IS NULL OR trim(p_diseases_text) = '' THEN
        RETURN;
    END IF;
    
    -- Traiter le texte comme une seule maladie
    disease_name := trim(p_diseases_text);
    
    -- Chercher ou créer la maladie
    SELECT id INTO disease_id 
    FROM public.diseases 
    WHERE name ILIKE disease_name 
    LIMIT 1;
    
    IF disease_id IS NULL THEN
        INSERT INTO public.diseases (name, description)
        VALUES (disease_name, 'Maladie ajoutée par l''utilisateur')
        RETURNING id INTO disease_id;
    END IF;
    
    -- Lier la maladie au membre
    INSERT INTO public.member_diseases (member_id, disease_id)
    VALUES (p_member_id, disease_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
