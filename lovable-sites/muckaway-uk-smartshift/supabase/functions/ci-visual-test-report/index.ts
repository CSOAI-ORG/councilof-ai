import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CITestReport {
  test_run_id: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  failed_routes: Array<{
    route_path: string;
    title: string;
    diff_percentage: number | null;
    viewport: string;
  }>;
  ci_info: {
    provider: 'github' | 'gitlab';
    run_id: string;
    pr_number?: string;
    repository: string;
    commit_sha: string;
    ref: string;
    timestamp: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const report: CITestReport = await req.json();

    console.log('Received CI visual test report:', {
      test_run_id: report.test_run_id,
      total: report.total_tests,
      passed: report.passed_tests,
      failed: report.failed_tests,
      provider: report.ci_info.provider,
    });

    // Store CI test run in database
    const { data: testRun, error: insertError } = await supabase
      .from('visual_test_runs')
      .insert({
        id: report.test_run_id,
        status: report.failed_tests > 0 ? 'failed' : 'passed',
        total_tests: report.total_tests,
        passed_tests: report.passed_tests,
        failed_tests: report.failed_tests,
        new_tests: 0,
        viewport: report.failed_routes[0]?.viewport || 'desktop',
        started_at: report.ci_info.timestamp,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing test run:', insertError);
      // Continue anyway - we still want to send notifications
    }

    // Store individual test results
    if (report.failed_routes.length > 0) {
      const results = report.failed_routes.map(route => ({
        test_run_id: report.test_run_id,
        route_path: route.route_path,
        viewport: route.viewport,
        status: 'failed' as const,
        diff_percentage: route.diff_percentage,
      }));

      const { error: resultsError } = await supabase
        .from('visual_test_results')
        .insert(results);

      if (resultsError) {
        console.error('Error storing test results:', resultsError);
      }
    }

    // If there were failures, send email notifications
    if (report.failed_tests > 0 && resendApiKey) {
      console.log('Sending failure notifications...');

      // Get notification recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from('visual_test_notification_recipients')
        .select('email, name')
        .eq('active', true);

      if (recipientsError) {
        console.error('Error fetching recipients:', recipientsError);
      } else if (recipients && recipients.length > 0) {
        // Build CI-specific details
        const ciProvider = report.ci_info.provider === 'github' ? 'GitHub' : 'GitLab';
        const prLink = report.ci_info.provider === 'github'
          ? `https://github.com/${report.ci_info.repository}/pull/${report.ci_info.pr_number}`
          : `https://gitlab.com/${report.ci_info.repository}/-/merge_requests/${report.ci_info.pr_number}`;
        
        const pipelineLink = report.ci_info.provider === 'github'
          ? `https://github.com/${report.ci_info.repository}/actions/runs/${report.ci_info.run_id}`
          : `https://gitlab.com/${report.ci_info.repository}/-/pipelines/${report.ci_info.run_id}`;

        // Generate failed routes HTML
        const failedRoutesHtml = report.failed_routes.map(route => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${route.route_path}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${route.viewport}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #ef4444;">
              ${route.diff_percentage ? `${route.diff_percentage.toFixed(2)}%` : 'Diff detected'}
            </td>
          </tr>
        `).join('');

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>CI Visual Regression Alert</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚨 CI Visual Regression Alert</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                ${ciProvider} Pipeline #${report.ci_info.run_id}
              </p>
            </div>
            
            <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-weight: 600;">
                  ❌ ${report.failed_tests} visual regression${report.failed_tests > 1 ? 's' : ''} detected
                </p>
                <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 14px;">
                  This pull request introduces visual changes that differ from the baseline screenshots.
                </p>
              </div>

              <h2 style="font-size: 18px; margin: 0 0 16px 0;">Test Summary</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Total Tests:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${report.total_tests}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #16a34a;"><strong>Passed:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #16a34a;">${report.passed_tests}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #dc2626;"><strong>Failed:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #dc2626;">${report.failed_tests}</td>
                </tr>
              </table>

              <h2 style="font-size: 18px; margin: 0 0 16px 0;">Failed Routes</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Route</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Viewport</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  ${failedRoutesHtml}
                </tbody>
              </table>

              <h2 style="font-size: 18px; margin: 0 0 16px 0;">CI Details</h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Repository:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.ci_info.repository}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Branch/Ref:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${report.ci_info.ref}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Commit:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${report.ci_info.commit_sha.substring(0, 8)}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                ${report.ci_info.pr_number ? `
                  <a href="${prLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">
                    View Pull Request
                  </a>
                ` : ''}
                <a href="${pipelineLink}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Pipeline
                </a>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
              <p>Muckaway Visual Regression Testing</p>
              <p>Generated at ${new Date().toISOString()}</p>
            </div>
          </body>
          </html>
        `;

        // Send emails to all recipients
        for (const recipient of recipients) {
          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'Muckaway CI <notifications@muckaway.com>',
                to: recipient.email,
                subject: `🚨 CI Visual Regression Failed - ${report.failed_tests} issue${report.failed_tests > 1 ? 's' : ''} in PR`,
                html: emailHtml,
              }),
            });

            if (!emailResponse.ok) {
              const error = await emailResponse.text();
              console.error(`Failed to send email to ${recipient.email}:`, error);
            } else {
              console.log(`Notification sent to ${recipient.email}`);
            }

            // Log email
            await supabase.from('email_logs').insert({
              email_type: 'ci_visual_test_failure',
              recipient_email: recipient.email,
              status: emailResponse.ok ? 'sent' : 'failed',
              metadata: {
                test_run_id: report.test_run_id,
                ci_provider: report.ci_info.provider,
                failed_tests: report.failed_tests,
              },
            });
          } catch (emailError) {
            console.error(`Error sending to ${recipient.email}:`, emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: report.failed_tests > 0 
          ? `Received report with ${report.failed_tests} failures, notifications sent`
          : 'All tests passed, no notifications needed',
        test_run_id: report.test_run_id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing CI report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
