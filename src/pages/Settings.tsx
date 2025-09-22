import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, User, Bell, Database, Shield, Webhook, Key, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Profile Settings
  const [profileSettings, setProfileSettings] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    businessUnit: "vendas",
    role: "user",
    phone: "",
    department: "Vendas"
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    meetingAlerts: true,
    scoreAlerts: true,
    weeklyReports: true,
    instantAlerts: false,
    alertThreshold: 75
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    autoTranscription: true,
    autoAnalysis: true,
    dataRetention: "90",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    enableWebhooks: true,
    webhookUrl: "https://api.example.com/webhooks/meetings"
  });

  // Integration Settings
  const [integrationSettings, setIntegrationSettings] = useState({
    calendarIntegration: false,
    crmIntegration: false,
    slackIntegration: false,
    apiKey: "sk-••••••••••••••••••••••••••••••••••••",
    webhookSecret: "whsec_••••••••••••••••••••••••••••"
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Notificações atualizadas",
        description: "Suas preferências de notificação foram salvas"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar as notificações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Webhook testado",
        description: "Conexão estabelecida com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro no webhook",
        description: "Falha ao conectar com o endpoint",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas preferências e configurações do sistema
            </p>
          </div>
          <Button 
            onClick={handleSaveProfile}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Informações do Perfil
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e profissionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      value={profileSettings.fullName}
                      onChange={(e) => setProfileSettings({...profileSettings, fullName: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileSettings.email}
                      onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
                      placeholder="seu@email.com"
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={profileSettings.phone}
                      onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={profileSettings.department}
                      onChange={(e) => setProfileSettings({...profileSettings, department: e.target.value})}
                      placeholder="Vendas"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessUnit">Business Unit</Label>
                    <Select value={profileSettings.businessUnit} onValueChange={(value) => setProfileSettings({...profileSettings, businessUnit: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="customer_success">Customer Success</SelectItem>
                        <SelectItem value="produtos">Produtos</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select value={profileSettings.role} onValueChange={(value) => setProfileSettings({...profileSettings, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Preferências de Notificação
                </CardTitle>
                <CardDescription>
                  Configure quando e como você quer ser notificado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">Receber resumos e atualizações por email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="meetingAlerts">Alertas de Reunião</Label>
                      <p className="text-sm text-muted-foreground">Notificações quando novas reuniões são processadas</p>
                    </div>
                    <Switch
                      id="meetingAlerts"
                      checked={notificationSettings.meetingAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, meetingAlerts: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="scoreAlerts">Alertas de Score</Label>
                      <p className="text-sm text-muted-foreground">Notificações para reuniões com score baixo</p>
                    </div>
                    <Switch
                      id="scoreAlerts"
                      checked={notificationSettings.scoreAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, scoreAlerts: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weeklyReports">Relatórios Semanais</Label>
                      <p className="text-sm text-muted-foreground">Resumo semanal de performance</p>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="instantAlerts">Alertas Instantâneos</Label>
                      <p className="text-sm text-muted-foreground">Notificações em tempo real</p>
                    </div>
                    <Switch
                      id="instantAlerts"
                      checked={notificationSettings.instantAlerts}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, instantAlerts: checked})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Limite para Alertas de Score (%)</Label>
                  <Input
                    id="alertThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={notificationSettings.alertThreshold}
                    onChange={(e) => setNotificationSettings({...notificationSettings, alertThreshold: parseInt(e.target.value)})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Receber alertas quando o score for menor que este valor
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Notificações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Configurações do Sistema
                </CardTitle>
                <CardDescription>
                  Configure o comportamento do sistema de análise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoTranscription">Transcrição Automática</Label>
                      <p className="text-sm text-muted-foreground">Processar automaticamente áudios recebidos</p>
                    </div>
                    <Switch
                      id="autoTranscription"
                      checked={systemSettings.autoTranscription}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoTranscription: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoAnalysis">Análise Automática</Label>
                      <p className="text-sm text-muted-foreground">Gerar insights automaticamente das transcrições</p>
                    </div>
                    <Switch
                      id="autoAnalysis"
                      checked={systemSettings.autoAnalysis}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoAnalysis: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableWebhooks">Webhooks Habilitados</Label>
                      <p className="text-sm text-muted-foreground">Receber dados de reuniões via webhook</p>
                    </div>
                    <Switch
                      id="enableWebhooks"
                      checked={systemSettings.enableWebhooks}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, enableWebhooks: checked})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
                    <Select value={systemSettings.dataRetention} onValueChange={(value) => setSystemSettings({...systemSettings, dataRetention: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                        <SelectItem value="forever">Indefinido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({...systemSettings, language: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({...systemSettings, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">URL do Webhook</Label>
                  <Input
                    id="webhookUrl"
                    value={systemSettings.webhookUrl}
                    onChange={(e) => setSystemSettings({...systemSettings, webhookUrl: e.target.value})}
                    placeholder="https://sua-api.com/webhook"
                  />
                  <p className="text-sm text-muted-foreground">
                    URL para receber dados de reuniões via webhook
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleTestWebhook} disabled={loading} variant="outline" className="mr-2">
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Webhook className="w-4 h-4 mr-2" />
                    )}
                    Testar Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  Integrações
                </CardTitle>
                <CardDescription>
                  Conecte com outras plataformas e serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Calendário</div>
                        <div className="text-sm text-muted-foreground">Sincronizar com Google Calendar ou Outlook</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.calendarIntegration ? "default" : "outline"}>
                        {integrationSettings.calendarIntegration ? "Conectado" : "Desconectado"}
                      </Badge>
                      <Switch
                        checked={integrationSettings.calendarIntegration}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, calendarIntegration: checked})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">CRM</div>
                        <div className="text-sm text-muted-foreground">Integração com Salesforce, HubSpot ou Pipedrive</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.crmIntegration ? "default" : "outline"}>
                        {integrationSettings.crmIntegration ? "Conectado" : "Desconectado"}
                      </Badge>
                      <Switch
                        checked={integrationSettings.crmIntegration}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, crmIntegration: checked})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Slack</div>
                        <div className="text-sm text-muted-foreground">Receber notificações no Slack</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integrationSettings.slackIntegration ? "default" : "outline"}>
                        {integrationSettings.slackIntegration ? "Conectado" : "Desconectado"}
                      </Badge>
                      <Switch
                        checked={integrationSettings.slackIntegration}
                        onCheckedChange={(checked) => setIntegrationSettings({...integrationSettings, slackIntegration: checked})}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave da API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={integrationSettings.apiKey}
                      onChange={(e) => setIntegrationSettings({...integrationSettings, apiKey: e.target.value})}
                      placeholder="sk-..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={integrationSettings.webhookSecret}
                      onChange={(e) => setIntegrationSettings({...integrationSettings, webhookSecret: e.target.value})}
                      placeholder="whsec_..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Gerencie a segurança da sua conta e dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-foreground">Autenticação de Dois Fatores</div>
                      <Badge variant="outline">Não configurado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                    <Button variant="outline" size="sm">
                      Configurar 2FA
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-foreground">Sessões Ativas</div>
                      <Badge variant="default">1 sessão</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Gerencie onde você está logado
                    </p>
                    <Button variant="outline" size="sm">
                      Ver Sessões
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-gradient-subtle rounded-lg border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-foreground">Logs de Auditoria</div>
                      <Badge variant="outline">Disponível</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Histórico de atividades na sua conta
                    </p>
                    <Button variant="outline" size="sm">
                      Ver Logs
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-destructive">Zona de Perigo</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Ações irreversíveis que afetam sua conta
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Alterar Senha
                      </Button>
                      <Button variant="destructive" size="sm">
                        Excluir Conta
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;