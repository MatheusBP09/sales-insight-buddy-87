import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useMeetings } from '@/hooks/useMeetings';
import { FileUpload } from './FileUpload';
import { Plus, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const CreateMeetingDialog: React.FC = () => {
  const { toast } = useToast();
  const { createMeeting } = useMeetings();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    clientCompany: '',
    meetingType: 'sales_call',
    startTime: '',
    endTime: '',
    joinUrl: '',
    description: '',
    attachmentDocxUrl: '',
    attachmentVttUrl: '',
    attachmentDocxName: '',
    attachmentVttName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const meetingData = {
        title: formData.title,
        client_company: formData.clientCompany || undefined,
        meeting_type: formData.meetingType,
        start_time: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        join_url: formData.joinUrl || undefined,
        executive_summary: formData.description || undefined,
        status: 'completed',
        attachment_docx_url: formData.attachmentDocxUrl || undefined,
        attachment_vtt_url: formData.attachmentVttUrl || undefined,
        attachment_docx_name: formData.attachmentDocxName || undefined,
        attachment_vtt_name: formData.attachmentVttName || undefined
      };

      await createMeeting(meetingData.title, meetingData.client_company, meetingData.meeting_type, {
        start_time: meetingData.start_time,
        end_time: meetingData.end_time,
        join_url: meetingData.join_url,
        executive_summary: meetingData.executive_summary,
        status: meetingData.status,
        attachment_docx_url: meetingData.attachment_docx_url,
        attachment_vtt_url: meetingData.attachment_vtt_url,
        attachment_docx_name: meetingData.attachment_docx_name,
        attachment_vtt_name: meetingData.attachment_vtt_name
      });
      
      toast({
        title: "Sucesso",
        description: "Reunião criada com sucesso",
      });

      // Reset form and close dialog
      setFormData({
        title: '',
        clientCompany: '',
        meetingType: 'sales_call',
        startTime: '',
        endTime: '',
        joinUrl: '',
        description: '',
        attachmentDocxUrl: '',
        attachmentVttUrl: '',
        attachmentDocxName: '',
        attachmentVttName: ''
      });
      setOpen(false);
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar reunião",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploaded = (fileType: 'docx' | 'vtt', fileUrl: string, fileName: string) => {
    if (fileType === 'docx') {
      setFormData(prev => ({
        ...prev,
        attachmentDocxUrl: fileUrl,
        attachmentDocxName: fileName
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        attachmentVttUrl: fileUrl,
        attachmentVttName: fileName
      }));
    }
  };

  const formatDateTimeLocal = (date?: string) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Reunião
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Criar Nova Reunião
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da reunião e anexe arquivos se necessário.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Reunião *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Reunião de vendas - Cliente X"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientCompany">Empresa Cliente</Label>
                  <Input
                    id="clientCompany"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                    placeholder="Ex: Empresa ABC Ltda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingType">Tipo de Reunião</Label>
                <Select value={formData.meetingType} onValueChange={(value) => setFormData(prev => ({ ...prev, meetingType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_call">Chamada de Vendas</SelectItem>
                    <SelectItem value="demo">Demonstração</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="discovery">Descoberta</SelectItem>
                    <SelectItem value="negotiation">Negociação</SelectItem>
                    <SelectItem value="closing">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Data e Hora de Início</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.startTime)}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">Data e Hora de Fim</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.endTime)}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="joinUrl">URL da Reunião</Label>
                <Input
                  id="joinUrl"
                  value={formData.joinUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, joinUrl: e.target.value }))}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição/Resumo</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Adicione detalhes sobre a reunião, principais pontos discutidos, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <FileUpload
            onFileUploaded={handleFileUploaded}
            existingDocx={formData.attachmentDocxUrl ? { url: formData.attachmentDocxUrl, name: formData.attachmentDocxName } : undefined}
            existingVtt={formData.attachmentVttUrl ? { url: formData.attachmentVttUrl, name: formData.attachmentVttName } : undefined}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? "Criando..." : "Criar Reunião"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};