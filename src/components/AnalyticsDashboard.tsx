import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface AnalyticsDashboardProps {
  meetings: Array<{
    id: string;
    title: string;
    client_company?: string;
    start_time?: string;
    duration_seconds?: number;
    meeting_insights?: Array<{
      interest_score?: number;
      sentiment?: string;
      keywords?: string[];
    }>;
    meeting_participants?: Array<{
      name: string;
      email?: string;
    }>;
  }>;
}

export const AnalyticsDashboard = ({ meetings }: AnalyticsDashboardProps) => {
  const completedMeetings = meetings.filter(m => m.meeting_insights && m.meeting_insights.length > 0);
  
  // Calculate stats
  const totalMeetings = completedMeetings.length;
  const averageScore = totalMeetings > 0 
    ? Math.round(completedMeetings.reduce((acc, m) => acc + (m.meeting_insights?.[0]?.interest_score || 0), 0) / totalMeetings)
    : 0;
  const averageDuration = totalMeetings > 0 
    ? Math.round(completedMeetings.reduce((acc, m) => acc + (m.duration_seconds || 0), 0) / totalMeetings / 60)
    : 0;
  const highInterestCount = completedMeetings.filter(m => (m.meeting_insights?.[0]?.interest_score || 0) >= 75).length;
  const conversionRate = totalMeetings > 0 ? Math.round((highInterestCount / totalMeetings) * 100) : 0;

  // Prepare chart data
  const scoreDistribution = [
    { range: '0-25', count: completedMeetings.filter(m => (m.meeting_insights?.[0]?.interest_score || 0) <= 25).length },
    { range: '26-50', count: completedMeetings.filter(m => {
      const score = m.meeting_insights?.[0]?.interest_score || 0;
      return score > 25 && score <= 50;
    }).length },
    { range: '51-75', count: completedMeetings.filter(m => {
      const score = m.meeting_insights?.[0]?.interest_score || 0;
      return score > 50 && score <= 75;
    }).length },
    { range: '76-100', count: completedMeetings.filter(m => (m.meeting_insights?.[0]?.interest_score || 0) > 75).length }
  ];

  const sentimentData = completedMeetings.reduce((acc, m) => {
    const sentiment = m.meeting_insights?.[0]?.sentiment || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentChartData = Object.entries(sentimentData).map(([key, value]) => ({
    name: key === 'positive' ? 'Positivo' : key === 'negative' ? 'Negativo' : 'Neutro',
    value
  }));

  const COLORS = ['#22c55e', '#ef4444', '#6b7280'];

  // Keywords frequency
  const keywordFreq = completedMeetings.reduce((acc, m) => {
    const keywords = m.meeting_insights?.[0]?.keywords || [];
    keywords.forEach(keyword => {
      acc[keyword] = (acc[keyword] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topKeywords = Object.entries(keywordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  // Meeting timeline data (last 7 days)
  const timelineData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayMeetings = completedMeetings.filter(m => 
      m.start_time && m.start_time.split('T')[0] === dateStr
    );
    const avgScore = dayMeetings.length > 0 
      ? Math.round(dayMeetings.reduce((acc, m) => acc + (m.meeting_insights?.[0]?.interest_score || 0), 0) / dayMeetings.length)
      : 0;
    
    timelineData.push({
      date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      meetings: dayMeetings.length,
      avgScore
    });
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reuniões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Reuniões analisadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <Progress value={averageScore} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Score ≥ 75%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDuration}min</div>
            <p className="text-xs text-muted-foreground">
              Por reunião
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Scores</CardTitle>
            <CardDescription>Interesse dos clientes por faixa</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Sentimento</CardTitle>
            <CardDescription>Tom geral das reuniões</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sentimentChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {sentimentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline and Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Performance dos Últimos 7 Dias</CardTitle>
            <CardDescription>Reuniões e score médio por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Score Médio"
                />
                <Line 
                  type="monotone" 
                  dataKey="meetings" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  name="Nº Reuniões"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Palavras-chave Principais</CardTitle>
            <CardDescription>Temas mais discutidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topKeywords.slice(0, 8).map(({ keyword, count }, index) => (
                <div key={keyword} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{keyword}</span>
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {totalMeetings === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma reunião analisada ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Os dados aparecerão aqui assim que as reuniões começarem a ser recebidas via webhook
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};