import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeText, sanitizeUrl, MAX_LENGTHS, checkRateLimit } from '@/lib/validation'

/**
 * Anonymize email for storage - keeps domain but hides username
 * e.g., "user@example.com" becomes "u***@example.com"
 */
function anonymizeEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (!domain) return '***'
  const firstChar = username.charAt(0)
  return `${firstChar}***@${domain}`
}

/**
 * Anonymize name for storage - keeps first name initial only
 * e.g., "John Doe" becomes "J."
 */
function anonymizeName(name: string): string {
  if (!name) return 'Anonymous'
  return `${name.charAt(0).toUpperCase()}.`
}

// POST /api/plants/[id]/suggestions - Submit a suggestion for a plant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Require authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in to submit suggestions' },
        { status: 401 }
      )
    }

    // Rate limiting - max 10 suggestions per hour per user
    const rateLimit = checkRateLimit(`plant-suggestion:${session.user.id}`, 10, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many suggestions. Please try again later.' },
        { status: 429 }
      )
    }
    
    // Verify plant exists
    const plant = await prisma.plantingGuide.findUnique({
      where: { id },
    })
    
    if (!plant) {
      return NextResponse.json(
        { error: 'Plant not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    const {
      section,
      suggestionType,
      currentContent,
      suggestedContent,
      sourceUrl,
      notes,
    } = body
    
    // Validate required fields
    if (!section || !suggestionType || !suggestedContent) {
      return NextResponse.json(
        { error: 'Missing required fields: section, suggestionType, and suggestedContent are required' },
        { status: 400 }
      )
    }
    
    // Validate section
    const validSections = ['general', 'zones', 'facts', 'variations', 'recipes', 'crafts', 'medicinal', 'holistic', 'history', 'growing', 'companions']
    if (!validSections.includes(section)) {
      return NextResponse.json(
        { error: 'Invalid section' },
        { status: 400 }
      )
    }
    
    // Validate suggestion type
    const validTypes = ['addition', 'correction', 'removal']
    if (!validTypes.includes(suggestionType)) {
      return NextResponse.json(
        { error: 'Invalid suggestion type' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedCurrentContent = sanitizeText(currentContent, MAX_LENGTHS.longText)
    const sanitizedSuggestedContent = sanitizeText(suggestedContent, MAX_LENGTHS.longText)
    const sanitizedSourceUrl = sanitizeUrl(sourceUrl)
    const sanitizedNotes = sanitizeText(notes, MAX_LENGTHS.notes)

    // Anonymize PII before storage for privacy protection
    const anonymizedEmail = session.user.email ? anonymizeEmail(session.user.email) : null
    const anonymizedName = session.user.name ? anonymizeName(session.user.name) : 'Anonymous'
    
    // Create the suggestion with anonymized PII
    const suggestion = await prisma.plantSuggestion.create({
      data: {
        plantId: id,
        userId: session.user.id, // Keep userId for internal tracking
        userEmail: anonymizedEmail, // Store anonymized email
        userName: anonymizedName, // Store anonymized name
        section,
        suggestionType,
        currentContent: sanitizedCurrentContent,
        suggestedContent: sanitizedSuggestedContent!,
        sourceUrl: sanitizedSourceUrl,
        notes: sanitizedNotes,
        status: 'pending',
      },
    })
    
    return NextResponse.json({
      message: 'Suggestion submitted successfully',
      suggestionId: suggestion.id,
    })
  } catch (error) {
    console.error('Error creating suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to submit suggestion' },
      { status: 500 }
    )
  }
}

// GET /api/plants/[id]/suggestions - Get suggestions for a plant (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    // Only admins can view suggestions
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })
    
    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    
    const suggestions = await prisma.plantSuggestion.findMany({
      where: {
        plantId: id,
        status,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
