// Pluggable SMS sender. Defaults to TextBelt's free tier (1 SMS/day per IP
// using the literal key "textbelt"). Swap to Twilio by setting
// SMS_PROVIDER=twilio and the matching env vars. Fire-and-forget: callers
// should not await the returned promise on the request path.

type SmsResult = { ok: boolean; info: string };

export function smsConfigured() {
  if (process.env.SMS_ENABLED !== '1') return false;
  const provider = process.env.SMS_PROVIDER || 'textbelt';
  if (provider === 'twilio') {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
  }
  return true;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!smsConfigured()) return { ok: false, info: 'sms not configured' };
  const phone = to.trim();
  if (!phone) return { ok: false, info: 'empty recipient' };
  const provider = process.env.SMS_PROVIDER || 'textbelt';
  try {
    if (provider === 'twilio') return await sendTwilio(phone, body);
    return await sendTextbelt(phone, body);
  } catch (e) {
    return { ok: false, info: (e as Error).message };
  }
}

async function sendTextbelt(phone: string, message: string): Promise<SmsResult> {
  const key = process.env.TEXTBELT_KEY || 'textbelt';
  const res = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ phone, message, key }).toString(),
  });
  const data: { success?: boolean; error?: string; quotaRemaining?: number } = await res.json().catch(() => ({}));
  return { ok: Boolean(data.success), info: data.error || `quota ${data.quotaRemaining ?? '?'}` };
}

async function sendTwilio(phone: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_FROM!;
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: phone, From: from, Body: body }).toString(),
  });
  if (!res.ok) return { ok: false, info: `twilio ${res.status}` };
  return { ok: true, info: 'sent' };
}
