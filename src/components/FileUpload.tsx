import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFileUploaded: (fileType: 'docx' | 'vtt', fileUrl: string, fileName: string) => void;
  existingDocx?: { url: string; name: string };
  existingVtt?: { url: string; name: string };
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  existingDocx,
  existingVtt
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState<{ docx: boolean; vtt: boolean }>({
    docx: false,
    vtt: false
  });
  const [uploadProgress, setUploadProgress] = useState<{ docx: number; vtt: number }>({
    docx: 0,
    vtt: 0
  });

  const handleFileUpload = async (file: File, fileType: 'docx' | 'vtt') => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload de arquivos",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = {
      docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      vtt: ['text/vtt', 'text/plain']
    };

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileType === 'docx' && fileExtension !== 'docx') {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo .docx",
        variant: "destructive"
      });
      return;
    }

    if (fileType === 'vtt' && fileExtension !== 'vtt') {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo .vtt",
        variant: "destructive"
      });
      return;
    }

    setUploading(prev => ({ ...prev, [fileType]: true }));
    setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev[fileType] + 10, 90);
          return { ...prev, [fileType]: newProgress };
        });
      }, 100);

      const { data, error } = await supabase.storage
        .from('meeting-attachments')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('meeting-attachments')
        .getPublicUrl(filePath);

      onFileUploaded(fileType, publicUrl, file.name);

      toast({
        title: "Sucesso",
        description: `Arquivo ${fileType.toUpperCase()} enviado com sucesso`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: `Falha ao enviar arquivo ${fileType.toUpperCase()}`,
        variant: "destructive"
      });
    } finally {
      setUploading(prev => ({ ...prev, [fileType]: false }));
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
      }, 2000);
    }
  };

  const handleRemoveFile = async (fileType: 'docx' | 'vtt', fileUrl: string) => {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // Get user_id/filename

      const { error } = await supabase.storage
        .from('meeting-attachments')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      onFileUploaded(fileType, '', '');
      
      toast({
        title: "Sucesso",
        description: `Arquivo ${fileType.toUpperCase()} removido`,
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Erro",
        description: `Falha ao remover arquivo ${fileType.toUpperCase()}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Anexos da Reunião
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DOCX Upload */}
        <div className="space-y-3">
          <Label htmlFor="docx-upload" className="text-sm font-medium">
            Documento Word (.docx)
          </Label>
          
          {existingDocx?.url ? (
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm truncate">{existingDocx.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveFile('docx', existingDocx.url)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="docx-upload"
                type="file"
                accept=".docx"
                disabled={uploading.docx}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'docx');
                }}
              />
              {uploading.docx && (
                <div className="space-y-1">
                  <Progress value={uploadProgress.docx} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Enviando documento... {uploadProgress.docx}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* VTT Upload */}
        <div className="space-y-3">
          <Label htmlFor="vtt-upload" className="text-sm font-medium">
            Legenda VTT (.vtt)
          </Label>
          
          {existingVtt?.url ? (
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm truncate">{existingVtt.name}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveFile('vtt', existingVtt.url)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                id="vtt-upload"
                type="file"
                accept=".vtt"
                disabled={uploading.vtt}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'vtt');
                }}
              />
              {uploading.vtt && (
                <div className="space-y-1">
                  <Progress value={uploadProgress.vtt} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Enviando legenda... {uploadProgress.vtt}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};