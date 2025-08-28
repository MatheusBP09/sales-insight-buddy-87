import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Square, Clock, Users, Target, TrendingUp, BarChart3, History, Mic, LogOut, Trash2 } from "lucide-react";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { MeetingDetailsDialog } from "@/components/MeetingDetailsDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [meetingTitle, setMeetingTitle] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [currentMeeting, setCurrentMeeting] = useState<any>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<any>(null);
  
  const { meetings, stats, loading: meetingsLoading, createMeeting, updateMeeting, deleteMeeting } = useMeetings();
  
  const {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadAudio,
    formatTime
  } = useAudioRecording({
    onRecordingComplete: handleRecordingComplete,
    onError: (error) => {
      toast({
        title: "Erro na gravação",
        description: error,
        variant: "destructive"
      });
    }
  });

  async function handleRecordingComplete(recordingId: string, audioBlob: Blob) {
    console.log('=== RECORDING COMPLETE CALLBACK ===');
    console.log('Current meeting at callback:', currentMeeting);
    console.log('Recording ID:', recordingId);
    console.log('Audio blob size:', audioBlob.size);
    
    if (!currentMeeting) {
      console.error('=== NO CURRENT MEETING ERROR ===');
      console.error('currentMeeting is null/undefined when trying to process recording');
      toast({
        title: "Erro crítico",
        description: "Nenhuma reunião ativa encontrada. A gravação pode ter sido perdida.",
        variant: "destructive"
      });
      return;
    }

    const meetingId = currentMeeting.id;
    console.log('Processing recording for meeting:', meetingId);

    try {
      console.log('=== STARTING UPLOAD PROCESS ===');
      await uploadAudio(recordingId, audioBlob, meetingId);
      
      console.log('=== UPLOAD SUCCESSFUL ===');
      toast({
        title: "Gravação processada",
        description: "A gravação foi transcrita e analisada com sucesso"
      });
      
      // Only clear state after successful processing
      setCurrentMeeting(null);
      setMeetingTitle("");
      setClientCompany("");
      
    } catch (error) {
      console.error('=== RECORDING PROCESSING ERROR ===', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        meetingId,
        recordingId,
        currentMeeting: currentMeeting?.id
      });
      
      toast({
        title: "Erro no processamento",
        description: `Falha ao processar a gravação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });

      // Try to update meeting status to failed
      try {
        if (currentMeeting?.id) {
          await updateMeeting(currentMeeting.id, { status: 'failed' });
        }
      } catch (updateError) {
        console.error('Failed to update meeting status to failed:', updateError);
      }
    }
  }

  const handleStartRecording = async () => {
    if (!meetingTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, insira um título para a reunião",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create meeting record first
      const meeting = await createMeeting(meetingTitle, clientCompany || undefined);
      setCurrentMeeting(meeting);
      
      // Start audio recording
      await startRecording();
      
      // Update meeting status to recording
      await updateMeeting(meeting.id, { status: 'recording' });
      
      toast({
        title: "Gravação iniciada",
        description: "A reunião está sendo gravada"
      });
      
    } catch (error) {
      console.error('Error starting meeting:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar a reunião",
        variant: "destructive"
      });
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  const handleStopRecording = async () => {
    console.log('=== STOPPING RECORDING ===');
    console.log('Current meeting before stop:', currentMeeting);
    console.log('Recording time:', recordingTime);
    
    if (!currentMeeting) {
      console.error('=== NO CURRENT MEETING ON STOP ===');
      toast({
        title: "Erro",
        description: "Nenhuma reunião ativa para parar",
        variant: "destructive"
      });
      return;
    }

    // Store meeting info before stopping (to avoid race conditions)
    const meetingToUpdate = { ...currentMeeting };
    const finalRecordingTime = recordingTime;
    
    console.log('Stopping recording for meeting:', meetingToUpdate.id);
    
    // Stop the actual recording
    stopRecording();
    
    // Update meeting with end time and processing status
    try {
      console.log('Updating meeting status to processing...');
      await updateMeeting(meetingToUpdate.id, {
        end_time: new Date().toISOString(),
        duration_seconds: finalRecordingTime,
        status: 'processing'
      });
      console.log('Meeting status updated successfully');
      
      toast({
        title: "Processando gravação",
        description: "A gravação está sendo processada. Aguarde alguns momentos.",
      });
      
    } catch (error) {
      console.error('=== ERROR UPDATING MEETING ===', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da reunião",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = async (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetails(true);
  };

  const handleDeleteConfirm = async () => {
    if (meetingToDelete) {
      await deleteMeeting(meetingToDelete.id);
      setMeetingToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sales Insight Buddy</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Recording Section */}
        <section>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Iniciar Nova Reunião
              </CardTitle>
              <CardDescription>
                Grave e analise suas reuniões de vendas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isRecording ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-title">Título da Reunião</Label>
                    <Input 
                      id="meeting-title" 
                      placeholder="Ex: Reunião com Cliente ABC"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-company">Cliente/Empresa</Label>
                    <Input 
                      id="client-company" 
                      placeholder="Ex: Empresa XYZ Ltda"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleStartRecording}
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    disabled={isProcessing}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processando..." : "Iniciar Gravação"}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono text-primary">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {isPaused ? "Gravação pausada" : "Gravando..."}
                  </div>
                  {currentMeeting && (
                    <div className="text-sm text-muted-foreground">
                      <strong>{currentMeeting.title}</strong>
                      {currentMeeting.client_company && (
                        <> - {currentMeeting.client_company}</>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handlePauseRecording}
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? "Retomar" : "Pausar"}
                    </Button>
                    <Button 
                      onClick={handleStopRecording}
                      variant="destructive"
                      size="sm"
                      disabled={isProcessing}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {isProcessing ? "Processando..." : "Parar"}
                    </Button>
                  </div>
                  {isProcessing && (
                    <div className="text-sm text-muted-foreground">
                      Processando gravação... Isso pode levar alguns momentos.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Meetings */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Reuniões Recentes</h2>
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-2" />
              Ver Todas
            </Button>
          </div>
          
          {meetingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Comece gravando sua primeira reunião de vendas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meetings.slice(0, 3).map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <Badge variant={
                        meeting.status === "completed" ? "default" :
                        meeting.status === "processing" ? "secondary" :
                        meeting.status === "recording" ? "outline" : "default"
                      }>
                        {meeting.status === "completed" ? "Concluída" :
                         meeting.status === "processing" ? "Processando" :
                         meeting.status === "recording" ? "Gravando" : meeting.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {meeting.client_company && `${meeting.client_company} • `}
                      {new Date(meeting.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {meeting.duration_seconds && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {Math.round(meeting.duration_seconds / 60)} min
                        </div>
                      )}
                      {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {meeting.meeting_participants.length} participantes
                        </div>
                      )}
                      {meeting.meeting_insights?.[0]?.interest_score && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Score de Interesse</span>
                            <span className="font-medium">{meeting.meeting_insights[0].interest_score}%</span>
                          </div>
                          <Progress value={meeting.meeting_insights[0].interest_score} className="h-2" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetails(meeting)}
                          disabled={meeting.status !== 'completed'}
                        >
                          {meeting.status === 'completed' ? 'Ver Detalhes' : 'Aguarde processamento'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setMeetingToDelete(meeting)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Reunião</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a reunião "{meeting.title}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setMeetingToDelete(null)}>
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteConfirm}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Statistics */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Estatísticas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de reuniões</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMeetings}</div>
                <p className="text-xs text-muted-foreground">
                  Reuniões gravadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score médio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageScore}%</div>
                <p className="text-xs text-muted-foreground">
                  Interesse dos clientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de conclusão</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Reuniões processadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duração média</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageDuration} min</div>
                <p className="text-xs text-muted-foreground">
                  Tempo por reunião
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      
      {/* Meeting Details Dialog */}
      {selectedMeeting && (
        <MeetingDetailsDialog
          meeting={selectedMeeting}
          transcription={selectedMeeting.transcription}
          insights={selectedMeeting.meeting_insights?.[0]}
          participants={selectedMeeting.meeting_participants}
          open={showMeetingDetails}
          onOpenChange={setShowMeetingDetails}
        />
      )}
    </div>
  );
};

export default Index;