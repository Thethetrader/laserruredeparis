import { useState, useRef, useEffect } from 'react'
// @ts-ignore
import SimplePeer from 'simple-peer'

interface UseWebRTCProps {
  onCallReceived?: (caller: string) => void
  onCallEnded?: () => void
}

export const useWebRTC = ({ onCallReceived, onCallEnded }: UseWebRTCProps = {}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  // Initialiser le stream local
  const initializeLocalStream = async (video: boolean = true, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      return stream
    } catch (err) {
      setError('Impossible d\'accéder à la caméra/micro')
      console.error('Error accessing media devices:', err)
      return null
    }
  }

  // Démarrer un appel
  const startCall = async (initiator: boolean = true) => {
    try {
      const stream = await initializeLocalStream()
      if (!stream) return false

      const newPeer = new SimplePeer({
        initiator,
        trickle: false,
        stream
      })

      newPeer.on('signal', (data: any) => {
        // Ici, vous enverriez le signal via votre service de signaling (WebSocket, Supabase, etc.)
        console.log('Signal to send:', data)
      })

      newPeer.on('stream', (remoteStream: MediaStream) => {
        setRemoteStream(remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
      })

      newPeer.on('error', (err: any) => {
        setError('Erreur de connexion')
        console.error('Peer error:', err)
      })

      newPeer.on('close', () => {
        endCall()
      })

      setPeer(newPeer)
      setIsCallActive(true)
      return true
    } catch (err) {
      setError('Erreur lors du démarrage de l\'appel')
      return false
    }
  }

  // Répondre à un appel
  const answerCall = async (signalData: any) => {
    try {
      const stream = await initializeLocalStream()
      if (!stream) return false

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream
      })

      newPeer.on('signal', (data: any) => {
        // Renvoyer le signal de réponse
        console.log('Answer signal:', data)
      })

      newPeer.on('stream', (remoteStream: MediaStream) => {
        setRemoteStream(remoteStream)
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
      })

      newPeer.signal(signalData)
      setPeer(newPeer)
      setIsCallActive(true)
      return true
    } catch (err) {
      setError('Erreur lors de la réponse à l\'appel')
      return false
    }
  }

  // Terminer l'appel
  const endCall = () => {
    if (peer) {
      peer.destroy()
      setPeer(null)
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop())
      setRemoteStream(null)
    }

    setIsCallActive(false)
    setIsMuted(false)
    setIsVideoOff(false)
    setIsScreenSharing(false)
    onCallEnded?.()
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  // Partage d'écran
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })
        
        // Remplacer le stream vidéo par le stream d'écran
        if (peer && localStream) {
          const videoTrack = screenStream.getVideoTracks()[0]
          const sender = (peer as any)._pc.getSenders().find(
            (s: any) => s.track && s.track.kind === 'video'
          )
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }
        
        setIsScreenSharing(true)
        
        // Écouter quand l'utilisateur arrête le partage
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          // Remettre la caméra
          if (peer && localStream) {
            const videoTrack = localStream.getVideoTracks()[0]
            const sender = (peer as any)._pc.getSenders().find(
              (s: any) => s.track && s.track.kind === 'video'
            )
            if (sender) {
              sender.replaceTrack(videoTrack)
            }
          }
        }
      } else {
        // Arrêter le partage d'écran et remettre la caméra
        if (peer && localStream) {
          const videoTrack = localStream.getVideoTracks()[0]
          const sender = (peer as any)._pc.getSenders().find(
            (s: any) => s.track && s.track.kind === 'video'
          )
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        }
        setIsScreenSharing(false)
      }
    } catch (err) {
      setError('Impossible de partager l\'écran')
      console.error('Screen share error:', err)
    }
  }

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  return {
    localStream,
    remoteStream,
    isCallActive,
    isMuted,
    isVideoOff,
    isScreenSharing,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare
  }
} 