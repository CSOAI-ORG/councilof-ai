// DEFONEOS — governed stats → the Sovereign. Google Data Commons proxy: resolve ANY place
// (country/region/city) to a DCID, then return the latest value for a metric. Key in env
// (DC_KEY), out of git. This is the "all stats/companies/regs for every country, governed".
const DC = 'https://api.datacommons.org/v2';
const METRICS = {
  population: ['Count_Person', 'Population'],
  gdp: ['Amount_EconomicActivity_GrossDomesticProduction_Nominal', 'GDP (nominal, USD)'],
  'gdp per capita': ['Amount_EconomicActivity_GrossDomesticProduction_Nominal_PerCapita', 'GDP per capita (USD)'],
  'life expectancy': ['LifeExpectancy_Person', 'Life expectancy (years)'],
  unemployment: ['UnemploymentRate_Person', 'Unemployment rate (%)'],
  'median income': ['Median_Income_Person', 'Median income (USD)'],
  co2: ['Annual_Emissions_CarbonDioxide', 'CO₂ emissions (tonnes)'],
  poverty: ['Count_Person_BelowPovertyLevelInThePast12Months', 'People below poverty line']
};
function pickMetric(s) {
  s = (s || '').toLowerCase();
  for (const k in METRICS) { if (s.indexOf(k) >= 0) return k; }
  if (/gdp|econom/.test(s)) return 'gdp';
  if (/life|expectanc/.test(s)) return 'life expectancy';
  if (/unemploy|jobless/.test(s)) return 'unemployment';
  if (/income|wage|salary/.test(s)) return 'median income';
  if (/co2|carbon|emission|climate/.test(s)) return 'co2';
  if (/poverty|poor/.test(s)) return 'poverty';
  return 'population';
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  const key = process.env.DC_KEY;
  if (!key) return res.status(200).json({ ok: false, error: 'Data Commons key not configured' });
  const place = (req.query && req.query.place || '').trim();
  const metricKw = pickMetric((req.query && (req.query.metric || req.query.q)) || '');
  if (!place) return res.status(200).json({ ok: false, error: 'no place given' });
  const mv = METRICS[metricKw];
  const H = { 'X-API-Key': key };
  try {
    const rj = await (await fetch(DC + '/resolve?nodes=' + encodeURIComponent(place) + '&property=' + encodeURIComponent('<-description->dcid'), { headers: H })).json();
    const cand = rj.entities && rj.entities[0] && rj.entities[0].candidates && rj.entities[0].candidates[0];
    const dcid = cand && cand.dcid;
    if (!dcid) return res.status(200).json({ ok: false, error: 'place not found: ' + place, place });
    const oj = await (await fetch(DC + '/observation?date=LATEST&variable.dcids=' + mv[0] + '&entity.dcids=' + encodeURIComponent(dcid) + '&select=value&select=variable&select=entity&select=date', { headers: H })).json();
    const bv = oj.byVariable && oj.byVariable[mv[0]] && oj.byVariable[mv[0]].byEntity && oj.byVariable[mv[0]].byEntity[dcid];
    const obs = bv && bv.orderedFacets && bv.orderedFacets[0] && bv.orderedFacets[0].observations && bv.orderedFacets[0].observations[0];
    if (!obs) return res.status(200).json({ ok: false, error: 'no data for ' + metricKw + ' in ' + place, place, dcid, metric: mv[1] });
    return res.status(200).json({
      ok: true, place, dcid, metric: mv[1], value: obs.value, date: obs.date,
      source: 'Google Data Commons', governance: 'Federated under DEFONEOS Layer-0 · cited & governed', ts: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
