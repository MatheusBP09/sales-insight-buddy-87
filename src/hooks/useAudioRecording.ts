import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAudioRecordingProps {
  onRecordingComplete?: (recordingId: string, audioBlob: Blob) => void;
  onError?: (error: string) => void;
}

export const useAudioRecording = ({ onRecordingComplete, onError }: UseAudioRecordingProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      console.log('Starting audio recording...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        setIsProcessing(true);
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size);

        if (onRecordingComplete) {
          // Create a recording ID for tracking
          const recordingId = crypto.randomUUID();
          onRecordingComplete(recordingId, audioBlob);
        }

        setIsProcessing(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();

      console.log('Recording started successfully');

    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(errorMessage);
    }
  }, [onRecordingComplete, onError]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
      console.log('Recording paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
      console.log('Recording resumed');
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
    setRecordingTime(0);
  }, []);

  const uploadAudio = useCallback(async (recordingId: string, audioBlob: Blob, meetingId: string) => {
    try {
      console.log('=== STARTING AUDIO UPLOAD ===');
      console.log('Meeting ID:', meetingId);
      console.log('Recording ID:', recordingId);
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Audio blob type:', audioBlob.type);
      setIsProcessing(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.id);

      // Upload to Supabase Storage
      console.log('=== UPLOADING TO STORAGE ===');
      const fileName = `${user.id}/${recordingId}.webm`;
      console.log('Storage file name:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('=== STORAGE UPLOAD ERROR ===', uploadError);
        throw uploadError;
      }

      console.log('=== STORAGE UPLOAD SUCCESS ===', uploadData.path);

      // Create recording record in database
      console.log('=== CREATING RECORDING RECORD ===');
      console.log('Recording data:', {
        id: recordingId,
        meeting_id: meetingId,
        file_path: uploadData.path,
        file_size: audioBlob.size,
        duration_seconds: recordingTime,
        format: 'webm',
        status: 'uploaded'
      });
      
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          id: recordingId,
          meeting_id: meetingId,
          file_path: uploadData.path,
          file_size: audioBlob.size,
          duration_seconds: recordingTime,
          format: 'webm',
          status: 'uploaded'
        })
        .select()
        .single();

      if (recordingError) {
        console.error('=== RECORDING DATABASE ERROR ===', recordingError);
        throw recordingError;
      }

      console.log('=== RECORDING RECORD CREATED ===', recording.id);

      // Convert blob to base64 for transcription (improved for large files)
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid call stack issues
      let base64Audio = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
      }

      // Start transcription process
      console.log('=== STARTING TRANSCRIPTION ===');
      console.log('Audio base64 size:', base64Audio.length, 'characters');
      
      const { data: transcriptionResult, error: transcriptionError } = await supabase.functions
        .invoke('transcribe-audio', {
          body: {
            recordingId: recordingId,
            audioData: base64Audio
          }
        });

      if (transcriptionError) {
        console.error('=== TRANSCRIPTION ERROR ===', transcriptionError);
        // Update recording status to failed
        await supabase
          .from('recordings')
          .update({ status: 'failed' })
          .eq('id', recordingId);
        throw transcriptionError;
      }
      
      console.log('=== TRANSCRIPTION SUCCESS ===', transcriptionResult);

      console.log('Transcription completed successfully');

      // Start meeting analysis
      console.log('Starting meeting analysis...');
      const { error: analysisError } = await supabase.functions
        .invoke('analyze-meeting', {
          body: {
            meetingId: meetingId,
            transcriptionId: transcriptionResult.transcription?.id
          }
        });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        // Don't throw here as transcription was successful
      } else {
        console.log('Meeting analysis completed successfully');
      }

      setIsProcessing(false);
      return recording;

    } catch (error) {
      console.error('=== AUDIO UPLOAD ERROR ===', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setIsProcessing(false);
      throw error;
    }
  }, [recordingTime]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    isProcessing,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    uploadAudio,
    formatTime
  };
};