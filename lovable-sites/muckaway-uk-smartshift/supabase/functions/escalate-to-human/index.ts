import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationRequest {
  userEmail?: string;
  userName?: string;
  sessionId: string;
  conversationHistory: Array<{ role: string; content: string }>;
  reason: string;
  priority?: 'normal' | 'high' | 'urgent';
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[ESCALATE-TO-HUMAN] Request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: EscalationRequest = await req.json();
    console.log('[ESCALATE-TO-HUMAN] Processing escalation for session:', body.sessionId);

    // Determine priority based on reason
    let priority = body.priority || 'normal';
    const reasonLower = body.reason.toLowerCase();
    if (reasonLower.includes('refund') || reasonLower.includes('payment') || reasonLower.includes('billing')) {
      priority = 'high';
    }
    if (reasonLower.includes('urgent') || reasonLower.includes('emergency') || reasonLower.includes('legal')) {
      priority = 'urgent';
    }

    // Format conversation transcript
    const transcript = body.conversationHistory
      .map(msg => `**${msg.role === 'user' ? 'Customer' : 'MuckBot'}:** ${msg.content}`)
      .join('\n\n');

    // Save to support_requests table
    const { data: supportRequest, error: dbError } = await supabase
      .from('support_requests')
      .insert({
        email: body.userEmail || 'unknown@muckaway.ai',
        name: body.userName || 'Unknown Customer',
        user_id: body.userId || null,
        request_type: 'ai_escalation',
        subject: `AI Escalation: ${body.reason}`,
        message: body.reason,
        conversation_transcript: body.conversationHistory,
        status: 'new',
        priority: priority,
        metadata: {
          session_id: body.sessionId,
          escalated_at: new Date().toISOString(),
          message_count: body.conversationHistory.length
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('[ESCALATE-TO-HUMAN] Database error:', dbError);
    } else {
      console.log('[ESCALATE-TO-HUMAN] Saved to database:', supportRequest?.id);
    }

    // Determine priority styling
    const priorityColors = {
      normal: { bg: '#e0f2fe', text: '#0369a1', label: 'Normal' },
      high: { bg: '#fef3c7', text: '#b45309', label: 'High Priority' },
      urgent: { bg: '#fee2e2', text: '#dc2626', label: '🚨 URGENT' }
    };
    const priorityStyle = priorityColors[priority];

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: 'MuckAway.ai <onboarding@resend.dev>',
      to: ['nicholastempleman@gmail.com'],
      subject: `${priority === 'urgent' ? '🚨 URGENT: ' : priority === 'high' ? '⚠️ ' : ''}[MuckAway AI Escalation] ${body.reason}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: ${priorityStyle.bg}; color: ${priorityStyle.text}; padding: 15px 20px; border-radius: 8px 8px 0 0; font-weight: bold;">
            ${priorityStyle.label} - Human Support Required
          </div>
          
          <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #f97316; margin-top: 0;">AI Chatbot Escalation</h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Reason for Escalation:</strong></p>
              <p style="margin: 10px 0 0 0;">${body.reason}</p>
            </div>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>Customer Details:</strong></p>
              ${body.userEmail ? `<p style="margin: 5px 0;">Email: <a href="mailto:${body.userEmail}">${body.userEmail}</a></p>` : ''}
              ${body.userName ? `<p style="margin: 5px 0;">Name: ${body.userName}</p>` : ''}
              <p style="margin: 5px 0;">Session ID: ${body.sessionId}</p>
              <p style="margin: 5px 0;">Messages in conversation: ${body.conversationHistory.length}</p>
            </div>
            
            <h3>Conversation Transcript:</h3>
            <div style="background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto;">
              ${body.conversationHistory.map(msg => `
                <div style="margin-bottom: 15px; padding: 10px; background: ${msg.role === 'user' ? '#dbeafe' : '#f1f5f9'}; border-radius: 8px;">
                  <strong style="color: ${msg.role === 'user' ? '#1d4ed8' : '#475569'};">
                    ${msg.role === 'user' ? '👤 Customer' : '🤖 MuckBot'}:
                  </strong>
                  <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${msg.content}</p>
                </div>
              `).join('')}
            </div>
            
            ${supportRequest ? `
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                Reference ID: ${supportRequest.id}<br />
                View in admin dashboard to respond
              </p>
            ` : ''}
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          
          <p style="color: #64748b; font-size: 12px;">
            This escalation was triggered by the MuckAway.ai AI chatbot.<br />
            ${body.userEmail ? `Reply to ${body.userEmail} to respond directly to the customer.` : 'No customer email available.'}
          </p>
        </div>
      `,
      replyTo: body.userEmail || undefined,
    });

    console.log('[ESCALATE-TO-HUMAN] Email sent:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your request has been escalated to our support team. They will be in touch soon.',
        reference: supportRequest?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[ESCALATE-TO-HUMAN] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to escalate. Please try contacting support directly.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
