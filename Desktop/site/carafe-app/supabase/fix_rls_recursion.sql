-- ============================================================
-- FIX: Récursion infinie dans les policies RLS de establishment_members
-- À coller dans Supabase SQL Editor et exécuter
-- ============================================================

-- 1. Créer une fonction SECURITY DEFINER qui bypass le RLS
--    pour vérifier l'appartenance à un établissement.
--    Ceci casse la récursion.
CREATE OR REPLACE FUNCTION public.is_member_of_establishment(est_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM establishment_members
    WHERE establishment_id = est_id
      AND profile_id = uid
      AND is_active = true
  );
$$;

-- Même chose avec vérification du rôle
CREATE OR REPLACE FUNCTION public.is_owner_or_manager(est_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM establishment_members
    WHERE establishment_id = est_id
      AND profile_id = uid
      AND role IN ('owner', 'manager')
      AND is_active = true
  );
$$;

-- 2. Supprimer les anciennes policies récursives
DROP POLICY IF EXISTS "Members can view their establishment members" ON establishment_members;
DROP POLICY IF EXISTS "Owners and managers can insert members" ON establishment_members;
DROP POLICY IF EXISTS "Owners and managers can update members" ON establishment_members;

-- 3. Recréer les policies sans récursion

-- SELECT: les membres voient les membres de leur(s) établissement(s)
CREATE POLICY "Members can view their establishment members"
  ON establishment_members FOR SELECT
  USING (
    public.is_member_of_establishment(establishment_id, auth.uid())
  );

-- INSERT: owners/managers peuvent ajouter des membres
--         OU un user peut s'ajouter lui-même comme owner d'un établissement
--         qu'il vient de créer (flow signup — évite la poule/œuf)
CREATE POLICY "Owners and managers can insert members"
  ON establishment_members FOR INSERT
  WITH CHECK (
    -- Cas 1: owner ou manager qui ajoute quelqu'un
    public.is_owner_or_manager(establishment_id, auth.uid())
    OR
    -- Cas 2: signup — le patron s'insère lui-même comme owner
    --         de l'établissement dont il est owner_id
    (
      auth.uid() = profile_id
      AND role = 'owner'
      AND EXISTS (
        SELECT 1 FROM establishments
        WHERE id = establishment_id
          AND owner_id = auth.uid()
      )
    )
  );

-- UPDATE: owners/managers peuvent modifier les autres membres
--         les membres peuvent modifier leur propre fiche
CREATE POLICY "Owners and managers can update members"
  ON establishment_members FOR UPDATE
  USING (
    public.is_owner_or_manager(establishment_id, auth.uid())
    OR profile_id = auth.uid()
  );

-- Vérification
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'establishment_members'
ORDER BY policyname;
