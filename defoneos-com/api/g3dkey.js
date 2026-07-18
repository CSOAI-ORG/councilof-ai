// Serves the Google Maps key (from Vercel env, never committed) to the dome so it can
// load photoreal 3D tiles. A client key is exposed by design — it MUST be HTTP-referrer
// restricted + quota-capped in Google Cloud Console. This only avoids putting it in git.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');
  return res.status(200).json({ key: process.env.G3D_KEY || '' });
}
