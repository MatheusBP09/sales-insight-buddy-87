import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, TrendingUp, BarChart3, History, Mic, LogOut, Trash2, Calendar, Activity, Target } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { MeetingDetailsDialog } from "@/components/MeetingDetailsDialog";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { MeetingsFilter } from "@/components/MeetingsFilter";
import { CreateMeetingDialog } from "@/components/CreateMeetingDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "all",
    sentiment: "all",
    scoreRange: "all",
    company: "all"
  });
  
  const { meetings, stats, loading: meetingsLoading, deleteMeeting } = useMeetings();

  // Filter meetings based on current filters and group by user
  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!meeting.title.toLowerCase().includes(searchTerm) && 
            !(meeting.client_company?.toLowerCase().includes(searchTerm))) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== "all" && meeting.start_time) {
        const meetingDate = new Date(meeting.start_time);
        const now = new Date();
        
        switch (filters.dateRange) {
          case "today":
            if (meetingDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (meetingDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (meetingDate < monthAgo) return false;
            break;
          case "quarter":
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (meetingDate < quarterAgo) return false;
            break;
        }
      }

      // Sentiment filter
      if (filters.sentiment !== "all") {
        const sentiment = meeting.meeting_insights?.[0]?.sentiment;
        if (sentiment !== filters.sentiment) return false;
      }

      // Score range filter
      if (filters.scoreRange !== "all") {
        const score = meeting.meeting_insights?.[0]?.interest_score || 0;
        switch (filters.scoreRange) {
          case "high":
            if (score < 75) return false;
            break;
          case "medium":
            if (score < 50 || score >= 75) return false;
            break;
          case "low":
            if (score >= 50) return false;
            break;
        }
      }

      // Company filter
      if (filters.company !== "all") {
        if (meeting.client_company !== filters.company) return false;
      }

      return true;
    });
  }, [meetings, filters]);

  // Group meetings by user email
  const meetingsByUser = useMemo(() => {
    const grouped = filteredMeetings.reduce((acc, meeting) => {
      const userEmail = meeting.user_email || meeting.organizer_email || 'Sem email';
      if (!acc[userEmail]) {
        acc[userEmail] = [];
      }
      acc[userEmail].push(meeting);
      return acc;
    }, {} as Record<string, typeof filteredMeetings>);

    // Sort meetings within each user group by date (most recent first)
    Object.keys(grouped).forEach(userEmail => {
      grouped[userEmail].sort((a, b) => {
        const dateA = new Date(a.start_time || a.created_at);
        const dateB = new Date(b.start_time || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
    });

    return grouped;
  }, [filteredMeetings]);

  // Get unique companies for filter
  const companies = useMemo(() => {
    const uniqueCompanies = [...new Set(meetings
      .map(m => m.client_company)
      .filter(Boolean))] as string[];
    return uniqueCompanies;
  }, [meetings]);

  const handleViewDetails = async (meeting: any) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetails(true);
  };

  const handleDeleteConfirm = async () => {
    if (meetingToDelete) {
      await deleteMeeting(meetingToDelete.id);
      setMeetingToDelete(null);
      toast({
        title: "Reunião excluída",
        description: "A reunião foi removida com sucesso"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <header className="border-b border-border bg-gradient-primary/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Sales Analytics Hub</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {meetings.length} reuniões
              </Badge>
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
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Statistics */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Visão Geral</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Última atualização: {new Date().toLocaleString('pt-BR')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Total de Reuniões</CardTitle>
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.totalMeetings}</div>
                    <p className="text-xs text-muted-foreground">
                      Recebidas via webhook
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Score Médio</CardTitle>
                    <Target className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.averageScore}%</div>
                    <Progress value={stats.averageScore} className="h-2 mt-2" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Taxa de Conversão</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.conversionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      Score ≥ 75%
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-card border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Duração Média</CardTitle>
                    <Clock className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stats.averageDuration} min</div>
                    <p className="text-xs text-muted-foreground">
                      Por reunião
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard meetings={meetings} />
          </TabsContent>
          
          <TabsContent value="meetings" className="space-y-6">
            {/* Filters */}
            <MeetingsFilter 
              onFilterChange={setFilters}
              companies={companies}
            />

            {/* Meetings List */}
            <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Reuniões {filteredMeetings.length !== meetings.length && `(${filteredMeetings.length} de ${meetings.length})`}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {filteredMeetings.length} resultados
                    </Badge>
                    <CreateMeetingDialog />
                  </div>
                </div>
              
              {meetingsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse bg-gradient-card border-border/50">
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
              ) : filteredMeetings.length === 0 ? (
                <Card className="bg-gradient-card border-border/50">
                  <CardContent className="text-center py-12">
                    <Mic className="w-12 h-12 mx-auto text-primary mb-4" />
                    <p className="text-lg text-foreground mb-2">
                      {meetings.length === 0 ? "Nenhuma reunião encontrada" : "Nenhuma reunião corresponde aos filtros"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {meetings.length === 0 
                        ? "As reuniões aparecerão aqui quando forem recebidas via webhook" 
                        : "Tente ajustar os filtros para ver mais resultados"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {Object.entries(meetingsByUser).map(([userEmail, userMeetings]) => (
                    <div key={userEmail} className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gradient-subtle rounded-lg border border-primary/20">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{userEmail}</h3>
                          <p className="text-sm text-muted-foreground">
                            {userMeetings.length} reuniões
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
                        {userMeetings.map((meeting) => (
                          <Card key={meeting.id} className="hover:shadow-lg transition-all hover:shadow-primary/10 border-border/50 bg-gradient-card">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg truncate text-foreground">{meeting.title}</CardTitle>
                                <Badge variant={
                                  meeting.status === "completed" ? "default" :
                                  meeting.status === "processing" ? "secondary" : "outline"
                                }>
                                  {meeting.status === "completed" ? "Concluída" :
                                   meeting.status === "processing" ? "Processando" : meeting.status}
                                </Badge>
                              </div>
                              <CardDescription className="text-muted-foreground">
                                {meeting.client_company && `${meeting.client_company} • `}
                                {meeting.start_time 
                                  ? new Date(meeting.start_time).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : new Date(meeting.created_at).toLocaleDateString('pt-BR')
                                }
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
                                {meeting.meeting_insights?.[0]?.interest_score !== undefined && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-foreground">Score de Interesse</span>
                                      <span className="font-medium text-primary">{meeting.meeting_insights[0].interest_score}%</span>
                                    </div>
                                    <Progress value={meeting.meeting_insights[0].interest_score} className="h-2" />
                                  </div>
                                )}
                                {meeting.meeting_insights?.[0]?.sentiment && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Badge 
                                      variant={
                                        meeting.meeting_insights[0].sentiment === 'positive' ? 'default' :
                                        meeting.meeting_insights[0].sentiment === 'negative' ? 'destructive' :
                                        'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {meeting.meeting_insights[0].sentiment === 'positive' ? 'Positivo' :
                                       meeting.meeting_insights[0].sentiment === 'negative' ? 'Negativo' : 'Neutro'}
                                    </Badge>
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
                                    {meeting.status === 'completed' ? 'Ver Detalhes' : 'Processando...'}
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
                    </div>
                  ))}
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Meeting Details Dialog */}
      {selectedMeeting && (
        <MeetingDetailsDialog
          meeting={selectedMeeting}
          transcription={selectedMeeting.corrected_transcript}
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