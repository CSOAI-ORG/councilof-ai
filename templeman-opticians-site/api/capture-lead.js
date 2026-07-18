export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, patient_type, town, nhs_eligible, care_home, notes } = req.body;
  
  const lead = {
    timestamp: new Date().toISOString(),
    name: name || 'Not provided',
    phone: phone || 'Not provided',
    email: email || 'Not provided', 
    patient_type: patient_type || 'Not specified',
    town: town || 'Not specified',
    nhs: nhs_eligible || 'Not specified',
    care_home: care_home || '',
    notes: notes || '',
    source: 'templeman-opticians.com'
  };

  // Log to Vercel
  console.log('NEW LEAD:', JSON.stringify(lead));

  // Return success
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    success: true,
    message: `Thank you ${lead.name || ''}! We'll call ${lead.phone} within 24 hours.`,
    ref: Date.now().toString(36)
  });
}
