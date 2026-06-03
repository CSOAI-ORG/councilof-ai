import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { sendNotificationSchema, validateRequest, createValidationErrorResponse, type SendNotificationInput } from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Welcome to MuckAway.ai - Your Account is Ready!',
    getHtml: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; color: #000; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .tier-badge { display: inline-block; background: #FFD700; color: #000; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .steps { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .step { display: flex; align-items: flex-start; margin: 15px 0; }
          .step-number { background: #FFD700; color: #000; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
          .btn { display: inline-block; background: #FFD700; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 5px; }
          .btn:hover { background: #FFA500; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚧 Welcome to MuckAway.ai!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.name || 'there'},</p>
            <p>Thank you for subscribing to MuckAway.ai - the UK's smartest waste management platform!</p>
            
            <p>Your Plan: <span class="tier-badge">${data.tier || 'Professional'}</span></p>
            
            <div class="steps">
              <h3>🚀 Get Started in 3 Easy Steps:</h3>
              
              <div class="step">
                <div class="step-number">1</div>
                <div>
                  <strong>Access Your Dashboard</strong><br>
                  Log in to your account and explore your personalized dashboard with real-time analytics.
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">2</div>
                <div>
                  <strong>Upload Your First Spoil Image</strong><br>
                  Use our AI-powered classifier to instantly identify waste types and get EWC codes.
                </div>
              </div>
              
              <div class="step">
                <div class="step-number">3</div>
                <div>
                  <strong>Create Your First Quote</strong><br>
                  Generate compliant quotes in seconds using voice commands or manual entry.
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.dashboardUrl || 'https://muckaway.ai/dashboard'}" class="btn">Go to Dashboard</a>
              <a href="${data.loginUrl || 'https://muckaway.ai/auth'}" class="btn" style="background: #333; color: #fff;">Log In</a>
            </div>
            
            <p><strong>Need Help?</strong> Our support team is here for you:</p>
            <ul>
              <li>📧 Email: support@muckaway.ai</li>
              <li>📚 <a href="https://muckaway.ai/how-to-use">View Tutorials</a></li>
              <li>❓ <a href="https://muckaway.ai/faq">FAQ</a></li>
            </ul>
            
            <p style="margin-top: 20px;">Shift it smart. Shift it legal.</p>
            <p>- The MuckAway.ai Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MuckAway.ai | <a href="https://muckaway.ai/privacy">Privacy Policy</a> | <a href="https://muckaway.ai/terms">Terms of Service</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  usage_warning: {
    subject: 'Usage Alert - MuckAway.ai',
    getHtml: (data: any) => `
      <h1>Usage Warning</h1>
      <p>Hi ${data.name || 'there'},</p>
      <p>You've used <strong>${data.percentage}%</strong> of your monthly ${data.resource} limit.</p>
      <p>Current usage: ${data.current} / ${data.limit}</p>
      <p>Consider upgrading your plan for more capacity.</p>
      <a href="https://muckaway.ai/subscribe" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Upgrade Now</a>
    `
  },
  renewal_reminder: {
    subject: 'Subscription Renewal Reminder - MuckAway.ai',
    getHtml: (data: any) => `
      <h1>Subscription Renewal</h1>
      <p>Hi ${data.name || 'there'},</p>
      <p>Your ${data.tier} subscription will renew in ${data.days_until} days.</p>
      <p>Amount: ${data.amount}</p>
      <p>If you need to make any changes, visit your account settings.</p>
      <a href="https://muckaway.ai/profile" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Subscription</a>
    `
  },
  job_complete: {
    subject: 'Job Completed - MuckAway.ai',
    getHtml: (data: any) => `
      <h1>Job Completed!</h1>
      <p>Job #${data.job_id} has been completed.</p>
      <p><strong>Material:</strong> ${data.material_type}</p>
      <p><strong>Volume:</strong> ${data.volume} tonnes</p>
      <p><strong>Site:</strong> ${data.site_address}</p>
      <p>View details in your dashboard.</p>
      <a href="https://muckaway.ai/dashboard" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
    `
  },
  visual_test_failure: {
    subject: '⚠️ Visual Regression Tests Failed - MuckAway.ai',
    getHtml: (data: any) => `
      <h1>⚠️ Visual Regression Tests Failed</h1>
      <p>Visual tests have detected ${data.failedTests} visual regression${data.failedTests > 1 ? 's' : ''}.</p>
      <p><strong>Test Run:</strong> ${data.testRunId}</p>
      <p><strong>Summary:</strong></p>
      <ul>
        <li>Total Tests: ${data.totalTests}</li>
        <li>Passed: ${data.passedTests}</li>
        <li>Failed: ${data.failedTests}</li>
        <li>New: ${data.newTests}</li>
      </ul>
      <p>Please review and approve or fix the visual differences.</p>
      <a href="https://muckaway.ai/admin" style="background: #FFD700; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Visual Tests</a>
    `
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('[SEND-NOTIFICATION] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured', code: 'NO_RESEND_KEY' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    
    // Validate input with Zod schema
    const validation = validateRequest(sendNotificationSchema, rawBody);
    if (!validation.success) {
      console.error('[SEND-NOTIFICATION] Validation failed:', validation.error);
      return createValidationErrorResponse(validation.error, corsHeaders);
    }
    
    const { user_id, email, type, data = {} } = validation.data;

    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Invalid notification type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: 'MuckAway.ai <onboarding@resend.dev>',
      to: [email],
      subject: template.subject,
      html: template.getHtml(data)
    });

    console.log('[SEND-NOTIFICATION] Email sent:', emailResponse);

    // Log the email
    await supabase.from('email_logs').insert({
      user_id: user_id || null,
      email_type: type,
      recipient_email: email,
      status: 'sent',
      metadata: { resend_id: emailResponse.id, data }
    });

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SEND-NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
