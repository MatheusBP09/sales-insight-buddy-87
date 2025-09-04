import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, TrendingUp, AlertTriangle, Target, MessageSquare } from 'lucide-react';

interface MeetingInsights {
  client_objections?: string[];
  commitments?: string[];
  next_steps?: string[];
  pain_points?: string[];
  opportunities?: string[];
  risks?: string[];
  interest_score?: number;
  sentiment?: string;
  keywords?: string[];
  value_proposition?: string;
}

interface MeetingParticipant {
  name: string;
  company?: string;
  role?: string;
}

interface MeetingDetailsProps {
  meeting: {
    id: string;
    title: string;
    client_company?: string;
    start_time?: string;
    end_time?: string;
    duration_seconds?: number;
    status: string;
    meeting_type: string;
    attachment_docx_url?: string;
    attachment_vtt_url?: string;
    attachment_docx_name?: string;
    attachment_vtt_name?: string;
  };
  transcription?: string;
  insights?: MeetingInsights;
  participants?: MeetingParticipant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDetailsDialog({ 
  meeting, 
  transcription, 
  insights, 
  participants,
  open, 
  onOpenChange 
}: MeetingDetailsProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {meeting.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Meeting Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Informações da Reunião
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{meeting.client_company || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(meeting.status)}>{meeting.status}</Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{meeting.meeting_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Duração:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(meeting.duration_seconds)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Início:</span>
                    <p className="font-medium">{formatDate(meeting.start_time)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Fim:</span>
                    <p className="font-medium">{formatDate(meeting.end_time)}</p>
                  </div>
                </div>

                {participants && participants.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Participantes:</span>
                    <div className="mt-2 space-y-1">
                      {participants.map((participant, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{participant.name}</span>
                          {participant.role && <span className="text-muted-foreground"> - {participant.role}</span>}
                          {participant.company && <span className="text-muted-foreground"> ({participant.company})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Análise de IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score and Sentiment */}
                  <div className="grid grid-cols-2 gap-4">
                    {insights.interest_score && (
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{insights.interest_score}/10</div>
                        <div className="text-sm text-muted-foreground">Score de Interesse</div>
                      </div>
                    )}
                    {insights.sentiment && (
                      <div className="text-center p-4 rounded-lg">
                        <Badge className={getSentimentColor(insights.sentiment)}>{insights.sentiment}</Badge>
                        <div className="text-sm text-muted-foreground mt-2">Sentimento</div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Insights Sections */}
                  <div className="grid gap-4">
                    {insights.pain_points && insights.pain_points.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Pontos de Dor
                        </h4>
                        <ul className="space-y-1">
                          {insights.pain_points.map((point, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.opportunities && insights.opportunities.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-500" />
                          Oportunidades
                        </h4>
                        <ul className="space-y-1">
                          {insights.opportunities.map((opportunity, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {opportunity}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.client_objections && insights.client_objections.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Objeções do Cliente</h4>
                        <ul className="space-y-1">
                          {insights.client_objections.map((objection, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {objection}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.next_steps && insights.next_steps.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Próximos Passos</h4>
                        <ul className="space-y-1">
                          {insights.next_steps.map((step, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.commitments && insights.commitments.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Compromissos</h4>
                        <ul className="space-y-1">
                          {insights.commitments.map((commitment, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {commitment}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.risks && insights.risks.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Riscos</h4>
                        <ul className="space-y-1">
                          {insights.risks.map((risk, index) => (
                            <li key={index} className="text-sm text-muted-foreground">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.keywords && insights.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Palavras-chave</h4>
                        <div className="flex flex-wrap gap-2">
                          {insights.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transcription */}
            {transcription && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 w-full rounded border p-4">
                    <pre className="whitespace-pre-wrap text-sm">{transcription}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {(meeting.attachment_docx_url || meeting.attachment_vtt_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {meeting.attachment_docx_url && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{meeting.attachment_docx_name || 'Documento.docx'}</p>
                          <p className="text-xs text-muted-foreground">Documento Word</p>
                        </div>
                      </div>
                      <a 
                        href={meeting.attachment_docx_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Baixar
                      </a>
                    </div>
                  )}
                  
                  {meeting.attachment_vtt_url && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{meeting.attachment_vtt_name || 'Legenda.vtt'}</p>
                          <p className="text-xs text-muted-foreground">Arquivo de Legenda</p>
                        </div>
                      </div>
                      <a 
                        href={meeting.attachment_vtt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Baixar
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No data message */}
            {!transcription && !insights && !meeting.attachment_docx_url && !meeting.attachment_vtt_url && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ainda não há transcrição ou análise disponível para esta reunião.</p>
                  <p className="text-sm mt-2">Os dados aparecerão aqui após o processamento da gravação.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}