#!/bin/bash
# Script pour corriger le fichier .env.local

cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://cdxqumznswtzvfizavt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeHhxdW16b3ZzemZ3Zml6YXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzYwNzUsImV4cCI6MjA2NzQxMjA3NX0.C4iQyD5q-5rRlXc3lsYFgYetoW2h--rLOBv1gkBX-6k
EOF

echo "Fichier .env.local corrigé !" 