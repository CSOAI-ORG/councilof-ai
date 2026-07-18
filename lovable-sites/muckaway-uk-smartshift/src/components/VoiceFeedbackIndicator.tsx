import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback, isNative } from '@/lib/native';

interface VoiceFeedbackIndicatorProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing?: boolean;
  lastCommand?: string;
  commandStatus?: 'success' | 'error' | 'pending' | null;
  audioLevel?: number; // 0-100
  className?: string;
}

export const VoiceFeedbackIndicator: React.FC<VoiceFeedbackIndicatorProps> = ({
  isListening,
  isSpeaking,
  isProcessing = false,
  lastCommand,
  commandStatus,
  audioLevel = 0,
  className
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);

  // Trigger haptic feedback on state changes
  useEffect(() => {
    if (isNative()) {
      if (isListening) {
        hapticFeedback('light');
      }
    }
  }, [isListening]);

  useEffect(() => {
    if (isNative()) {
      if (commandStatus === 'success') {
        hapticFeedback('success');
      } else if (commandStatus === 'error') {
        hapticFeedback('error');
      }
    }
  }, [commandStatus]);

  // Calculate pulse intensity from audio level
  useEffect(() => {
    setPulseIntensity(Math.min(100, audioLevel * 1.5));
  }, [audioLevel]);

  const getStatusColor = () => {
    if (isProcessing) return 'bg-yellow-500/20 border-yellow-500';
    if (isListening) return 'bg-red-500/20 border-red-500';
    if (isSpeaking) return 'bg-green-500/20 border-green-500';
    return 'bg-muted border-border';
  };

  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (isListening) return <Mic className="h-5 w-5 text-red-500" />;
    if (isSpeaking) return <Volume2 className="h-5 w-5 text-green-500" />;
    return <MicOff className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Listening';
    if (isSpeaking) return 'Speaking';
    return 'Ready';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Status Indicator - Large and visible */}
      <div 
        className={cn(
          'relative flex items-center justify-center p-6 rounded-full border-4 transition-all duration-300',
          getStatusColor()
        )}
        style={{
          boxShadow: isListening 
            ? `0 0 ${20 + pulseIntensity * 0.3}px rgba(239, 68, 68, ${0.3 + pulseIntensity * 0.005})`
            : isSpeaking 
              ? '0 0 20px rgba(34, 197, 94, 0.3)'
              : 'none'
        }}
      >
        {/* Pulsing ring for active states */}
        {(isListening || isSpeaking) && (
          <div 
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-30',
              isListening ? 'bg-red-500' : 'bg-green-500'
            )}
            style={{ animationDuration: '1.5s' }}
          />
        )}
        
        {/* Audio level visualization */}
        {isListening && audioLevel > 10 && (
          <div className="absolute inset-2 flex items-center justify-center">
            <div 
              className="absolute rounded-full bg-red-500/20 transition-all duration-100"
              style={{
                width: `${50 + pulseIntensity * 0.5}%`,
                height: `${50 + pulseIntensity * 0.5}%`
              }}
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-semibold">{getStatusText()}</span>
        </div>
      </div>

      {/* Command Status Feedback */}
      {lastCommand && (
        <div className={cn(
          'p-3 rounded-lg border transition-all duration-300',
          commandStatus === 'success' && 'bg-green-500/10 border-green-500/30',
          commandStatus === 'error' && 'bg-red-500/10 border-red-500/30',
          commandStatus === 'pending' && 'bg-yellow-500/10 border-yellow-500/30',
          !commandStatus && 'bg-muted border-border'
        )}>
          <div className="flex items-start gap-2">
            {commandStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
            {commandStatus === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
            {commandStatus === 'pending' && <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Last command:</p>
              <p className="text-sm font-medium truncate">{lastCommand}</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Audio Level Bar - For noisy environments */}
      {isListening && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Audio Level</span>
            <span>{Math.round(audioLevel)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full transition-all duration-100 rounded-full',
                audioLevel < 30 ? 'bg-red-500' : audioLevel < 60 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
          {audioLevel < 30 && (
            <p className="text-xs text-red-500">⚠️ Low audio - speak louder or move closer</p>
          )}
        </div>
      )}

      {/* Quick Status Badges */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Badge 
          variant={isListening ? 'default' : 'outline'} 
          className={cn(isListening && 'bg-red-500 hover:bg-red-500')}
        >
          <Mic className="h-3 w-3 mr-1" />
          Mic {isListening ? 'Active' : 'Off'}
        </Badge>
        <Badge 
          variant={isSpeaking ? 'default' : 'outline'}
          className={cn(isSpeaking && 'bg-green-500 hover:bg-green-500')}
        >
          <Volume2 className="h-3 w-3 mr-1" />
          AI {isSpeaking ? 'Speaking' : 'Silent'}
        </Badge>
      </div>
    </div>
  );
};

export default VoiceFeedbackIndicator;
