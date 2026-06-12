const STATIC = /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?|ttf|eot|map|txt|json)$/i;

const GEO_BLOCK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Skywalker's Surplus — Not Available</title>
  <style>
    :root { --bg: #000008; --panel: #0b0b1f; --line: #1e2044; --text: #e8e4c8; --muted: #6878a0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
    .box { max-width: 420px; text-align: center; }
    h1 { font-size: 1.3rem; margin-bottom: 12px; }
    p { color: var(--muted); line-height: 1.6; font-size: .95rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Not available in your region</h1>
    <p>Skywalker's Surplus ships within the United States only. This site is not accessible outside the US.</p>
  </div>
</body>
</html>`;

export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname;

    const country = context.request.headers.get('CF-IPCountry');
    if (country && country !== 'US') {
      return new Response(GEO_BLOCK_HTML, {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (path === '/gate' || path.startsWith('/api/gate-verify') || STATIC.test(path)) {
      return context.next();
    }

    const cookie = context.request.headers.get('Cookie') || '';
    if (cookie.split(';').some(c => c.trim() === '_ts_gate=verified')) {
      return context.next();
    }

    const next = encodeURIComponent(path + url.search);
    return Response.redirect(`${url.origin}/gate?next=${next}`, 302);
  } catch {
    return context.next();
  }
}
