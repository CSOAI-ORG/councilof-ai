import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisualTestFailureData {
  testRunId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  newTests: number;
  failedRoutes: Array<{
    routePath: string;
    viewport: string;
    diffPercentage: number;
  }>;
  dashboardUrl?: string;
}

function generateEmailHtml(data: VisualTestFailureData): string {
  const failedRoutesHtml = data.failedRoutes.map(route => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-family: monospace; color: #333;">${route.routePath}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #333;">${route.viewport}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; color: #dc2626; font-weight: bold;">${route.diffPercentage.toFixed(2)}%</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #fff; font-size: 24px;">⚠️ Visual Regression Tests Failed</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="margin: 0 0 20px; color: #666;">Visual regression tests have detected UI changes that need review.</p>
          
          <!-- Summary Stats -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px;">
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #333;">${data.totalTests}</div>
              <div style="font-size: 12px; color: #666;">Total</div>
            </div>
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${data.passedTests}</div>
              <div style="font-size: 12px; color: #666;">Passed</div>
            </div>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${data.failedTests}</div>
              <div style="font-size: 12px; color: #666;">Failed</div>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: #d97706;">${data.newTests}</div>
              <div style="font-size: 12px; color: #666;">New</div>
            </div>
          </div>
          
          ${data.failedRoutes.length > 0 ? `
            <!-- Failed Routes Table -->
            <h3 style="margin: 0 0 15px; color: #333; font-size: 16px;">Failed Routes</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase;">Route</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase;">Viewport</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; color: #666; font-size: 12px; text-transform: uppercase;">Diff %</th>
                </tr>
              </thead>
              <tbody>
                ${failedRoutesHtml}
              </tbody>
            </table>
          ` : ''}
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl || 'https://muckaway.ai/admin'}" 
               style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Review Visual Tests
            </a>
          </div>
          
          <!-- Test Run Info -->
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px; color: #666;">
            <strong>Test Run ID:</strong> ${data.testRunId}<br>
            <strong>Time:</strong> ${new Date().toISOString()}
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated notification from MuckAway.ai Visual Regression Testing System.
          </p>
          <p style="margin: 10px 0 0; color: #999; font-size: 11px;">
            To unsubscribe, update your notification preferences in the admin dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.warn('[NOTIFY-VISUAL-TEST-FAILURE] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured', code: 'NO_RESEND_KEY' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: VisualTestFailureData = await req.json();
    
    console.log('[NOTIFY-VISUAL-TEST-FAILURE] Processing notification for test run:', data.testRunId);

    // Get all active notification recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from('visual_test_notification_recipients')
      .select('email, name')
      .eq('active', true);

    if (recipientsError) {
      console.error('[NOTIFY-VISUAL-TEST-FAILURE] Error fetching recipients:', recipientsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notification recipients' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!recipients || recipients.length === 0) {
      console.log('[NOTIFY-VISUAL-TEST-FAILURE] No active recipients configured');
      return new Response(
        JSON.stringify({ success: true, message: 'No recipients configured', emailsSent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const emailHtml = generateEmailHtml(data);
    const subject = `⚠️ Visual Regression Tests Failed - ${data.failedTests} Issue${data.failedTests > 1 ? 's' : ''} Detected`;
    
    const emailPromises = recipients.map(async (recipient) => {
      try {
        const response = await resend.emails.send({
          from: 'MuckAway.ai <onboarding@resend.dev>',
          to: [recipient.email],
          subject,
          html: emailHtml,
        });
        
        console.log(`[NOTIFY-VISUAL-TEST-FAILURE] Email sent to ${recipient.email}:`, response.id);
        
        // Log the email
        await supabase.from('email_logs').insert({
          email_type: 'visual_test_failure',
          recipient_email: recipient.email,
          status: 'sent',
          metadata: { 
            resend_id: response.id, 
            test_run_id: data.testRunId,
            failed_tests: data.failedTests 
          }
        });
        
        return { email: recipient.email, success: true, id: response.id };
      } catch (error) {
        console.error(`[NOTIFY-VISUAL-TEST-FAILURE] Failed to send to ${recipient.email}:`, error);
        
        await supabase.from('email_logs').insert({
          email_type: 'visual_test_failure',
          recipient_email: recipient.email,
          status: 'failed',
          metadata: { 
            error: error.message, 
            test_run_id: data.testRunId 
          }
        });
        
        return { email: recipient.email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[NOTIFY-VISUAL-TEST-FAILURE] Sent ${successCount}/${recipients.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: successCount,
        totalRecipients: recipients.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[NOTIFY-VISUAL-TEST-FAILURE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
