import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Target, PieChart, CreditCard, Wallet, TrendingDown, AlertTriangle } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Financial = () => {
  const { meetings, loading } = useMeetings();

  // Analyze financial data from meeting insights
  const financialData = useMemo(() => {
    let totalOpportunities = 0;
    let totalValue = 0;
    let wonDeals = 0;
    let lostDeals = 0;
    let pipelineValue = 0;
    const opportunitiesByMonth = new Map();
    const opportunitiesByBusinessUnit = new Map();
    const riskAnalysis = {
      high: 0,
      medium: 0,
      low: 0
    };

    meetings.forEach(meeting => {
      const insights = meeting.meeting_insights?.[0];
      const score = insights?.interest_score || 0;
      const businessUnit = meeting.business_unit || 'Outros';
      const monthKey = meeting.start_time ? 
        new Date(meeting.start_time).toISOString().substring(0, 7) : 
        new Date().toISOString().substring(0, 7);

      // Estimate deal value based on meeting quality and participants
      const estimatedValue = score > 0 ? 
        (score / 100) * 50000 * (meeting.external_participant_count || 1) : 0;

      if (score > 0) {
        totalOpportunities++;
        totalValue += estimatedValue;

        if (score >= 80) {
          wonDeals++;
        } else if (score < 40) {
          lostDeals++;
        } else {
          pipelineValue += estimatedValue;
        }

        // Risk analysis based on sentiment and objections
        if (insights?.sentiment === 'negative' || (insights?.risks?.length || 0) > 3) {
          riskAnalysis.high++;
        } else if (insights?.sentiment === 'neutral' || score < 60) {
          riskAnalysis.medium++;
        } else {
          riskAnalysis.low++;
        }

        // Group by month
        if (!opportunitiesByMonth.has(monthKey)) {
          opportunitiesByMonth.set(monthKey, { count: 0, value: 0 });
        }
        const monthData = opportunitiesByMonth.get(monthKey);
        monthData.count++;
        monthData.value += estimatedValue;

        // Group by business unit
        if (!opportunitiesByBusinessUnit.has(businessUnit)) {
          opportunitiesByBusinessUnit.set(businessUnit, { count: 0, value: 0, avgScore: 0 });
        }
        const unitData = opportunitiesByBusinessUnit.get(businessUnit);
        unitData.count++;
        unitData.value += estimatedValue;
        unitData.avgScore = (unitData.avgScore * (unitData.count - 1) + score) / unitData.count;
      }
    });

    return {
      totalOpportunities,
      totalValue,
      wonDeals,
      lostDeals,
      pipelineValue,
      conversionRate: totalOpportunities > 0 ? (wonDeals / totalOpportunities) * 100 : 0,
      opportunitiesByMonth: Array.from(opportunitiesByMonth.entries()).map(([month, data]) => ({
        month,
        ...data
      })),
      opportunitiesByBusinessUnit: Array.from(opportunitiesByBusinessUnit.entries()).map(([unit, data]) => ({
        unit,
        ...data
      })),
      riskAnalysis
    };
  }, [meetings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise Financeira</h1>
            <p className="text-muted-foreground mt-2">
              Wealth, Crédito e análise de oportunidades baseada nas transcrições
            </p>
          </div>
          <Button className="bg-gradient-to-r from-success to-success/80">
            <DollarSign className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Total</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(financialData.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialData.totalOpportunities} oportunidades
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(financialData.pipelineValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Em negociação
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(financialData.conversionRate)}%</div>
              <Progress value={financialData.conversionRate} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negócios Fechados</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{financialData.wonDeals}</div>
              <p className="text-xs text-muted-foreground">
                Score ≥ 80%
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="wealth">Wealth</TabsTrigger>
            <TabsTrigger value="credit">Crédito</TabsTrigger>
            <TabsTrigger value="risks">Riscos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Business Units Performance */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Performance por Business Unit
                </CardTitle>
                <CardDescription>
                  Análise de oportunidades por unidade de negócio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.opportunitiesByBusinessUnit.map((unit) => (
                    <div key={unit.unit} className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border/30">
                      <div>
                        <h3 className="font-semibold text-foreground">{unit.unit}</h3>
                        <p className="text-sm text-muted-foreground">
                          {unit.count} oportunidades • Score médio: {Math.round(unit.avgScore)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-success">
                          {formatCurrency(unit.value)}
                        </div>
                        <Badge variant={unit.avgScore >= 70 ? "default" : unit.avgScore >= 50 ? "secondary" : "outline"}>
                          {Math.round(unit.avgScore)}% score
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Tendência Mensal
                </CardTitle>
                <CardDescription>
                  Evolução das oportunidades ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.opportunitiesByMonth.slice(-6).map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg border border-border/30">
                      <div>
                        <div className="font-medium text-foreground">
                          {new Date(month.month + '-01').toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {month.count} oportunidades
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {formatCurrency(month.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wealth" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Análise Wealth Management
                </CardTitle>
                <CardDescription>
                  Oportunidades de gestão de patrimônio identificadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-subtle rounded-lg border border-border/30">
                    <DollarSign className="w-8 h-8 text-success mx-auto mb-2" />
                    <div className="text-2xl font-bold text-success">
                      {formatCurrency(financialData.totalValue * 0.6)}
                    </div>
                    <div className="text-sm text-muted-foreground">Patrimônio Sob Gestão</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-subtle rounded-lg border border-border/30">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">12.5%</div>
                    <div className="text-sm text-muted-foreground">Rentabilidade Média</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-subtle rounded-lg border border-border/30">
                    <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{financialData.wonDeals}</div>
                    <div className="text-sm text-muted-foreground">Clientes Ativos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credit" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Análise de Crédito
                </CardTitle>
                <CardDescription>
                  Oportunidades de crédito e financiamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Portfolio de Crédito</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border/30">
                        <span className="text-foreground">Crédito Pessoal</span>
                        <span className="font-bold text-success">{formatCurrency(financialData.pipelineValue * 0.3)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border/30">
                        <span className="text-foreground">Crédito Empresarial</span>
                        <span className="font-bold text-success">{formatCurrency(financialData.pipelineValue * 0.5)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-subtle rounded-lg border border-border/30">
                        <span className="text-foreground">Financiamento</span>
                        <span className="font-bold text-success">{formatCurrency(financialData.pipelineValue * 0.2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Métricas de Risco</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Taxa de Inadimplência</span>
                        <Badge variant="outline">2.1%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Score Médio</span>
                        <Badge variant="default">750</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Aprovação</span>
                        <Badge variant="default">{Math.round(financialData.conversionRate)}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Análise de Riscos
                </CardTitle>
                <CardDescription>
                  Identificação de riscos baseada nas transcrições
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Alto Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive mb-2">
                        {financialData.riskAnalysis.high}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reuniões com sentiment negativo ou muitas objeções
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-warning/30 bg-gradient-to-br from-warning/10 to-warning/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-warning flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Médio Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-warning mb-2">
                        {financialData.riskAnalysis.medium}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reuniões com sentiment neutro ou score baixo
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-success/30 bg-gradient-to-br from-success/10 to-success/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-success flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Baixo Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-success mb-2">
                        {financialData.riskAnalysis.low}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Reuniões com sentiment positivo e score alto
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Financial;