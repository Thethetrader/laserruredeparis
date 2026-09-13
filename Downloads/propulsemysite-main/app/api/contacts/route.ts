import { NextRequest, NextResponse } from 'next/server'
import { contactsDb } from '@/lib/localDb'

// GET - Récupérer tous les contacts
export async function GET() {
  try {
    const contacts = await contactsDb.getAll()
    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des contacts' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { full_name, email, project_name, company_website, project_description } = body

    // Validation des champs requis
    if (!full_name || !email || !project_name || !project_description) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Créer le contact
    const newContact = await contactsDb.create({
      full_name,
      email,
      project_name,
      company_website: company_website || '',
      project_description
    })

    return NextResponse.json(newContact, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du contact:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du contact' },
      { status: 500 }
    )
  }
} 