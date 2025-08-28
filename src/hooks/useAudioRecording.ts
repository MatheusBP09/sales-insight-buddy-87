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
        console.log('Final recording time:', recordingTime, 'seconds');
        setIsProcessing(true);
        
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size);

        if (audioBlob.size === 0) {
          console.error('Audio blob is empty!');
          onError?.('Gravação vazia - tente novamente');
          setIsProcessing(false);
          return;
        }

        if (onRecordingComplete) {
          // Create a recording ID for tracking
          const recordingId = crypto.randomUUID();
          console.log('Calling onRecordingComplete with:', { recordingId, blobSize: audioBlob.size });
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
    // Don't reset recordingTime here - it will be used in uploadAudio
    // setRecordingTime(0) will be called after successful upload
  }, []);

  const uploadAudio = useCallback(async (recordingId: string, audioBlob: Blob, meetingId: string, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      console.log('=== STARTING AUDIO UPLOAD ===');
      console.log('Meeting ID:', meetingId);
      console.log('Recording ID:', recordingId);
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Audio blob type:', audioBlob.type);
      console.log('Current recording time:', recordingTime, 'seconds');
      console.log('Retry attempt:', retryCount);
      setIsProcessing(true);

      // Validate inputs
      if (!meetingId || !recordingId || !audioBlob || audioBlob.size === 0) {
        throw new Error(`Invalid parameters: meetingId=${meetingId}, recordingId=${recordingId}, blobSize=${audioBlob?.size}`);
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.id);

      // Check if storage bucket exists (and create if needed)
      console.log('=== CHECKING STORAGE BUCKET ===');
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'meeting-recordings');
      console.log('Meeting-recordings bucket exists:', bucketExists);

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
        
        // If bucket doesn't exist, provide helpful error
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        
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

      // Convert blob to base64 for transcription (robust implementation)
      console.log('=== CONVERTING TO BASE64 ===');
      let base64Audio = '';
      
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('Array buffer size:', arrayBuffer.byteLength);
        
        // Convert to base64 in small chunks to avoid call stack issues
        const chunkSize = 1024; // Smaller chunks for safety
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          try {
            const chunk = uint8Array.slice(i, i + chunkSize);
            const chunkString = Array.from(chunk, byte => String.fromCharCode(byte)).join('');
            base64Audio += btoa(chunkString);
            
            // Log progress for large files
            if (i % (chunkSize * 100) === 0) {
              console.log(`Base64 conversion progress: ${((i / uint8Array.length) * 100).toFixed(1)}%`);
            }
          } catch (chunkError) {
            console.error('Error processing chunk at position', i, chunkError);
            throw new Error(`Base64 conversion failed at position ${i}: ${chunkError.message}`);
          }
        }
        
        console.log('Base64 conversion completed, size:', base64Audio.length, 'characters');
      } catch (conversionError) {
        console.error('=== BASE64 CONVERSION ERROR ===', conversionError);
        throw new Error(`Failed to convert audio to base64: ${conversionError.message}`);
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

      // Reset recording time only after successful completion
      setRecordingTime(0);
      setIsProcessing(false);
      return recording;

    } catch (error) {
      console.error('=== AUDIO UPLOAD ERROR ===', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        meetingId,
        recordingId,
        audioSize: audioBlob.size
      });
      
      setIsProcessing(false);
      
      // Retry mechanism for transient errors
      if (retryCount < MAX_RETRIES) {
        const isRetryableError = 
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('fetch') ||
          error.message?.includes('connection');
          
        if (isRetryableError) {
          console.log(`Retrying upload (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return uploadAudio(recordingId, audioBlob, meetingId, retryCount + 1);
        }
      }
      
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