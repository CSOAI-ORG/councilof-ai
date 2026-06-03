import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  toolCalls?: any[];
}

interface ConversationSession {
  sessionId: string;
  messages: ChatMessage[];
  context: Record<string, any>;
}

export function useAIMemory(userId?: string) {
  const [session, setSession] = useState<ConversationSession>(() => ({
    sessionId: generateSessionId(),
    messages: [],
    context: {}
  }));
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef(session.sessionId);

  // Generate a unique session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Load previous session if exists
  useEffect(() => {
    if (!userId) return;

    const loadSession = async () => {
      const { data } = await supabase
        .from('ai_conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      if (data && data.last_activity) {
        // Only restore if session is less than 24 hours old
        const lastActivity = new Date(data.last_activity);
        const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceActivity < 24) {
          setSession(prev => ({
            ...prev,
            sessionId: data.session_id,
            context: (data.context as Record<string, any>) || {}
          }));
          sessionRef.current = data.session_id;

          // Load recent messages
          const { data: messages } = await supabase
            .from('ai_interactions')
            .select('role, content, created_at')
            .eq('session_id', data.session_id)
            .order('created_at', { ascending: true })
            .limit(10);

          if (messages) {
            setSession(prev => ({
              ...prev,
              messages: messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.created_at)
              }))
            }));
          }
        }
      }
    };

    loadSession();
  }, [userId]);

  // Add a message to the conversation
  const addMessage = useCallback((message: ChatMessage) => {
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, { ...message, timestamp: new Date() }]
    }));
  }, []);

  // Update assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string) => {
    setSession(prev => {
      const messages = [...prev.messages];
      const lastIndex = messages.length - 1;
      
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content };
      } else {
        messages.push({ role: 'assistant', content, timestamp: new Date() });
      }
      
      return { ...prev, messages };
    });
  }, []);

  // Save interaction to database
  const saveInteraction = useCallback(async (role: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => {
    if (!content.trim()) return;

    try {
      await supabase.from('ai_interactions').insert({
        session_id: sessionRef.current,
        user_id: userId || null,
        role,
        content,
        metadata
      });
    } catch (error) {
      console.error('Failed to save interaction:', error);
    }
  }, [userId]);

  // Record feedback for RL
  const recordFeedback = useCallback(async (
    interactionId: string,
    feedbackType: 'helpful' | 'not_helpful' | 'correction' | 'accepted' | 'rejected',
    details?: { originalResponse?: string; correctedResponse?: string; feedbackValue?: string }
  ) => {
    try {
      await supabase.from('ai_feedback').insert({
        interaction_id: interactionId,
        user_id: userId || null,
        feedback_type: feedbackType,
        original_response: details?.originalResponse,
        corrected_response: details?.correctedResponse,
        feedback_value: details?.feedbackValue,
        context: { session_id: sessionRef.current }
      });
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  }, [userId]);

  // Update context
  const updateContext = useCallback((updates: Record<string, any>) => {
    setSession(prev => ({
      ...prev,
      context: { ...prev.context, ...updates }
    }));
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    const newSessionId = generateSessionId();
    sessionRef.current = newSessionId;
    setSession({
      sessionId: newSessionId,
      messages: [],
      context: {}
    });
  }, []);

  // Get messages formatted for API
  const getMessagesForAPI = useCallback((): ChatMessage[] => {
    return session.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }, [session.messages]);

  return {
    session,
    sessionId: session.sessionId,
    messages: session.messages,
    context: session.context,
    isLoading,
    setIsLoading,
    addMessage,
    updateLastAssistantMessage,
    saveInteraction,
    recordFeedback,
    updateContext,
    clearConversation,
    getMessagesForAPI
  };
}
