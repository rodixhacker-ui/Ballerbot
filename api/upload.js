module.exports = async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'POST only' });

  const token = process.env.TG_BOT_TOKEN;
  if (!token) return res.status(500).json({ ok: false, error: 'token missing' });

  const { chatid, image } = req.body || {};
  if (!chatid || !image)
    return res.status(400).json({ ok: false, error: 'chatid/image required' });

  const m = /^data:image\/(jpeg|png);base64,(.+)$/.exec(image);
  if (!m) return res.status(400).json({ ok: false, error: 'bad image' });

  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 3.5 * 1024 * 1024)
    return res.status(413).json({ ok: false, error: 'too large' });

  const form = new FormData();
  form.append('chat_id', String(chatid));
  form.append('photo', new Blob([buf], { type: 'image/jpeg' }), 'frame.jpg');

  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    body: form,
  });
  const data = await r.json();

  // Telegram rate-limit — client ko retry_after wapas bhej do
  if (r.status === 429) {
    return res.status(429).json({
      ok: false,
      retry_after: data?.parameters?.retry_after || 1,
    });
  }

  return res.status(r.ok && data.ok ? 200 : 502).json({ ok: data.ok, tg: data });
};
