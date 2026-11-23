const encoder = new TextEncoder();

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      ...extra
    }
  });
}

export function configOk(env) {
  return typeof env?.ADMIN_PASSWORD === 'string' && env.ADMIN_PASSWORD.length >= 12 &&
    typeof env?.ADMIN_SESSION_SECRET === 'string' && env.ADMIN_SESSION_SECRET.length >= 32;
}

export async function verifyPassword(input, expected) {
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(input))));
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(String(expected))));
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

function b64url(bytes) {
  let result = '';
  for (const byte of bytes) result += String.fromCharCode(byte);
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(value) {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function sign(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function createSession(secret) {
  const now = Date.now();
  const data = b64url(encoder.encode(JSON.stringify({sub:'vinculacion',iat:now,exp:now+8*60*60*1000})));
  return `${data}.${b64url(await sign(secret, data))}`;
}

export async function isAdmin(request, env) {
  if (!configOk(env)) return false;
  const cookie = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith('ss_admin='));
  const value = cookie?.slice(9) || '';
  if (value.length > 1000) return false;
  const parts = value.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  try {
    const expected = await sign(env.ADMIN_SESSION_SECRET, parts[0]);
    const actual = fromB64url(parts[1]);
    let diff = expected.length ^ actual.length;
    for (let i = 0; i < Math.max(expected.length,actual.length); i++) diff |= (expected[i] || 0) ^ (actual[i] || 0);
    if (diff) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    return payload.sub === 'vinculacion' && Number.isFinite(payload.iat) && Number.isFinite(payload.exp) &&
      payload.exp > Date.now() && payload.iat <= Date.now()+60000 && payload.exp-payload.iat === 8*60*60*1000;
  } catch { return false; }
}

export function cookieSet(value) { return `ss_admin=${value}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`; }
export function cookieClear() { return 'ss_admin=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict'; }
