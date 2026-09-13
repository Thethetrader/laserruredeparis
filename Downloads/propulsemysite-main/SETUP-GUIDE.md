# Guide de Configuration Supabase 🚀

## 📋 Résumé de la Situation

✅ **Configuré** :
- Variables d'environnement (`.env.local`)
- Client Supabase dans le code
- Packages installés

❌ **À Faire** :
- Créer les tables dans la base de données
- Configurer le bucket storage
- Activer Row Level Security (RLS)

## 🛠️ Instructions Étape par Étape

### 1. Accéder à Supabase Dashboard

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet (celui avec l'URL `https://cdxqumznswtzvfizavt.supabase.co`)

### 2. Créer les Tables

1. Dans le Dashboard, cliquez sur **"SQL Editor"** dans la sidebar
2. Cliquez sur **"New Query"**
3. Copiez-collez le contenu COMPLET du fichier `setup-supabase.sql` dans l'éditeur
4. Cliquez sur **"RUN"** pour exécuter le script
5. Vérifiez qu'il n'y a pas d'erreurs dans la console

### 3. Vérifier les Tables

1. Allez dans **"Table Editor"** dans la sidebar
2. Vous devriez voir toutes ces tables :
   - `clients`
   - `projects`
   - `channels`
   - `messages`
   - `file_uploads`
   - `message_read_status`
   - `user_presence`
   - `call_sessions`

### 4. Configurer le Storage

1. Allez dans **"Storage"** dans la sidebar
2. Cliquez sur **"Create a new bucket"**
3. Nom du bucket : `chat-files`
4. Cochez **"Public bucket"**
5. Cliquez sur **"Create bucket"**

### 5. Vérifier les Politiques RLS

1. Allez dans **"Authentication"** > **"Policies"**
2. Vérifiez que les politiques sont créées pour chaque table
3. Si pas de politiques, retournez au SQL Editor et relancez le script

### 6. Tester la Configuration

Après avoir terminé les étapes ci-dessus, lancez dans le terminal :

```bash
node setup-database.js
```

Vous devriez voir :
- ✅ Tables accessibles
- ✅ Bucket storage créé
- ✅ Données de test insérées

## 🎯 Résultat Attendu

Une fois terminé, vous devriez avoir :
- 8 tables créées et accessibles
- 1 bucket storage `chat-files` 
- Politiques RLS configurées
- Données de test (Client Test, Projet Test, Canal Général)

## 🔧 Dépannage

### Erreur "relation does not exist"
- Les tables ne sont pas créées → Répétez l'étape 2

### Erreur "bucket already exists"
- Normal, le bucket existe déjà → Continuez

### Erreur "policy already exists"
- Normal, les politiques existent déjà → Continuez

### Erreur "permission denied"
- Vérifiez que vous êtes propriétaire du projet Supabase
- Vérifiez les politiques RLS

## 📱 Prochaines Étapes

Une fois la configuration terminée :
1. Testez votre application : `npm run dev`
2. Allez sur `/login` pour tester l'authentification
3. Testez les fonctionnalités de chat
4. Vérifiez les uploads de fichiers

## 🚨 Important

- Ne supprimez pas les fichiers `setup-supabase.sql` et `setup-database.js`
- Gardez une sauvegarde de votre `.env.local`
- En cas de problème, relancez le script SQL complet

---

💡 **Besoin d'aide ?** Consultez la [documentation Supabase](https://supabase.com/docs) ou contactez le support. 