import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Building2, TrendingUp, Activity, Search, Filter, UserPlus, BarChart3 } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const UsersPage = () => {
  const { meetings, loading } = useMeetings();
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredUsers = usersData.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.businessUnit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = usersData.length;
  const activeUsers = usersData.filter(u => u.lastActivity && 
    new Date(u.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

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

        {/* Users List */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Usuários Detalhados
                </CardTitle>
                <CardDescription>
                  Lista completa de usuários baseada nas transcrições
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.email} className="border border-border/30 hover:shadow-lg transition-all hover:shadow-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {user.businessUnit}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-foreground">{user.totalMeetings}</div>
                          <div className="text-xs text-muted-foreground">Reuniões</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-primary">{Math.round(user.avgScore)}%</div>
                          <div className="text-xs text-muted-foreground">Score Médio</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-foreground">
                            {Math.round(user.totalDuration / 60)}min
                          </div>
                          <div className="text-xs text-muted-foreground">Duração Total</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                    
                    {user.lastActivity && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                          Última atividade: {new Date(user.lastActivity).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage;