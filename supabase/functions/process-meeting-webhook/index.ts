import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MeetingData {
  meeting_id?: string;
  external_meeting_id?: string;
  online_meeting_id?: string;
  id?: string;
  subject?: string;
  event_subject?: string;
  start_time?: string;
  event_start?: string;
  end_time?: string;
  event_end?: string;
  duration_minutes?: number;
  organizer_name?: string;
  user_name?: string;
  organizer_email?: string;
  user_email?: string;
  participants?: Array<string | {
    name: string;
    email?: string;
    role?: string;
    company?: string;
    speaking_time_seconds?: number;
  }>;
  transcript_content?: string;
  raw_content?: string;
  word_count?: number;
  join_url?: string;
  auto_detected_type?: string;
  business_unit?: string;
  quality_score?: number;
  created_at?: string;
  corrected_transcript?: string;
  executive_summary?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const payload = await req.json()
    console.log('Received payload:', JSON.stringify(payload, null, 2))

    // Extract data - handle n8n format and Python script formats
    let meetingData: MeetingData
    if (payload.Body) {
      console.log('Using n8n format (payload.Body)')
      meetingData = payload.Body
    } else if (payload.body) {
      console.log('Using standard format (payload.body)')
      meetingData = payload.body
    } else {
      console.log('Using direct payload format')
      meetingData = payload
    }

    console.log('Extracted meeting data:', JSON.stringify(meetingData, null, 2))

    // Extract and validate required fields with multiple field names support
    const meetingId = meetingData.meeting_id || meetingData.external_meeting_id || meetingData.online_meeting_id || meetingData.id
    const subject = meetingData.subject || meetingData.event_subject || 'Reunião'
    const organizerEmail = meetingData.organizer_email || meetingData.user_email
    const organizerName = meetingData.organizer_name || meetingData.user_name
    const startTime = meetingData.start_time || meetingData.event_start
    const endTime = meetingData.end_time || meetingData.event_end
    const transcriptContent = meetingData.transcript_content || meetingData.raw_content

    if (!meetingId) {
      throw new Error('meeting_id, external_meeting_id, online_meeting_id ou id é obrigatório')
    }

    if (!organizerEmail) {
      throw new Error('organizer_email ou user_email é obrigatório')
    }

    // Find or create user profile
    let userId: string
    
    // First check if user exists in profiles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id, business_unit')
      .eq('email', organizerEmail)
      .single()

    if (existingProfile) {
      userId = existingProfile.user_id
    } else {
      // Get user from auth.users if exists
      const { data: authUser } = await supabase.auth.admin.listUsers()
      const user = authUser.users.find(u => u.email === organizerEmail)
      
      if (user) {
        userId = user.id
        // Create profile for existing auth user
        await supabase.from('profiles').upsert({
          user_id: userId,
          email: organizerEmail,
          full_name: organizerName || '',
          business_unit: detectBusinessUnit(organizerEmail),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else {
        throw new Error(`Usuário com email ${organizerEmail} não encontrado`)
      }
    }

    // Calculate duration
    let durationSeconds = 0
    if (meetingData.duration_minutes) {
      durationSeconds = meetingData.duration_minutes * 60
    } else if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
    }

    // Classify meeting type and detect business unit
    const meetingType = meetingData.auto_detected_type || classifyMeetingType(
      subject,
      meetingData.participants || [],
      transcriptContent || ''
    )
    
    const businessUnit = meetingData.business_unit || detectBusinessUnit(organizerEmail)

    // Calculate basic scores
    const wordCount = meetingData.word_count || (transcriptContent ? transcriptContent.split(' ').length : 0)
    const qualityScore = meetingData.quality_score || calculateQualityScore(transcriptContent || '')
    const sentimentScore = calculateSentimentScore(transcriptContent || '')
    const engagementScore = calculateEngagementScore(meetingData.participants || [])

    // Upsert meeting data
    const meetingRecord = {
      external_meeting_id: meetingId,
      user_id: userId,
      title: subject,
      meeting_type: meetingType,
      business_unit: businessUnit,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
      duration_seconds: durationSeconds,
      organizer_name: organizerName,
      organizer_email: organizerEmail,
      raw_content: transcriptContent,
      corrected_transcript: meetingData.corrected_transcript,
      executive_summary: meetingData.executive_summary,
      word_count: wordCount,
      quality_score: qualityScore,
      sentiment_score: sentimentScore,
      engagement_score: engagementScore,
      external_participant_count: 0,
      total_participant_count: 0,
      join_url: meetingData.join_url,
      user_email: organizerEmail,
      status: 'completed',
      processed_at: new Date().toISOString(),
      created_at: meetingData.created_at ? new Date(meetingData.created_at).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .upsert(meetingRecord, {
        onConflict: 'external_meeting_id'
      })
      .select()
      .single()

    if (meetingError) {
      console.error('Error upserting meeting:', meetingError)
      throw meetingError
    }

    console.log('Meeting upserted:', meeting.id)

    // Process participants
    if (meetingData.participants && meetingData.participants.length > 0) {
      // Delete existing participants
      await supabase
        .from('meeting_participants')
        .delete()
        .eq('meeting_id', meeting.id)

      // Prepare participants data
      const participantsToInsert = meetingData.participants.map(participant => {
        if (typeof participant === 'string') {
          // Handle string format (email only)
          return {
            meeting_id: meeting.id,
            name: participant.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            email: participant,
            company: participant.split('@')[1],
            role: participant === organizerEmail ? 'host' : 'participant',
            created_at: new Date().toISOString()
          }
        } else {
          // Handle object format
          return {
            meeting_id: meeting.id,
            name: participant.name,
            email: participant.email || null,
            role: participant.role || null,
            company: participant.company || null,
            speaking_time_seconds: participant.speaking_time_seconds || 0,
            created_at: new Date().toISOString()
          }
        }
      })

      // Update participant counts
      const externalCount = participantsToInsert.filter(p => 
        p.email && !p.email.endsWith('@tutorsparticipacoes.com')
      ).length

      await supabase
        .from('meetings')
        .update({
          external_participant_count: externalCount,
          total_participant_count: participantsToInsert.length
        })
        .eq('id', meeting.id)

      // Insert participants
      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participantsToInsert)

      if (participantsError) {
        console.error('Error inserting participants:', participantsError)
      } else {
        console.log(`Inserted ${participantsToInsert.length} participants`)
      }
    }

    // Extract and store keywords
    const keywords = extractKeywords(transcriptContent || meetingData.executive_summary || '')
    if (keywords.length > 0) {
      // Delete existing keywords
      await supabase
        .from('meeting_keywords')
        .delete()
        .eq('meeting_id', meeting.id)

      // Insert new keywords
      const keywordsToInsert = keywords.map(keyword => ({
        meeting_id: meeting.id,
        keyword: keyword.text,
        frequency: keyword.frequency,
        category: keyword.category,
        created_at: new Date().toISOString()
      }))

      const { error: keywordsError } = await supabase
        .from('meeting_keywords')
        .insert(keywordsToInsert)

      if (keywordsError) {
        console.error('Error inserting keywords:', keywordsError)
      } else {
        console.log(`Inserted ${keywordsToInsert.length} keywords`)
      }
    }

    // Generate meeting insights from executive summary
    if (meetingData.executive_summary || transcriptContent) {
      const content = meetingData.executive_summary || transcriptContent
      const insights = {
        meeting_id: meeting.id,
        sentiment: sentimentScore > 0.6 ? 'positive' : sentimentScore < 0.4 ? 'negative' : 'neutral',
        interest_score: qualityScore,
        keywords: extractKeywords(content).map(k => k.text),
        opportunities: extractListFromText(content, ['oportunidade', 'opportunity', 'possibilidade']),
        commitments: extractListFromText(content, ['compromisso', 'commitment', 'decisão', 'ação']),
        next_steps: extractListFromText(content, ['próximo passo', 'next step', 'ação', 'seguimento']),
        pain_points: extractListFromText(content, ['problema', 'pain point', 'dificuldade', 'desafio']),
        risks: extractListFromText(content, ['risco', 'risk', 'preocupação', 'obstáculo']),
        value_proposition: extractValueProposition(content)
      }

      const { error: insightsError } = await supabase
        .from('meeting_insights')
        .upsert(insights, { 
          onConflict: 'meeting_id'
        })

      if (insightsError) {
        console.error('Error creating insights:', insightsError)
      } else {
        console.log('Insights created for meeting:', meeting.id)
      }
    }

    // Generate meeting analytics
    const analytics = generateMeetingAnalytics(transcriptContent || '', meetingData.participants || [])
    
    const { error: analyticsError } = await supabase
      .from('meeting_analytics')
      .upsert({
        meeting_id: meeting.id,
        ...analytics,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'meeting_id'
      })

    if (analyticsError) {
      console.error('Error upserting analytics:', analyticsError)
    } else {
      console.log('Meeting analytics generated')
    }

    return new Response(
      JSON.stringify({
        success: true,
        meeting_id: meeting.id,
        external_meeting_id: meetingId,
        message: 'Reunião processada com sucesso',
        analytics: {
          word_count: wordCount,
          quality_score: qualityScore,
          sentiment_score: sentimentScore,
          engagement_score: engagementScore,
          meeting_type: meetingType,
          business_unit: businessUnit
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error processing meeting webhook:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Erro ao processar dados da reunião'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Helper Functions
function detectBusinessUnit(email: string): string {
  const emailLower = email.toLowerCase()
  
  const buPatterns = {
    'wealth': ['wealth', 'gestao', 'investimentos'],
    'credito': ['credito', 'credit'],
    'hedge': ['hedge', 'fund'],
    'agro': ['agro', 'agronegocio'],
    'seguros': ['seguros', 'insurance']
  }

  for (const [bu, patterns] of Object.entries(buPatterns)) {
    for (const pattern of patterns) {
      if (emailLower.includes(pattern)) {
        return bu
      }
    }
  }

  return 'outros'
}

function classifyMeetingType(subject: string, participants: any[], content: string): string {
  const subjectLower = subject.toLowerCase()
  const contentLower = content.toLowerCase()

  // Keywords for each meeting type
  const keywords = {
    'sales_meeting': ['venda', 'proposta', 'cliente', 'orçamento', 'pitch', 'leads', 'comercial'],
    'client_meeting': ['atendimento', 'suporte', 'dúvida', 'problema', 'solução', 'cliente'],
    'internal': ['alinhamento', 'planejamento', 'status', 'review', 'retrospectiva', 'interno'],
    'training_workshop': ['treinamento', 'capacitação', 'workshop', 'curso', 'aprendizado'],
    'hiring_interview': ['entrevista', 'vaga', 'candidato', 'seleção', 'recrutamento'],
    'finance_billing': ['financeiro', 'cobrança', 'pagamento', 'fatura', 'orçamento'],
    'vendor_partner': ['fornecedor', 'parceiro', 'contrato', 'acordo', 'vendor']
  }

  for (const [meetingType, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (subjectLower.includes(word) || contentLower.includes(word)) {
        return meetingType
      }
    }
  }

  // Logic based on participants
  if (participants.length > 10) {
    return 'company_wide'
  } else if (participants.some(p => {
    const email = typeof p === 'string' ? p : p.email
    return email && !email.endsWith('@tutorsparticipacoes.com')
  })) {
    return 'vendor_partner'
  }

  return 'other'
}

function calculateQualityScore(content: string): number {
  if (!content) return 0

  let score = 50 // Base score

  // Quality indicators
  const qualityIndicators = [
    'próximos passos', 'action items', 'decisão', 'acordo',
    'prazo', 'responsável', 'follow up', 'conclusão',
    'objetivo', 'agenda', 'ação', 'compromisso'
  ]

  const contentLower = content.toLowerCase()
  for (const indicator of qualityIndicators) {
    if (contentLower.includes(indicator)) {
      score += 8
    }
  }

  // Penalty for short content
  if (content.length < 100) {
    score -= 20
  }

  // Bonus for structured content
  if (content.includes('1.') || content.includes('•') || content.includes('-')) {
    score += 10
  }

  return Math.min(100, Math.max(0, score))
}

function calculateSentimentScore(content: string): number {
  if (!content) return 0.5

  const positiveWords = ['acordo', 'sim', 'excelente', 'ótimo', 'perfeito', 'sucesso', 'positivo', 'bom']
  const negativeWords = ['problema', 'não', 'difícil', 'impossível', 'ruim', 'negativo', 'preocupação']

  const contentLower = content.toLowerCase()
  let positiveCount = 0
  let negativeCount = 0

  for (const word of positiveWords) {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length
    positiveCount += matches
  }

  for (const word of negativeWords) {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length
    negativeCount += matches
  }

  const totalWords = positiveCount + negativeCount
  if (totalWords === 0) return 0.5

  return positiveCount / totalWords
}

function calculateEngagementScore(participants: any[]): number {
  if (participants.length === 0) return 0

  // Check if participants have speaking time data
  const hasTimingData = participants.some(p => 
    (typeof p === 'object' && p.speaking_time_seconds !== undefined)
  )

  if (!hasTimingData) {
    // Base score for having participants
    return Math.min(100, participants.length * 20)
  }

  const totalSpeakingTime = participants.reduce((sum, p) => {
    if (typeof p === 'object' && p.speaking_time_seconds) {
      return sum + p.speaking_time_seconds
    }
    return sum
  }, 0)

  if (totalSpeakingTime === 0) return 50

  // Calculate distribution score (better when more evenly distributed)
  const avgSpeakingTime = totalSpeakingTime / participants.length
  const variance = participants.reduce((sum, p) => {
    const speakingTime = (typeof p === 'object' && p.speaking_time_seconds) ? p.speaking_time_seconds : 0
    const diff = speakingTime - avgSpeakingTime
    return sum + diff * diff
  }, 0) / participants.length

  const distributionScore = Math.max(0, 100 - (variance / 1000))
  return Math.min(100, distributionScore)
}

function extractKeywords(content: string): Array<{text: string, frequency: number, category: string}> {
  if (!content) return []

  const businessKeywords = {
    'vendas': ['venda', 'proposta', 'cliente', 'orçamento', 'negociação'],
    'financeiro': ['investimento', 'retorno', 'roi', 'custo', 'lucro', 'receita'],
    'processo': ['processo', 'metodologia', 'estratégia', 'planejamento'],
    'pessoas': ['equipe', 'time', 'colaborador', 'recurso', 'talento'],
    'tecnologia': ['sistema', 'ferramenta', 'automação', 'digital', 'tecnologia'],
    'mercado': ['mercado', 'concorrência', 'oportunidade', 'tendência']
  }

  const keywords: Array<{text: string, frequency: number, category: string}> = []
  const contentLower = content.toLowerCase()

  for (const [category, words] of Object.entries(businessKeywords)) {
    for (const word of words) {
      const regex = new RegExp(word, 'gi')
      const matches = contentLower.match(regex)
      if (matches && matches.length > 0) {
        keywords.push({
          text: word,
          frequency: matches.length,
          category: category
        })
      }
    }
  }

  return keywords.sort((a, b) => b.frequency - a.frequency).slice(0, 20)
}

function extractListFromText(text: string, keywords: string[]): string[] {
  const results: string[] = []
  const sentences = text.split(/[.!?]+/)
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        results.push(sentence.trim())
        break
      }
    }
  }
  
  return results.slice(0, 3) // Limit to 3 items
}

function extractValueProposition(text: string): string {
  const sentences = text.split(/[.!?]+/)
  
  // Look for sentences containing value-related terms
  const valueKeywords = ['benefício', 'vantagem', 'valor', 'solução', 'resultado']
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase()
    for (const keyword of valueKeywords) {
      if (lowerSentence.includes(keyword)) {
        return sentence.trim()
      }
    }
  }
  
  return 'Proposta de valor a ser definida'
}

function generateMeetingAnalytics(content: string, participants: any[]) {
  const words = content.split(' ').filter(word => word.length > 3)
  const sentences = content.split(/[.!?]+/).filter(s => s.length > 10)
  
  return {
    total_words: words.length,
    average_sentence_length: sentences.length > 0 ? words.length / sentences.length : 0,
    questions_asked: (content.match(/\?/g) || []).length,
    action_items_identified: (content.toLowerCase().match(/(ação|tarefa|próximos passos|action item)/g) || []).length,
    next_steps_defined: content.toLowerCase().includes('próximos passos') || content.toLowerCase().includes('follow up'),
    objections_handled: (content.toLowerCase().match(/(objeção|preocupação|mas|porém|entretanto)/g) || []).length,
    decision_points: (content.toLowerCase().match(/(decidir|decisão|definir|escolher)/g) || []).length,
    follow_up_scheduled: content.toLowerCase().includes('agendar') || content.toLowerCase().includes('próxima reunião'),
    agenda_followed: content.toLowerCase().includes('agenda') && content.toLowerCase().includes('item')
  }
}