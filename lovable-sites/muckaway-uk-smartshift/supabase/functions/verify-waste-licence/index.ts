import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LicenceVerificationRequest {
  licenceNumber: string;
  customerId?: string;
}

interface LicenceVerificationResult {
  isValid: boolean;
  licenceNumber: string;
  licenceTier: 'upper' | 'lower' | null;
  registeredHolder: string | null;
  expiryDate: string | null;
  status: 'valid' | 'expired' | 'suspended' | 'not_found';
  message: string;
  verificationSource: 'live_api' | 'cached' | 'fallback';
  lastVerified: string;
}

// Environment Agency Public Register API endpoint
// Note: The EA provides a public register at https://environment.data.gov.uk/
// For waste carriers: https://environment.data.gov.uk/public-register/waste-carriers-brokers/
const EA_API_BASE = 'https://environment.data.gov.uk/public-register/waste-carriers-brokers';

function validateLicenceFormat(licenceNumber: string): { valid: boolean; tier: 'upper' | 'lower' | null; message: string } {
  const upperTierPattern = /^CBDU\d{6}$/;
  const lowerTierPattern = /^CBDL\d{6}$/;
  
  if (upperTierPattern.test(licenceNumber)) {
    return { valid: true, tier: 'upper', message: 'Valid upper tier format' };
  }
  
  if (lowerTierPattern.test(licenceNumber)) {
    return { valid: true, tier: 'lower', message: 'Valid lower tier format' };
  }
  
  return { 
    valid: false, 
    tier: null, 
    message: 'Invalid licence format. Expected CBDU or CBDL followed by 6 digits' 
  };
}

async function verifyLicenceWithEA(licenceNumber: string): Promise<LicenceVerificationResult> {
  const formatCheck = validateLicenceFormat(licenceNumber);
  
  if (!formatCheck.valid) {
    return {
      isValid: false,
      licenceNumber,
      licenceTier: null,
      registeredHolder: null,
      expiryDate: null,
      status: 'not_found',
      message: formatCheck.message,
      verificationSource: 'fallback',
      lastVerified: new Date().toISOString()
    };
  }

  try {
    // Call the Environment Agency Public Register API
    // The API provides JSON data for waste carrier registrations
    console.log(`Calling EA API for licence: ${licenceNumber}`);
    
    const response = await fetch(
      `${EA_API_BASE}/registration/${licenceNumber}.json`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MuckawayAI/1.0 (waste-management-platform)'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`EA API response for ${licenceNumber}:`, JSON.stringify(data).substring(0, 500));
      
      // Parse EA API response structure
      const registration = data.registration || data;
      const isExpired = registration.expires ? new Date(registration.expires) < new Date() : false;
      const isSuspended = registration.status === 'REVOKED' || registration.status === 'SUSPENDED';
      
      let status: 'valid' | 'expired' | 'suspended' | 'not_found' = 'valid';
      if (isExpired) status = 'expired';
      if (isSuspended) status = 'suspended';
      
      return {
        isValid: status === 'valid',
        licenceNumber,
        licenceTier: formatCheck.tier,
        registeredHolder: registration.companyName || registration.organisationName || registration.applicantName || null,
        expiryDate: registration.expires || registration.expiryDate || null,
        status,
        message: status === 'valid' 
          ? 'Licence verified with Environment Agency register'
          : status === 'expired'
            ? 'Licence has expired - renewal required'
            : 'Licence is currently suspended or revoked',
        verificationSource: 'live_api',
        lastVerified: new Date().toISOString()
      };
    } else if (response.status === 404) {
      console.log(`Licence ${licenceNumber} not found in EA register`);
      return {
        isValid: false,
        licenceNumber,
        licenceTier: formatCheck.tier,
        registeredHolder: null,
        expiryDate: null,
        status: 'not_found',
        message: 'Licence not found in Environment Agency register. Please check the number or contact the carrier.',
        verificationSource: 'live_api',
        lastVerified: new Date().toISOString()
      };
    } else {
      // API error - log and fall back to cached/manual verification
      console.error(`EA API error: ${response.status} ${response.statusText}`);
      throw new Error(`EA API returned ${response.status}`);
    }
  } catch (error) {
    console.error('EA API verification failed:', error);
    
    // Fallback: Return a result indicating manual verification is needed
    // In production, you might check a local cache here
    return {
      isValid: false,
      licenceNumber,
      licenceTier: formatCheck.tier,
      registeredHolder: null,
      expiryDate: null,
      status: 'not_found',
      message: 'Unable to verify with EA register. Manual verification required. Visit: https://environment.data.gov.uk/public-register/waste-carriers-brokers',
      verificationSource: 'fallback',
      lastVerified: new Date().toISOString()
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { licenceNumber, customerId }: LicenceVerificationRequest = await req.json();

    if (!licenceNumber) {
      return new Response(
        JSON.stringify({ error: 'Licence number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedLicence = licenceNumber.toUpperCase().trim();
    console.log(`Verifying licence: ${normalizedLicence} for user: ${userId}`);

    // Perform verification with real EA API
    const result = await verifyLicenceWithEA(normalizedLicence);

    // Log the verification attempt
    if (userId) {
      const { error: logError } = await supabase
        .from('licence_verifications')
        .insert({
          user_id: userId,
          licence_number: normalizedLicence,
          licence_tier: result.licenceTier,
          registered_holder: result.registeredHolder,
          expiry_date: result.expiryDate,
          verification_status: result.status,
          raw_response: result
        });

      if (logError) {
        console.error('Error logging verification:', logError);
      }

      // If customer ID provided and licence is valid, link it
      if (customerId && result.isValid) {
        const { error: linkError } = await supabase
          .from('waste_carrier_licences')
          .upsert({
            customer_id: customerId,
            licence_number: normalizedLicence,
            licence_tier: result.licenceTier,
            registered_holder: result.registeredHolder,
            expiry_date: result.expiryDate,
            is_verified: true,
            last_verified_at: new Date().toISOString(),
            user_id: userId
          }, {
            onConflict: 'customer_id,licence_number'
          });

        if (linkError) {
          console.error('Error linking licence to customer:', linkError);
        }
      }
    }

    console.log(`Verification result for ${normalizedLicence}:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
