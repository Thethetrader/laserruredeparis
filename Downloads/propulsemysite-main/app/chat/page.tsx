'use client'

import React, { useState, useEffect } from 'react'
import { useWebRTC } from '../../lib/useWebRTC'
import { supabase } from '../../lib/supabase'

interface Message {
  id: number
  author: string
  content: string
  time: string
  isWelcome?: boolean
}

export default function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState('projet')
  const [message, setMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true)
  const [callingUser, setCallingUser] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [messagesMap, setMessagesMap] = useState<{[key: string]: Message[]}>({})
  const [clientName, setClientName] = useState<string>('Client')

  // WebRTC hook
  const {
    localStream,
    remoteStream,
    isCallActive,
    startCall: rtcStartCall,
    endCall: rtcEndCall,
    toggleMute: rtcToggleMute,
    toggleVideo: rtcToggleVideo,
    toggleScreenShare: rtcToggleScreenShare,
    isMuted,
    isVideoOff,
    isScreenSharing,
    localVideoRef,
    remoteVideoRef
  } = useWebRTC()

  const channels = [
    { 
      name: 'projet', 
      type: 'text',
      icon: '📁',
      description: 'Bienvenue dans l\'espace principal du projet. Vous trouverez ici le suivi global, les étapes clés, les échéances et les points importants à valider ensemble.'
    },
    { 
      name: 'inspirations', 
      type: 'text',
      icon: '💡',
      description: 'N\'hésitez pas à partager ici les sites web que vous appréciez (design, ambiance, fonctionnalités). Cela nous permettra de mieux comprendre vos préférences.'
    },
    { 
      name: 'contenu', 
      type: 'text',
      icon: '📄',
      description: 'Cet espace est dédié à la collecte de tous les contenus nécessaires à votre site : textes, images, vidéos, documents... Vous pouvez tout centraliser ici.'
    },
    { 
      name: 'design-maquettes', 
      type: 'text',
      icon: '🎨',
      description: 'Vous retrouverez ici les propositions de design et les maquettes. Nous pourrons échanger sur vos retours afin d\'affiner l\'identité visuelle du site.'
    },
    { 
      name: 'tests-et-validation', 
      type: 'text',
      icon: '✅',
      description: 'C\'est dans cet espace que je vous transmettrai les liens de prévisualisation du site afin que vous puissiez tester, commenter et valider les différentes étapes.'
    },
    { 
      name: 'questions-réponses', 
      type: 'text',
      icon: '❓',
      description: 'Si vous avez la moindre question ou remarque, n\'hésitez pas à l\'écrire ici. Je reste disponible tout au long du projet pour vous accompagner.'
    },
  ]

     // Messages par salon
   const messagesByChannel = {
     'projet': [
       { id: 1, author: 'Propulsemysite', content: '📁 Bienvenue dans l\'espace principal du projet. Vous trouverez ici le suivi global, les étapes clés, les échéances et les points importants à valider ensemble.\n\nVoici les grandes étapes de votre projet :\n\n1. 💡 Collecte des inspirations\n2. 📄 Rassemblement du contenu\n3. 🎨 Création des maquettes\n4. ✅ Tests et validation\n\nNous sommes prêts à commencer ! 🚀', time: '', isWelcome: true },
     ],
     'inspirations': [
       { id: 1, author: 'Propulsemysite', content: '💡 N\'hésitez pas à partager ici les sites web que vous appréciez (design, ambiance, fonctionnalités). Cela nous permettra de mieux comprendre vos préférences.\n\nVous pouvez partager des liens, des captures d\'écran ou simplement décrire ce qui vous plaît dans certains sites ! 📸', time: '', isWelcome: true },
     ],
     'contenu': [
       { id: 1, author: 'Propulsemysite', content: '📄 Cet espace est dédié à la collecte de tous les contenus nécessaires à votre site : textes, images, vidéos, documents... Vous pouvez tout centraliser ici.\n\nN\'hésitez pas à uploader vos fichiers directement ici. Je peux traiter tous types de documents ! 📎', time: '', isWelcome: true },
     ],
     'design-maquettes': [
       { id: 1, author: 'Propulsemysite', content: '🎨 Vous retrouverez ici les propositions de design et les maquettes. Nous pourrons échanger sur vos retours afin d\'affiner l\'identité visuelle du site.\n\nJe partagerai ici les maquettes au fur et à mesure. N\'hésitez pas à commenter chaque proposition ! ✏️', time: '', isWelcome: true },
     ],
     'tests-et-validation': [
       { id: 1, author: 'Propulsemysite', content: '✅ C\'est dans cet espace que je vous transmettrai les liens de prévisualisation du site afin que vous puissiez tester, commenter et valider les différentes étapes.\n\nJe vous enverrai des liens de test régulièrement. Prenez le temps de tout vérifier ! 🔍', time: '', isWelcome: true },
     ],
     'questions-réponses': [
       { id: 1, author: 'Propulsemysite', content: '❓ Si vous avez la moindre question ou remarque, n\'hésitez pas à l\'écrire ici. Je reste disponible tout au long du projet pour vous accompagner.\n\nAucune question n\'est trop petite ! Je suis là pour vous aider 🤝', time: '', isWelcome: true },
     ],
   }

  // Initialiser les messages par défaut si pas encore chargés
  const defaultMessages = messagesByChannel[selectedChannel as keyof typeof messagesByChannel] || []
  const currentMessages = messagesMap[selectedChannel] || defaultMessages

  // Initialiser le canal avec les messages par défaut s'il n'existe pas encore
  React.useEffect(() => {
    if (!messagesMap[selectedChannel]) {
      setMessagesMap(prev => ({
        ...prev,
        [selectedChannel]: defaultMessages
      }))
    }
  }, [selectedChannel, defaultMessages, messagesMap])

  // Fetch client name once
  useEffect(() => {
    async function fetchClient() {
      if (!supabase) return // Pas de client Supabase en build
      const { data, error } = await supabase
        .from('clients')
        .select('name')
        .limit(1)
        .maybeSingle()
      if (!error && data?.name) {
        setClientName(data.name as string)
      }
    }
    fetchClient()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const files = Array.from(event.dataTransfer.files)
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    return '📁'
  }

  const startCall = async (userName: string) => {
    const ok = await rtcStartCall(true)
    if (ok) {
    setCallingUser(userName)
    }
  }

  const endCall = () => {
    rtcEndCall()
    setCallingUser(null)
  }

  const toggleMute = () => rtcToggleMute()
  const toggleVideo = () => rtcToggleVideo()
  const toggleScreenShare = () => rtcToggleScreenShare()

  // Fonction pour envoyer un message
  const sendMessage = () => {
    if (message.trim() === '' && selectedFiles.length === 0) return

    const newMessage: Message = {
      id: Date.now(),
      author: clientName,
      content: message.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isWelcome: false
    }

    // Ajouter le message au canal actuel
    setMessagesMap(prev => ({
      ...prev,
      [selectedChannel]: [...(prev[selectedChannel] || defaultMessages), newMessage]
    }))

    // Réinitialiser le champ de saisie
    setMessage('')
    setSelectedFiles([])
  }

  // Gérer l'envoi avec Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

      return (
      <div className="h-screen bg-white flex">
        {/* SUPPRESSION DU BOUTON FLECHE MOBILE */}
        {/* {!sidebarOpen && (
          <button className="fixed top-16 left-10 z-30 md:hidden bg-white rounded-full shadow p-2" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )} */}
        {/* Sidebar centre - Channels */}
        <div className={`w-64 bg-white flex flex-col border-r border-gray-100 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:static z-20 h-full md:h-auto md:flex`}>
          {/* Header serveur */}
          <div className="h-16 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm">
            <h1 className="font-medium text-gray-800">Projet "{clientName || 'Nouveau projet'}"</h1>
            <button 
              onClick={() => {
                // Rediriger vers la landing page
                window.location.href = '/'
              }}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors opacity-60 hover:opacity-100"
              title="Se déconnecter"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Liste des channels */}
          <div className="flex-1 p-4">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-3 px-2 tracking-wider">Espaces de discussion</h3>
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  onClick={() => { setSelectedChannel(channel.name); setSidebarOpen(false); }}
                  className={`flex items-center px-3 py-2 rounded-xl cursor-pointer mb-2 transition-all duration-200 group ${selectedChannel === channel.name ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                  title={channel.description}
                >
                  <span className="mr-3 text-lg">{channel.icon}</span>
                  <span className="text-sm font-medium pl-8 md:pl-0">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="block md:hidden p-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Équipe projet</h3>
            <div className="mb-6">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-3 tracking-wider">Actifs maintenant - 2</h4>
              <div className="flex items-center mb-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                  <span className="text-white text-sm font-medium">P</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">Propulsemysite</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Créateur
                  </div>
                </div>
                <button
                  onClick={() => startCall('Propulsemysite')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mb-3 p-3 rounded-xl bg-blue-50">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                  <span className="text-white text-sm font-medium">C</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{clientName}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Membre
                  </div>
                </div>
                <button
                  onClick={() => startCall(clientName)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de chat principale */}
        <div className={`flex-1 flex flex-col md:flex-col transform transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
          {/* Header channel */}
          <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm fixed md:static top-0 left-0 right-0 z-10">
            <div className="flex items-center w-full">
              {!sidebarOpen && (
                <button className="mr-3 md:hidden bg-white rounded-full shadow p-2" onClick={() => setSidebarOpen(true)}>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <span className="text-lg mr-2">
                {channels.find(ch => ch.name === selectedChannel)?.icon || '📁'}
              </span>
              <h2 className="font-semibold text-black">{selectedChannel}</h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto md:flex-1 md:p-4 md:overflow-y-auto pt-16 pb-32 md:pt-4 md:pb-4">
            {currentMessages.map((msg: Message) => (
              <div key={msg.id} className={`mb-4 hover:bg-gray-50 p-3 rounded-lg ${
                msg.isWelcome ? 'bg-blue-50 border-l-4 border-blue-400' : ''
              }`}>
                <div className="flex items-baseline mb-1">
                  <span className="font-semibold text-black mr-2">{msg.author}</span>
                  {msg.time && <span className="text-xs text-gray-500">{msg.time}</span>}
                  {msg.isWelcome && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Message d'accueil
                    </span>
                  )}
                </div>
                <div className="text-gray-800 whitespace-pre-line">{msg.content}</div>
              </div>
            ))}
          </div>

          {/* Zone de saisie */}
          <div className="p-4 border-t border-gray-200 md:p-4 md:border-t md:border-gray-200 fixed md:static bottom-0 left-0 right-0 bg-white z-10">
            {/* Aperçu des fichiers sélectionnés et zone d'upload */}
            {showFileUpload && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fichiers à envoyer ({selectedFiles.length})</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getFileIcon(file.type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{file.name}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                {/* Zone de drag & drop */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  } border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-all duration-200`}
                >
                  <div className="text-gray-500 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm">Glissez vos fichiers ici ou cliquez pour sélectionner</p>
                    <p className="text-xs text-gray-400">Photos, vidéos, documents (max 10MB chacun)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    Choisir des fichiers
                  </label>
                </div>
              </div>
            )}
            {/* Barre de saisie de message */}
            <div className="flex items-center bg-gray-100 rounded-lg px-4 py-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Envoyer un message dans #${selectedChannel}`}
                className="flex-1 bg-transparent outline-none text-black placeholder-gray-500"
              />
              <button
                onClick={() => setShowFileUpload((v) => !v)}
                className="ml-2 text-gray-500 hover:text-black transition-colors"
                title="Joindre un fichier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15V7a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4a1 1 0 001 1h4" />
                </svg>
              </button>
              <button 
                onClick={sendMessage}
                className="ml-2 text-gray-500 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar droite - Membres */}
        {isRightSidebarOpen && (
          <div className="w-64 bg-white border-l border-gray-100 animate-slide-in hidden md:block">
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Équipe projet</h3>
              
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-3 tracking-wider">Actifs maintenant - 2</h4>
                
                <div className="flex items-center mb-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-white text-sm font-medium">P</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">Propulsemysite</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Créateur
                    </div>
                  </div>
                  <button
                    onClick={() => startCall('Propulsemysite')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center mb-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-3 shadow-sm">
                    <span className="text-white text-sm font-medium">C</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{clientName}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Membre
                    </div>
                  </div>
                  <button
                    onClick={() => startCall(clientName)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interface d'appel vidéo */}
        {isCallActive && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              {/* Header appel */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white text-2xl font-medium">
                    {callingUser?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  Appel avec {callingUser}
                </h3>
                <p className="text-sm text-gray-500">Connecté - 00:45</p>
              </div>

              {/* Zone vidéo simulée */}
              <div className="relative mb-6">
                <div className="bg-gray-900 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                  {remoteStream ? (
                    <video ref={remoteVideoRef} className="w-full h-full object-cover" autoPlay playsInline />
                  ) : isScreenSharing ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Partage d'écran actif</p>
                      <p className="text-green-400 text-xs">par {callingUser}</p>
                    </div>
                  ) : isVideoOff ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-xl font-medium">
                          {callingUser?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Caméra désactivée</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-xl font-medium">
                          {callingUser?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Vidéo active</p>
                    </div>
                  )}
                </div>
                
                {/* Petite fenêtre "moi" */}
                <div className="absolute bottom-4 right-4 w-16 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                  {localStream ? (
                    <video ref={localVideoRef} className="w-full h-full object-cover" muted autoPlay playsInline />
                  ) : (
                  <span className="text-white text-xs">Moi</span>
                  )}
                </div>
                
                {/* Indicateur de partage d'écran */}
                {isScreenSharing && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-lg text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Écran partagé
                  </div>
                )}
              </div>

              {/* Contrôles d'appel */}
              <div className="flex justify-center space-x-3">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoOff 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isVideoOff ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-full transition-colors ${
                    isScreenSharing 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  onClick={endCall}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
} 