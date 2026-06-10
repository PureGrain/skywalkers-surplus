export async function onRequestPost(context) {
  const { request, env } = context;

  let name, email, message;
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    ({ name, email, message } = await request.json());
  } else {
    const fd = await request.formData();
    name    = fd.get('name');
    email   = fd.get('email');
    message = fd.get('message');
  }

  if (!name || !email || !message) {
    return json({ error: 'All fields required.' }, 400);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: "Skywalker's Surplus <skywalker@skywalkerssurplus.com>",
      to: ['challon.holt@gmail.com'],
      reply_to: email,
      subject: `Contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  if (!res.ok) {
    return json({ error: 'Failed to send.' }, 500);
  }

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
