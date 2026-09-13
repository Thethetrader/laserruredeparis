import { promises as fs } from 'fs'
import path from 'path'

// Types pour notre base de données locale
export interface Contact {
  id: string
  full_name: string
  email: string
  project_name: string
  company_website?: string
  project_description: string
  created_at: string
}

export interface User {
  id: string
  email: string
  password: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  author_id: string
  author_name: string
  content: string
  created_at: string
}

// Chemins des fichiers de données
const DATA_DIR = path.join(process.cwd(), 'data')
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json')
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json')

// Fonctions utilitaires
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

const readJsonFile = async <T>(filePath: string): Promise<T[]> => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

const writeJsonFile = async <T>(filePath: string, data: T[]) => {
  await ensureDataDir()
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// API pour les contacts
export const contactsDb = {
  async getAll(): Promise<Contact[]> {
    return await readJsonFile<Contact>(CONTACTS_FILE)
  },

  async create(contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
    const contacts = await this.getAll()
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      created_at: new Date().toISOString()
    }
    contacts.push(newContact)
    await writeJsonFile(CONTACTS_FILE, contacts)
    return newContact
  },

  async findByEmail(email: string): Promise<Contact | null> {
    const contacts = await this.getAll()
    return contacts.find(c => c.email === email) || null
  }
}

// API pour les utilisateurs
export const usersDb = {
  async getAll(): Promise<User[]> {
    return await readJsonFile<User>(USERS_FILE)
  },

  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const users = await this.getAll()
    const newUser: User = {
      ...user,
      id: generateId(),
      created_at: new Date().toISOString()
    }
    users.push(newUser)
    await writeJsonFile(USERS_FILE, users)
    return newUser
  },

  async findByEmail(email: string): Promise<User | null> {
    const users = await this.getAll()
    return users.find(u => u.email === email) || null
  },

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email)
    if (user && user.password === password) {
      return user
    }
    return null
  }
}

// API pour les projets
export const projectsDb = {
  async getAll(): Promise<Project[]> {
    return await readJsonFile<Project>(PROJECTS_FILE)
  },

  async create(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const projects = await this.getAll()
    const newProject: Project = {
      ...project,
      id: generateId(),
      created_at: new Date().toISOString()
    }
    projects.push(newProject)
    await writeJsonFile(PROJECTS_FILE, projects)
    return newProject
  },

  async findByClientId(clientId: string): Promise<Project[]> {
    const projects = await this.getAll()
    return projects.filter(p => p.client_id === clientId)
  }
}

// API pour les messages
export const messagesDb = {
  async getAll(): Promise<Message[]> {
    return await readJsonFile<Message>(MESSAGES_FILE)
  },

  async create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const messages = await this.getAll()
    const newMessage: Message = {
      ...message,
      id: generateId(),
      created_at: new Date().toISOString()
    }
    messages.push(newMessage)
    await writeJsonFile(MESSAGES_FILE, messages)
    return newMessage
  },

  async findByChannelId(channelId: string): Promise<Message[]> {
    const messages = await this.getAll()
    return messages.filter(m => m.channel_id === channelId)
  }
}

// Initialisation avec des données de test
export const initializeDb = async () => {
  await ensureDataDir()
  
  // Créer un utilisateur de test s'il n'existe pas
  const users = await usersDb.getAll()
  if (users.length === 0) {
    await usersDb.create({
      email: 'test@propulsemysite.com',
      password: 'password123',
      name: 'Utilisateur Test'
    })
    console.log('✅ Utilisateur de test créé: test@propulsemysite.com / password123')
  }
} 