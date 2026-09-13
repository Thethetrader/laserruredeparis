import { useState, useEffect, useRef } from 'react'
// @ts-ignore
import toast from 'react-hot-toast'

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  silent?: boolean
  requireInteraction?: boolean
  actions?: NotificationAction[]
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Créer l'élément audio pour les sons de notification
    audioRef.current = new Audio()
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Demander la permission pour les notifications
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Envoyer une notification
  const sendNotification = async (options: NotificationOptions): Promise<void> => {
    // Vérifier si l'utilisateur est sur la page
    if (!document.hidden) {
      return // Ne pas envoyer de notification si l'utilisateur est actif
    }

    if (permission === 'granted') {
      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/favicon.ico',
          tag: options.tag,
          silent: options.silent || false,
          requireInteraction: options.requireInteraction || false
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto-fermer après 5 secondes
        setTimeout(() => {
          notification.close()
        }, 5000)
      } catch (error) {
        console.error('Error sending notification:', error)
      }
    }
  }

  // Jouer un son de notification
  const playNotificationSound = (soundType: 'message' | 'call' | 'error' = 'message'): void => {
    if (audioRef.current) {
      let soundUrl = ''
      
      switch (soundType) {
        case 'message':
          soundUrl = '/sounds/message.mp3'
          break
        case 'call':
          soundUrl = '/sounds/call.mp3'
          break
        case 'error':
          soundUrl = '/sounds/error.mp3'
          break
      }
      
      audioRef.current.src = soundUrl
      audioRef.current.volume = 0.5
      audioRef.current.play().catch(console.error)
    }
  }

  // Notification pour nouveau message
  const notifyNewMessage = (senderName: string, content: string, channelName: string): void => {
    sendNotification({
      title: `${senderName} dans #${channelName}`,
      body: content,
      icon: '/favicon.ico',
      tag: 'new-message'
    })
    
    playNotificationSound('message')
    
    // Toast notification aussi
    toast.success(`${senderName}: ${content}`, {
      duration: 4000,
      position: 'top-right'
    })
  }

  // Notification pour appel entrant
  const notifyIncomingCall = (callerName: string): void => {
    sendNotification({
      title: 'Appel entrant',
      body: `${callerName} vous appelle`,
      icon: '/favicon.ico',
      tag: 'incoming-call',
      requireInteraction: true,
      actions: [
        { action: 'answer', title: 'Répondre' },
        { action: 'decline', title: 'Refuser' }
      ]
    })
    
    playNotificationSound('call')
  }

  // Notification pour fichier reçu
  const notifyFileReceived = (senderName: string, fileName: string, channelName: string): void => {
    sendNotification({
      title: `Fichier reçu dans #${channelName}`,
      body: `${senderName} a envoyé ${fileName}`,
      icon: '/favicon.ico',
      tag: 'file-received'
    })
    
    playNotificationSound('message')
    
    toast.success(`📎 ${senderName} a envoyé ${fileName}`, {
      duration: 4000,
      position: 'top-right'
    })
  }

  // Notification d'erreur
  const notifyError = (message: string): void => {
    playNotificationSound('error')
    
    toast.error(message, {
      duration: 6000,
      position: 'top-right'
    })
  }

  // Notification de succès
  const notifySuccess = (message: string): void => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right'
    })
  }

  // Notification d'information
  const notifyInfo = (message: string): void => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️'
    })
  }

  // Vérifier si l'utilisateur est en train de taper
  const [typingUsers, setTypingUsers] = useState<{[channelId: string]: string[]}>({})

  const addTypingUser = (channelId: string, userName: string): void => {
    setTypingUsers(prev => ({
      ...prev,
      [channelId]: [...(prev[channelId] || []), userName].filter((user, index, arr) => 
        arr.indexOf(user) === index
      )
    }))

    // Supprimer l'utilisateur après 3 secondes
    setTimeout(() => {
      setTypingUsers(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).filter(user => user !== userName)
      }))
    }, 3000)
  }

  const removeTypingUser = (channelId: string, userName: string): void => {
    setTypingUsers(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || []).filter(user => user !== userName)
    }))
  }

  const getTypingIndicator = (channelId: string): string => {
    const users = typingUsers[channelId] || []
    if (users.length === 0) return ''
    
    if (users.length === 1) {
      return `${users[0]} est en train d'écrire...`
    } else if (users.length === 2) {
      return `${users[0]} et ${users[1]} sont en train d'écrire...`
    } else {
      return `${users[0]} et ${users.length - 1} autres sont en train d'écrire...`
    }
  }

  // Gérer les notifications de présence
  const notifyUserOnline = (userName: string): void => {
    notifyInfo(`${userName} est maintenant en ligne`)
  }

  const notifyUserOffline = (userName: string): void => {
    notifyInfo(`${userName} s'est déconnecté`)
  }

  // Gérer les badges de notification
  const [unreadCounts, setUnreadCounts] = useState<{[channelId: string]: number}>({})

  const incrementUnreadCount = (channelId: string): void => {
    setUnreadCounts(prev => ({
      ...prev,
      [channelId]: (prev[channelId] || 0) + 1
    }))

    // Mettre à jour le badge du navigateur
    updateBrowserBadge()
  }

  const resetUnreadCount = (channelId: string): void => {
    setUnreadCounts(prev => ({
      ...prev,
      [channelId]: 0
    }))

    updateBrowserBadge()
  }

  const getTotalUnreadCount = (): number => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  }

  const updateBrowserBadge = (): void => {
    const totalUnread = getTotalUnreadCount()
    
    if ('setAppBadge' in navigator) {
      if (totalUnread > 0) {
        (navigator as any).setAppBadge(totalUnread)
      } else {
        (navigator as any).clearAppBadge()
      }
    }
    
    // Mettre à jour le title de la page
    const baseTitle = 'Propulsemysite'
    document.title = totalUnread > 0 ? `(${totalUnread}) ${baseTitle}` : baseTitle
  }

  return {
    // État des notifications
    permission,
    isSupported,
    
    // Gestion des permissions
    requestPermission,
    
    // Notifications
    sendNotification,
    notifyNewMessage,
    notifyIncomingCall,
    notifyFileReceived,
    notifyError,
    notifySuccess,
    notifyInfo,
    notifyUserOnline,
    notifyUserOffline,
    
    // Sons
    playNotificationSound,
    
    // Indicateurs de frappe
    typingUsers,
    addTypingUser,
    removeTypingUser,
    getTypingIndicator,
    
    // Compteurs non lus
    unreadCounts,
    incrementUnreadCount,
    resetUnreadCount,
    getTotalUnreadCount
  }
} 