import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { chatMessageSchema, validateRequest, createValidationErrorResponse } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // 30 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000;

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP;
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, resetIn: RATE_LIMIT_WINDOW };
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetIn: entry.resetTime - now };
  }
  
  entry.count++;
  return { allowed: true, resetIn: entry.resetTime - now };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    console.log('[AI-CHATBOT] Rate limit exceeded for IP:', clientIP);
    return new Response(JSON.stringify({ 
      reply: "I'm receiving too many requests right now. Please wait a moment and try again."
    }), {
      status: 429,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString()
      },
    });
  }

  try {
    console.log('[AI-CHATBOT] Function started');
    
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validation = validateRequest(chatMessageSchema, rawBody);
    if (!validation.success) {
      console.error('[AI-CHATBOT] Validation failed:', validation.error);
      return createValidationErrorResponse(validation.error, corsHeaders);
    }
    
    const { message, context } = validation.data;

    console.log('[AI-CHATBOT] Message received:', message.length, 'characters');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[AI-CHATBOT] LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI-CHATBOT] API key verified');

    const systemPrompt = `You are MuckBot, an expert AI assistant for spoil removal and waste management services. You have deep knowledge of:

- UK waste regulations and EWC codes
- Spoil classification and contamination assessment  
- Haulage and disposal pricing
- Environmental compliance requirements
- Construction waste management best practices
- Landfill tax rates and exemptions
- Hazardous waste consignment procedures

Your personality:
- Professional yet friendly and approachable
- Highly knowledgeable about technical aspects
- Practical and solution-focused
- Able to explain complex regulations simply
- Proactive in offering relevant services

Key services you can help with:
- Spoil classification and risk assessment
- Quote generation for removal services
- Regulatory compliance guidance
- EWC code identification
- WTN and hazardous consignment documentation
- Route optimization and logistics
- Cost estimation and budgeting
- Emergency spill response

Always provide specific, actionable advice. Include relevant costs, timelines, and compliance requirements where appropriate. If asked about booking services, direct users to complete the online quote form or contact the operations team.

Current context: ${context || 'general_inquiry'}`;

    console.log('[AI-CHATBOT] Calling AI API...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500
      }),
    });

    console.log('[AI-CHATBOT] AI API response status:', response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          reply: "I'm currently experiencing high demand. Please try again in a moment, or contact our support team directly for immediate assistance." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          reply: "I'm temporarily unavailable due to service limits. Please contact our team directly at support@muckaway.com for assistance." 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorData = await response.text();
      console.error('AI API error:', response.status, errorData);
      throw new Error(`AI chat failed: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('No reply content received from AI');
    }

    return new Response(
      JSON.stringify({ success: true, reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chatbot:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});