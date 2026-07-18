import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Mic, MicOff, Phone, PhoneOff, AudioWaveform, Bot, Lock, Volume2 } from 'lucide-react';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { useNavigate } from 'react-router-dom';
import { useUsageMetering } from '@/hooks/useUsageMetering';
import { UsageWarningBanner } from '@/components/UsageWarningBanner';
import { VoiceFeedbackIndicator } from '@/components/VoiceFeedbackIndicator';
import { hapticFeedback, isNative } from '@/lib/native';

interface VoiceInterfaceProps {
  onSpeakingChange?: (speaking: boolean) => void;
  onQuoteGenerated?: (quote: any) => void;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTranscript?: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ 
  onSpeakingChange, 
  onQuoteGenerated 
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canAccessFeature, requiresUpgrade } = useSubscriptionGate();
  const { trackUsage } = useUsageMetering();
  const hasAccess = canAccessFeature('voice_ai');
  const needsUpgrade = requiresUpgrade('voice_ai');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [commandStatus, setCommandStatus] = useState<'success' | 'error' | 'pending' | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const chatRef = useRef<RealtimeChat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Monitor audio level for visual feedback
  const startAudioLevelMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
    }
  }, []);

  const stopAudioLevelMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  }, []);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event.type, event);
    
    switch (event.type) {
      case 'session.created':
        console.log('Session created successfully');
        // Haptic feedback on session start
        if (isNative()) hapticFeedback('success');
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        setIsProcessing(false);
        onSpeakingChange?.(false);
        // Light haptic on speech detection
        if (isNative()) hapticFeedback('light');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        setIsProcessing(true);
        // Medium haptic when processing starts
        if (isNative()) hapticFeedback('medium');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        const userMessage: VoiceMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: event.transcript,
          timestamp: new Date(),
          isTranscript: true
        };
        setMessages(prev => [...prev, userMessage]);
        setLastCommand(event.transcript);
        setCommandStatus('pending');
        setCurrentTranscript('');
        setIsProcessing(true);
        break;
        
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + event.delta);
        break;
        
      case 'response.audio_transcript.done':
        if (currentTranscript.trim()) {
          const assistantMessage: VoiceMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: currentTranscript.trim(),
            timestamp: new Date(),
            isTranscript: true
          };
          setMessages(prev => [...prev, assistantMessage]);
          setCurrentTranscript('');
          setCommandStatus('success');
          // Success haptic on response complete
          if (isNative()) hapticFeedback('success');
        }
        setIsProcessing(false);
        break;
        
      case 'response.audio.delta':
        setIsSpeaking(true);
        setIsProcessing(false);
        onSpeakingChange?.(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        onSpeakingChange?.(false);
        // Track AI usage after voice interaction completes
        trackUsage('ai_request');
        break;
        
      case 'response.function_call_arguments.done':
        // Handle function calls for quote generation
        if (event.name === 'generate_quote') {
          try {
            const args = JSON.parse(event.arguments);
            onQuoteGenerated?.(args);
            setCommandStatus('success');
            // Strong success haptic for quote generation
            if (isNative()) hapticFeedback('success');
            toast({
              title: "✅ Quote Generated",
              description: `Voice-generated quote for ${args.volume}m³ of ${args.material_type}`,
            });
          } catch (error) {
            console.error('Error parsing quote arguments:', error);
            setCommandStatus('error');
            if (isNative()) hapticFeedback('error');
          }
        }
        break;
        
      case 'error':
        console.error('Voice interface error:', event);
        setIsProcessing(false);
        setCommandStatus('error');
        // Error haptic feedback
        if (isNative()) hapticFeedback('error');
        toast({
          title: "Voice Error",
          description: event.error?.message || "An error occurred with the voice interface",
          variant: "destructive",
        });
        break;
    }
  };

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      
      // Add welcome message
      const welcomeMessage: VoiceMessage = {
        id: 'welcome',
        type: 'assistant',
        content: "Hello! I'm MuckBot Pro, your advanced AI assistant for waste management. You can now speak to me directly to get quotes, classify spoil, or book collections. Try saying something like 'I need 50 tons of clay removed from London'.",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Start audio level monitoring for visual feedback
      await startAudioLevelMonitoring();
      
      // Haptic feedback on successful connection
      if (isNative()) hapticFeedback('success');
      
      toast({
        title: "🎙️ Voice Interface Active",
        description: "MuckBot Pro is listening. Start speaking to generate quotes instantly!",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      if (isNative()) hapticFeedback('error');
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to start voice interface',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    stopAudioLevelMonitoring();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessing(false);
    setLastCommand('');
    setCommandStatus(null);
    onSpeakingChange?.(false);
    setMessages([]);
    setCurrentTranscript('');
    
    if (isNative()) hapticFeedback('medium');
    
    toast({
      title: "Voice Disconnected",
      description: "Voice interface has been disconnected",
    });
  };

  const sendTextMessage = async () => {
    if (!chatRef.current) return;
    
    try {
      await chatRef.current.sendMessage("Hello, can you help me with a quote?");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
      stopAudioLevelMonitoring();
    };
  }, [stopAudioLevelMonitoring]);

  return (
    <div className="space-y-4">
      <UsageWarningBanner featureType="ai_request" />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-accent" />
          MuckBot Pro - Voice AI Assistant
          {needsUpgrade && (
            <Badge variant="outline" className="ml-2 text-accent border-accent">
              <Lock className="h-3 w-3 mr-1" />
              Professional
            </Badge>
          )}
          {isConnected && (
            <Badge variant="secondary" className="ml-auto">
              {isSpeaking && <AudioWaveform className="h-3 w-3 mr-1 animate-pulse" />}
              {isListening && <Mic className="h-3 w-3 mr-1 text-red-500 animate-pulse" />}
              {!isSpeaking && !isListening && "Ready"}
              {isSpeaking && "Speaking"}
              {isListening && "Listening"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upgrade Prompt for Non-Subscribers */}
        {needsUpgrade && (
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-center">
            <Lock className="h-8 w-8 mx-auto text-accent mb-2" />
            <h3 className="font-semibold text-lg mb-1">Upgrade to Professional</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Voice AI is available on Professional and Enterprise plans. Upgrade to speak directly with MuckBot Pro.
            </p>
            <Button 
              onClick={() => navigate('/subscribe')}
              className="bg-accent hover:bg-accent/90"
            >
              Upgrade Now
            </Button>
          </div>
        )}

        {/* Connection Controls - Only show if user has access */}
        {hasAccess && (
          <div className="flex gap-2 justify-center">
            {!isConnected ? (
              <Button 
                onClick={startConversation}
                disabled={isConnecting}
                className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={endConversation}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                End Voice Chat
              </Button>
            )}
          </div>
        )}

        {/* Enhanced Voice Feedback Indicator for Noisy Environments */}
        {isConnected && (
          <VoiceFeedbackIndicator
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            lastCommand={lastCommand}
            commandStatus={commandStatus}
            audioLevel={audioLevel}
          />
        )}

        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-muted rounded-lg">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {currentTranscript && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-card border border-border opacity-70">
                  <p className="text-sm">{currentTranscript}...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p className="font-medium">🎯 Revolutionary Voice Commands:</p>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <p>"I need 50 tons of clay removed from Manchester"</p>
            <p>"What's the EWC code for contaminated soil?"</p>
            <p>"Generate a quote for hardcore removal"</p>
            <p>"Book a collection for next Tuesday"</p>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceInterface;