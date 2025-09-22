import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, TrendingUp, Activity, UserPlus, BarChart3, Eye, Mail } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UsersFilter } from "@/components/UsersFilter";

interface FilterState {
  search: string;
  businessUnit: string;
  scoreRange: string;
  activityStatus: string;
  sortBy: string;
  sortOrder: string;
}

const UsersPage = () => {
  const { meetings, loading } = useMeetings();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    businessUnit: "all",
    scoreRange: "all",
    activityStatus: "all",
    sortBy: "name",
    sortOrder: "asc"
  });

  // Analyze user data from meetings
  const usersData = useMemo(() => {
    const userMap = new Map();
    
    meetings.forEach(meeting => {
      const userEmail = meeting.user_email || meeting.organizer_email;
      const businessUnit = meeting.business_unit || 'Outros';
      
      if (userEmail) {
        if (!userMap.has(userEmail)) {
          userMap.set(userEmail, {
            email: userEmail,
            name: meeting.organizer_name || userEmail.split('@')[0],
            businessUnit,
            meetings: [],
            totalMeetings: 0,
            avgScore: 0,
            totalDuration: 0,
            lastActivity: null
          });
        }
        
        const userData = userMap.get(userEmail);
        userData.meetings.push(meeting);
        userData.totalMeetings++;
        
        if (meeting.duration_seconds) {
          userData.totalDuration += meeting.duration_seconds;
        }
        
        if (meeting.meeting_insights?.[0]?.interest_score) {
          userData.avgScore = userData.meetings
            .filter(m => m.meeting_insights?.[0]?.interest_score)
            .reduce((acc, m) => acc + m.meeting_insights[0].interest_score, 0) / 
            userData.meetings.filter(m => m.meeting_insights?.[0]?.interest_score).length;
        }
        
        if (meeting.start_time && (!userData.lastActivity || new Date(meeting.start_time) > new Date(userData.lastActivity))) {
          userData.lastActivity = meeting.start_time;
        }
      }
    });
    
    return Array.from(userMap.values());
  }, [meetings]);

  // Group users by business unit
  const businessUnits = useMemo(() => {
    const units = new Map();
    
    usersData.forEach(user => {
      const unit = user.businessUnit || 'Outros';
      if (!units.has(unit)) {
        units.set(unit, {
          name: unit,
          users: [],
          totalMeetings: 0,
          avgScore: 0
        });
      }
      
      const unitData = units.get(unit);
      unitData.users.push(user);
      unitData.totalMeetings += user.totalMeetings;
    });
    
    // Calculate average scores for each unit
    units.forEach((unit, key) => {
      const usersWithScores = unit.users.filter(u => u.avgScore > 0);
      if (usersWithScores.length > 0) {
        unit.avgScore = usersWithScores.reduce((acc, u) => acc + u.avgScore, 0) / usersWithScores.length;
      }
    });
    
    return Array.from(units.values());
  }, [usersData]);

  // Enhanced filtering and sorting
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = usersData.filter(user => {
      // Search filter
      const searchMatch = !filters.search || 
        user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        user.businessUnit.toLowerCase().includes(filters.search.toLowerCase());

      // Business unit filter
      const businessUnitMatch = filters.businessUnit === "all" || 
        user.businessUnit === filters.businessUnit;

      // Score range filter
      let scoreMatch = true;
      if (filters.scoreRange !== "all") {
        switch (filters.scoreRange) {
          case "high":
            scoreMatch = user.avgScore >= 75;
            break;
          case "medium":
            scoreMatch = user.avgScore >= 50 && user.avgScore < 75;
            break;
          case "low":
            scoreMatch = user.avgScore > 0 && user.avgScore < 50;
            break;
          case "no-score":
            scoreMatch = user.avgScore === 0;
            break;
        }
      }

      // Activity status filter
      let activityMatch = true;
      if (filters.activityStatus !== "all") {
        const isActive = user.lastActivity && 
          new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        if (filters.activityStatus === "active") {
          activityMatch = isActive;
        } else if (filters.activityStatus === "inactive") {
          activityMatch = !isActive;
        }
      }

      return searchMatch && businessUnitMatch && scoreMatch && activityMatch;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case "meetings":
          aValue = a.totalMeetings;
          bValue = b.totalMeetings;
          break;
        case "score":
          aValue = a.avgScore;
          bValue = b.avgScore;
          break;
        case "lastActivity":
          aValue = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bValue = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        case "businessUnit":
          aValue = a.businessUnit;
          bValue = b.businessUnit;
          break;
        default: // name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [usersData, filters]);

  const totalUsers = usersData.length;
  const activeUsers = usersData.filter(u => u.lastActivity && 
    new Date(u.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  
  const uniqueBusinessUnits = Array.from(new Set(usersData.map(u => u.businessUnit)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-2">
              Análise de usuários e business units baseada nas transcrições
            </p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-primary/80">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Baseado nas transcrições
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Units</CardTitle>
              <Building2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{businessUnits.length}</div>
              <p className="text-xs text-muted-foreground">
                Identificadas automaticamente
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio Geral</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(usersData.reduce((acc, u) => acc + u.avgScore, 0) / usersData.filter(u => u.avgScore > 0).length || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Interesse das reuniões
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Business Units Overview */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Business Units
            </CardTitle>
            <CardDescription>
              Análise de performance por business unit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessUnits.map((unit) => (
                <Card key={unit.name} className="border border-border/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{unit.name}</CardTitle>
                      <Badge variant="outline">
                        {unit.users.length} usuários
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reuniões:</span>
                      <span className="font-medium">{unit.totalMeetings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score médio:</span>
                      <Badge variant={unit.avgScore >= 75 ? "default" : unit.avgScore >= 50 ? "secondary" : "outline"}>
                        {Math.round(unit.avgScore)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <UsersFilter 
          filters={filters}
          onFiltersChange={setFilters}
          businessUnits={uniqueBusinessUnits}
          totalUsers={totalUsers}
          filteredCount={filteredAndSortedUsers.length}
        />

        {/* Users List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Lista de Usuários
            </CardTitle>
            <CardDescription>
              {filteredAndSortedUsers.length > 0 ? (
                `${filteredAndSortedUsers.length} usuário${filteredAndSortedUsers.length !== 1 ? 's' : ''} encontrado${filteredAndSortedUsers.length !== 1 ? 's' : ''}`
              ) : (
                "Nenhum usuário encontrado com os filtros aplicados"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAndSortedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros para ver mais resultados.
                </p>
                <Button variant="outline" onClick={() => setFilters({
                  search: "",
                  businessUnit: "all",
                  scoreRange: "all",
                  activityStatus: "all",
                  sortBy: "name",
                  sortOrder: "asc"
                })}>
                  Limpar Filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAndSortedUsers.map((user) => (
                  <Card key={user.email} className="border border-border/30 hover:shadow-lg transition-all hover:shadow-primary/10">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-foreground text-lg">{user.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
                            >
                              <Building2 className="w-3 h-3 mr-1" />
                              {user.businessUnit}
                            </Badge>
                            {user.lastActivity && (
                              <div className="flex items-center gap-1">
                                <Activity className={`w-3 h-3 ${
                                  new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                    ? 'text-success' : 'text-muted-foreground'
                                }`} />
                                <span className="text-xs text-muted-foreground">
                                  {new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                    ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/30">
                            <div className="text-2xl font-bold text-foreground">{user.totalMeetings}</div>
                            <div className="text-xs text-muted-foreground">Reuniões</div>
                          </div>
                          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 border border-primary/20">
                            <div className={`text-2xl font-bold ${
                              user.avgScore >= 75 ? 'text-success' : 
                              user.avgScore >= 50 ? 'text-primary' : 
                              user.avgScore > 0 ? 'text-warning' : 'text-muted-foreground'
                            }`}>
                              {user.avgScore > 0 ? `${Math.round(user.avgScore)}%` : 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">Score Médio</div>
                          </div>
                          <div className="bg-gradient-to-br from-background to-muted/20 rounded-lg p-3 border border-border/30">
                            <div className="text-2xl font-bold text-foreground">
                              {Math.round(user.totalDuration / 60)}min
                            </div>
                            <div className="text-xs text-muted-foreground">Duração Total</div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="default" size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                      
                      {user.lastActivity && (
                        <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Última atividade: {new Date(user.lastActivity).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <Badge 
                            variant={
                              new Date(user.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                ? "default" : 
                              new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {new Date(user.lastActivity) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                              ? 'Muito Ativo' : 
                            new Date(user.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                              ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage;