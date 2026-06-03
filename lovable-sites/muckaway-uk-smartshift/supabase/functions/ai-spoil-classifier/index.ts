import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // 20 requests per minute
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
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);
  
  if (!rateLimitResult.allowed) {
    console.log('[AI-SPOIL-CLASSIFIER] Rate limit exceeded for IP:', clientIP);
    return new Response(JSON.stringify({ 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
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
    console.log('[AI-SPOIL-CLASSIFIER] Function started');
    
    const { image, enhancedMode = false, includeRiskAssessment = false, includeVisualMapping = false } = await req.json();
    
    if (!image) {
      console.error('[AI-SPOIL-CLASSIFIER] No image data provided');
      throw new Error('No image data provided');
    }

    console.log('[AI-SPOIL-CLASSIFIER] Image data received, length:', image.length);
    console.log('[AI-SPOIL-CLASSIFIER] Enhanced mode:', enhancedMode);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[AI-SPOIL-CLASSIFIER] LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[AI-SPOIL-CLASSIFIER] API key verified');

    const systemPrompt = `You are an expert geotechnical engineer and waste classification specialist with advanced computer vision capabilities. Analyze the uploaded image of spoil material and provide a detailed classification.

${enhancedMode ? `
ENHANCED ANALYSIS MODE - Provide comprehensive technical assessment:
- Advanced material composition analysis
- Detailed contamination risk assessment  
- Environmental impact evaluation
- Regulatory compliance guidance
- Visual contamination mapping
- Particle size distribution analysis
- Moisture content assessment
- Geotechnical properties evaluation
` : ''}

Return a JSON response with this exact structure:
{
  "material_type": "soil|clay|chalk|hardcore|mixed|topsoil",
  "confidence": 0.85,
  "estimated_volume_m3": 45,
  "contamination_risk": "low|medium|high",
  "ewc_code": "17 05 04",
  "description": "Detailed description of what you see including color, texture, particle size",
  "recommendations": ["List of specific recommendations for handling and disposal"],
  "landfill_tax_category": "inert|standard|hazardous"${enhancedMode ? `,
  "risk_assessment": "Detailed risk analysis including environmental and health factors",
  "visual_analysis": "Comprehensive visual assessment including contamination indicators",
  "particle_size_analysis": "Assessment of particle distribution and composition",
  "moisture_content": "Visual assessment of moisture levels",
  "geotechnical_properties": "Assessment of bearing capacity, compaction, stability"` : ''}
}

Key analysis points:
- Color and texture indicate material type and contamination
- Visible contaminants (oil stains, debris, unusual colors, foreign materials)
- Particle size distribution and sorting
- Moisture content indicators
- Safety recommendations for handling
- Appropriate disposal routes and costs
- EWC codes: 17 05 04 (inert), 17 05 05* (contaminated), 17 05 03* (hazardous)
- Environmental impact assessment
- Regulatory compliance requirements`;

    console.log('[AI-SPOIL-CLASSIFIER] Calling AI API...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this spoil material image and provide a detailed classification.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    console.log('[AI-SPOIL-CLASSIFIER] AI API response status:', response.status);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service quota exceeded. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI analysis failed: ' + response.status);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No analysis content received from AI');
    }

    let analysisResult;
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      // Fallback with extracted information
      analysisResult = {
        material_type: "mixed",
        confidence: 0.75,
        estimated_volume_m3: 30,
        contamination_risk: "medium",
        ewc_code: "17 05 04",
        description: aiContent,
        recommendations: ["Manual verification recommended", "Standard disposal protocols apply"],
        landfill_tax_category: "standard"
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-spoil-classifier:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});