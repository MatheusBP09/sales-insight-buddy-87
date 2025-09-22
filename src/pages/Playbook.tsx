import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Target, TrendingUp, Settings, Plus, Edit, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Playbook = () => {
  const { meetings, loading } = useMeetings();
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    keywords: "",
    meetingType: "",
    weight: 1.0,
    minScore: 0,
    maxScore: 100
  });

  // Analyze playbook performance from meetings
  const playbookAnalysis = useMemo(() => {
    const rulePerformance = new Map();
    const keywordFrequency = new Map();
    const meetingTypeAnalysis = new Map();
    
    let totalScore = 0;
    let totalMeetings = 0;
    
    meetings.forEach(meeting => {
      const insights = meeting.meeting_insights?.[0];
      const score = insights?.interest_score || 0;
      const meetingType = meeting.meeting_type || 'sales_call';
      
      if (score > 0) {
        totalScore += score;
        totalMeetings++;
        
        // Analyze meeting type performance
        if (!meetingTypeAnalysis.has(meetingType)) {
          meetingTypeAnalysis.set(meetingType, {
            count: 0,
            totalScore: 0,
            avgScore: 0,
            bestPractices: [],
            improvements: []
          });
        }
        
        const typeData = meetingTypeAnalysis.get(meetingType);
        typeData.count++;
        typeData.totalScore += score;
        typeData.avgScore = typeData.totalScore / typeData.count;
        
        // Analyze keywords from insights
        if (insights?.keywords) {
          insights.keywords.forEach(keyword => {
            if (!keywordFrequency.has(keyword)) {
              keywordFrequency.set(keyword, { count: 0, totalScore: 0, avgScore: 0 });
            }
            const keywordData = keywordFrequency.get(keyword);
            keywordData.count++;
            keywordData.totalScore += score;
            keywordData.avgScore = keywordData.totalScore / keywordData.count;
          });
        }
        
        // Best practices identification
        if (score >= 80) {
          if (insights?.next_steps?.length > 0) {
            typeData.bestPractices.push("Definição clara de próximos passos");
          }
          if (insights?.commitments?.length > 0) {
            typeData.bestPractices.push("Comprometimentos assumidos");
          }
          if (meeting.duration_seconds > 1800) { // 30 min
            typeData.bestPractices.push("Reunião com duração adequada");
          }
        }
        
        // Improvement opportunities
        if (score < 60) {
          if (!insights?.next_steps?.length) {
            typeData.improvements.push("Falta de definição de próximos passos");
          }
          if (insights?.risks?.length > 2) {
            typeData.improvements.push("Muitos riscos identificados");
          }
          if (meeting.duration_seconds < 900) { // 15 min
            typeData.improvements.push("Reunião muito curta");
          }
        }
      }
    });
    
    // Remove duplicates from best practices and improvements
    meetingTypeAnalysis.forEach((data, type) => {
      data.bestPractices = [...new Set(data.bestPractices)];
      data.improvements = [...new Set(data.improvements)];
    });
    
    return {
      averageScore: totalMeetings > 0 ? totalScore / totalMeetings : 0,
      totalMeetings,
      keywordFrequency: Array.from(keywordFrequency.entries())
        .map(([keyword, data]) => ({ keyword, ...data }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 20),
      meetingTypeAnalysis: Array.from(meetingTypeAnalysis.entries())
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.avgScore - a.avgScore)
    };
  }, [meetings]);

  const mockPlaybookRules = [
    {
      id: 1,
      name: "Descoberta de Necessidades",
      description: "Identificar dores e necessidades do cliente através de perguntas abertas",
      keywords: ["necessidade", "problema", "dor", "desafio", "objetivo"],
      meetingType: "sales_call",
      weight: 2.0,
      performance: 85,
      status: "active"
    },
    {
      id: 2,
      name: "Apresentação de Valor",
      description: "Demonstrar como nossa solução resolve os problemas identificados",
      keywords: ["solução", "benefício", "valor", "resultado", "impacto"],
      meetingType: "sales_call",
      weight: 1.8,
      performance: 78,
      status: "active"
    },
    {
      id: 3,
      name: "Tratamento de Objeções",
      description: "Identificar e responder adequadamente às objeções do cliente",
      keywords: ["objeção", "preocupação", "dúvida", "problema", "limitação"],
      meetingType: "sales_call",
      weight: 1.5,
      performance: 62,
      status: "needs_improvement"
    },
    {
      id: 4,
      name: "Fechamento e Próximos Passos",
      description: "Definir claramente os próximos passos e comprometimentos",
      keywords: ["próximo passo", "compromisso", "prazo", "decisão", "aprovação"],
      meetingType: "sales_call",
      weight: 2.0,
      performance: 71,
      status: "active"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Playbook de Vendas</h1>
            <p className="text-muted-foreground mt-2">
              Regras e configurações baseadas na análise das transcrições
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary/80">
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Regra do Playbook</DialogTitle>
                <DialogDescription>
                  Defina uma nova regra para análise automática das reuniões
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Regra</Label>
                    <Input
                      id="name"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      placeholder="Ex: Descoberta de Necessidades"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meetingType">Tipo de Reunião</Label>
                    <Select value={newRule.meetingType} onValueChange={(value) => setNewRule({...newRule, meetingType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales_call">Chamada de Vendas</SelectItem>
                        <SelectItem value="demo">Demonstração</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="negotiation">Negociação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    placeholder="Descreva o objetivo desta regra..."
                  />
                </div>
                <div>
                  <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    value={newRule.keywords}
                    onChange={(e) => setNewRule({...newRule, keywords: e.target.value})}
                    placeholder="necessidade, problema, dor, desafio"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5.0"
                      value={newRule.weight}
                      onChange={(e) => setNewRule({...newRule, weight: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minScore">Score Mínimo</Label>
                    <Input
                      id="minScore"
                      type="number"
                      min="0"
                      max="100"
                      value={newRule.minScore}
                      onChange={(e) => setNewRule({...newRule, minScore: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxScore">Score Máximo</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      min="0"
                      max="100"
                      value={newRule.maxScore}
                      onChange={(e) => setNewRule({...newRule, maxScore: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Criar Regra</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio do Playbook</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round(playbookAnalysis.averageScore)}%
              </div>
              <Progress value={playbookAnalysis.averageScore} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockPlaybookRules.length}</div>
              <p className="text-xs text-muted-foreground">
                Aplicadas automaticamente
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {Math.round((mockPlaybookRules.filter(r => r.performance >= 75).length / mockPlaybookRules.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Regras com performance ≥75%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reuniões Analisadas</CardTitle>
              <Settings className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playbookAnalysis.totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Com insights aplicados
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules">Regras Ativas</TabsTrigger>
            <TabsTrigger value="analysis">Análise de Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights & Melhorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Regras do Playbook
                </CardTitle>
                <CardDescription>
                  Regras configuradas para análise automática das reuniões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPlaybookRules.map((rule) => (
                    <Card key={rule.id} className="border border-border/30 hover:shadow-lg transition-all hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground text-lg">{rule.name}</h3>
                              <Badge variant={rule.status === 'active' ? 'default' : 'destructive'}>
                                {rule.status === 'active' ? 'Ativa' : 'Precisa Melhorar'}
                              </Badge>
                              <Badge variant="outline">
                                Peso: {rule.weight}x
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-4">{rule.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {rule.keywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Tipo: {rule.meetingType === 'sales_call' ? 'Chamada de Vendas' : rule.meetingType}</span>
                              <span>Performance: {rule.performance}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <div className="text-right mr-4">
                              <div className="text-2xl font-bold text-primary mb-1">
                                {rule.performance}%
                              </div>
                              <Progress value={rule.performance} className="w-20 h-2" />
                            </div>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Meeting Type Analysis */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Performance por Tipo de Reunião</CardTitle>
                  <CardDescription>
                    Análise baseada nas transcrições coletadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playbookAnalysis.meetingTypeAnalysis.map((type) => (
                      <div key={type.type} className="p-4 bg-gradient-subtle rounded-lg border border-border/30">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">
                            {type.type === 'sales_call' ? 'Chamada de Vendas' : type.type}
                          </h3>
                          <Badge variant={type.avgScore >= 75 ? 'default' : type.avgScore >= 50 ? 'secondary' : 'destructive'}>
                            {Math.round(type.avgScore)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{type.count} reuniões</span>
                          <span>Score médio: {Math.round(type.avgScore)}%</span>
                        </div>
                        <Progress value={type.avgScore} className="h-2 mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Keywords */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <CardTitle>Palavras-chave de Maior Performance</CardTitle>
                  <CardDescription>
                    Keywords que geram melhores resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {playbookAnalysis.keywordFrequency.slice(0, 10).map((keyword, index) => (
                      <div key={keyword.keyword} className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg border border-border/30">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium text-foreground">{keyword.keyword}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {keyword.count}x
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

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {playbookAnalysis.meetingTypeAnalysis.map((type) => (
                <Card key={type.type} className="bg-gradient-card border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {type.type === 'sales_call' ? 'Chamadas de Vendas' : type.type}
                    </CardTitle>
                    <CardDescription>
                      Melhores práticas e oportunidades de melhoria
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {type.bestPractices.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-success flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4" />
                          Melhores Práticas Identificadas
                        </h4>
                        <div className="space-y-2">
                          {type.bestPractices.map((practice, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-success/10 rounded-lg border border-success/20">
                              <CheckCircle className="w-4 h-4 text-success" />
                              <span className="text-sm text-foreground">{practice}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {type.improvements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-warning flex items-center gap-2 mb-3">
                          <AlertCircle className="w-4 h-4" />
                          Oportunidades de Melhoria
                        </h4>
                        <div className="space-y-2">
                          {type.improvements.map((improvement, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg border border-warning/20">
                              <AlertCircle className="w-4 h-4 text-warning" />
                              <span className="text-sm text-foreground">{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Playbook;