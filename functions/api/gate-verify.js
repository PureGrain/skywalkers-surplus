export async function onRequestPost(context) {
  const { request, env } = context;

  let token, next;
  const ct = request.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    const body = await request.json();
    token = body.token;
    next = body.next;
  } else {
    const fd = await request.formData();
    token = fd.get('token');
    next = fd.get('next');
  }

  if (!next || !next.startsWith('/') || next.startsWith('//')) next = '/';

  if (!token) {
    return Response.redirect(`/gate?next=${encodeURIComponent(next)}&error=missing`, 302);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const verifyResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });

  const data = await verifyResp.json();
  if (!data.success) {
    return Response.redirect(`/gate?next=${encodeURIComponent(next)}&error=failed`, 302);
  }

  const maxAge = 60 * 60 * 24 * 7;
  return new Response(null, {
    status: 302,
    headers: {
      Location: next,
      'Set-Cookie': `_ts_gate=verified; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Lax`,
    },
  });
}
