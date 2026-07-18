import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ConversationContext {
  userId?: string;
  sessionId: string;
  region?: string;
  recentJobs?: any[];
  userPreferences?: any;
}

// Tool definitions for the AI
const tools = [
  {
    type: "function",
    function: {
      name: "generate_quote",
      description: "Generate a waste removal quote based on material type, volume, and location",
      parameters: {
        type: "object",
        properties: {
          material_type: { type: "string", description: "Type of spoil/waste material" },
          volume_tonnes: { type: "number", description: "Estimated volume in tonnes" },
          site_postcode: { type: "string", description: "Collection site postcode" },
          contamination_level: { type: "string", enum: ["none", "low", "medium", "high"], description: "Contamination level" }
        },
        required: ["material_type", "volume_tonnes", "site_postcode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_job_status",
      description: "Check the status of an existing job",
      parameters: {
        type: "object",
        properties: {
          job_id: { type: "string", description: "The job ID to check" }
        },
        required: ["job_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_collection",
      description: "Book a waste collection for a specific date",
      parameters: {
        type: "object",
        properties: {
          quote_id: { type: "string", description: "The quote ID to convert to booking" },
          collection_date: { type: "string", description: "Preferred collection date (YYYY-MM-DD)" },
          contact_name: { type: "string", description: "Contact name for the collection" },
          contact_phone: { type: "string", description: "Contact phone number" }
        },
        required: ["collection_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_pricing_info",
      description: "Get current pricing information for waste disposal",
      parameters: {
        type: "object",
        properties: {
          material_type: { type: "string", description: "Type of material" },
          region: { type: "string", description: "Region for pricing" }
        },
        required: ["material_type"]
      }
    }
  }
];

// Execute tool calls
async function executeTool(supabase: any, toolName: string, args: any, context: ConversationContext): Promise<string> {
  console.log(`[AI-CHATBOT] Executing tool: ${toolName}`, args);
  
  switch (toolName) {
    case "generate_quote": {
      const basePricePerTonne = {
        'clean_soil': 25,
        'mixed_soil': 45,
        'clay': 35,
        'hardcore': 30,
        'contaminated': 120,
        'hazardous': 250
      };
      
      const contaminationMultiplier = {
        'none': 1,
        'low': 1.3,
        'medium': 1.8,
        'high': 2.5
      };
      
      const materialKey = args.material_type.toLowerCase().replace(/\s+/g, '_');
      const basePrice = basePricePerTonne[materialKey] || 50;
      const multiplier = contaminationMultiplier[args.contamination_level || 'none'] || 1;
      const haulagePerTonne = 15;
      const landfillTax = args.contamination_level === 'none' ? 3.25 : 98.60;
      
      const totalPerTonne = (basePrice * multiplier) + haulagePerTonne + landfillTax;
      const totalPrice = totalPerTonne * args.volume_tonnes;
      
      // Store quote in database
      const { data: quote, error } = await supabase.from('quotes').insert({
        material_type: args.material_type,
        volume_tonnes: args.volume_tonnes,
        site_postcode: args.site_postcode,
        contamination_level: args.contamination_level || 'none',
        haulage_cost: haulagePerTonne * args.volume_tonnes,
        disposal_cost: basePrice * multiplier * args.volume_tonnes,
        landfill_tax: landfillTax * args.volume_tonnes,
        total_price: totalPrice,
        user_id: context.userId,
        source: 'ai_chatbot',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }).select().single();
      
      if (error) {
        console.error('[AI-CHATBOT] Quote creation error:', error);
        return `I've calculated your quote: £${totalPrice.toFixed(2)} for ${args.volume_tonnes} tonnes of ${args.material_type}. However, I couldn't save it to the system. Would you like me to try again?`;
      }
      
      // Track outcome
      await supabase.from('ai_outcomes').insert({
        quote_id: quote.id,
        outcome_type: 'quote_generated',
        outcome_value: totalPrice,
        metadata: { source: 'chatbot', material: args.material_type }
      });
      
      return `I've generated a quote for you:\n\n**Quote #${quote.id.slice(0, 8)}**\n- Material: ${args.material_type}\n- Volume: ${args.volume_tonnes} tonnes\n- Collection: ${args.site_postcode}\n- Contamination: ${args.contamination_level || 'None'}\n\n**Breakdown:**\n- Disposal: £${(basePrice * multiplier * args.volume_tonnes).toFixed(2)}\n- Haulage: £${(haulagePerTonne * args.volume_tonnes).toFixed(2)}\n- Landfill Tax: £${(landfillTax * args.volume_tonnes).toFixed(2)}\n\n**Total: £${totalPrice.toFixed(2)}**\n\nThis quote is valid for 7 days. Would you like to book a collection?`;
    }
    
    case "check_job_status": {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*, customers(company_name, contact_name)')
        .eq('id', args.job_id)
        .single();
      
      if (error || !job) {
        return `I couldn't find a job with that ID. Please check the job reference and try again.`;
      }
      
      return `**Job Status: ${job.status?.toUpperCase() || 'PENDING'}**\n\n- Material: ${job.material_type}\n- Volume: ${job.volume_tonnes} tonnes\n- Location: ${job.site_address}\n- Scheduled: ${job.scheduled_date || 'Not yet scheduled'}\n${job.driver_id ? '- Driver assigned' : '- Awaiting driver assignment'}\n\nWould you like me to update anything about this job?`;
    }
    
    case "book_collection": {
      return `I'd be happy to book a collection for ${args.collection_date}. To complete the booking, I'll need:\n\n1. Confirm the quote you'd like to proceed with\n2. Contact details for site access\n3. Any special access requirements\n\nWould you like to proceed with the booking?`;
    }
    
    case "get_pricing_info": {
      const pricing = {
        'clean_soil': { price: '£25-35/tonne', tax: '£3.25 (lower rate)', notes: 'Inert waste, lowest cost option' },
        'mixed_soil': { price: '£45-60/tonne', tax: '£98.60 (standard rate)', notes: 'May require testing' },
        'contaminated': { price: '£120-180/tonne', tax: '£98.60 (standard rate)', notes: 'Requires hazardous waste consignment note' },
        'hazardous': { price: '£250-400/tonne', tax: '£98.60 (standard rate)', notes: 'Special handling required' }
      };
      
      const materialKey = args.material_type?.toLowerCase().replace(/\s+/g, '_') || 'mixed_soil';
      const info = pricing[materialKey] || pricing['mixed_soil'];
      
      return `**Pricing for ${args.material_type || 'Mixed Soil'}:**\n\n- Base Price: ${info.price}\n- Landfill Tax: ${info.tax}\n- Notes: ${info.notes}\n\nPrices include haulage within 25 miles. Would you like a detailed quote for your specific requirements?`;
    }
    
    default:
      return `I'm not sure how to handle that request. Could you please rephrase?`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AI-CHATBOT-STREAM] Request received');
    
    const { messages, sessionId, userId, context: userContext } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[AI-CHATBOT-STREAM] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load conversation history for memory
    let conversationContext: ConversationContext = {
      sessionId: sessionId || crypto.randomUUID(),
      userId: userId,
      region: userContext?.region || 'uk'
    };

    // Fetch recent context if user is authenticated
    if (userId) {
      const [jobsResult, sessionResult] = await Promise.all([
        supabase.from('jobs').select('id, material_type, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('ai_conversation_sessions').select('*').eq('session_id', conversationContext.sessionId).single()
      ]);

      if (jobsResult.data) {
        conversationContext.recentJobs = jobsResult.data;
      }
      if (sessionResult.data) {
        conversationContext.userPreferences = sessionResult.data.context;
      }
    }

    // Build system prompt with context
    const systemPrompt = `You are MuckBot, an expert AI assistant for MuckAway.ai - a professional spoil removal and waste management platform. You help customers with:

- Generating quotes for waste removal
- Booking collections
- Checking job status
- Understanding UK waste regulations and EWC codes
- Compliance guidance (WTNs, hazardous waste notes)

Your personality: Professional, helpful, knowledgeable about construction waste. You provide specific, actionable advice.

${conversationContext.recentJobs?.length ? `\nUser's recent jobs:\n${conversationContext.recentJobs.map(j => `- ${j.material_type}: ${j.status}`).join('\n')}` : ''}

Region: ${conversationContext.region?.toUpperCase() || 'UK'}
Current landfill tax rates: Standard £98.60/tonne, Lower rate £3.25/tonne (inert waste)

IMPORTANT: When users ask for quotes, use the generate_quote function. When they ask about jobs, use check_job_status. Be proactive in offering to help book collections.`;

    const allMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('[AI-CHATBOT-STREAM] Calling AI with streaming...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: allMessages,
        tools: tools,
        tool_choice: 'auto',
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error('[AI-CHATBOT-STREAM] AI API error:', status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited, please try again' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${status}`);
    }

    // Store interaction
    const interactionData = {
      session_id: conversationContext.sessionId,
      user_id: userId,
      role: 'user',
      content: messages[messages.length - 1]?.content || '',
      metadata: { region: conversationContext.region, source: 'streaming_chatbot' }
    };
    
    await supabase.from('ai_interactions').insert(interactionData);

    // Update session
    await supabase.from('ai_conversation_sessions').upsert({
      session_id: conversationContext.sessionId,
      user_id: userId,
      message_count: messages.length,
      last_activity: new Date().toISOString(),
      context: conversationContext.userPreferences || {}
    }, { onConflict: 'session_id' });

    // Return streaming response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
    });

  } catch (error) {
    console.error('[AI-CHATBOT-STREAM] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
