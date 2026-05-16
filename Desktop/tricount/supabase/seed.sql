-- Seed: catégories par défaut
-- À exécuter après avoir créé un couple (remplacer COUPLE_ID_HERE par l'ID réel)
-- Ces catégories sont insérées via la fonction d'onboarding en TypeScript

-- Exemple de seed manuel :
-- INSERT INTO categories (couple_id, name, icon, color, sort_order) VALUES
-- ('COUPLE_ID_HERE', 'Logement', 'House', '#e07a5f', 1),
-- ...

-- La fonction createDefaultCategories() dans lib/utils/categories.ts gère l'insertion
-- automatiquement lors de la création d'un couple.

SELECT 'Seed manuel: utiliser createDefaultCategories() dans le code TypeScript' AS note;
