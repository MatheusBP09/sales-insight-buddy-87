import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Users, BarChart3, History, Play, Pause, Square, Timer } from "lucide-react";
import { mockMeetings, meetingTypes } from "@/data/mockData";

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleStartRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Sales Insight Buddy</h1>
                <p className="text-sm text-muted-foreground">Análise Inteligente de Reuniões</p>
              </div>
            </div>
            <Button variant="professional" size="sm">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold mb-6">Iniciar Nova Reunião</h2>
          <Card className="bg-gradient-card border-border shadow-brand">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-primary" />
                <span>Gravação de Reunião</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isRecording ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Título da Reunião</label>
                      <input 
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="Ex: Demo - TechCorp LTDA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Cliente/Empresa</label>
                      <input 
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                        placeholder="Ex: TechCorp LTDA"
                      />
                    </div>
                  </div>
                  <Button onClick={handleStartRecording} size="xl" className="w-full">
                    <Mic className="w-5 h-5 mr-2" />
                    Iniciar Gravação
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="w-4 h-4 bg-recording rounded-full animate-recording"></div>
                    <span className="text-lg font-medium">Gravando...</span>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Timer className="w-4 h-4" />
                      <span>{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant={isPaused ? "default" : "secondary"} 
                      onClick={handlePauseRecording}
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </Button>
                    <Button variant="destructive" onClick={handleStopRecording}>
                      <Square className="w-4 h-4 mr-2" />
                      Parar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Meetings */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold mb-6">Reuniões Recentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMeetings.slice(0, 3).map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <div className={`w-3 h-3 rounded-full ${meetingTypes.find(t => t.value === meeting.type)?.color}`}></div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{new Date(meeting.date).toLocaleDateString('pt-BR')}</span>
                    <span>{meeting.duration}min</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{meeting.participants.length} participantes</span>
                    </div>
                    {meeting.insights && (
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-success" />
                        <span className="text-sm">Score: {meeting.insights.interestScore}/10</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                      Ver Insights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Mic className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Reuniões este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-8 h-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold">7.8</p>
                    <p className="text-sm text-muted-foreground">Score médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="w-8 h-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-sm text-muted-foreground">Taxa conversão</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Timer className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">45min</p>
                    <p className="text-sm text-muted-foreground">Duração média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;