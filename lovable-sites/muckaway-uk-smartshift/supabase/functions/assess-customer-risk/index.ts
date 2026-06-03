import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskAssessmentRequest {
  customerId: string;
}

interface RiskFactor {
  factor: string;
  weight: number;
  detected: boolean;
  description: string;
}

interface RiskAssessmentResult {
  customerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendations: string[];
  assessedAt: string;
}

// Known fly-tipping hotspot postcodes (mock data)
const flyTippingHotspots = [
  'E15', 'SE18', 'N17', 'DA1', 'RM8', 'UB7', 'IG11', 'CR0'
];

function calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { customerId }: RiskAssessmentRequest = await req.json();

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Customer ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Assessing risk for customer: ${customerId}`);

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch customer's jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Fetch customer's waste carrier licence
    const { data: licences } = await supabase
      .from('waste_carrier_licences')
      .select('*')
      .eq('customer_id', customerId);

    // Initialize risk factors
    const factors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Factor 1: New customer with large first job
    const isNewCustomer = jobs && jobs.length <= 1;
    const hasLargeFirstJob = jobs && jobs.length > 0 && jobs[0].volume_tonnes > 50;
    factors.push({
      factor: 'new_customer_large_job',
      weight: 20,
      detected: isNewCustomer && hasLargeFirstJob,
      description: 'New customer with unusually large first job (>50 tonnes)'
    });

    // Factor 2: No verified waste carrier licence
    const hasVerifiedLicence = licences && licences.some(l => l.is_verified);
    factors.push({
      factor: 'no_verified_licence',
      weight: 25,
      detected: !hasVerifiedLicence,
      description: 'No verified waste carrier licence on file'
    });

    // Factor 3: Multiple different site postcodes in short time
    const uniquePostcodes = new Set(jobs?.map(j => j.site_postcode?.substring(0, 4)).filter(Boolean));
    const hasMultipleLocations = uniquePostcodes.size > 3 && jobs && jobs.length < 10;
    factors.push({
      factor: 'multiple_postcodes',
      weight: 15,
      detected: hasMultipleLocations,
      description: 'Multiple different site locations in a short period'
    });

    // Factor 4: Sites in known fly-tipping hotspots
    const hotspotsUsed = jobs?.filter(j => 
      j.site_postcode && flyTippingHotspots.some(h => 
        j.site_postcode.toUpperCase().startsWith(h)
      )
    );
    const hasHotspotSites = hotspotsUsed && hotspotsUsed.length > 0;
    factors.push({
      factor: 'fly_tipping_hotspot',
      weight: 20,
      detected: hasHotspotSites,
      description: `Sites in known fly-tipping hotspot areas (${hotspotsUsed?.length || 0} jobs)`
    });

    // Factor 5: Cash only / no company details
    const missingCompanyDetails = !customer.company_name || customer.company_name.trim() === '';
    factors.push({
      factor: 'missing_company_details',
      weight: 15,
      detected: missingCompanyDetails,
      description: 'Missing company name or registration details'
    });

    // Factor 6: Unusual job patterns (all hazardous, all after hours, etc.)
    const hazardousJobs = jobs?.filter(j => 
      j.contamination_level === 'high' || j.contamination_level === 'hazardous'
    );
    const highHazardousRatio = jobs && jobs.length > 0 && hazardousJobs && 
      (hazardousJobs.length / jobs.length) > 0.5;
    factors.push({
      factor: 'high_hazardous_ratio',
      weight: 15,
      detected: highHazardousRatio,
      description: 'More than 50% of jobs involve hazardous materials'
    });

    // Factor 7: Credit limit issues
    const overCreditLimit = customer.current_balance > customer.credit_limit;
    factors.push({
      factor: 'over_credit_limit',
      weight: 10,
      detected: overCreditLimit,
      description: 'Customer is over their credit limit'
    });

    // Calculate total risk score
    const riskScore = factors
      .filter(f => f.detected)
      .reduce((sum, f) => sum + f.weight, 0);

    const riskLevel = calculateRiskLevel(riskScore);

    // Generate recommendations
    if (!hasVerifiedLicence) {
      recommendations.push('Request and verify waste carrier licence before accepting new jobs');
    }
    if (missingCompanyDetails) {
      recommendations.push('Obtain full company registration details');
    }
    if (hasHotspotSites) {
      recommendations.push('Verify disposal site legitimacy for hotspot area jobs');
    }
    if (isNewCustomer && hasLargeFirstJob) {
      recommendations.push('Consider requiring payment upfront for first large job');
    }
    if (overCreditLimit) {
      recommendations.push('Review and resolve outstanding balance before new work');
    }
    if (riskLevel === 'critical') {
      recommendations.push('URGENT: Manual review required before accepting any new jobs');
    }

    const result: RiskAssessmentResult = {
      customerId,
      riskScore,
      riskLevel,
      factors,
      recommendations,
      assessedAt: new Date().toISOString()
    };

    // Save assessment to database
    const { error: saveError } = await supabase
      .from('customer_risk_assessments')
      .upsert({
        customer_id: customerId,
        risk_score: riskScore,
        risk_level: riskLevel,
        flagged_reasons: factors.filter(f => f.detected).map(f => f.factor),
        assessment_notes: recommendations.join('; '),
        last_assessment_at: new Date().toISOString(),
        user_id: user.id
      }, {
        onConflict: 'customer_id'
      });

    if (saveError) {
      console.error('Error saving assessment:', saveError);
    }

    // Log suspicious activities if high/critical risk
    if (riskLevel === 'high' || riskLevel === 'critical') {
      const suspiciousFactors = factors.filter(f => f.detected);
      
      for (const factor of suspiciousFactors) {
        await supabase
          .from('suspicious_activity_log')
          .insert({
            customer_id: customerId,
            activity_type: factor.factor,
            severity: riskLevel,
            description: factor.description,
            user_id: user.id,
            metadata: {
              riskScore,
              allFactors: factors.filter(f => f.detected).map(f => f.factor)
            }
          });
      }
    }

    console.log(`Risk assessment for ${customerId}: Score ${riskScore}, Level: ${riskLevel}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Risk assessment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
