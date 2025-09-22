import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, LineChart, PieChart, TrendingUp, Download, Filter, Calendar, FileText, Users, Target } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Reports = () => {
  const { meetings, loading } = useMeetings();
  const [dateRange, setDateRange] = useState("30");
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("all");

  // Generate comprehensive reports from meeting data
  const reportsData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    const filteredMeetings = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time || meeting.created_at);
      const passesDateFilter = meetingDate >= cutoffDate;
      const passesBusinessUnitFilter = selectedBusinessUnit === "all" || 
        meeting.business_unit === selectedBusinessUnit;
      
      return passesDateFilter && passesBusinessUnitFilter;
    });

    // Performance Analytics
    const performanceAnalytics = {
      totalMeetings: filteredMeetings.length,
      avgScore: 0,
      highPerformingMeetings: 0,
      totalDuration: 0,
      avgDuration: 0,
      totalParticipants: 0,
      avgParticipants: 0
    };

    // Business Unit Analysis
    const businessUnitAnalysis = new Map();
    
    // Time-based Analysis
    const timeAnalysis = new Map();
    
    // Sentiment Analysis
    const sentimentAnalysis = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    // Keyword Analysis
    const keywordAnalysis = new Map();

    filteredMeetings.forEach(meeting => {
      const insights = meeting.meeting_insights?.[0];
      const score = insights?.interest_score || 0;
      const businessUnit = meeting.business_unit || 'Outros';
      const sentiment = insights?.sentiment || 'neutral';
      const duration = meeting.duration_seconds || 0;
      const participants = meeting.external_participant_count || 0;
      
      // Performance metrics
      if (score > 0) {
        performanceAnalytics.avgScore += score;
        if (score >= 75) {
          performanceAnalytics.highPerformingMeetings++;
        }
      }
      
      performanceAnalytics.totalDuration += duration;
      performanceAnalytics.totalParticipants += participants;

      // Business unit analysis
      if (!businessUnitAnalysis.has(businessUnit)) {
        businessUnitAnalysis.set(businessUnit, {
          meetings: 0,
          totalScore: 0,
          avgScore: 0,
          totalDuration: 0,
          avgDuration: 0,
          conversions: 0
        });
      }
      
      const unitData = businessUnitAnalysis.get(businessUnit);
      unitData.meetings++;
      unitData.totalScore += score;
      unitData.totalDuration += duration;
      if (score >= 80) unitData.conversions++;

      // Time analysis
      const dateKey = new Date(meeting.start_time || meeting.created_at).toISOString().split('T')[0];
      if (!timeAnalysis.has(dateKey)) {
        timeAnalysis.set(dateKey, {
          meetings: 0,
          totalScore: 0,
          avgScore: 0
        });
      }
      
      const dayData = timeAnalysis.get(dateKey);
      dayData.meetings++;
      dayData.totalScore += score;

      // Sentiment analysis
      sentimentAnalysis[sentiment]++;

      // Keyword analysis
      if (insights?.keywords) {
        insights.keywords.forEach(keyword => {
          if (!keywordAnalysis.has(keyword)) {
            keywordAnalysis.set(keyword, {
              frequency: 0,
              totalScore: 0,
              avgScore: 0
            });
          }
          const keywordData = keywordAnalysis.get(keyword);
          keywordData.frequency++;
          keywordData.totalScore += score;
        });
      }
    });

    // Calculate averages
    if (performanceAnalytics.totalMeetings > 0) {
      performanceAnalytics.avgScore = performanceAnalytics.avgScore / filteredMeetings.filter(m => m.meeting_insights?.[0]?.interest_score).length;
      performanceAnalytics.avgDuration = performanceAnalytics.totalDuration / performanceAnalytics.totalMeetings;
      performanceAnalytics.avgParticipants = performanceAnalytics.totalParticipants / performanceAnalytics.totalMeetings;
    }

    // Process business unit data
    businessUnitAnalysis.forEach((data, unit) => {
      data.avgScore = data.totalScore / data.meetings;
      data.avgDuration = data.totalDuration / data.meetings;
    });

    // Process time data
    timeAnalysis.forEach((data, date) => {
      data.avgScore = data.totalScore / data.meetings;
    });

    // Process keyword data
    keywordAnalysis.forEach((data, keyword) => {
      data.avgScore = data.totalScore / data.frequency;
    });

    return {
      performanceAnalytics,
      businessUnitAnalysis: Array.from(businessUnitAnalysis.entries()).map(([unit, data]) => ({
        unit,
        ...data
      })).sort((a, b) => b.avgScore - a.avgScore),
      timeAnalysis: Array.from(timeAnalysis.entries()).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      sentimentAnalysis,
      keywordAnalysis: Array.from(keywordAnalysis.entries()).map(([keyword, data]) => ({
        keyword,
        ...data
      })).sort((a, b) => b.frequency - a.frequency).slice(0, 15)
    };
  }, [meetings, dateRange, selectedBusinessUnit]);

  const businessUnits = useMemo(() => {
    return [...new Set(meetings.map(m => m.business_unit).filter(Boolean))];
  }, [meetings]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios e Métricas</h1>
            <p className="text-muted-foreground mt-2">
              Dashboards e análises baseadas nas transcrições
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Business Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {businessUnits.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportsData.performanceAnalytics.totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Nos últimos {dateRange} dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round(reportsData.performanceAnalytics.avgScore)}%
              </div>
              <Progress value={reportsData.performanceAnalytics.avgScore} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(reportsData.performanceAnalytics.avgDuration)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por reunião
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alta Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {reportsData.performanceAnalytics.highPerformingMeetings}
              </div>
              <p className="text-xs text-muted-foreground">
                Score ≥ 75%
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="business-units" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Business Units
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Tendências
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Distribution */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Distribuição de Sentimentos
                  </CardTitle>
                  <CardDescription>
                    Análise do sentimento geral das reuniões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span className="font-medium text-foreground">Positivo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-success">
                          {reportsData.sentimentAnalysis.positive}
                        </span>
                        <Badge variant="outline">
                          {Math.round((reportsData.sentimentAnalysis.positive / reportsData.performanceAnalytics.totalMeetings) * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-muted/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-muted rounded-full"></div>
                        <span className="font-medium text-foreground">Neutro</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {reportsData.sentimentAnalysis.neutral}
                        </span>
                        <Badge variant="outline">
                          {Math.round((reportsData.sentimentAnalysis.neutral / reportsData.performanceAnalytics.totalMeetings) * 100)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-destructive rounded-full"></div>
                        <span className="font-medium text-foreground">Negativo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-destructive">
                          {reportsData.sentimentAnalysis.negative}
                        </span>
                        <Badge variant="outline">
                          {Math.round((reportsData.sentimentAnalysis.negative / reportsData.performanceAnalytics.totalMeetings) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Keywords */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Palavras-chave Mais Frequentes
                  </CardTitle>
                  <CardDescription>
                    Temas mais discutidos nas reuniões
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportsData.keywordAnalysis.slice(0, 8).map((keyword, index) => (
                      <div key={keyword.keyword} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg border border-border/30">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium text-foreground">{keyword.keyword}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {keyword.frequency}x
                          </Badge>
                          <Badge variant={keyword.avgScore >= 75 ? 'default' : keyword.avgScore >= 50 ? 'secondary' : 'destructive'}>
                            {Math.round(keyword.avgScore)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business-units" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Performance por Business Unit
                </CardTitle>
                <CardDescription>
                  Comparação detalhada entre unidades de negócio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportsData.businessUnitAnalysis.map((unit, index) => (
                    <Card key={unit.unit} className="border border-border/30 hover:shadow-lg transition-all hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">{unit.unit}</h3>
                              <p className="text-sm text-muted-foreground">
                                {unit.meetings} reuniões • {unit.conversions} conversões
                              </p>
                            </div>
                          </div>
                          <Badge variant={unit.avgScore >= 75 ? 'default' : unit.avgScore >= 50 ? 'secondary' : 'destructive'}>
                            {Math.round(unit.avgScore)}% score
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-foreground">{unit.meetings}</div>
                            <div className="text-xs text-muted-foreground">Reuniões</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-primary">{Math.round(unit.avgScore)}%</div>
                            <div className="text-xs text-muted-foreground">Score Médio</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-foreground">
                              {formatDuration(unit.avgDuration)}
                            </div>
                            <div className="text-xs text-muted-foreground">Duração Média</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-success">
                              {Math.round((unit.conversions / unit.meetings) * 100)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Taxa Conversão</div>
                          </div>
                        </div>
                        
                        <Progress value={unit.avgScore} className="h-2 mt-4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-primary" />
                  Tendência Temporal
                </CardTitle>
                <CardDescription>
                  Evolução das métricas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportsData.timeAnalysis.slice(-14).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg border border-border/30">
                      <div>
                        <div className="font-medium text-foreground">
                          {new Date(day.date).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {day.meetings} {day.meetings === 1 ? 'reunião' : 'reuniões'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {Math.round(day.avgScore)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Score médio</div>
                        </div>
                        <div className="w-20">
                          <Progress value={day.avgScore} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Principais Conquistas
                  </CardTitle>
                  <CardDescription>
                    Pontos positivos identificados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="font-medium text-success mb-1">Alta Taxa de Conversão</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((reportsData.performanceAnalytics.highPerformingMeetings / reportsData.performanceAnalytics.totalMeetings) * 100)}% das reuniões têm score ≥ 75%
                      </div>
                    </div>
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="font-medium text-success mb-1">Duração Otimizada</div>
                      <div className="text-sm text-muted-foreground">
                        Reuniões com duração média ideal de {formatDuration(reportsData.performanceAnalytics.avgDuration)}
                      </div>
                    </div>
                    <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                      <div className="font-medium text-success mb-1">Engagement Alto</div>
                      <div className="text-sm text-muted-foreground">
                        Média de {Math.round(reportsData.performanceAnalytics.avgParticipants)} participantes por reunião
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-warning" />
                    Oportunidades de Melhoria
                  </CardTitle>
                  <CardDescription>
                    Áreas que precisam de atenção
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportsData.sentimentAnalysis.negative > 0 && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <div className="font-medium text-warning mb-1">Sentimento Negativo</div>
                        <div className="text-sm text-muted-foreground">
                          {reportsData.sentimentAnalysis.negative} reuniões com sentimento negativo precisam de atenção
                        </div>
                      </div>
                    )}
                    
                    {reportsData.businessUnitAnalysis.some(unit => unit.avgScore < 50) && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <div className="font-medium text-warning mb-1">Unidades com Baixo Performance</div>
                        <div className="text-sm text-muted-foreground">
                          Algumas business units têm score abaixo de 50%
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="font-medium text-warning mb-1">Consistência</div>
                      <div className="text-sm text-muted-foreground">
                        Trabalhar na padronização do processo de vendas
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;