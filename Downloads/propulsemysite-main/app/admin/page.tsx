'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('clients')
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  
  // Form states
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    projectName: '',
    projectDescription: '',
    password: ''
  })

  // Liste dynamique récupérée de Supabase
  const [clients, setClients] = useState<any[]>([])

  // Projets depuis Supabase
  const [projects, setProjects] = useState<any[]>([])

  const [editingClient, setEditingClient] = useState<any | null>(null)

  // Formulaire nouveau projet
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    clientId: ''
  })

  useEffect(() => {
    async function fetchClients() {
      if (!supabase) return
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setClients(data as any[])
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    async function fetchProjects() {
      if (!supabase) return
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, created_at, clients(name)')
        .order('created_at', { ascending: false })
      if (!error && data) {
        // transforme pour avoir client_name directement
        const mapped = (data as any[]).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          created_at: p.created_at,
          client_name: Array.isArray(p.clients) && p.clients.length > 0 ? p.clients[0].name : '—'
        }))
        setProjects(mapped)
      }
    }
    fetchProjects()
  }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setClientForm(prev => ({ ...prev, password }))
  }

  const handleCreateClient = () => {
    console.log('Création client:', clientForm)
    // Ici on intégrerait avec Supabase
    alert(`Client créé !\n\nEmail: ${clientForm.email}\nMot de passe: ${clientForm.password}\n\n(Envoyer ces identifiants au client)`)
    setShowAddClient(false)
    setClientForm({ name: '', email: '', projectName: '', projectDescription: '', password: '' })
  }

  const openEdit = (client: any) => {
    setClientForm({
      name: client.name,
      email: client.email,
      projectName: '',
      projectDescription: '',
      password: ''
    })
    setEditingClient(client)
  }

  async function handleUpdateClient() {
    if (!supabase || !editingClient) return
    const { error } = await supabase
      .from('clients')
      .update({ name: clientForm.name, email: clientForm.email })
      .eq('id', editingClient.id)
    if (!error) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, name: clientForm.name, email: clientForm.email } : c))
      setEditingClient(null)
    } else {
      alert('Erreur mise à jour')
    }
  }

  async function deleteClient(id: string) {
    if (!supabase) return
    const confirm = window.confirm('Supprimer ce client ?')
    if (!confirm) return
    await supabase.from('clients').delete().eq('id', id)
    // rafraîchir la liste
    setClients(prev => prev.filter(c => c.id !== id))
  }

  // Supprimer projet
  async function deleteProject(id: string) {
    if (!supabase) return
    const confirm = window.confirm('Supprimer ce projet ?')
    if (!confirm) return
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  // Créer projet
  async function handleCreateProject() {
    if (!supabase) return
    if (!projectForm.name || !projectForm.clientId) return
    const { data, error } = await supabase.from('projects').insert({
      name: projectForm.name,
      description: projectForm.description,
      client_id: projectForm.clientId,
      status: 'active'
    }).select('id, name, created_at, status, clients(name)').single()
    if (!error && data) {
      const newProj = {
        id: data.id,
        name: data.name,
        status: data.status,
        created_at: data.created_at,
        client_name: Array.isArray(data.clients) && data.clients.length > 0 ? data.clients[0].name : '—'
      }
      setProjects(prev => [newProj, ...prev])
      setShowAddProject(false)
      setProjectForm({ name: '', description: '', clientId: '' })
    } else {
      alert('Erreur création projet')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-black">
                Propulsemysite
              </Link>
              <span className="text-gray-400">|</span>
              <h1 className="text-xl font-medium text-gray-700">Administration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Connecté en tant qu'admin</span>
              <Link href="/" className="text-sm text-black hover:underline">
                Retour au site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clients ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Projets ({projects.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu Clients */}
        {activeTab === 'clients' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-black">Gestion des clients</h2>
              <button
                onClick={() => setShowAddClient(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                + Nouveau client
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.created_at}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => openEdit(client)} className="text-black hover:underline mr-4">Éditer</button>
                        <button onClick={() => deleteClient(client.id)} className="text-red-600 hover:underline">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenu Projets */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-light text-black">Gestion des projets</h2>
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                + Nouveau projet
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.client_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          project.status === 'En cours' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{project.created_at}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/chat?project=${project.id}`} className="text-black hover:underline mr-4">
                          Accéder au chat
                        </Link>
                        <button className="text-black hover:underline mr-4">Éditer</button>
                        <button onClick={() => deleteProject(project.id)} className="text-red-600 hover:underline">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Créer Client */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Créer un nouveau client</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                  placeholder="Marie Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                  placeholder="marie@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du projet
                </label>
                <input
                  type="text"
                  value={clientForm.projectName}
                  onChange={(e) => setClientForm(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                  placeholder="Site E-commerce"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description du projet
                </label>
                <textarea
                  value={clientForm.projectDescription}
                  onChange={(e) => setClientForm(prev => ({ ...prev, projectDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                  rows={3}
                  placeholder="Site de vente en ligne avec catalogue produits..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe temporaire
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={clientForm.password}
                    onChange={(e) => setClientForm(prev => ({ ...prev, password: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                    placeholder="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Générer
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le client pourra le changer à sa première connexion
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddClient(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateClient}
                disabled={!clientForm.name || !clientForm.email || !clientForm.projectName || !clientForm.password}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Créer le client
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Après création :</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Envoyer les identifiants par email au client</li>
                <li>• Les salons Discord seront créés automatiquement</li>
                <li>• Le client pourra se connecter sur /login</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éditer Client */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Modifier le client</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateClient}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
              >
                Sauver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créer Projet */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Créer un nouveau projet</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                <input type="text" value={projectForm.name} onChange={(e)=>setProjectForm(prev=>({...prev,name:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black" placeholder="Site Web" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select value={projectForm.clientId} onChange={(e)=>setProjectForm(prev=>({...prev,clientId:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black">
                  <option value="">-- Sélectionner --</option>
                  {clients.map(c=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={projectForm.description} onChange={(e)=>setProjectForm(prev=>({...prev,description:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-black focus:border-black" rows={3} />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={()=>setShowAddProject(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">Annuler</button>
              <button onClick={handleCreateProject} disabled={!projectForm.name || !projectForm.clientId} className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">Créer le projet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 