import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetentionPolicy {
  id: string;
  table_name: string;
  retention_years: number;
  retention_action: 'archive' | 'anonymize' | 'delete';
  legal_basis: string;
  active: boolean;
}

interface ProcessingResult {
  table: string;
  action: string;
  count: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting data retention processing...');

    // Get active retention policies
    const { data: policies, error: policiesError } = await supabase
      .from('data_retention_policies')
      .select('*')
      .eq('active', true);

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      throw policiesError;
    }

    console.log(`Found ${policies?.length || 0} active retention policies`);

    const results: ProcessingResult[] = [];
    const now = new Date();

    for (const policy of (policies as RetentionPolicy[]) || []) {
      const result: ProcessingResult = {
        table: policy.table_name,
        action: policy.retention_action,
        count: 0,
        errors: []
      };

      try {
        console.log(`Processing ${policy.table_name} with ${policy.retention_action} action...`);

        // Calculate retention cutoff date
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - policy.retention_years);

        switch (policy.table_name) {
          case 'jobs':
            result.count = await processJobs(supabase, policy, cutoffDate);
            break;
          case 'hazardous_consignment_notes':
            result.count = await processHazardousNotes(supabase, policy, cutoffDate);
            break;
          case 'customers':
            result.count = await processCustomers(supabase, policy, cutoffDate);
            break;
          case 'quotes':
            result.count = await processQuotes(supabase, policy, cutoffDate);
            break;
          case 'ai_interactions':
            result.count = await processAIInteractions(supabase, policy, cutoffDate);
            break;
          case 'analytics_events':
            result.count = await processAnalyticsEvents(supabase, policy, cutoffDate);
            break;
          default:
            console.log(`No processor for table: ${policy.table_name}`);
        }

        console.log(`Processed ${result.count} records from ${policy.table_name}`);
      } catch (error) {
        console.error(`Error processing ${policy.table_name}:`, error);
        result.errors.push(error.message);
      }

      results.push(result);
    }

    // Log the processing to audit
    await supabase.from('data_access_audit').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      action_type: 'retention_processing',
      resource_type: 'system',
      resource_details: { results, processed_at: now.toISOString() }
    });

    console.log('Data retention processing completed', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed_at: now.toISOString(),
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Retention processing error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processJobs(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  // Find completed jobs past retention period
  const { data: expiredJobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'completed')
    .lt('completed_date', cutoffDate.toISOString().split('T')[0])
    .eq('anonymized', false)
    .is('archived_at', null)
    .limit(100); // Process in batches

  if (error || !expiredJobs?.length) return 0;

  let processedCount = 0;

  for (const job of expiredJobs) {
    if (policy.retention_action === 'archive') {
      // Archive the record
      await supabase.from('archived_records').insert({
        original_table: 'jobs',
        original_id: job.id,
        archived_data: job,
        reason: policy.legal_basis,
        retention_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString() // Keep archive 3 more years
      });

      // Mark as archived (keep for reference but flag)
      await supabase.from('jobs').update({
        archived_at: new Date().toISOString()
      }).eq('id', job.id);

    } else if (policy.retention_action === 'anonymize') {
      await supabase.from('jobs').update({
        site_address: anonymizeAddress(job.site_address),
        site_postcode: anonymizePostcode(job.site_postcode),
        notes: null,
        anonymized: true
      }).eq('id', job.id);

    } else if (policy.retention_action === 'delete') {
      await supabase.from('jobs').delete().eq('id', job.id);
    }

    processedCount++;
  }

  return processedCount;
}

async function processHazardousNotes(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  const { data: expiredNotes, error } = await supabase
    .from('hazardous_consignment_notes')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .eq('anonymized', false)
    .is('archived_at', null)
    .limit(100);

  if (error || !expiredNotes?.length) return 0;

  let processedCount = 0;

  for (const note of expiredNotes) {
    if (policy.retention_action === 'archive') {
      await supabase.from('archived_records').insert({
        original_table: 'hazardous_consignment_notes',
        original_id: note.id,
        archived_data: note,
        reason: policy.legal_basis
      });

      await supabase.from('hazardous_consignment_notes').update({
        archived_at: new Date().toISOString()
      }).eq('id', note.id);
    }

    processedCount++;
  }

  return processedCount;
}

async function processCustomers(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  // Find inactive customers past retention period
  const { data: inactiveCustomers, error } = await supabase
    .from('customers')
    .select('*')
    .lt('last_activity_at', cutoffDate.toISOString())
    .eq('anonymized', false)
    .limit(100);

  if (error || !inactiveCustomers?.length) return 0;

  let processedCount = 0;

  for (const customer of inactiveCustomers) {
    if (policy.retention_action === 'anonymize') {
      const hash = crypto.randomUUID().slice(0, 8);
      await supabase.from('customers').update({
        company_name: `Archived_${hash}`,
        contact_name: null,
        email: null,
        phone: null,
        address: anonymizeAddress(customer.address),
        postcode: anonymizePostcode(customer.postcode),
        anonymized: true
      }).eq('id', customer.id);
    }

    processedCount++;
  }

  return processedCount;
}

async function processQuotes(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  // Delete unconverted quotes past retention period
  const { data: expiredQuotes, error } = await supabase
    .from('quotes')
    .select('id')
    .lt('created_at', cutoffDate.toISOString())
    .is('converted_to_job_id', null)
    .limit(100);

  if (error || !expiredQuotes?.length) return 0;

  if (policy.retention_action === 'delete') {
    const { error: deleteError } = await supabase
      .from('quotes')
      .delete()
      .in('id', expiredQuotes.map((q: any) => q.id));

    if (deleteError) throw deleteError;
  }

  return expiredQuotes.length;
}

async function processAIInteractions(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  const { data: expiredInteractions, error } = await supabase
    .from('ai_interactions')
    .select('id')
    .lt('created_at', cutoffDate.toISOString())
    .limit(500);

  if (error || !expiredInteractions?.length) return 0;

  if (policy.retention_action === 'delete') {
    await supabase
      .from('ai_interactions')
      .delete()
      .in('id', expiredInteractions.map((i: any) => i.id));
  }

  return expiredInteractions.length;
}

async function processAnalyticsEvents(supabase: any, policy: RetentionPolicy, cutoffDate: Date): Promise<number> {
  const { data: expiredEvents, error } = await supabase
    .from('analytics_events')
    .select('*')
    .lt('created_at', cutoffDate.toISOString())
    .limit(1000);

  if (error || !expiredEvents?.length) return 0;

  if (policy.retention_action === 'anonymize') {
    // Anonymize by removing user identifiers
    for (const event of expiredEvents) {
      await supabase.from('analytics_events').update({
        user_id: null,
        user_agent: null,
        properties: { ...event.properties, anonymized: true }
      }).eq('id', event.id);
    }
  } else if (policy.retention_action === 'delete') {
    await supabase
      .from('analytics_events')
      .delete()
      .in('id', expiredEvents.map((e: any) => e.id));
  }

  return expiredEvents.length;
}

function anonymizeAddress(address: string | null): string | null {
  if (!address) return null;
  // Keep only the area/region (first part)
  const parts = address.split(',');
  return parts.length > 1 ? `[Redacted], ${parts[parts.length - 1].trim()}` : '[Redacted Address]';
}

function anonymizePostcode(postcode: string | null): string | null {
  if (!postcode) return null;
  // Keep only outward code (first part, e.g., SW1 from SW1A 2AA)
  const parts = postcode.split(' ');
  return parts[0] ? `${parts[0]} ***` : '[Redacted]';
}
