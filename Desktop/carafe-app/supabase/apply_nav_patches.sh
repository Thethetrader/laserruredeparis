#!/bin/bash
# Script d'application des patches navigation — Tâches récurrentes
# Lancer depuis un terminal avec accès complet au disque :
#   bash ~/Desktop/carafe-app/supabase/apply_nav_patches.sh

BASE="$HOME/Desktop/carafe-app"

echo "→ Application des patches Tâches récurrentes…"

replace() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    mv "$src" "$dst" && echo "  ✓ $dst"
  else
    echo "  ✗ Fichier source introuvable : $src"
  fi
}

replace "$BASE/components/layout/BottomNav.new.tsx"                     "$BASE/components/layout/BottomNav.tsx"
replace "$BASE/components/layout/Sidebar.new.tsx"                       "$BASE/components/layout/Sidebar.tsx"
replace "$BASE/app/(app)/establishment/settings/page.new.tsx"           "$BASE/app/(app)/establishment/settings/page.tsx"

echo ""
echo "Fait. Relance le serveur de dev si nécessaire."
