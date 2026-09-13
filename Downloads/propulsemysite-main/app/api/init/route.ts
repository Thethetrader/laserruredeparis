import { NextResponse } from 'next/server'
import { initializeDb } from '@/lib/localDb'

// GET - Initialiser la base de données
export async function GET() {
  try {
    await initializeDb()
    return NextResponse.json({ 
      message: 'Base de données initialisée avec succès',
      credentials: {
        email: 'test@propulsemysite.com',
        password: 'password123'
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation de la base de données' },
      { status: 500 }
    )
  }
} 