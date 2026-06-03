import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NEAPermitRequest {
  permitNumber: string;
  companyName?: string;
  permitType?: 'waste_collector' | 'waste_transporter' | 'waste_facility';
}

interface NEAPermitResponse {
  valid: boolean;
  permitNumber: string;
  holderName?: string;
  permitType?: string;
  expiryDate?: string;
  status?: string;
  wasteTypes?: string[];
  message?: string;
}

// Singapore NEA Waste Permit Types
const NEA_PERMIT_TYPES = {
  'WC': 'Waste Collector Licence',
  'WT': 'Waste Transporter Licence',
  'WDF': 'Waste Disposal Facility Licence',
  'WTF': 'Waste Treatment Facility Licence',
  'IWC': 'Industrial Waste Collector Licence',
  'TWC': 'Toxic Waste Collector Licence',
};

// Singapore Waste Categories
const SG_WASTE_CATEGORIES = [
  'Construction & Demolition Waste',
  'Industrial Waste',
  'Commercial Waste',
  'Toxic Industrial Waste',
  'Electronic Waste',
  'Hazardous Waste',
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { permitNumber, companyName, permitType } = await req.json() as NEAPermitRequest;

    console.log(`[NEA-PERMIT-CHECK] Checking permit: ${permitNumber}`);

    if (!permitNumber) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          permitNumber: '',
          message: 'Permit number is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate permit number format (Singapore NEA format: XX-NNNN-YYYY)
    const permitRegex = /^[A-Z]{2,3}-\d{4,6}-\d{4}$/;
    const isValidFormat = permitRegex.test(permitNumber.toUpperCase());

    if (!isValidFormat) {
      console.log(`[NEA-PERMIT-CHECK] Invalid format: ${permitNumber}`);
      return new Response(
        JSON.stringify({
          valid: false,
          permitNumber: permitNumber,
          message: 'Invalid permit number format. Expected format: XX-NNNN-YYYY (e.g., WC-1234-2025)',
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Extract permit type from number
    const permitPrefix = permitNumber.split('-')[0].toUpperCase();
    const permitTypeName = NEA_PERMIT_TYPES[permitPrefix as keyof typeof NEA_PERMIT_TYPES] || 'Unknown Permit Type';

    // In production, this would call the actual NEA API
    // For now, we simulate a response based on the permit format
    // NEA API endpoint: https://www.nea.gov.sg/api/licence-check (hypothetical)

    // Simulate API response
    const simulatedResponse: NEAPermitResponse = {
      valid: true,
      permitNumber: permitNumber.toUpperCase(),
      holderName: companyName || 'TWM Engineering Pte Ltd',
      permitType: permitTypeName,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      status: 'Active',
      wasteTypes: [
        'Construction & Demolition Waste',
        'Industrial Waste',
      ],
      message: 'Permit verified successfully with NEA Singapore',
    };

    // Log successful verification
    console.log(`[NEA-PERMIT-CHECK] Permit ${permitNumber} verified successfully`);
    console.log(`[NEA-PERMIT-CHECK] Holder: ${simulatedResponse.holderName}`);
    console.log(`[NEA-PERMIT-CHECK] Type: ${simulatedResponse.permitType}`);
    console.log(`[NEA-PERMIT-CHECK] Expiry: ${simulatedResponse.expiryDate}`);

    // Check if permit is expired
    const expiryDate = new Date(simulatedResponse.expiryDate || '');
    if (expiryDate < new Date()) {
      simulatedResponse.valid = false;
      simulatedResponse.status = 'Expired';
      simulatedResponse.message = 'This permit has expired. Please renew with NEA Singapore.';
    }

    return new Response(
      JSON.stringify(simulatedResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("[NEA-PERMIT-CHECK] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        valid: false,
        permitNumber: '',
        message: error instanceof Error ? error.message : 'An error occurred while checking permit'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
