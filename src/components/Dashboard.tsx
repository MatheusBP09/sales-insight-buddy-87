import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  Building2,
  Target,
  MessageSquare,
  BarChart3,
  Filter,
  Download
} from "lucide-react"
import { useMeetings } from "@/hooks/useMeetings"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

interface BusinessUnit {
  name: string;
  display_name: string;
  color: string;
}

interface DashboardStats {
  totalMeetings: number;
  averageScore: number;
  conversionRate: number;
  averageDuration: number;
  byBusinessUnit: Record<string, {
    meetings: number;
    avgScore: number;
    avgDuration: number;
  }>;
  byMeetingType: Record<string, number>;
  recentMeetings: any[];
}

export function Dashboard() {
  const { meetings, stats, loading } = useMeetings()
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchBusinessUnits()
    calculateDashboardStats()
  }, [meetings])

  const fetchBusinessUnits = async () => {
    const { data } = await supabase
      .from('business_units')
      .select('name, color')
      .eq('is_active', true)
      .order('name')

    if (data) {
      setBusinessUnits(data)
    }
  }

  const calculateDashboardStats = () => {
    if (!meetings.length) return

    const byBusinessUnit: Record<string, {meetings: number; avgScore: number; avgDuration: number}> = {}
    const byMeetingType: Record<string, number> = {}

    meetings.forEach(meeting => {
      // Business Unit stats
      const bu = meeting.business_unit || 'outros'
      if (!byBusinessUnit[bu]) {
        byBusinessUnit[bu] = { meetings: 0, avgScore: 0, avgDuration: 0 }
      }
      byBusinessUnit[bu].meetings++
      byBusinessUnit[bu].avgScore += meeting.quality_score || 0
      byBusinessUnit[bu].avgDuration += meeting.duration_seconds || 0

      // Meeting Type stats
      const type = meeting.meeting_type || 'other'
      byMeetingType[type] = (byMeetingType[type] || 0) + 1
    })

    // Calculate averages
    Object.keys(byBusinessUnit).forEach(bu => {
      const count = byBusinessUnit[bu].meetings
      byBusinessUnit[bu].avgScore = Math.round(byBusinessUnit[bu].avgScore / count)
      byBusinessUnit[bu].avgDuration = Math.round(byBusinessUnit[bu].avgDuration / count / 60) // Convert to minutes
    })

    setDashboardStats({
      totalMeetings: meetings.length,
      averageScore: stats.averageScore,
      conversionRate: stats.conversionRate,
      averageDuration: stats.averageDuration,
      byBusinessUnit,
      byMeetingType,
      recentMeetings: meetings.slice(0, 5)
    })
  }

  const getMeetingTypeName = (type: string) => {
    const types: Record<string, string> = {
      'sales_meeting': 'Vendas',
      'client_meeting': 'Atendimento',
      'internal': 'Interna',
      'company_wide': 'All Hands',
      'vendor_partner': 'Parceiros',
      'training_workshop': 'Treinamento',
      'support_ticket': 'Suporte',
      'finance_billing': 'Financeiro',
      'hiring_interview': 'Entrevista',
      'other': 'Outros'
    }
    return types[type] || type
  }

  const getBusinessUnitColor = (buName: string) => {
    const bu = businessUnits.find(b => b.name === buName)
    return bu?.color || '#6b7280'
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Análise completa das suas reuniões de negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Qualidade das reuniões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Reuniões com resultado positivo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.averageDuration || 0}min</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio por reunião
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="business-units">Business Units</TabsTrigger>
          <TabsTrigger value="meeting-types">Tipos de Reunião</TabsTrigger>
          <TabsTrigger value="recent">Reuniões Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Gráfico de evolução será implementado aqui
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Distribuição por Sentimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Positivo</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Neutro</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Negativo</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business-units" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {businessUnits.map((bu) => {
              const stats = dashboardStats?.byBusinessUnit[bu.name]
              return (
                <Card key={bu.name}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{bu.display_name}</CardTitle>
                      <Building2 
                        className="h-5 w-5" 
                        style={{ color: bu.color }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reuniões</span>
                      <span className="font-medium">{stats?.meetings || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Score Médio</span>
                      <Badge 
                        variant={stats?.avgScore && stats.avgScore >= 70 ? "default" : "secondary"}
                      >
                        {stats?.avgScore || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Duração Média</span>
                      <span className="text-sm">{stats?.avgDuration || 0}min</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="meeting-types" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardStats && Object.entries(dashboardStats.byMeetingType).map(([type, count]) => (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {getMeetingTypeName(type)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((count / dashboardStats.totalMeetings) * 100)}% do total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reuniões Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardStats?.recentMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{meeting.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {meeting.client_company} • {getMeetingTypeName(meeting.meeting_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={meeting.quality_score >= 70 ? "default" : "secondary"}
                      >
                        {meeting.quality_score || 0}%
                      </Badge>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getBusinessUnitColor(meeting.business_unit) }}
                        title={meeting.business_unit}
                      />
                    </div>
                  </div>
                ))}
                
                {(!dashboardStats?.recentMeetings.length) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma reunião encontrada</p>
                    <p className="text-sm">As reuniões aparecerão aqui quando forem processadas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}