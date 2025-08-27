export interface Participant {
  id: string;
  name: string;
  role: string;
  company?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: number; // in minutes
  type: 'prospecting' | 'demo' | 'negotiation' | 'follow-up';
  client: string;
  participants: Participant[];
  audioUrl?: string;
  transcription?: string;
  insights?: MeetingInsights;
  status: 'completed' | 'processing' | 'scheduled';
}

export interface MeetingInsights {
  clientObjections: string[];
  commitments: {
    party: string;
    commitment: string;
    deadline?: string;
  }[];
  nextSteps: string[];
  painPoints: string[];
  valueProposition: string[];
  interestScore: number; // 1-10
  keyWords: { word: string; count: number }[];
  sentiment: 'positive' | 'neutral' | 'negative';
  opportunities: string[];
  risks: string[];
}

export const mockParticipants: Participant[] = [
  { id: '1', name: 'Carlos Silva', role: 'Vendedor', company: 'Nossa Empresa' },
  { id: '2', name: 'Ana Costa', role: 'Gerente Comercial', company: 'Nossa Empresa' },
  { id: '3', name: 'João Santos', role: 'CTO', company: 'TechCorp LTDA' },
  { id: '4', name: 'Maria Oliveira', role: 'Diretora de TI', company: 'TechCorp LTDA' },
  { id: '5', name: 'Pedro Lima', role: 'CEO', company: 'StartupXYZ' },
];

export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Apresentação da Solução - TechCorp',
    date: '2024-01-15T14:30:00',
    duration: 45,
    type: 'demo',
    client: 'TechCorp LTDA',
    participants: [mockParticipants[0], mockParticipants[2], mockParticipants[3]],
    status: 'completed',
    transcription: `Carlos: Boa tarde João e Maria, obrigado por disponibilizarem esse tempo. Vou apresentar nossa solução de automação de processos.

João: Perfeito Carlos. Estamos sempre em busca de otimizar nossos processos internos. Nossa maior dor hoje é a integração entre sistemas.

Carlos: Excelente ponto João. Nossa plataforma resolve exatamente isso. Conseguimos integrar qualquer sistema via API ou webhooks.

Maria: Interessante. E quanto ao custo de implementação? Estamos com orçamento limitado até março.

Carlos: Entendo perfeitamente Maria. Temos planos flexíveis e posso propor um modelo de pagamento que se adeque ao seu timeline. O ROI costuma aparecer em 3-4 meses.

João: Isso é atrativo. Qual seria o próximo passo?

Carlos: Posso agendar uma demo técnica com sua equipe e preparar uma proposta comercial customizada até sexta-feira.

Maria: Perfeito. Vamos seguir assim.`,
    insights: {
      clientObjections: [
        'Orçamento limitado até março',
        'Preocupação com custo de implementação'
      ],
      commitments: [
        { party: 'Carlos Silva', commitment: 'Preparar proposta comercial customizada', deadline: 'sexta-feira' },
        { party: 'Carlos Silva', commitment: 'Agendar demo técnica com equipe' },
        { party: 'TechCorp', commitment: 'Participar da demo técnica' }
      ],
      nextSteps: [
        'Agendar demo técnica',
        'Preparar proposta comercial personalizada',
        'Definir cronograma de implementação'
      ],
      painPoints: [
        'Integração entre sistemas',
        'Processos internos não otimizados',
        'Falta de automação'
      ],
      valueProposition: [
        'Integração via API e webhooks',
        'ROI em 3-4 meses',
        'Planos flexíveis de pagamento',
        'Otimização de processos'
      ],
      interestScore: 8,
      keyWords: [
        { word: 'integração', count: 4 },
        { word: 'processos', count: 3 },
        { word: 'API', count: 2 },
        { word: 'ROI', count: 1 }
      ],
      sentiment: 'positive',
      opportunities: [
        'Cliente demonstrou interesse genuíno',
        'Problema identificado é exatamente o que resolvemos',
        'Abertura para flexibilidade comercial'
      ],
      risks: [
        'Orçamento limitado pode ser impeditivo',
        'Decisão depende de aprovação de múltiplos stakeholders'
      ]
    }
  },
  {
    id: '2',
    title: 'Prospecção - StartupXYZ',
    date: '2024-01-12T10:00:00',
    duration: 30,
    type: 'prospecting',
    client: 'StartupXYZ',
    participants: [mockParticipants[1], mockParticipants[4]],
    status: 'completed',
    transcription: `Ana: Olá Pedro, obrigada por aceitar nossa reunião. Gostaríamos de entender melhor os desafios da StartupXYZ.

Pedro: Claro Ana. Estamos crescendo rapidamente e enfrentando problemas de escalabilidade em nossos processos.

Ana: Entendo. Vocês já tentaram alguma solução de automação?

Pedro: Tentamos algumas ferramentas, mas nada que realmente se adaptasse ao nosso modelo de negócio. Somos muito específicos.

Ana: Interessante. Nossa plataforma é altamente customizável. Já atendemos outras startups em crescimento acelerado.

Pedro: Seria interessante ver alguns cases. Vocês têm disponibilidade para uma apresentação na próxima semana?

Ana: Claro! Vou agendar e enviar alguns materiais por e-mail.`,
    insights: {
      clientObjections: [
        'Soluções anteriores não se adaptaram ao modelo de negócio'
      ],
      commitments: [
        { party: 'Ana Costa', commitment: 'Agendar apresentação para próxima semana' },
        { party: 'Ana Costa', commitment: 'Enviar materiais por e-mail' }
      ],
      nextSteps: [
        'Enviar cases de startups similares',
        'Agendar apresentação detalhada',
        'Preparar demo customizada'
      ],
      painPoints: [
        'Problemas de escalabilidade',
        'Processos não automatizados',
        'Necessidade de customização'
      ],
      valueProposition: [
        'Plataforma altamente customizável',
        'Experiência com startups em crescimento'
      ],
      interestScore: 6,
      keyWords: [
        { word: 'escalabilidade', count: 2 },
        { word: 'processos', count: 2 },
        { word: 'customização', count: 1 }
      ],
      sentiment: 'neutral',
      opportunities: [
        'Cliente está em fase de crescimento',
        'Abertura para soluções customizadas',
        'Necessidade real identificada'
      ],
      risks: [
        'Experiência negativa com soluções anteriores',
        'Pode ser cliente muito exigente quanto à customização'
      ]
    }
  }
];

