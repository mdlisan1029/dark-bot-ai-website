const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Server Supabase environment variables are missing.');
  return createClient(url, key, { auth: { persistSession: false } });
}

function cleanCode(value) {
  const code = String(value || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(code) ? code : null;
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || '')).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const referralCode = cleanCode(body.referralCode);
    const visitorId = String(body.visitorId || '').slice(0, 160);
    const eventType = ['visit', 'telegram_click'].includes(body.eventType) ? body.eventType : 'visit';
    if (!referralCode || !visitorId) return res.status(400).json({ ok: false, error: 'Invalid referral payload' });

    const sb = client();
    const { data: affiliate, error: aErr } = await sb
      .from('affiliates')
      .select('id,affiliate_code,status')
      .eq('affiliate_code', referralCode)
      .eq('status', 'active')
      .maybeSingle();
    if (aErr) throw aErr;
    if (!affiliate) return res.status(404).json({ ok: false, error: 'Affiliate not found' });

    const { data, error } = await sb.from('referral_events').insert({
      affiliate_id: affiliate.id,
      referral_code: affiliate.affiliate_code,
      visitor_id: visitorId,
      landing_page: String(body.landingPage || '').slice(0, 500),
      event_type: eventType,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 500),
      ip_hash: hashIp(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    }).select('id').single();
    if (error) throw error;
    return res.status(200).json({ ok: true, eventId: data.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Unable to record referral event' });
  }
};
