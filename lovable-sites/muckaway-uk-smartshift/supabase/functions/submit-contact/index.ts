import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
  subject?: string;
  source_page?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[SUBMIT-CONTACT] Request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ContactRequest = await req.json();
    console.log('[SUBMIT-CONTACT] Processing contact from:', body.email);

    // Validate required fields
    if (!body.name || body.name.length < 2) {
      return new Response(JSON.stringify({ error: 'Name is required (min 2 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.email || !body.email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.message || body.message.length < 10) {
      return new Response(JSON.stringify({ error: 'Message is required (min 10 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to support_requests table
    const { data: supportRequest, error: dbError } = await supabase
      .from('support_requests')
      .insert({
        email: body.email,
        name: body.name,
        phone: body.phone || null,
        company: body.company || null,
        request_type: 'contact_form',
        subject: body.subject || 'Contact Form Submission',
        message: body.message,
        source_page: body.source_page || '/contact',
        status: 'new',
        priority: 'normal',
        metadata: {
          submitted_at: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') || 'unknown'
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('[SUBMIT-CONTACT] Database error:', dbError);
      // Continue anyway - send email even if DB fails
    } else {
      console.log('[SUBMIT-CONTACT] Saved to database:', supportRequest?.id);
    }

    // Send email notification to admin
    const emailResponse = await resend.emails.send({
      from: 'MuckAway.ai <onboarding@resend.dev>',
      to: ['nicholastempleman@gmail.com'],
      subject: `[MuckAway Contact] ${body.subject || 'New Message'} from ${body.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${body.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${body.email}">${body.email}</a></p>
            ${body.phone ? `<p><strong>Phone:</strong> <a href="tel:${body.phone}">${body.phone}</a></p>` : ''}
            ${body.company ? `<p><strong>Company:</strong> ${body.company}</p>` : ''}
            <p><strong>Source Page:</strong> ${body.source_page || '/contact'}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${body.message}</p>
          </div>
          
          ${supportRequest ? `<p style="color: #64748b; font-size: 12px; margin-top: 20px;">Reference ID: ${supportRequest.id}</p>` : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          
          <p style="color: #64748b; font-size: 12px;">
            This email was sent from the MuckAway.ai contact form.<br />
            Reply directly to this email to respond to the customer.
          </p>
        </div>
      `,
      replyTo: body.email,
    });

    console.log('[SUBMIT-CONTACT] Email sent:', emailResponse);

    // Send confirmation email to customer
    await resend.emails.send({
      from: 'MuckAway.ai <onboarding@resend.dev>',
      to: [body.email],
      subject: 'We received your message - MuckAway.ai',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Thank you for contacting MuckAway.ai, ${body.name}!</h2>
          
          <p>We've received your message and will get back to you within 24 hours.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Message:</h3>
            <p style="white-space: pre-wrap;">${body.message}</p>
          </div>
          
          <p>In the meantime, you can:</p>
          <ul>
            <li><a href="https://muckaway.ai/ai-tools">Try our AI Assistant</a> for instant answers</li>
            <li><a href="https://muckaway.ai/pricing">View our pricing plans</a></li>
            <li><a href="https://muckaway.ai/how-to-use">Learn how MuckAway.ai works</a></li>
          </ul>
          
          <p>Best regards,<br />The MuckAway.ai Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          
          <p style="color: #64748b; font-size: 12px;">
            MuckAway.ai - AI-Powered Waste Management<br />
            support@muckaway.ai
          </p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully',
        reference: supportRequest?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[SUBMIT-CONTACT] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send message. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