export const meetingTypes = [
  { value: 'prospecting', label: 'Prospecção', color: 'bg-blue-500' },
  { value: 'demo', label: 'Demo/Apresentação', color: 'bg-purple-500' },
  { value: 'negotiation', label: 'Negociação', color: 'bg-orange-500' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-green-500' }
];

// Mock da análise de IA em tempo real
export const generateMockInsights = (transcription: string): MeetingInsights => {
  // Simulação simplificada de análise de IA
  const words = transcription.toLowerCase().split(/\s+/);
  const wordCount: { [key: string]: number } = {};
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3) {
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
    }
  });

  const topWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));

  // Análise de sentimento básica
  const positiveWords = ['ótimo', 'excelente', 'perfeito', 'interessante', 'bom'];
  const negativeWords = ['problema', 'difícil', 'caro', 'complicado', 'impossível'];
  
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (transcription.toLowerCase().includes(word) ? 1 : 0), 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (transcription.toLowerCase().includes(word) ? 1 : 0), 0);
    
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';

  return {
    clientObjections: ['Análise em processamento...'],
    commitments: [
      { party: 'Vendedor', commitment: 'Enviar proposta comercial' }
    ],
    nextSteps: ['Agendar próximo encontro', 'Enviar materiais complementares'],
    painPoints: ['Identificando pontos de dor...'],
    valueProposition: ['Analisando proposta de valor...'],
    interestScore: Math.floor(Math.random() * 5) + 5, // 5-10
    keyWords: topWords,
    sentiment,
    opportunities: ['Oportunidade identificada na reunião'],
    risks: ['Analisando possíveis riscos...']
  };
};