import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  request_id?: string;
  email?: string;
  user_id?: string;
  format?: 'json' | 'csv';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { request_id, email, user_id, format = 'json' }: ExportRequest = await req.json();

    console.log('Processing data export request:', { request_id, email, user_id, format });

    // Get the data subject request if provided
    let requestRecord = null;
    if (request_id) {
      const { data } = await supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', request_id)
        .single();
      requestRecord = data;
    }

    // Determine the target user
    let targetEmail = email || requestRecord?.requester_email;
    let targetUserId = user_id;

    if (!targetEmail && !targetUserId) {
      throw new Error('Either email or user_id is required');
    }

    // Find user by email if needed
    if (targetEmail && !targetUserId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users.users?.find(u => u.email === targetEmail);
      targetUserId = user?.id;
    }

    console.log('Exporting data for:', { targetEmail, targetUserId });

    // Collect all user data
    const exportData: Record<string, any> = {
      export_metadata: {
        generated_at: new Date().toISOString(),
        request_type: 'subject_access_request',
        format: format,
        data_controller: 'MuckAway.ai',
        data_protection_contact: 'dpo@muckaway.ai'
      },
      user_data: {}
    };

    // 1. Profile data
    if (targetUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      if (profile) {
        exportData.user_data.profile = sanitizeRecord(profile);
      }
    }

    // 2. Customer records (where user is the data subject)
    const { data: customerRecords } = await supabase
      .from('customers')
      .select('*')
      .or(`email.eq.${targetEmail},user_id.eq.${targetUserId}`);
    
    if (customerRecords?.length) {
      exportData.user_data.customer_records = customerRecords.map(sanitizeRecord);
    }

    // 3. Jobs created by or related to the user
    if (targetUserId) {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(500);
      
      if (jobs?.length) {
        exportData.user_data.jobs = jobs.map(sanitizeRecord);
      }
    }

    // 4. Quotes
    if (targetUserId) {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(200);
      
      if (quotes?.length) {
        exportData.user_data.quotes = quotes.map(sanitizeRecord);
      }
    }

    // 5. Hazardous consignment notes
    if (targetUserId) {
      const { data: hazNotes } = await supabase
        .from('hazardous_consignment_notes')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(200);
      
      if (hazNotes?.length) {
        exportData.user_data.hazardous_consignment_notes = hazNotes.map(sanitizeRecord);
      }
    }

    // 6. AI Interactions
    if (targetUserId) {
      const { data: aiInteractions } = await supabase
        .from('ai_interactions')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(500);
      
      if (aiInteractions?.length) {
        exportData.user_data.ai_interactions = aiInteractions.map(sanitizeRecord);
      }
    }

    // 7. Analytics events
    if (targetUserId) {
      const { data: analyticsEvents } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(1000);
      
      if (analyticsEvents?.length) {
        exportData.user_data.analytics_events = analyticsEvents.map(sanitizeRecord);
      }
    }

    // 8. Notification preferences
    if (targetUserId) {
      const { data: notifPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      
      if (notifPrefs) {
        exportData.user_data.notification_preferences = sanitizeRecord(notifPrefs);
      }
    }

    // 9. Drivers (created by user)
    if (targetUserId) {
      const { data: drivers } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', targetUserId);
      
      if (drivers?.length) {
        exportData.user_data.drivers = drivers.map(sanitizeRecord);
      }
    }

    // 10. Vehicles
    if (targetUserId) {
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', targetUserId);
      
      if (vehicles?.length) {
        exportData.user_data.vehicles = vehicles.map(sanitizeRecord);
      }
    }

    // 11. Compliance documents
    if (targetUserId) {
      const { data: complianceDocs } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('user_id', targetUserId);
      
      if (complianceDocs?.length) {
        exportData.user_data.compliance_documents = complianceDocs.map(sanitizeRecord);
      }
    }

    // 12. Data access audit (about this user)
    if (targetUserId) {
      const { data: auditLogs } = await supabase
        .from('data_access_audit')
        .select('*')
        .eq('user_id', targetUserId)
        .limit(500);
      
      if (auditLogs?.length) {
        exportData.user_data.data_access_audit = auditLogs.map(sanitizeRecord);
      }
    }

    // Generate export content
    let exportContent: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      exportContent = convertToCSV(exportData);
      contentType = 'text/csv';
      filename = `data_export_${Date.now()}.csv`;
    } else {
      exportContent = JSON.stringify(exportData, null, 2);
      contentType = 'application/json';
      filename = `data_export_${Date.now()}.json`;
    }

    // Update the request record if provided
    if (request_id) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

      await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          export_expires_at: expiresAt.toISOString(),
          notes: `Export generated with ${Object.keys(exportData.user_data).length} data categories`
        })
        .eq('id', request_id);
    }

    // Log to audit
    await supabase.from('data_access_audit').insert({
      user_id: targetUserId || '00000000-0000-0000-0000-000000000000',
      action_type: 'data_export',
      resource_type: 'subject_access_request',
      resource_details: {
        request_id,
        categories_exported: Object.keys(exportData.user_data),
        format,
        generated_at: new Date().toISOString()
      }
    });

    console.log('Data export completed successfully');

    // Return the export directly
    return new Response(exportContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function sanitizeRecord(record: any): any {
  // Remove internal IDs and sensitive system fields
  const sanitized = { ...record };
  delete sanitized.key_hash; // API keys
  delete sanitized.access_token;
  delete sanitized.refresh_token;
  delete sanitized.token_hash;
  return sanitized;
}

function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  // Add metadata as comments
  lines.push('# Data Export - Subject Access Request');
  lines.push(`# Generated: ${data.export_metadata.generated_at}`);
  lines.push(`# Data Controller: ${data.export_metadata.data_controller}`);
  lines.push('');

  // Process each data category
  for (const [category, records] of Object.entries(data.user_data)) {
    lines.push(`# Category: ${category}`);
    
    if (Array.isArray(records) && records.length > 0) {
      // Get all unique keys from all records
      const allKeys = new Set<string>();
      records.forEach((record: any) => {
        Object.keys(record).forEach(key => allKeys.add(key));
      });
      
      const headers = Array.from(allKeys);
      lines.push(headers.join(','));
      
      records.forEach((record: any) => {
        const values = headers.map(header => {
          const value = record[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
          return String(value).replace(/,/g, ';').replace(/\n/g, ' ');
        });
        lines.push(values.join(','));
      });
    } else if (typeof records === 'object' && records !== null) {
      const headers = Object.keys(records);
      lines.push(headers.join(','));
      const values = headers.map(header => {
        const value = (records as any)[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return String(value).replace(/,/g, ';').replace(/\n/g, ' ');
      });
      lines.push(values.join(','));
    }
    
    lines.push('');
  }

  return lines.join('\n');
}
