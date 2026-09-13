# 🚀 Guide d'Installation Supabase - Propulsemysite

## ✅ Prérequis
- Nouveau projet Supabase créé ✅
- URL et clés API configurées ✅
- Connexion réseau fonctionnelle ✅

## 📋 Étapes d'Installation

### 1. Configuration Manuelle (Recommandée)

#### Étape 1: Accéder au SQL Editor
1. Ouvrir le dashboard Supabase
2. Aller dans **SQL Editor** (dans le menu de gauche)
3. Cliquer sur **"New Query"**

#### Étape 2: Exécuter le Script SQL
1. Copier tout le contenu du fichier `setup-supabase-complete.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **"Run"** ou **Ctrl+Enter**

#### Étape 3: Vérifier les Résultats
Après exécution, vous devriez voir :
- ✅ **8 tables créées** : clients, projects, channels, messages, file_uploads, message_read_status, user_presence, call_sessions
- ✅ **Index créés** pour les performances
- ✅ **RLS activé** avec politiques de sécurité
- ✅ **Données de test** insérées
- ✅ **Vues utiles** créées

### 2. Configuration Automatique (Alternative)

```bash
# Exécuter le script automatique
node setup-database-auto.js
```

**Note**: Nécessite la clé service (service_role) de Supabase.

## 🧪 Test de la Configuration

### Test 1: Vérifier les Tables
```bash
# Dans le terminal
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://levhtmlnwyhmtupdtbrc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxldmh0bWxud3lobXR1cGR0YnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4Mzk0NzcsImV4cCI6MjA2NzQxNTQ3N30.BSBhyHGTtvtPkcbyhVFM-KNE5Dhfk9a6bYGdgpHzk1c'
);

async function test() {
  const { data, error } = await supabase.from('clients').select('*');
  console.log('Clients:', data?.length || 0);
  console.log('Erreur:', error?.message || 'Aucune');
}
test();
"
```

### Test 2: Vérifier l'Application
```bash
# Redémarrer l'application Next.js
npm run dev
```

Ouvrir http://localhost:3004 et tester les fonctionnalités.

## 🗂️ Structure de la Base de Données

### Tables Principales
- **clients** - Informations des clients
- **projects** - Projets liés aux clients
- **channels** - Canaux de communication par projet
- **messages** - Messages dans les canaux
- **file_uploads** - Fichiers uploadés
- **message_read_status** - Statut de lecture des messages
- **user_presence** - Présence des utilisateurs
- **call_sessions** - Sessions d'appels vidéo

### Vues Utiles
- **projects_with_client** - Projets avec infos client
- **messages_with_channel** - Messages avec infos canal

## 🔐 Sécurité (RLS)

Toutes les tables ont Row Level Security activé avec des politiques appropriées :
- **Lecture** : Tous les utilisateurs authentifiés
- **Écriture** : Utilisateurs propriétaires uniquement
- **Mise à jour** : Utilisateurs propriétaires uniquement

## 🚀 Configuration Storage

### Créer le Bucket pour les Fichiers
1. Aller dans **Storage** dans le dashboard
2. Cliquer sur **"New bucket"**
3. Nom: `chat-files`
4. Public: **Oui**
5. Cliquer sur **"Create bucket"**

### Configurer les Politiques Storage
```sql
-- Politique pour upload
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Politique pour lecture
CREATE POLICY "Files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

-- Politique pour suppression
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 🎯 Fonctionnalités Activées

Après cette configuration, votre application aura :

### ✅ Authentification
- Inscription/Connexion utilisateurs
- Gestion des sessions
- Profils utilisateurs

### ✅ Chat en Temps Réel
- Messages instantanés
- Canaux par projet
- Statut de lecture
- Présence utilisateurs

### ✅ Gestion de Fichiers
- Upload de fichiers
- Stockage sécurisé
- Partage de fichiers

### ✅ Appels Vidéo
- Sessions d'appels
- Historique des appels
- Gestion des participants

### ✅ Gestion de Projets
- Clients et projets
- Canaux de communication
- Historique des interactions

## 🔧 Dépannage

### Problème: Tables non créées
**Solution**: Exécuter le script SQL manuellement dans le dashboard

### Problème: Erreurs de permissions
**Solution**: Vérifier que RLS est bien configuré

### Problème: Fichiers non uploadés
**Solution**: Vérifier que le bucket `chat-files` existe

### Problème: Connexion échouée
**Solution**: Vérifier les URLs et clés dans `.env.local`

## 📞 Support

En cas de problème :
1. Vérifier les logs dans le dashboard Supabase
2. Tester les requêtes dans le SQL Editor
3. Vérifier la configuration RLS
4. Contrôler les politiques Storage

## 🎉 Félicitations !

Votre application **Propulsemysite** est maintenant configurée avec :
- ✅ Base de données complète
- ✅ Sécurité activée
- ✅ Données de test
- ✅ Storage configuré
- ✅ Application fonctionnelle

**Prêt pour le développement ! 🚀** 