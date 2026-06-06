import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Current HMRC Landfill Tax Rates (April 2024 - March 2025)
// Source: https://www.gov.uk/government/publications/rates-and-allowances-landfill-tax/landfill-tax-rates-from-1-april-2024
const LANDFILL_TAX_RATES = {
  // Current rates effective from 1 April 2024
  current: {
    standard: 126.15, // £ per tonne - non-inert waste
    lower: 3.25,      // £ per tonne - inert/inactive waste
    effectiveFrom: '2024-04-01',
    effectiveTo: '2025-03-31',
  },
  // Upcoming rates from 1 April 2025 (announced in Budget)
  upcoming: {
    standard: 126.15, // May be updated when HMRC announces
    lower: 3.25,
    effectiveFrom: '2025-04-01',
    effectiveTo: '2026-03-31',
  },
  // Historical for reference
  historical: [
    { year: '2023-24', standard: 102.10, lower: 3.25 },
    { year: '2022-23', standard: 98.60, lower: 3.15 },
    { year: '2021-22', standard: 96.70, lower: 3.10 },
  ]
};

// Materials classified as inert (lower rate)
const INERT_MATERIALS = [
  'clean_fill',
  'clean fill',
  'topsoil',
  'subsoil',
  'clay',
  'sand',
  'gravel',
  'crushed rock',
  'concrete rubble',
  'brick rubble',
  'inert waste',
  'soil',
  'stone',
  'rocks',
  'aggregate'
];

function isInertMaterial(materialType: string): boolean {
  const normalized = materialType.toLowerCase().trim();
  return INERT_MATERIALS.some(inert => normalized.includes(inert));
}

function getCurrentRate(materialType?: string): { 
  rate: number; 
  rateType: 'standard' | 'lower'; 
  effectiveFrom: string;
  effectiveTo: string;
} {
  const isInert = materialType ? isInertMaterial(materialType) : false;
  
  return {
    rate: isInert ? LANDFILL_TAX_RATES.current.lower : LANDFILL_TAX_RATES.current.standard,
    rateType: isInert ? 'lower' : 'standard',
    effectiveFrom: LANDFILL_TAX_RATES.current.effectiveFrom,
    effectiveTo: LANDFILL_TAX_RATES.current.effectiveTo
  };
}

function calculateTax(tonnage: number, materialType?: string): {
  taxAmount: number;
  rate: number;
  rateType: 'standard' | 'lower';
  tonnage: number;
  effectiveDate: string;
} {
  const rateInfo = getCurrentRate(materialType);
  
  return {
    taxAmount: Math.round(tonnage * rateInfo.rate * 100) / 100,
    rate: rateInfo.rate,
    rateType: rateInfo.rateType,
    tonnage,
    effectiveDate: rateInfo.effectiveFrom
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'rates';
    
    if (req.method === 'GET') {
      // GET request - return current rates
      if (action === 'rates') {
        return new Response(
          JSON.stringify({
            success: true,
            rates: LANDFILL_TAX_RATES.current,
            upcomingRates: LANDFILL_TAX_RATES.upcoming,
            lastUpdated: new Date().toISOString(),
            source: 'HMRC Landfill Tax Rates',
            disclaimer: 'Rates subject to change. Always verify with HMRC for compliance.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (req.method === 'POST') {
      const body = await req.json();
      const { tonnage, materialType } = body;
      
      if (!tonnage || tonnage <= 0) {
        return new Response(
          JSON.stringify({ error: 'Valid tonnage is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const calculation = calculateTax(tonnage, materialType);
      
      return new Response(
        JSON.stringify({
          success: true,
          calculation,
          rates: LANDFILL_TAX_RATES.current,
          materialClassification: materialType ? {
            material: materialType,
            isInert: isInertMaterial(materialType),
            rateApplied: calculation.rateType
          } : null,
          disclaimer: 'This is an estimate. Final tax liability depends on waste classification at the landfill site.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Landfill tax rate error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
