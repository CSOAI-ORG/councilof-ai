// The Unreal "body" tunnel — DEFONEOS is ONE mind (signed Layer-0 substrate + MCP federation) that
// can wear different bodies. The CesiumJS globe is the default body (near-free, runs everywhere). An
// Unreal Engine Pixel-Streaming instance is an OPTIONAL premium body (photoreal, GPU-cost) you tunnel
// INTO through the SAME seam — same /api/* feeds, same sovBrain, same signed context handoff.
// Set UNREAL_STREAM_URL to a Pixel-Streaming signalling URL to light it up; until then this is honestly
// "body not connected" — the globe body is fully functional on its own.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60');
  const url = process.env.UNREAL_STREAM_URL || '';
  return res.status(200).json({
    ok: !!url,
    connected: !!url,
    url: url || null,
    body: url ? 'unreal-pixel-streaming' : 'globe-only',
    note: url
      ? 'Unreal body online — tunnelling shares the Layer-0 seam (same feeds, brain, signed context).'
      : 'Unreal body not connected. The globe is the mind’s default body and works fully alone; set UNREAL_STREAM_URL (a Pixel-Streaming signalling endpoint) to add the premium photoreal body. GPU-cost is real — this is a body, not the brain.'
  });
}
