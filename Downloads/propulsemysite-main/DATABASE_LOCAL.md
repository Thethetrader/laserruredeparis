# Base de données locale

## 📋 Vue d'ensemble

Ce projet utilise une base de données locale simple basée sur des fichiers JSON pour stocker les données. Cette solution est parfaite pour le développement et les tests.

## 🗂️ Structure des données

Les données sont stockées dans le dossier `data/` avec les fichiers suivants :

- `users.json` - Comptes utilisateurs
- `contacts.json` - Formulaires de contact soumis
- `projects.json` - Projets clients
- `messages.json` - Messages de chat

## 🔧 API disponibles

### Contacts
- `GET /api/contacts` - Récupérer tous les contacts
- `POST /api/contacts` - Créer un nouveau contact

### Authentification
- `POST /api/auth/login` - Connexion utilisateur

### Initialisation
- `GET /api/init` - Initialiser la base de données

## 🚀 Utilisation

### 1. Initialisation automatique

La base de données est initialisée automatiquement avec un utilisateur de test :

```bash
curl http://localhost:3000/api/init
```

### 2. Compte de test

- **Email :** test@propulsemysite.com
- **Mot de passe :** password123

### 3. Formulaire de contact

Le formulaire de contact fonctionne automatiquement et sauvegarde les données dans `data/contacts.json`.

## 📁 Structure des fichiers

```
data/
├── users.json      # Comptes utilisateurs
├── contacts.json   # Contacts du formulaire
├── projects.json   # Projets clients
└── messages.json   # Messages de chat
```

## 🔍 Exemple de données

### Utilisateur (users.json)
```json
{
  "id": "user123",
  "email": "test@propulsemysite.com",
  "password": "password123",
  "name": "Utilisateur Test",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Contact (contacts.json)
```json
{
  "id": "contact456",
  "full_name": "Jean Dupont",
  "email": "jean@example.com",
  "project_name": "Mon Site Web",
  "company_website": "https://example.com",
  "project_description": "Création d'un site vitrine",
  "created_at": "2024-01-15T10:00:00Z"
}
```

## 💻 Développement

### Ajouter de nouveaux utilisateurs

```javascript
import { usersDb } from '@/lib/localDb'

await usersDb.create({
  email: 'nouveau@email.com',
  password: 'motdepasse',
  name: 'Nouveau Utilisateur'
})
```

### Consulter les contacts

```javascript
import { contactsDb } from '@/lib/localDb'

const contacts = await contactsDb.getAll()
console.log(contacts)
```

## 🔒 Sécurité

⚠️ **Important :** Cette base de données est conçue pour le développement uniquement. Pour la production, utilisez une vraie base de données comme PostgreSQL avec Supabase ou une autre solution sécurisée.

## 📊 Avantages

- ✅ **Simple** : Pas de configuration complexe
- ✅ **Rapide** : Démarrage immédiat
- ✅ **Portable** : Fonctionne partout
- ✅ **Lisible** : Fichiers JSON facilement consultables

## 🔄 Migration vers une vraie base de données

Quand vous serez prêt à migrer vers une base de données de production, vous pourrez facilement remplacer les API routes par des appels à Supabase, PostgreSQL ou MongoDB sans changer le code frontend. 