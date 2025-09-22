import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, TrendingUp, BarChart3, History, Mic, LogOut, Trash2, Calendar, Activity, Target, ChevronDown, ChevronRight, Home, Presentation, Grid3X3, List, User, Search, Filter, Eye, ExpandIcon, ShrinkIcon } from "lucide-react";
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
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
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

  const toggleUserExpanded = (userEmail: string) => {
    const newExpandedUsers = new Set(expandedUsers);
    if (newExpandedUsers.has(userEmail)) {
      newExpandedUsers.delete(userEmail);
    } else {
      newExpandedUsers.add(userEmail);
    }
    setExpandedUsers(newExpandedUsers);
  };

  const expandAllUsers = () => {
    const allUsers = Object.keys(meetingsByUser);
    setExpandedUsers(new Set(allUsers));
  };

  const collapseAllUsers = () => {
    setExpandedUsers(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      {/* Header */}
      <header className="border-b border-border/50 bg-gradient-to-r from-card/95 to-card/50 backdrop-blur-lg sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <Activity className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-success to-success/80 rounded-full border-2 border-background"></div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Analytics Hub</h1>
                <p className="text-base text-muted-foreground font-medium">
                  Bem-vindo, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">{meetings.length}</span>
                    <span className="text-xs text-muted-foreground">reuniões</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="lg" 
                onClick={signOut}
                className="group hover:bg-destructive/10 hover:text-destructive border border-border/50 hover:border-destructive/30 transition-all duration-300"
              >
                <LogOut className="w-5 h-5 mr-3 group-hover:animate-pulse" />
                <span className="font-medium">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6">
        {/* Navigation Tabs */}
        <div className="sticky top-[120px] z-40 -mt-4 mb-8">
          <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-lg p-2">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="dashboard" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 rounded-xl py-4 px-6 text-base font-semibold transition-all duration-300 hover:bg-muted/50"
                >
                  <Home className="w-5 h-5 mr-3" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="meetings"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 rounded-xl py-4 px-6 text-base font-semibold transition-all duration-300 hover:bg-muted/50"
                >
                  <Presentation className="w-5 h-5 mr-3" />
                  Reuniões
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="pb-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            </TabsList>
          
            <TabsContent value="dashboard" className="space-y-8 animate-fade-in">
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
          
          <TabsContent value="meetings" className="space-y-8 animate-fade-in">
            {/* Filters */}
            <MeetingsFilter 
              onFilterChange={setFilters}
              companies={companies}
            />

            {/* Meetings List */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Reuniões {filteredMeetings.length !== meetings.length && `(${filteredMeetings.length} de ${meetings.length})`}
                  </h2>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {Object.keys(meetingsByUser).length} pessoas • {filteredMeetings.length} reuniões
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-muted/30 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grouped')}
                      className="h-8 px-3"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Por Pessoa
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="w-4 h-4 mr-2" />
                      Lista
                    </Button>
                  </div>

                  {/* Expand/Collapse All - Only show in grouped mode */}
                  {viewMode === 'grouped' && Object.keys(meetingsByUser).length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={expandAllUsers}
                        className="h-8 px-3"
                      >
                        <ExpandIcon className="w-4 h-4 mr-2" />
                        Expandir Tudo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={collapseAllUsers}
                        className="h-8 px-3"
                      >
                        <ShrinkIcon className="w-4 h-4 mr-2" />
                        Recolher Tudo
                      </Button>
                    </div>
                  )}

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
                <>
                  {/* Grouped View - Por Pessoa */}
                  {viewMode === 'grouped' && (
                    <div className="space-y-6">
                      {Object.entries(meetingsByUser).map(([userEmail, userMeetings]) => {
                        const isExpanded = expandedUsers.has(userEmail);
                        const avgScore = userMeetings.reduce((acc, meeting) => {
                          const score = meeting.meeting_insights?.[0]?.interest_score;
                          return score ? acc + score : acc;
                        }, 0) / userMeetings.filter(m => m.meeting_insights?.[0]?.interest_score).length || 0;

                        return (
                          <div key={userEmail} className="space-y-4">
                            <Card 
                              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:shadow-primary/10 border-primary/30 bg-gradient-to-r from-card to-card/80 hover:border-primary/50"
                              onClick={() => toggleUserExpanded(userEmail)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="relative">
                                      <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                                        <Users className="w-7 h-7 text-primary-foreground" />
                                      </div>
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-success to-success/80 rounded-full border-2 border-card flex items-center justify-center">
                                        <span className="text-xs font-bold text-success-foreground">{userMeetings.length}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-foreground mb-1">{userEmail.split('@')[0]}</h3>
                                      <p className="text-sm text-muted-foreground mb-2">{userEmail}</p>
                                      <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {userMeetings.length} {userMeetings.length === 1 ? 'reunião' : 'reuniões'}
                                        </Badge>
                                        {avgScore > 0 && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Score médio:</span>
                                            <Badge variant={avgScore >= 75 ? "default" : avgScore >= 50 ? "secondary" : "destructive"} className="font-semibold">
                                              {Math.round(avgScore)}%
                                            </Badge>
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                          Última: {new Date(userMeetings[0].start_time || userMeetings[0].created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Expandir e filtrar por este usuário
                                        if (!isExpanded) toggleUserExpanded(userEmail);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Ver Reuniões
                                    </Button>
                                    <div className="text-center">
                                      {isExpanded ? (
                                        <ChevronDown className="w-6 h-6 text-primary" />
                                      ) : (
                                        <ChevronRight className="w-6 h-6 text-muted-foreground" />
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {isExpanded ? 'Recolher' : 'Expandir'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {isExpanded && (
                              <div className="ml-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animated-fadeIn">
                                {userMeetings.map((meeting) => (
                                  <Card key={meeting.id} className="hover:shadow-lg transition-all hover:shadow-primary/10 border-border/50 bg-gradient-card group">
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-base truncate text-foreground group-hover:text-primary transition-colors">
                                          {meeting.title}
                                        </CardTitle>
                                        <Badge variant={
                                          meeting.status === "completed" ? "default" :
                                          meeting.status === "processing" ? "secondary" : "outline"
                                        } className="text-xs">
                                          {meeting.status === "completed" ? "✓" :
                                           meeting.status === "processing" ? "⏳" : meeting.status}
                                        </Badge>
                                      </div>
                                      <CardDescription className="text-xs text-muted-foreground">
                                        {meeting.client_company && (
                                          <Badge variant="outline" className="text-xs mr-2 mb-1">
                                            {meeting.client_company}
                                          </Badge>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                          <Calendar className="w-3 h-3" />
                                          {meeting.start_time 
                                            ? new Date(meeting.start_time).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })
                                            : new Date(meeting.created_at).toLocaleDateString('pt-BR')
                                          }
                                        </div>
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                          {meeting.duration_seconds && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                              <Clock className="w-3 h-3" />
                                              {Math.round(meeting.duration_seconds / 60)}min
                                            </div>
                                          )}
                                          {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                              <Users className="w-3 h-3" />
                                              {meeting.meeting_participants.length}
                                            </div>
                                          )}
                                        </div>
                                        
                                        {meeting.meeting_insights?.[0]?.interest_score !== undefined && (
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-foreground font-medium">Score de Interesse</span>
                                              <Badge variant={
                                                meeting.meeting_insights[0].interest_score >= 75 ? "default" :
                                                meeting.meeting_insights[0].interest_score >= 50 ? "secondary" : "destructive"
                                              } className="text-xs font-bold">
                                                {meeting.meeting_insights[0].interest_score}%
                                              </Badge>
                                            </div>
                                            <Progress value={meeting.meeting_insights[0].interest_score} className="h-2" />
                                          </div>
                                        )}
                                        
                                        {meeting.meeting_insights?.[0]?.sentiment && (
                                          <div className="flex items-center justify-center">
                                            <Badge 
                                              variant={
                                                meeting.meeting_insights[0].sentiment === "positive" ? "default" :
                                                meeting.meeting_insights[0].sentiment === "negative" ? "destructive" : "secondary"
                                              }
                                              className="text-xs"
                                            >
                                              {meeting.meeting_insights[0].sentiment === "positive" ? "😊 Positivo" :
                                               meeting.meeting_insights[0].sentiment === "negative" ? "😞 Negativo" : "😐 Neutro"}
                                            </Badge>
                                          </div>
                                        )}
                                        
                                        <div className="flex gap-2 pt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewDetails(meeting)}
                                            className="flex-1 text-xs h-8"
                                          >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Detalhes
                                          </Button>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setMeetingToDelete(meeting)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Tem certeza que deseja excluir a reunião "{meetingToDelete?.title}"? 
                                                  Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List View - Lista Cronológica */}
                  {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMeetings.map((meeting) => (
                        <Card key={meeting.id} className="hover:shadow-lg transition-all hover:shadow-primary/10 border-border/50 bg-gradient-card group">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base truncate text-foreground group-hover:text-primary transition-colors">
                                {meeting.title}
                              </CardTitle>
                              <Badge variant={
                                meeting.status === "completed" ? "default" :
                                meeting.status === "processing" ? "secondary" : "outline"
                              } className="text-xs">
                                {meeting.status === "completed" ? "✓" :
                                 meeting.status === "processing" ? "⏳" : meeting.status}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3" />
                                <span className="font-medium">{meeting.user_email || meeting.organizer_email || 'Sem email'}</span>
                              </div>
                              {meeting.client_company && (
                                <Badge variant="outline" className="text-xs mr-2 mb-1">
                                  {meeting.client_company}
                                </Badge>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="w-3 h-3" />
                                {meeting.start_time 
                                  ? new Date(meeting.start_time).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : new Date(meeting.created_at).toLocaleDateString('pt-BR')
                                }
                              </div>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                {meeting.duration_seconds && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {Math.round(meeting.duration_seconds / 60)}min
                                  </div>
                                )}
                                {meeting.meeting_participants && meeting.meeting_participants.length > 0 && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    {meeting.meeting_participants.length}
                                  </div>
                                )}
                              </div>
                              
                              {meeting.meeting_insights?.[0]?.interest_score !== undefined && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-foreground font-medium">Score</span>
                                    <Badge variant={
                                      meeting.meeting_insights[0].interest_score >= 75 ? "default" :
                                      meeting.meeting_insights[0].interest_score >= 50 ? "secondary" : "destructive"
                                    } className="text-xs font-bold">
                                      {meeting.meeting_insights[0].interest_score}%
                                    </Badge>
                                  </div>
                                  <Progress value={meeting.meeting_insights[0].interest_score} className="h-2" />
                                </div>
                              )}
                              
                              {meeting.meeting_insights?.[0]?.sentiment && (
                                <div className="flex items-center justify-center">
                                  <Badge 
                                    variant={
                                      meeting.meeting_insights[0].sentiment === "positive" ? "default" :
                                      meeting.meeting_insights[0].sentiment === "negative" ? "destructive" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {meeting.meeting_insights[0].sentiment === "positive" ? "😊 Positivo" :
                                     meeting.meeting_insights[0].sentiment === "negative" ? "😞 Negativo" : "😐 Neutro"}
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(meeting)}
                                  className="flex-1 text-xs h-8"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Detalhes
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setMeetingToDelete(meeting)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir a reunião "{meetingToDelete?.title}"? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
                </>
              )}
            </section>
            </TabsContent>
          </Tabs>
        </div>
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