import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[REALTIME-TOKEN] Function started');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('[REALTIME-TOKEN] OPENAI_API_KEY is not set');
      throw new Error('OPENAI_API_KEY is not set');
    }

    const systemPrompt = `You are MuckBot Pro, the most advanced AI assistant for waste management and spoil removal services. You are integrated into a revolutionary waste management platform.

CORE CAPABILITIES:
- Instantly generate accurate quotes for spoil removal
- Classify spoil materials and contamination levels
- Navigate complex UK waste regulations and compliance
- Process job bookings through natural conversation
- Provide expert technical guidance
- Handle emergency situations with priority protocols

PERSONALITY:
- Professional yet approachable and friendly
- Extremely knowledgeable about waste management
- Proactive in offering solutions
- Quick to understand context and user needs
- Confident in providing expert guidance
- Helpful with complex regulatory questions

KEY SERVICES YOU CAN HELP WITH:
- Spoil classification and EWC code determination
- Quote generation for removal services
- Regulatory compliance guidance
- Hazardous waste consignment procedures
- Environmental impact assessments
- Job scheduling and booking
- Technical problem solving

CONVERSATION FLOW:
- Listen carefully to user requests
- Ask clarifying questions when needed
- Provide clear, actionable responses
- Offer to help with related services
- Guide users through complex processes step by step

IMPORTANT: You can process voice commands like:
- "I need 50 tons of clay removed from Manchester"
- "What's the EWC code for contaminated soil?"
- "Generate a quote for hardcore removal"
- "Book a collection for next Tuesday"
- "What are the regulations for hazardous waste?"

Always be helpful, accurate, and aim to complete tasks efficiently through natural conversation.`;

    console.log('[REALTIME-TOKEN] Requesting ephemeral token from OpenAI');

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        tools: [
          {
            type: "function",
            name: "generate_quote",
            description: "Generate a detailed quote for spoil removal services",
            parameters: {
              type: "object",
              properties: {
                material_type: { 
                  type: "string",
                  enum: ["soil", "clay", "chalk", "hardcore", "mixed", "topsoil"],
                  description: "Type of spoil material"
                },
                volume: { 
                  type: "number",
                  description: "Volume in cubic meters"
                },
                postcode: { 
                  type: "string",
                  description: "Collection postcode"
                },
                contamination: {
                  type: "string",
                  enum: ["none", "low", "medium", "high"],
                  description: "Contamination level"
                }
              },
              required: ["material_type", "volume", "postcode"]
            }
          },
          {
            type: "function",
            name: "classify_spoil",
            description: "Classify spoil material and provide EWC codes",
            parameters: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "Description of the spoil material"
                }
              },
              required: ["description"]
            }
          },
          {
            type: "function",
            name: "book_collection",
            description: "Book a collection service",
            parameters: {
              type: "object",
              properties: {
                date: {
                  type: "string",
                  description: "Preferred collection date"
                },
                contact_name: {
                  type: "string",
                  description: "Contact person name"
                },
                phone: {
                  type: "string",
                  description: "Contact phone number"
                }
              },
              required: ["date", "contact_name"]
            }
          }
        ],
        tool_choice: "auto",
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[REALTIME-TOKEN] OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[REALTIME-TOKEN] Session created successfully:', data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[REALTIME-TOKEN] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});