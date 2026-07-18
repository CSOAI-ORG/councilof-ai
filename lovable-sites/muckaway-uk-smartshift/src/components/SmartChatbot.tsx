import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, ThumbsUp, ThumbsDown, Trash2, Sparkles, UserCircle, AlertCircle } from 'lucide-react';
import { useAIMemory, ChatMessage } from '@/hooks/useAIMemory';
import { useAuth } from '@/hooks/useAuth';
import { trackAIInteraction, trackFeedback } from '@/lib/rlAnalytics';
import { toast } from '@/hooks/use-toast';
import { useUsageMetering } from '@/hooks/useUsageMetering';
import { UsageWarningBanner } from '@/components/UsageWarningBanner';
import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot-stream`;

export function SmartChatbot() {
  const { user } = useAuth();
  const { trackUsage, checkCanUseFeature } = useUsageMetering();
  const {
    messages,
    sessionId,
    addMessage,
    updateLastAssistantMessage,
    saveInteraction,
    recordFeedback,
    clearConversation,
    getMessagesForAPI
  } = useAIMemory(user?.id);

  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [showEscalationSuccess, setShowEscalationSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isStreaming) return;

    // Check usage limit
    if (!checkCanUseFeature('ai_request')) {
      toast({
        title: "Usage Limit Reached",
        description: "Upgrade your plan to continue chatting.",
        variant: "destructive"
      });
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');
    
    // Add user message
    addMessage({ role: 'user', content: userMessage });
    await saveInteraction('user', userMessage);
    trackAIInteraction('message_sent', { length: userMessage.length });

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...getMessagesForAPI(), { role: 'user', content: userMessage }],
          sessionId,
          userId: user?.id,
          userEmail: user?.email,
          context: { region: 'uk' }
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: 'Too many requests', description: 'Please wait a moment and try again.', variant: 'destructive' });
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateLastAssistantMessage(assistantContent);
            }
          } catch {
            // Incomplete JSON, will be completed in next chunk
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (assistantContent) {
        await saveInteraction('assistant', assistantContent);
        trackAIInteraction('response_received', { length: assistantContent.length });
        // Track usage after successful response
        await trackUsage('ai_request');
      }

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Chat error:', error);
      
      const errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
      updateLastAssistantMessage(errorMessage);
      toast({ title: 'Connection Error', description: 'Failed to get response from AI', variant: 'destructive' });
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [inputText, isStreaming, sessionId, user?.id, user?.email, addMessage, updateLastAssistantMessage, saveInteraction, getMessagesForAPI, checkCanUseFeature, trackUsage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFeedback = async (type: 'helpful' | 'not_helpful', messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || message.role !== 'assistant') return;

    trackFeedback(type, 'chatbot');
    toast({ title: 'Thanks for your feedback!', description: 'This helps us improve.' });
  };

  const handleEscalateToHuman = async () => {
    if (isEscalating) return;
    
    setIsEscalating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('escalate-to-human', {
        body: {
          sessionId,
          userId: user?.id,
          userEmail: user?.email,
          userName: user?.user_metadata?.full_name,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          reason: 'User requested human support'
        }
      });

      if (error) throw error;

      setShowEscalationSuccess(true);
      addMessage({
        role: 'assistant',
        content: "I've notified our support team and they'll be in touch soon. In the meantime, is there anything else I can help you with?"
      });
      
      toast({
        title: "Support Request Sent",
        description: "Our team will contact you within 24 hours.",
      });
    } catch (error: any) {
      console.error('Escalation error:', error);
      toast({
        title: "Couldn't Send Request",
        description: "Please try again or email support@muckaway.ai directly.",
        variant: "destructive"
      });
    } finally {
      setIsEscalating(false);
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <div className="space-y-4">
      <UsageWarningBanner featureType="ai_request" />
      <Card className="w-full max-w-2xl mx-auto bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span>MuckBot</span>
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEscalateToHuman}
            disabled={isEscalating || messages.length === 0}
            className="text-muted-foreground hover:text-foreground"
            title="Talk to a human"
          >
            <UserCircle className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline text-xs">Talk to Human</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversation}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <ScrollArea className="h-[400px] pr-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Hi! I'm MuckBot</p>
              <p className="text-sm mt-2">I can help you with:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Generate quotes for waste removal</li>
                <li>• Check job status</li>
                <li>• Book collections</li>
                <li>• Answer compliance questions</li>
              </ul>
              <p className="text-xs mt-4 text-muted-foreground/70">
                Need human help? Click "Talk to Human" above
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {showEscalationSuccess && (
                <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <span>Support team notified - they'll contact you soon!</span>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {message.role === 'assistant' && index === messages.length - 1 && !isStreaming && (
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleFeedback('helpful', index)}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleFeedback('not_helpful', index)}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about quotes, jobs, or compliance..."
            disabled={isStreaming}
            className="flex-1"
          />
          {isStreaming ? (
            <Button variant="outline" onClick={stopStreaming}>
              Stop
            </Button>
          ) : (
            <Button onClick={sendMessage} disabled={!inputText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartChatbot;
