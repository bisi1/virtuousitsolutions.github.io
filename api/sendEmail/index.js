const Mailjet = require('node-mailjet');

// NOTE: Temporary defaults are hardcoded here for quick testing. Replace with secure env vars in production.
const MAILJET_API_KEY = process.env.MAILJET_API_KEY || process.env.MJ_APIKEY_PUBLIC || process.env.MJ_APIKEY || 'ae058196ea6e933e6ffbc04e79d43070';
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET || process.env.MJ_APIKEY_PRIVATE || process.env.MJ_APISECRET || '076fcf2d93396db87b01d5c3611f1c0b';
const TO_EMAIL = process.env.TO_EMAIL || 'bijumatprof@gmail.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'bijumatprof@gmail.com';
const FROM_NAME = process.env.FROM_NAME || 'Virtuous IT Solutions';
const CORS_ALLOWED = process.env.CORS_ALLOWED || '*';

function addCors(res){
  res.headers = Object.assign(res.headers || {}, {
    'Access-Control-Allow-Origin': CORS_ALLOWED,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept'
  });
  return res;
}

module.exports = async function (context, req) {
  context.log('sendEmail (Mailjet) function received a request');
  context.log('Warning: using hardcoded Mailjet credentials for testing; move keys to environment variables for production');

  // Handle CORS preflight
  if (req.method === 'OPTIONS'){
    context.res = addCors({ status: 204 });
    return;
  }

  if (!MAILJET_API_KEY || !MAILJET_API_SECRET) {
    context.log.error('Mailjet API key/secret not configured');
    context.res = addCors({
      status: 500,
      body: { error: 'Email provider (Mailjet) not configured' }
    });
    return;
  }

  const { name, email, message } = req.body || {};

  if (!email || !message) {
    context.res = addCors({
      status: 400,
      body: { error: 'Missing required fields: email and message' }
    });
    return;
  }

  // Warn if using a generic default FROM_EMAIL (may be rejected by Mailjet)
  if (FROM_EMAIL === 'no-reply@virtuousit.com') {
    context.log.warn('Using default FROM_EMAIL; consider setting a verified sender in environment settings (FROM_EMAIL)');
  }

  const mailjet = Mailjet.connect(MAILJET_API_KEY, MAILJET_API_SECRET);

  const subject = `Website contact from ${name || 'website visitor'}`;
  const text = `Name: ${name || ''}\nEmail: ${email}\n\n${message}`;
  const html = `<p><strong>Name:</strong> ${name || ''}</p><p><strong>Email:</strong> ${email}</p><hr/><p>${(message || '').replace(/\n/g, '<br/>')}</p>`;

  const requestBody = {
    Messages: [
      {
        From: { Email: FROM_EMAIL, Name: FROM_NAME },
        To: [{ Email: TO_EMAIL, Name: 'Recipient' }],
        Subject: subject,
        TextPart: text,
        HTMLPart: html,
        ReplyTo: { Email: email, Name: name || 'Website visitor' }
      }
    ]
  };

  try {
    const result = await mailjet.post('send', { version: 'v3.1' }).request(requestBody);
    // Log full response for debugging (will include MessageID/UUID)
    context.log('Mailjet response', result && result.body);
    // Return the Mailjet response body to the caller for easier client-side debugging
    context.res = addCors({
      status: 200,
      body: { ok: true, mailjet: result.body }
    });
  } catch (err) {
    // Provide richer error info when Mailjet returns a structured response
    const details = (err && err.response && err.response.body) ? err.response.body : (err && err.message ? err.message : err);
    context.log.error('Mailjet error', details);
    context.res = addCors({
      status: 502,
      body: { error: 'Failed to send email', details }
    });
  }
};
