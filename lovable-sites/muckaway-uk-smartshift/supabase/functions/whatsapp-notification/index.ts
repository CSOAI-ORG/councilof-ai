import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { whatsappMessageSchema, validateRequest, createValidationErrorResponse, type WhatsAppMessageInput } from '../_shared/validation.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// WhatsApp Business API Templates
const MESSAGE_TEMPLATES = {
  booking_confirmation: {
    name: 'booking_confirmed',
    language: 'en',
    components: [
      { type: 'body', parameters: ['customerName', 'collectionDate', 'address'] }
    ],
    fallbackMessage: (meta: WhatsAppMessage['metadata']) => 
      `✅ Booking Confirmed!\n\nHi ${meta?.customerName || 'Customer'},\n\nYour waste collection is scheduled for ${meta?.collectionDate || 'TBC'} at ${meta?.address || 'your address'}.\n\nReference: ${meta?.jobId || 'N/A'}\n\nThank you for choosing MuckAway.ai!`
  },
  
  collection_reminder: {
    name: 'collection_reminder',
    language: 'en',
    components: [
      { type: 'body', parameters: ['customerName', 'collectionDate'] }
    ],
    fallbackMessage: (meta: WhatsAppMessage['metadata']) => 
      `🔔 Reminder: Collection Tomorrow\n\nHi ${meta?.customerName || 'Customer'},\n\nJust a reminder that your waste collection is scheduled for tomorrow (${meta?.collectionDate || 'TBC'}).\n\nPlease ensure the waste is accessible.\n\nSee you tomorrow!`
  },
  
  driver_arrival: {
    name: 'driver_arriving',
    language: 'en',
    components: [
      { type: 'body', parameters: ['driverName', 'vehicleReg'] }
    ],
    fallbackMessage: (meta: WhatsAppMessage['metadata']) => 
      `🚛 Driver On The Way!\n\nYour driver ${meta?.driverName || ''} is approximately 30 minutes away.\n\nVehicle: ${meta?.vehicleReg || 'N/A'}\n\nPlease ensure access is clear.`
  },
  
  job_complete: {
    name: 'job_completed',
    language: 'en',
    components: [
      { type: 'body', parameters: ['customerName', 'jobId'] }
    ],
    fallbackMessage: (meta: WhatsAppMessage['metadata']) => 
      `✅ Collection Complete!\n\nHi ${meta?.customerName || 'Customer'},\n\nYour waste collection (Ref: ${meta?.jobId || 'N/A'}) has been completed.\n\nYour Waste Transfer Note is available in your dashboard.\n\nThank you for using MuckAway.ai! 🌱`
  },
  
  custom: {
    name: 'custom_message',
    language: 'en',
    components: [],
    fallbackMessage: () => ''
  }
};

// Format phone number for WhatsApp API
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Assume Singapore if no country code
    if (cleaned.length === 8) {
      cleaned = '+65' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validation = validateRequest(whatsappMessageSchema, rawBody);
    if (!validation.success) {
      console.error('[WHATSAPP] Validation failed:', validation.error);
      return createValidationErrorResponse(validation.error, corsHeaders);
    }
    
    const requestData = validation.data;
    console.log(`[WHATSAPP] Processing ${requestData.type} message to ${requestData.to}`);

    const formattedPhone = formatPhoneNumber(requestData.to);
    console.log(`[WHATSAPP] Formatted phone: ${formattedPhone}`);

    // Get WhatsApp Business API credentials
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    // Get message template
    const template = MESSAGE_TEMPLATES[requestData.type];
    
    if (!template && requestData.type !== 'custom') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid message type' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message content
    const messageContent = requestData.message || template?.fallbackMessage(requestData.metadata) || '';

    // If WhatsApp credentials are not configured, log and return success
    // This allows the system to work in development without real WhatsApp integration
    if (!whatsappToken || !whatsappPhoneId) {
      console.log(`[WHATSAPP] Credentials not configured - simulating send`);
      console.log(`[WHATSAPP] Would send to: ${formattedPhone}`);
      console.log(`[WHATSAPP] Message: ${messageContent}`);
      
      // Return simulated success
      const simulatedResponse: WhatsAppResponse = {
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };
      
      return new Response(
        JSON.stringify(simulatedResponse),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call WhatsApp Business API
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone.replace('+', ''),
      type: "text",
      text: {
        preview_url: false,
        body: messageContent
      }
    };

    console.log(`[WHATSAPP] Sending to Meta API...`);
    
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[WHATSAPP] API Error:`, result);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error?.message || 'Failed to send WhatsApp message' 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WHATSAPP] Message sent successfully:`, result);

    const successResponse: WhatsAppResponse = {
      success: true,
      messageId: result.messages?.[0]?.id || result.message_id,
    };

    return new Response(
      JSON.stringify(successResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[WHATSAPP] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
