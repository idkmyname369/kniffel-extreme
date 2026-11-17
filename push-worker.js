// Kniffel Royale – Push-Einladungen (Cloudflare Worker)
// Einstellungen im Worker (Settings → Variables and Secrets):
//   DB_URL            = https://kn1ffel-extreme-default-rtdb.europe-west1.firebasedatabase.app
//   (VAPID_PUBLIC wird nicht mehr gebraucht – er wird aus dem privaten Schlüssel berechnet)
//   VAPID_PRIVATE_JWK = privater Schlüssel als JSON (als „Secret“ anlegen, niemals veröffentlichen)

const PUSH_HOSTS = /(^|\.)(push\.apple\.com|fcm\.googleapis\.com|googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/;
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length } return o };

function vapidJwk(env) {
  const raw = String(env.VAPID_PRIVATE_JWK || '').trim().replace(/[\u201C\u201D\u201E\u2033]/g, '"');
  const j = JSON.parse(raw);
  return { kty: 'EC', crv: 'P-256', x: j.x.trim(), y: j.y.trim(), d: j.d.trim() };
}
// Öffentlichen Schlüssel direkt aus dem privaten ableiten – so können sie nie auseinanderlaufen.
function vapidPub(env) { const j = vapidJwk(env); return b64u(cat(new Uint8Array([4]), unb64u(j.x), unb64u(j.y))) }

async function vapidJWT(aud, env) {
  const jwk = vapidJwk(env);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:idkmyname369@users.noreply.github.com' })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return head + '.' + body + '.' + b64u(sig);
}

async function hkdf(salt, ikm, info, bits) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, bits));
}

// RFC 8291 (aes128gcm)
async function encrypt(sub, text) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', as.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode('WebPush: info\0'), uaPub, asPub), 256);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 128);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 96);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(enc.encode(text), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);
  return cat(salt, rs, new Uint8Array([asPub.length]), asPub, ct);
}

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type' };
    const out = (t, s = 200) => new Response(t, { status: s, headers: cors });
    if (req.method === 'OPTIONS') return out(null, 204);
    if (req.method !== 'POST') return out('Kniffel Royale Push');
    let b; try { b = JSON.parse(await req.text()) } catch (e) { return out('bad', 400) }
    const to = String(b.to || ''), token = String(b.token || ''), from = String(b.from || '').replace(/[\u0000-\u001f]/g, '').slice(0, 20);
    if (!/^[A-Za-z0-9_-]{6,64}$/.test(to) || token.length < 20) return out('bad', 400);
    // Liest das Abo mit dem Firebase-Token des Absenders – ungültige Tokens lehnt Firebase ab.
    const r = await fetch(String(env.DB_URL).trim().replace(/\/$/, '') + '/push/' + to + '.json?auth=' + encodeURIComponent(token));
    if (!r.ok) return out('denied', 403);
    const sub = await r.json();
    if (!sub || !sub.endpoint) return out('no subscription', 404);
    let ep; try { ep = new URL(sub.endpoint) } catch (e) { return out('bad endpoint', 400) }
    if (ep.protocol !== 'https:' || !PUSH_HOSTS.test(ep.hostname)) return out('bad endpoint', 400);
    const jwt = await vapidJWT(ep.origin, env);
    const headers = { TTL: '1800', Urgency: 'high', Topic: 'kx-invite', Authorization: 'vapid t=' + jwt + ', k=' + vapidPub(env) };
    let body = null;
    if (sub.keys && sub.keys.p256dh && sub.keys.auth) {
      body = await encrypt(sub, (from ? from + ' lädt dich zu einer Runde ein.' : 'Du wurdest zu einer Runde eingeladen.') + ' Tippe, um beizutreten.');
      headers['Content-Encoding'] = 'aes128gcm'; headers['Content-Type'] = 'application/octet-stream';
    }
    const res = await fetch(sub.endpoint, { method: 'POST', headers, body });
    if (res.ok) return out(String(res.status));
    let why = ''; try { why = (await res.text()).slice(0, 200) } catch (e) { }
    return out(res.status + ' ' + why, 502);
  }
};
