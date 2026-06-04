-- Fix protocols_category_check constraint
-- Old constraint only allowed: general, hygiene, service, security, opening, closing
-- New constraint adds the French category values used by the app

ALTER TABLE protocols DROP CONSTRAINT IF EXISTS protocols_category_check;
ALTER TABLE protocols ADD CONSTRAINT protocols_category_check CHECK (
  category IN ('salle','cuisine','bar','accueil','hygiene','securite','ouverture','fermeture','general','service','security','opening','closing')
);
