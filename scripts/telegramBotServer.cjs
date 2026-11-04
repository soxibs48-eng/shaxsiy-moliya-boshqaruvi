/**
 * Smart Finance — Telegram Bot Polling Server
 * Bot: @xsobchi_bot (9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg)
 */

const BOT_TOKEN = '9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let lastUpdateId = 0;

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error('Xabar yuborishda xatolik:', err.message);
  }
}

async function fetchCbuRates() {
  try {
    const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/');
    const list = await res.json();
    const usd = list.find((c) => c.Ccy === 'USD');
    const eur = list.find((c) => c.Ccy === 'EUR');
    const rub = list.find((c) => c.Ccy === 'RUB');
    return {
      usd: usd ? `${usd.Rate} UZS (${usd.Diff > 0 ? '+' : ''}${usd.Diff})` : 'N/A',
      eur: eur ? `${eur.Rate} UZS (${eur.Diff > 0 ? '+' : ''}${eur.Diff})` : 'N/A',
      rub: rub ? `${rub.Rate} UZS (${rub.Diff > 0 ? '+' : ''}${rub.Diff})` : 'N/A',
      date: usd ? usd.Date : new Date().toLocaleDateString('uz-UZ'),
    };
  } catch {
    return { usd: '11 911.71 UZS', eur: '13 319.67 UZS', rub: '146.49 UZS', date: 'Bugun' };
  }
}

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userName = msg.from.first_name || 'Foydalanuvchi';

  console.log(`[Telegram] Xabar keldi: ${userName} (${chatId}): ${text}`);

  if (text.startsWith('/start')) {
    const welcome = `
<b>Assalomu alaykum, ${userName}! 👋</b>

Men <b>"Smart Finance — Shaxsiy moliya boshqaruvi"</b> tizimining rasmiy xabarchi botiman.

🆔 <b>Sizning Telegram Chat ID:</b> <code>${chatId}</code>

Web-ilovaga ushbu Chat ID ni kiritib, har bitta yangi operatsiya, hamyon o'tkazmalari, byudjet limitlari va qarzlarni Telegram orqali jonli qabul qilishingiz mumkin! 🚀

<b>Mavjud buyruqlar:</b>
▫️ /kurs — Markaziy Bank jonli valyuta kurslari
▫️ /id — Chat ID raqamingizni ko'rish
▫️ /yordam — Bot imkoniyatlari
`.trim();

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌐 Web-Ilovani ochish', url: 'http://127.0.0.1:3000/' },
        ],
        [
          { text: '📈 Valyuta kurslari', callback_data: 'rates' },
          { text: '🆔 Mening ID raqamim', callback_data: 'my_id' },
        ],
      ],
    };

    await sendTelegramMessage(chatId, welcome, keyboard);
  } else if (text.startsWith('/kurs')) {
    const rates = await fetchCbuRates();
    const ratesMsg = `
<b>📈 Markaziy Bank Rasmiy Valyuta Kurslari:</b>
<i>Sana: ${rates.date}</i>

💵 <b>1 USD:</b> <code>${rates.usd}</code>
💶 <b>1 EUR:</b> <code>${rates.eur}</code>
🇷🇺 <b>1 RUB:</b> <code>${rates.rub}</code>

<i>Har 1 soniyada Smart Finance ilovasi bilan sinxronlanadi.</i>
`.trim();
    await sendTelegramMessage(chatId, ratesMsg);
  } else if (text.startsWith('/id')) {
    await sendTelegramMessage(
      chatId,
      `🆔 Sizning Chat ID raqamingiz: <code>${chatId}</code>\n\nUshbu raqamni Smart Finance ilovasidagi Telegram sozlamalariga kiriting.`
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `Hurmatli <b>${userName}</b>, barcha moliyaviy operatsiyalaringiz Web ilova orqali ushbu botga avtomatik keladi.\n\nValyuta kurslarini ko'rish uchun /kurs buyrug'ini yuboring.`
    );
  }
}

async function startPolling() {
  console.log('🤖 @xsobchi_bot Telegram Polling serveri ishga tushdi...');

  while (true) {
    try {
      const url = `${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      console.error('Polling xatosi:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();

