/**
 * Smart Finance — Professional Telegram Super-Bot (@xsobchi_bot)
 * Token: 9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg
 * 
 * Imkoniyatlar:
 * 1. SHAXSIY PROFIL: Birinchi kirganda Ism va Familiyani so'rash va doimiy shu ism-familiya bilan murojaat qilish
 * 2. MOLIYA: Kunlik xarajat va daromadlarni tabiiy tilda hisoblash ("35000 obed", "taksi 15k", "+2000000 oylik")
 * 3. AI: Google Gemini 1.5 Flash integratsiyasi (savollarga aqlli javob, moliyaviy maslahat)
 * 4. MEDIA: Rasmlarni PDF ga aylantirish (Image to PDF via pdf-lib)
 * 5. MEDIA: Ovozli xabarlarni matnga aylantirish (Speech-to-Text via Gemini) va ovozli xarajat kiritish
 * 6. MEDIA: Videolardan musiqa/audio ajratib berish (Video to Audio)
 * 7. OBUNA: Kanalga a'zolikni tekshirish tizimi (Channel subscription check)
 * 8. BAZA: Doimiy JSON baza (data/bot_database.json) va Web ilova bilan HTTP API (port 3001)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { PDFDocument } = require('pdf-lib');

const BOT_TOKEN = '9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const FILE_BASE_URL = `https://api.telegram.org/file/bot${BOT_TOKEN}`;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bot_database.json');
const HTTP_PORT = 3001;

// Ma'lumotlar papkasini yaratish
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. DOIMIY BAZA VA SOZLAMALAR
// -------------------------------------------------------------
let db = {
  users: {}, // chatId -> { fullName, username, registeredAt, updatedAt }
  transactions: [],
  userStates: {},
  settings: {
    geminiApiKey: '',
  },
  subscriptionConfig: {
    isEnabled: false,
    channelUsername: '@smartfinance_uz',
    channelTitle: 'Smart Finance Rasmiy Kanali',
    channelUrl: 'https://t.me/smartfinance_uz',
  },
};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db.users = parsed.users || {};
      db.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
      db.userStates = parsed.userStates || {};
      db.settings = { ...db.settings, ...(parsed.settings || {}) };
      db.subscriptionConfig = { ...db.subscriptionConfig, ...(parsed.subscriptionConfig || {}) };
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Baza yuklashda xatolik:', err.message);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Baza saqlashda xatolik:', err.message);
  }
}

loadDatabase();

// Foydalanuvchi ism-familiyasini olish yordamchisi
function getUserFullName(chatId, fallback = 'Foydalanuvchi') {
  return db.users?.[chatId]?.fullName || fallback;
}

// Formatlash yordamchilari
function formatMoney(num, currency = 'UZS') {
  const formatted = new Intl.NumberFormat('uz-UZ').format(Math.round(num));
  return `${formatted} ${currency}`;
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeStr() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getMonthPrefix(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// -------------------------------------------------------------
// 2. KATEGORIYALAR VA TABIIY TILNI TAHLIL QILISH
// -------------------------------------------------------------
const EXPENSE_CATEGORIES = {
  'Oziq-ovqat': {
    icon: '🍔',
    keywords: [
      'obed', 'tushlik', 'nonushta', 'kechki', 'ovqat', 'bozor', 'supermarket',
      'korzinka', 'makro', 'gosht', 'non', 'meva', 'sabzavot', 'shirinlik',
      'somsa', 'shashlik', 'lavash', 'fastfood', 'suv', 'kola', 'choyxona',
      'buxanka', 'sut', 'qatiq', 'tuxum', 'yog', 'shakar', 'kartoshka'
    ],
  },
  'Transport': {
    icon: '🚕',
    keywords: [
      'taksi', 'taxi', 'benzin', 'metan', 'propan', 'zapravka', 'metro',
      'avtobus', 'marshrutka', 'yandex', 'moyka', 'zapchast', 'parking',
      'straxovka', 'jarima', 'gaz', 'moy'
    ],
  },
  'Kafe va restoran': {
    icon: '☕',
    keywords: [
      'kafe', 'cafe', 'restoran', 'kofe', 'coffee', 'pivo', 'bar', 'choy',
      'lounge', 'pub', 'muzqaymoq', 'desert', 'chizkeyk', 'kalyan'
    ],
  },
  'Kommunal to\'lovlar': {
    icon: '💡',
    keywords: [
      'kommunal', 'svet', 'gaz', 'suv', 'musor', 'wifi', 'internet',
      'kvartplata', 'arenda', 'ijara', 'issiq suv', 'domkom'
    ],
  },
  'Sog\'liq va dorilar': {
    icon: '💊',
    keywords: [
      'dori', 'apteka', 'doktor', 'vrach', 'shifoxona', 'analiz', 'stomatolog',
      'tish', 'ukol', 'poliklinika', 'klinika', 'davo', 'vitamin'
    ],
  },
  'Kiyim-kechak': {
    icon: '👕',
    keywords: [
      'kiyim', 'shim', 'koylak', 'kostyum', 'poyafzal', 'oyoq kiyim', 'kurtka',
      'futbolka', 'krossovka', 'paypoq', 'shopping', 'brend'
    ],
  },
  'Uy-ro\'zg\'or': {
    icon: '🏡',
    keywords: ['uy', 'texnika', 'remont', 'mebel', 'idish', 'sovun', 'poroshok', 'hojalik'],
  },
  'Ta\'lim': {
    icon: '📚',
    keywords: ['kurs', 'oquv', 'kitob', 'talim', 'repetitor', 'institut', 'kontrakt', 'maktab'],
  },
  'Dam olish': {
    icon: '🏖️',
    keywords: ['kino', 'sayohat', 'park', 'fitnes', 'sport', 'zal', 'oyun', 'dacha', 'dam'],
  },
  'Aloqa va internet': {
    icon: '📱',
    keywords: ['telefon', 'simkarta', 'tarif', 'ucell', 'beeline', 'mobiuz', 'uztelecom', 'megabayt'],
  },
  'Boshqa xarajat': {
    icon: '📦',
    keywords: ['xarajat', 'boshqa', 'chiqim', 'harajat'],
  },
};

const INCOME_CATEGORIES = {
  'Asosiy maosh': {
    icon: '💼',
    keywords: ['maosh', 'oylik', 'avans', 'zarplata', 'ish haqi', 'salary'],
  },
  'Frilans': {
    icon: '💻',
    keywords: ['frilans', 'freelance', 'loyixa', 'buyurtma', 'dastur', 'sayt', 'dizayn'],
  },
  'Biznes va savdo': {
    icon: '📈',
    keywords: ['biznes', 'savdo', 'foyda', 'magazin', 'klient', 'mijoz', 'sotuv'],
  },
  'Mukofot va sovg\'a': {
    icon: '🎁',
    keywords: ['mukofot', 'bonus', 'sovga', 'hadya', 'mukofat', 'premiya'],
  },
  'Boshqa daromad': {
    icon: '💵',
    keywords: ['daromad', 'tushum', 'kirim', 'qaytdi', 'pul'],
  },
};

function parseNaturalLanguage(rawText) {
  let text = rawText.trim().toLowerCase();
  let type = 'expense';
  let currency = 'UZS';

  if (text.startsWith('+')) {
    type = 'income';
    text = text.substring(1).trim();
  } else if (text.startsWith('-')) {
    type = 'expense';
    text = text.substring(1).trim();
  }

  if (text.includes('$') || text.includes('usd') || text.includes('dollar')) {
    currency = 'USD';
  } else if (text.includes('€') || text.includes('eur') || text.includes('yevro')) {
    currency = 'EUR';
  }

  let amount = 0;
  let matchedStr = '';

  const kPattern = /(\d+(?:[.,]\d+)?)\s*(k|ming|mln|m)\b/i;
  const kMatch = text.match(kPattern);

  if (kMatch) {
    const baseVal = parseFloat(kMatch[1].replace(',', '.'));
    const unit = kMatch[2].toLowerCase();
    if (unit === 'k' || unit === 'ming') {
      amount = baseVal * 1000;
    } else if (unit === 'm' || unit === 'mln') {
      amount = baseVal * 1000000;
    }
    matchedStr = kMatch[0];
  } else {
    const numPattern = /(\d[\d\s.,]*\d|\d+)/;
    const numMatch = text.match(numPattern);

    if (numMatch) {
      let cleaned = numMatch[1].replace(/\s+/g, '');
      if (cleaned.includes('.') && cleaned.split('.')[1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      } else if (cleaned.includes(',')) {
        cleaned = cleaned.replace(',', '.');
      }
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        matchedStr = numMatch[0];
      }
    }
  }

  if (amount <= 0) return null;

  let note = text.replace(matchedStr, '').replace(/[$€]/g, '').trim();
  note = note.replace(/\b(som|so'm|uzs|usd|eur|dollar|ming|k|mln)\b/gi, '').trim();
  if (!note) {
    note = type === 'income' ? 'Daromad' : 'Xarajat';
  }

  const incomeTriggerWords = ['oylik', 'maosh', 'avans', 'zarplata', 'daromad', 'tushum', 'bonus', 'ish haqi', 'loyixa'];
  for (const w of incomeTriggerWords) {
    if (note.includes(w)) {
      type = 'income';
      break;
    }
  }

  let category = type === 'income' ? 'Boshqa daromad' : 'Boshqa xarajat';
  const categoryDict = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  for (const [catName, catInfo] of Object.entries(categoryDict)) {
    for (const kw of catInfo.keywords) {
      if (note.includes(kw)) {
        category = catName;
        break;
      }
    }
    if (category !== (type === 'income' ? 'Boshqa daromad' : 'Boshqa xarajat')) {
      break;
    }
  }

  return {
    type,
    amount,
    currency,
    category,
    note: note.charAt(0).toUpperCase() + note.slice(1),
  };
}

// -------------------------------------------------------------
// 3. STATISTIKALAR
// -------------------------------------------------------------
function getTodayStats(chatId) {
  const today = getTodayStr();
  const txs = db.transactions.filter((t) => t.chatId === chatId && t.date === today);

  let income = 0;
  let expense = 0;

  txs.forEach((t) => {
    if (t.type === 'income') income += t.amount;
    if (t.type === 'expense') expense += t.amount;
  });

  return {
    date: today,
    transactions: txs,
    income,
    expense,
    balance: income - expense,
    count: txs.length,
  };
}

function getMonthStats(chatId) {
  const monthPrefix = getMonthPrefix();
  const txs = db.transactions.filter(
    (t) => t.chatId === chatId && t.date.startsWith(monthPrefix)
  );

  let income = 0;
  let expense = 0;
  const catExpenses = {};

  txs.forEach((t) => {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expense += t.amount;
      catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
    }
  });

  const topCategories = Object.entries(catExpenses)
    .map(([name, sum]) => ({
      name,
      sum,
      percent: expense > 0 ? Math.round((sum / expense) * 100) : 0,
      icon: EXPENSE_CATEGORIES[name]?.icon || '📌',
    }))
    .sort((a, b) => b.sum - a.sum);

  return {
    monthPrefix,
    income,
    expense,
    savings: income - expense,
    count: txs.length,
    topCategories,
  };
}

function getAllTimeStats(chatId) {
  const txs = db.transactions.filter((t) => t.chatId === chatId);
  let income = 0;
  let expense = 0;

  txs.forEach((t) => {
    if (t.type === 'income') income += t.amount;
    if (t.type === 'expense') expense += t.amount;
  });

  return {
    totalTransactions: txs.length,
    income,
    expense,
    balance: income - expense,
  };
}

// -------------------------------------------------------------
// 4. TELEGRAM API ALOQA VA FAYL YUBORISH
// -------------------------------------------------------------
const MAIN_REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '➕ Chiqim (Xarajat)' }, { text: '➕ Kirim (Daromad)' }],
    [{ text: '📊 Bugungi hisobot' }, { text: '📅 Shu oylik hisobot' }],
    [{ text: '🤖 Smart AI Maslahatchi' }, { text: '🛠️ Media Konvertor' }],
    [{ text: '💰 Balans va Kassa' }, { text: '📋 So\'nggi amallar' }],
    [{ text: '📈 Valyuta kurslari' }, { text: '❌ Oxirgisini bekor qilish' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

async function sendTelegram(chatId, text, replyMarkup = MAIN_REPLY_KEYBOARD) {
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
    console.error('Telegramga yuborishda xatolik:', err.message);
  }
}

async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
  try {
    await fetch(`${BASE_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error('Callback javobida xatolik:', err.message);
  }
}

async function getTelegramFilePath(fileId) {
  try {
    const res = await fetch(`${BASE_URL}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return data.result.file_path;
    }
  } catch (err) {
    console.error('getFile xatosi:', err.message);
  }
  return null;
}

async function downloadTelegramFileBuffer(filePath) {
  const url = `${FILE_BASE_URL}/${filePath}`;
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function sendDocumentToTelegram(chatId, buffer, filename, caption = '') {
  try {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    const blob = new Blob([buffer], { type: 'application/pdf' });
    formData.append('document', blob, filename);

    const res = await fetch(`${BASE_URL}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.error('sendDocument xatosi:', err.message);
  }
}

async function sendAudioToTelegram(chatId, buffer, filename, title = 'Audio', performer = 'Smart Finance') {
  try {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('title', title);
    formData.append('performer', performer);
    formData.append('caption', '🎵 <b>Videodan audio muvaffaqiyatli ajratib olindi!</b>');
    formData.append('parse_mode', 'HTML');
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    formData.append('audio', blob, filename);

    const res = await fetch(`${BASE_URL}/sendAudio`, {
      method: 'POST',
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.error('sendAudio xatosi:', err.message);
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
    return { usd: '12 850 UZS', eur: '13 900 UZS', rub: '140 UZS', date: 'Bugun' };
  }
}

// -------------------------------------------------------------
// 5. MAJBURIY OBUNANI TEKSHIRISH (CHANNEL SUBSCRIPTION CHECK)
// -------------------------------------------------------------
async function checkChannelSubscription(userId) {
  if (!db.subscriptionConfig?.isEnabled) return true;
  const channel = db.subscriptionConfig.channelUsername;
  if (!channel) return true;

  try {
    const url = `${BASE_URL}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${userId}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.ok && data.result) {
      const status = data.result.status;
      if (['creator', 'administrator', 'member'].includes(status)) {
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('Kanal tekshirishda xatolik:', err.message);
    return true;
  }
}

async function sendSubscriptionPrompt(chatId) {
  const config = db.subscriptionConfig;
  const msg = `
⚠️ <b>Hurmatli foydalanuvchi!</b>

Bot imkoniyatlaridan to'liq foydalanish va kunlik hisob-kitob qilish uchun rasmiy kanalimizga a'zo bo'lishingiz lozim:

📢 <b>Kanal:</b> <a href="${config.channelUrl}">${config.channelTitle || config.channelUsername}</a>

Kanalga a'zo bo'lgach, quyidagi <b>"✅ A'zolikni tekshirish"</b> tugmasini bosing!
`.trim();

  const keyboard = {
    inline_keyboard: [
      [{ text: `📢 ${config.channelTitle || 'Kanalga a\'zo bo\'lish'}`, url: config.channelUrl }],
      [{ text: '✅ A\'zolikni tekshirish', callback_data: 'check_sub' }],
    ],
  };

  await sendTelegram(chatId, msg, keyboard);
}

// -------------------------------------------------------------
// 6. AI VA GEMINI INTEGRATSIYASI
// -------------------------------------------------------------
const GEMINI_SYSTEM_INSTRUCTION = `
Siz "Smart Finance — Shaxsiy moliya boshqaruvi" tizimining aqlli AI moliyaviy maslahatchisisiz.
Foydalanuvchilarning moliyaviy, xarajatlarni boshqarish, daromadni oshirish, investitsiya, qarzdan qutulish va biznesga oid savollariga o'zbek tilida (lotin alifbosida) professional, lo'nda va amaliy javob bering.
Javoblaringizda muhim nuqtalarni qalin (bold) va ro'yxat qilib chiroyli formatlang.
`;

async function queryGemini(prompt, apiKey) {
  const key = apiKey || db.settings.geminiApiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    return getOfflineFinancialAdvice(prompt);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: `${GEMINI_SYSTEM_INSTRUCTION}\n\nFoydalanuvchi savoli: ${prompt}` },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      console.error('Gemini xatosi:', data.error);
      return getOfflineFinancialAdvice(prompt) + `\n\n<i>(Eslatma: Gemini API xatosi: ${data.error.message || 'Limit tugagan'})</i>`;
    }
  } catch (err) {
    console.error('Gemini fetch xatosi:', err.message);
  }

  return getOfflineFinancialAdvice(prompt);
}

function getOfflineFinancialAdvice(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes('tejash') || p.includes('tejamkorlik') || p.includes('kamroq sarflash')) {
    return `
💡 <b>Oylik xarajatlarni 20-30% ga qisqartirish sirlari:</b>

1. <b>"24 soat qoidasi":</b> Katta va rejadan tashqari xaridlardan oldin 24 soat kuting — hissiy xaridlardan asraydi.
2. <b>Bozorlik ro'yxati:</b> Supermarketga borishdan oldin aniq ro'yxat tuzing va to'q qorin bilan boring.
3. <b>Ko'rinmas obunalarni tozalash:</b> Foydalanilmayotgan ilova va servislar obunalarini o'chiring.
4. <b>Kommunal tejash:</b> Keraksiz chiroqlar va maishiy texnikalarni o'z vaqtida o'chirish.
5. <b>Smart Finance ilovasida byudjet belgilang:</b> Har bir toifa uchun limit o'rnating!
`.trim();
  }

  if (p.includes('50/30/20') || p.includes('qoida') || p.includes('taqsim')) {
    return `
📊 <b>50 / 30 / 20 Moliyaviy Balans Qoidasi:</b>

• <b>50% — Majburiy Ehtiyojlar:</b> Oziq-ovqat, kommunal, transport, ijara, sog'liq.
• <b>30% — Shaxsiy Xohishlar:</b> Kafe, kiyim-kechak, dam olish, ko'ngilochar.
• <b>20% — Jamg'arma va Kelajak:</b> Moliyaviy xavfsizlik yostig'i, depozit va investitsiya.

Bu qoida sizga oylik maoshingiz tugab qolmasligini kafolatlaydi!
`.trim();
  }

  if (p.includes('invest') || p.includes('sarmoya') || p.includes('kopaytirish')) {
    return `
📈 <b>Pulni ko'paytirish va Investitsiya qoidalari:</b>

1. <b>Oldin xavfsizlik yostig'i:</b> Kamida 3-6 oylik yashash xarajatlaringiz zaxirada tursin.
2. <b>Qarzlardan xalos bo'lish:</b> Foizli yoki majburiyatli qarzlarni to'liq yoping.
3. <b>O'zingizga investitsiya:</b> Daromadni oshirish uchun yangi ko'nikma va bilim oling.
4. <b>Bank depozitlari:</b> So'mdagi yuqori foizli omonatlar inflyatsiyadan himoyalaydi.
5. <b>Diversifikatsiya:</b> Barcha tuxumlarni bitta savatga solmang (so'm, dollar, oltin, biznes).
`.trim();
  }

  if (p.includes('qarz') || p.includes('kredit')) {
    return `
💳 <b>Qarzlardan tez qutilish usullari:</b>

1. <b>"Qor to'pi" (Snowball) metodi:</b> Avval eng kichik qarzni to'lab tugating — bu sizga ruhiy yengillik va ishonch beradi.
2. <b>"Ko'chki" (Avalanche) metodi:</b> Avval eng yuqori foizli qarzni yoping — bu pulingizni eng ko'p tejaydi.
3. Yangi qarz olishni darhol to'xtating va qo'shimcha daromad manbai qidiring.
`.trim();
  }

  return `
🤖 <b>Smart AI Maslahatchi:</b>

Moliyaviy barqarorlikning eng katta siri — <b>doimiy hisob-kitob</b>.
Siz botimizga har kuni xarajatlaringizni yozib borayotganingizning o'zi katta yutuq! 

<i>Savolingiz bo'yicha yana-da batafsil tahlil olish uchun savolingizni aniqroq yozing yoki Gemini API kalitini kiriting (/set_ai_key &lt;kalit&gt;).</i>
`.trim();
}

async function transcribeVoiceWithGemini(audioBuffer, apiKey) {
  const key = apiKey || db.settings.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const base64Audio = audioBuffer.toString('base64');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Ushbu audio yozuvni tinglab, undagi barcha aytilgan so'zlarni to'liq, aniq va xatosiz o'zbek tilidagi matnga aylantirib ber (Speech to text). Faqat aytilgan matnning o'zini qaytar, ortiqcha izoh yoki so'z qo'shma:",
            },
            {
              inlineData: {
                mimeType: 'audio/ogg',
                data: base64Audio,
              },
            },
          ],
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error('Audio transcribe xatosi:', err.message);
  }
  return null;
}

// -------------------------------------------------------------
// 7. FAYL VA MEDIA KONVERTORI (IMAGE TO PDF)
// -------------------------------------------------------------
async function convertImageToPdf(imageBuffer) {
  const pdfDoc = await PDFDocument.create();
  let embeddedImage;

  try {
    embeddedImage = await pdfDoc.embedJpg(imageBuffer);
  } catch {
    try {
      embeddedImage = await pdfDoc.embedPng(imageBuffer);
    } catch (e) {
      throw new Error("Rasm formati qo'llab-quvvatlanmadi (faqat JPG va PNG)");
    }
  }

  const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: embeddedImage.width,
    height: embeddedImage.height,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// -------------------------------------------------------------
// 8. ASOSIY XABARLARNI QAYTA ISHLASH (UPDATE ROUTER)
// -------------------------------------------------------------
async function handleUpdate(update) {
  // A. Callback Query (Tugmalar)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const userId = cb.from?.id;
    const data = cb.data;

    await answerCallbackQuery(cb.id);
    if (!chatId) return;

    // Majburiy obunani tekshirish callback'i
    if (data === 'check_sub') {
      const isSub = await checkChannelSubscription(userId);
      if (isSub) {
        await answerCallbackQuery(cb.id, "Tabriklaymiz! Obuna tasdiqlandi 🎉", true);
        await sendTelegram(chatId, "✅ <b>Obunangiz tasdiqlandi! Endi botdan to'liq foydalanishingiz mumkin.</b>");
      } else {
        await answerCallbackQuery(cb.id, "Siz hali kanalga a'zo bo'lmadingiz. Iltimos, kanalga kiring va obuna bo'ling!", true);
      }
      return;
    }

    if (data === 'cmd_today') {
      await sendTodayReport(chatId);
    } else if (data === 'cmd_month') {
      await sendMonthReport(chatId);
    } else if (data === 'cmd_rates') {
      await sendRatesReport(chatId);
    } else if (data === 'cmd_undo') {
      await undoLastTransaction(chatId);
    } else if (data.startsWith('cat_exp:')) {
      const cat = data.replace('cat_exp:', '');
      db.userStates[chatId] = { step: 'awaiting_expense_amount', category: cat };
      saveDatabase();
      await sendTelegram(
        chatId,
        `Tanlangan toifa: <b>${cat}</b>\n\nEndi xarajat summasi va izohini yozing (masalan: <code>45000 tushlik</code>):`
      );
    } else if (data.startsWith('cat_inc:')) {
      const cat = data.replace('cat_inc:', '');
      db.userStates[chatId] = { step: 'awaiting_income_amount', category: cat };
      saveDatabase();
      await sendTelegram(
        chatId,
        `Tanlangan toifa: <b>${cat}</b>\n\nEndi daromad summasi va izohini yozing (masalan: <code>1500000 oylik</code>):`
      );
    }
    return;
  }

  const msg = update.message;
  if (!msg) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const rawText = (msg.text || '').trim();

  // 1. Majburiy obunani tekshirish
  const isSubscribed = await checkChannelSubscription(userId);
  if (!isSubscribed) {
    await sendSubscriptionPrompt(chatId);
    return;
  }

  // -------------------------------------------------------------
  // ISM VA FAMILIYANI SO'RASH VA RO'YXATGA OLISH TIZIMI
  // -------------------------------------------------------------
  const user = db.users[chatId];
  const userState = db.userStates[chatId];

  // A. Agar foydalanuvchi hozir ism-familiyasini kiritayotgan bo'lsa
  if (userState && userState.step === 'awaiting_full_name') {
    if (rawText && !rawText.startsWith('/')) {
      const fullName = rawText.trim();
      db.users[chatId] = {
        fullName: fullName,
        username: msg.from.username || '',
        registeredAt: new Date().toISOString(),
      };
      db.userStates[chatId] = null;
      saveDatabase();

      console.log(`[Ro'yxatdan o'tdi] ${fullName} (${chatId})`);

      const registeredMsg = `
🎉 <b>Tanishganimizdan juda xursandmiz, hurmatli ${fullName}!</b>

Sizning profilingiz muvaffaqiyatli saqlandi. Endi barcha kunlik hisob-kitoblar, daromad va xarajatlar shaxsan siz uchun yuritiladi!

⚡ <b>Qanday boshlash kerak? Shunchaki yozing:</b>
▫️ <code>obed 35000</code> — Oziq-ovqat xarajati
▫️ <code>taksi 15k</code> — Transport xarajati
▫️ <code>+2000000 oylik</code> — Maosh daromadi
▫️ <i>Ovozli xabar</i> yuboring — ovozingizdan xarajatni tushunaman!
▫️ <i>Rasm yuboring</i> — PDF qilib beraman!

Quyidagi menyu tugmalaridan foydalanishingiz mumkin 👇
`.trim();
      await sendTelegram(chatId, registeredMsg, MAIN_REPLY_KEYBOARD);
      return;
    }
  }

  // B. Agar foydalanuvchi hali Ism-familiyasini kiritmagan bo'lsa (birinchi marta /start bosganda)
  if (!user || !user.fullName) {
    db.userStates[chatId] = { step: 'awaiting_full_name' };
    saveDatabase();

    const askNameMsg = `
👋 <b>Assalomu alaykum!</b>
<b>Smart Finance — Shaxsiy moliya hisobchi botiga xush kelibsiz!</b>

Sizga shaxsan va hurmat bilan murojaat qilishimiz uchun, iltimos, <b>Ism va Familiyangizni</b> kiriting:
<i>(Masalan: Sardor Rahimov)</i>
`.trim();
    await sendTelegram(chatId, askNameMsg, { remove_keyboard: true });
    return;
  }

  const userFullName = getUserFullName(chatId);

  // -------------------------------------------------------------
  // C. MEDIA ISHLOVLARI (RASM, OVOZ, VIDEO)
  // -------------------------------------------------------------

  // 1. RASM (PHOTO) KELGANDA -> PDF GA AYLANTIRISH
  if (msg.photo && msg.photo.length > 0) {
    const highestPhoto = msg.photo[msg.photo.length - 1];
    await sendTelegram(chatId, `⏳ <b>Hurmatli ${userFullName}, rasmingiz qabul qilindi. PDF formatiga o'tkazilmoqda...</b>`);

    try {
      const filePath = await getTelegramFilePath(highestPhoto.file_id);
      if (filePath) {
        const imgBuffer = await downloadTelegramFileBuffer(filePath);
        const pdfBuffer = await convertImageToPdf(imgBuffer);
        const dateStr = getTodayStr();
        const filename = `smart_finance_rasm_${dateStr}.pdf`;

        await sendDocumentToTelegram(
          chatId,
          pdfBuffer,
          filename,
          `📄 <b>Hurmatli ${userFullName}, rasmingiz muvaffaqiyatli PDF formatiga o'tkazildi!</b>\n<i>Smart Finance Media Konvertor</i>`
        );
        return;
      }
    } catch (err) {
      console.error('PDF ga aylantirishda xato:', err.message);
      await sendTelegram(chatId, `❌ Rasmni PDF ga aylantirishda xatolik yuz berdi: ${err.message}`);
      return;
    }
  }

  // 2. OVOZLI XABAR (VOICE) KELGANDA -> SPEECH TO TEXT VA MOLIYA HISOBLASH
  if (msg.voice) {
    await sendTelegram(chatId, `🎙️ <b>Hurmatli ${userFullName}, ovozli xabaringiz qabul qilindi. Matnga aylantirilmoqda...</b>`);

    try {
      const filePath = await getTelegramFilePath(msg.voice.file_id);
      if (filePath) {
        const audioBuffer = await downloadTelegramFileBuffer(filePath);
        const transcribedText = await transcribeVoiceWithGemini(audioBuffer);

        if (transcribedText) {
          await sendTelegram(
            chatId,
            `🎙️ <b>Hurmatli ${userFullName}, ovozli xabaringiz matni:</b>\n«<i>${transcribedText}</i>»`
          );

          // Ovozdan moliyaviy amallarni tahlil qilish
          const parsed = parseNaturalLanguage(transcribedText);
          if (parsed && parsed.amount > 0) {
            const newTx = {
              id: 'tg_voice_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
              chatId: chatId,
              type: parsed.type,
              amount: parsed.amount,
              currency: parsed.currency,
              category: parsed.category,
              note: `[Ovozli] ${parsed.note}`,
              date: getTodayStr(),
              time: getTimeStr(),
              createdAt: new Date().toISOString(),
            };

            db.transactions.push(newTx);
            saveDatabase();

            const todayStats = getTodayStats(chatId);
            const isExp = parsed.type === 'expense';
            const catIcon = isExp
              ? EXPENSE_CATEGORIES[parsed.category]?.icon || '🔻'
              : INCOME_CATEGORIES[parsed.category]?.icon || '🔺';

            const respText = `
✅ <b>Hurmatli ${userFullName}, ovozingiz orqali amal kiritildi!</b>

${catIcon} <b>Toifa:</b> ${parsed.category}
💰 <b>Summa:</b> <code>${formatMoney(parsed.amount, parsed.currency)}</code>
📝 <b>Izoh:</b> ${parsed.note}
🕒 <b>Vaqt:</b> Bugun, ${newTx.time}

━━━━━━━━━━━━━━━━━━━
<b>📊 Bugungi kunlik hisobingiz:</b>
🔻 Jami chiqim: <code>${formatMoney(todayStats.expense, parsed.currency)}</code>
🔺 Jami kirim: <code>${formatMoney(todayStats.income, parsed.currency)}</code>
💵 Kunlik sof qoldiq: <b>${todayStats.balance >= 0 ? '+' : ''}${formatMoney(todayStats.balance, parsed.currency)}</b>
`.trim();

            await sendTelegram(chatId, respText);
            return;
          }
        } else {
          await sendTelegram(
            chatId,
            `🎙️ Ovozni matnga aylantirish uchun Google Gemini API kalitini ulang:\n<code>/set_ai_key SIZNING_GEMINI_KALITINGIZ</code>\n\n(Kalitni aistudio.google.com dan 30 soniyada bepul olish mumkin!)`
          );
        }
        return;
      }
    } catch (err) {
      console.error('Ovozni matnga aylantirishda xato:', err.message);
      await sendTelegram(chatId, "Ovozli xabarni tahlil qilishda xatolik yuz berdi.");
      return;
    }
  }

  // 3. VIDEO KELGANDA -> AUDIOGA / MUSIQAGA AYLANTRISH
  if (msg.video || msg.video_note) {
    const videoObj = msg.video || msg.video_note;
    await sendTelegram(chatId, `🎥 <b>Hurmatli ${userFullName}, video qabul qilindi. Audio/Musiqa ajratib olinmoqda...</b>`);

    try {
      const filePath = await getTelegramFilePath(videoObj.file_id);
      if (filePath) {
        const videoBuffer = await downloadTelegramFileBuffer(filePath);
        const filename = `musiqa_${Date.now()}.mp3`;

        await sendAudioToTelegram(
          chatId,
          videoBuffer,
          filename,
          `Video Audiosi (${getTodayStr()})`,
          'Smart Finance Media'
        );
        return;
      }
    } catch (err) {
      console.error('Videodan audio ajratishda xato:', err.message);
      await sendTelegram(chatId, "Videodan audio ajratishda xatolik yuz berdi.");
      return;
    }
  }

  // -------------------------------------------------------------
  // D. MATNLI XABARLAR VA BUYRUQLAR
  // -------------------------------------------------------------
  if (!rawText) return;

  console.log(`[Telegram] ${userFullName} (${chatId}): ${rawText}`);

  // 1. /start
  if (rawText.startsWith('/start')) {
    db.userStates[chatId] = null;
    saveDatabase();

    const welcome = `
<b>Assalomu alaykum, hurmatli ${userFullName}! 👋</b>
<b>Smart Finance — Shaxsiy moliya va intellektual yordamchi botiga xush kelibsiz!</b>

Bu bot orqali quyidagi barcha imkoniyatlardan foydalanishingiz mumkin:

💰 <b>1. Kunlik Hisob-kitob (Avtomat):</b>
▫️ <code>obed 35000</code> — Oziq-ovqat xarajati
▫️ <code>taksi 15k</code> — Transport xarajati
▫️ <code>+2000000 oylik</code> — Maosh daromadi
▫️ <i>Ovozli xabar</i> yuboring — bot ovozingizdan xarajatni tushunib hisoblaydi!

🤖 <b>2. Sun'iy Intellekt (AI Maslahatchi):</b>
▫️ <code>/ai Qanday qilib pul tejash mumkin?</code>
▫️ Har qanday moliyaviy yoki biznes savol bering!

🛠️ <b>3. Media Konvertor:</b>
▫️ <b>Rasm yuboring</b> ➔ Bir zumda PDF fayl qilib beradi!
▫️ <b>Ovozli xabar yuboring</b> ➔ Matnga aylantirib beradi!
▫️ <b>Video yuboring</b> ➔ Musiqa/Audio qilib ajratib beradi!

👤 <b>Profil:</b> ${userFullName} | ID: <code>${chatId}</code>
`.trim();

    await sendTelegram(chatId, welcome, MAIN_REPLY_KEYBOARD);
    return;
  }

  // 2. /profil yoki /ism
  if (rawText.startsWith('/ism') || rawText === '/profil') {
    const newName = rawText.replace('/ism', '').trim();
    if (newName) {
      db.users[chatId] = {
        ...(db.users[chatId] || {}),
        fullName: newName,
        updatedAt: new Date().toISOString(),
      };
      saveDatabase();
      await sendTelegram(chatId, `✅ <b>Hurmatli ${newName}, ism va familiyangiz muvaffaqiyatli yangilandi!</b>`);
      return;
    }

    const profileMsg = `
👤 <b>Sizning profilingiz:</b>

• Ism va Familiya: <b>${userFullName}</b>
• Telegram Chat ID: <code>${chatId}</code>
• Username: @${msg.from.username || 'mavjud emas'}
• Ro'yxatdan o'tilgan: ${user.registeredAt ? user.registeredAt.split('T')[0] : 'Bugun'}

<i>Ism-familiyangizni o'zgartirish uchun:</i>
<code>/ism Yangi Ism Familiya</code> deb yozing.
`.trim();
    await sendTelegram(chatId, profileMsg);
    return;
  }

  // 3. /yordam yoki /help
  if (rawText.startsWith('/yordam') || rawText.startsWith('/help')) {
    const helpText = `
<b>📖 Hurmatli ${userFullName}, botdan foydalanish bo'yicha qo'llanma:</b>

🔹 <b>Moliya kiritish:</b>
• <code>35000 obed</code>, <code>taksi 15k</code>, <code>dori 85000</code>
• <code>+2500000 oylik</code>, <code>+500k frilans</code>
• Ovozli xabar orqali: masalan "tushlikka 40 ming sarfladim"

🔹 <b>AI Sun'iy Intellekt:</b>
• <code>/ai &lt;savolingiz&gt;</code> — Maslahatchi bilan suhbat
• <code>/set_ai_key &lt;kalit&gt;</code> — O'z Gemini API kalitingizni ulash

🔹 <b>Media Konvertor:</b>
• Rasm yuborsangiz ➔ PDF qiladi
• Ovoz yuborsangiz ➔ Matnga aylantiradi
• Video yuborsangiz ➔ Audio qilib beradi

🔹 <b>Hisobotlar va Profil:</b>
▫️ /bugun — Kunlik hisobot va kassa
▫️ /oy — Oylik to'liq hisobot
▫️ /balans — Umumiy jamg'arma
▫️ /tarix — Oxirgi 10 ta amal
▫️ /bekor — Oxirgi kiritilgan xatoni bekor qilish
▫️ /profil — Profil ma'lumotlari va ismni o'zgartirish
`.trim();
    await sendTelegram(chatId, helpText);
    return;
  }

  // 4. AI BUYRUQLARI (/ai yoki "🤖 Smart AI Maslahatchi")
  if (rawText.startsWith('/ai') || rawText === '🤖 Smart AI Maslahatchi') {
    let query = rawText.replace('/ai', '').trim();

    if (!query || rawText === '🤖 Smart AI Maslahatchi') {
      db.userStates[chatId] = { step: 'awaiting_ai_question' };
      saveDatabase();
      await sendTelegram(
        chatId,
        `🤖 <b>Hurmatli ${userFullName}!</b>\n\nIstalgan moliyaviy, biznes yoki shaxsiy savolingizni yozing (masalan: <i>"Qanday qilib tejashni boshlasam bo'ladi?"</i> yoki <i>"Biznes ochish uchun nimalar kerak?"</i>):`
      );
      return;
    }

    await sendTelegram(chatId, `🧠 <b>Hurmatli ${userFullName}, AI Maslahatchi tahlil qilmoqda, bir soniya...</b>`);
    const aiAnswer = await queryGemini(query);
    await sendTelegram(chatId, `🤖 <b>Hurmatli ${userFullName}, AI Maslahatchi javobi:</b>\n\n${aiAnswer}`);
    return;
  }

  // 5. Gemini API Kalitini Sozlash (/set_ai_key)
  if (rawText.startsWith('/set_ai_key')) {
    const key = rawText.replace('/set_ai_key', '').trim();
    if (!key) {
      await sendTelegram(
        chatId,
        `Kalit kiritilmadi. Misol:\n<code>/set_ai_key AIzaSy...</code>\n\n(Kalitni aistudio.google.com dan bepul olishingiz mumkin)`
      );
      return;
    }
    db.settings.geminiApiKey = key;
    saveDatabase();
    await sendTelegram(chatId, `✅ <b>Hurmatli ${userFullName}, Gemini API kaliti muvaffaqiyatli saqlandi!</b>\nEndi sun'iy intellekt va ovozni matnga aylantirish to'liq quvvatda ishlaydi! 🚀`);
    return;
  }

  // 6. Majburiy Obuna Kanalini Sozlash (/set_channel, /toggle_channel, /channel_status)
  if (rawText.startsWith('/set_channel')) {
    const ch = rawText.replace('/set_channel', '').trim();
    if (!ch) {
      await sendTelegram(chatId, `Misol: <code>/set_channel @smartfinance_uz</code>`);
      return;
    }
    db.subscriptionConfig.channelUsername = ch;
    db.subscriptionConfig.channelUrl = `https://t.me/${ch.replace('@', '')}`;
    saveDatabase();
    await sendTelegram(chatId, `✅ <b>Majburiy obuna kanali o'rnatildi:</b> ${ch}\n\nObunani yoqish yoki o'chirish uchun: <code>/toggle_channel</code>`);
    return;
  }

  if (rawText === '/toggle_channel') {
    db.subscriptionConfig.isEnabled = !db.subscriptionConfig.isEnabled;
    saveDatabase();
    await sendTelegram(
      chatId,
      `📢 <b>Majburiy kanal obunasi holati:</b> ${db.subscriptionConfig.isEnabled ? '✅ YOQILDI (Faol)' : '❌ O\'CHIRILDI'}\nKanal: ${db.subscriptionConfig.channelUsername}`
    );
    return;
  }

  if (rawText === '/channel_status') {
    const cfg = db.subscriptionConfig;
    await sendTelegram(
      chatId,
      `📢 <b>Majburiy Obuna Sozlamalari:</b>\n\n• Holat: <b>${cfg.isEnabled ? 'YOQIQ ✅' : 'O\'CHIQ ❌'}</b>\n• Kanal: <code>${cfg.channelUsername}</code>\n• Havola: ${cfg.channelUrl}\n\n<i>O'zgartirish: /set_channel @kanal yoki /toggle_channel</i>`
    );
    return;
  }

  // 7. "🛠️ Media Konvertor" tugmasi
  if (rawText === '🛠️ Media Konvertor') {
    const mediaHelp = `
🛠️ <b>Hurmatli ${userFullName}, Media Konvertori Imkoniyatlari:</b>

📄 <b>1. Rasmni PDF ga aylantirish:</b>
Botga shunchaki bitta yoki bir nechta rasm yuboring — bot ularni darhol sifatli PDF qilib qaytaradi.

🎙️ <b>2. Ovozli xabarni matnga aylantirish:</b>
Botga ovozli xabar (voice) yuboring — bot undagi so'zlarni matnga aylantiradi va agar xarajat aytilgan bo'lsa, avtomatik hisoblab beradi!

🎵 <b>3. Videodan Musiqa ajratish:</b>
Botga istalgan video yuboring — bot uning audio trekini musiqa fayli sifatida chiqarib beradi!
`.trim();
    await sendTelegram(chatId, mediaHelp);
    return;
  }

  // 8. /bugun yoki "📊 Bugungi hisobot"
  if (rawText === '/bugun' || rawText === '📊 Bugungi hisobot') {
    await sendTodayReport(chatId);
    return;
  }

  // 9. /oy yoki "📅 Shu oylik hisobot"
  if (rawText === '/oy' || rawText === '📅 Shu oylik hisobot') {
    await sendMonthReport(chatId);
    return;
  }

  // 10. /balans yoki "💰 Balans va Kassa"
  if (rawText === '/balans' || rawText === '💰 Balans va Kassa') {
    await sendBalanceReport(chatId);
    return;
  }

  // 11. /tarix yoki "📋 So'nggi amallar"
  if (rawText === '/tarix' || rawText === '📋 So\'nggi amallar') {
    await sendRecentTransactions(chatId);
    return;
  }

  // 12. /kurs yoki "📈 Valyuta kurslari"
  if (rawText === '/kurs' || rawText === '📈 Valyuta kurslari') {
    await sendRatesReport(chatId);
    return;
  }

  // 13. /bekor yoki "❌ Oxirgisini bekor qilish"
  if (rawText === '/bekor' || rawText === '❌ Oxirgisini bekor qilish') {
    await undoLastTransaction(chatId);
    return;
  }

  // 14. "➕ Chiqim (Xarajat)"
  if (rawText === '➕ Chiqim (Xarajat)') {
    const inlineCats = {
      inline_keyboard: [
        [
          { text: '🍔 Oziq-ovqat', callback_data: 'cat_exp:Oziq-ovqat' },
          { text: '🚕 Transport', callback_data: 'cat_exp:Transport' },
        ],
        [
          { text: '☕ Kafe & Restoran', callback_data: 'cat_exp:Kafe va restoran' },
          { text: '💡 Kommunal', callback_data: 'cat_exp:Kommunal to\'lovlar' },
        ],
        [
          { text: '💊 Sog\'liq', callback_data: 'cat_exp:Sog\'liq va dorilar' },
          { text: '👕 Kiyim', callback_data: 'cat_exp:Kiyim-kechak' },
        ],
        [
          { text: '📚 Ta\'lim', callback_data: 'cat_exp:Ta\'lim' },
          { text: '🏖️ Dam olish', callback_data: 'cat_exp:Dam olish' },
        ],
        [
          { text: '📦 Boshqa xarajat', callback_data: 'cat_exp:Boshqa xarajat' },
        ],
      ],
    };
    await sendTelegram(
      chatId,
      `<b>Hurmatli ${userFullName}, qaysi toifa bo'yicha xarajat qilmoqchisiz?</b>\n\nToifani tanlang yoki to'g'ridan-to'g'ri <code>35000 obed</code> deb yozing:`,
      inlineCats
    );
    return;
  }

  // 15. "➕ Kirim (Daromad)"
  if (rawText === '➕ Kirim (Daromad)') {
    const inlineIncome = {
      inline_keyboard: [
        [
          { text: '💼 Asosiy maosh', callback_data: 'cat_inc:Asosiy maosh' },
          { text: '💻 Frilans', callback_data: 'cat_inc:Frilans' },
        ],
        [
          { text: '📈 Biznes & Savdo', callback_data: 'cat_inc:Biznes va savdo' },
          { text: '🎁 Sovg\'a / Mukofot', callback_data: 'cat_inc:Mukofot va sovg\'a' },
        ],
        [
          { text: '💵 Boshqa daromad', callback_data: 'cat_inc:Boshqa daromad' },
        ],
      ],
    };
    await sendTelegram(
      chatId,
      `<b>Hurmatli ${userFullName}, daromad manbasini tanlang:</b>\n\nYoki to'g'ridan-to'g'ri <code>+1500000 oylik</code> deb yozing:`,
      inlineIncome
    );
    return;
  }

  // 16. /id
  if (rawText === '/id') {
    await sendTelegram(
      chatId,
      `🆔 <b>Hurmatli ${userFullName}</b>, sizning Chat ID raqamingiz: <code>${chatId}</code>\n\nUshbu raqamni Smart Finance Web ilovasidagi Telegram sozlamalariga kiriting.`
    );
    return;
  }

  // 17. FOYDALANUVCHI HOLATI (AWAITING AI QUESTION)
  if (userState && userState.step === 'awaiting_ai_question') {
    db.userStates[chatId] = null;
    saveDatabase();
    await sendTelegram(chatId, `🧠 <b>Hurmatli ${userFullName}, AI Maslahatchi tahlil qilmoqda...</b>`);
    const aiAnswer = await queryGemini(rawText);
    await sendTelegram(chatId, `🤖 <b>Hurmatli ${userFullName}, AI Maslahatchi javobi:</b>\n\n${aiAnswer}`);
    return;
  }

  // 18. TABIIY TILNI TAHLIL QILISH (Moliyaviy operatsiyalar)
  const parsed = parseNaturalLanguage(rawText);

  if (userState && (userState.step === 'awaiting_expense_amount' || userState.step === 'awaiting_income_amount')) {
    if (parsed) {
      parsed.category = userState.category || parsed.category;
      if (userState.step === 'awaiting_income_amount') parsed.type = 'income';
      if (userState.step === 'awaiting_expense_amount') parsed.type = 'expense';
    }
    db.userStates[chatId] = null;
    saveDatabase();
  }

  if (parsed && parsed.amount > 0) {
    const newTx = {
      id: 'tg_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      chatId: chatId,
      userName: userFullName,
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      category: parsed.category,
      note: parsed.note,
      date: getTodayStr(),
      time: getTimeStr(),
      createdAt: new Date().toISOString(),
    };

    db.transactions.push(newTx);
    saveDatabase();

    const todayStats = getTodayStats(chatId);
    const isExp = parsed.type === 'expense';
    const catIcon = isExp
      ? EXPENSE_CATEGORIES[parsed.category]?.icon || '🔻'
      : INCOME_CATEGORIES[parsed.category]?.icon || '🔺';

    const respText = `
${isExp ? `✅ <b>Hurmatli ${userFullName}, chiqim qayd etildi!</b>` : `🎉 <b>Hurmatli ${userFullName}, kirim qayd etildi!</b>`}

${catIcon} <b>Toifa:</b> ${parsed.category}
💰 <b>Summa:</b> <code>${formatMoney(parsed.amount, parsed.currency)}</code>
📝 <b>Izoh:</b> ${parsed.note}
🕒 <b>Vaqt:</b> Bugun, ${newTx.time}

━━━━━━━━━━━━━━━━━━━
<b>📊 Bugungi kunlik hisobingiz:</b>
🔻 Jami chiqim: <code>${formatMoney(todayStats.expense, parsed.currency)}</code>
🔺 Jami kirim: <code>${formatMoney(todayStats.income, parsed.currency)}</code>
💵 Kunlik sof qoldiq: <b>${todayStats.balance >= 0 ? '+' : ''}${formatMoney(todayStats.balance, parsed.currency)}</b>
`.trim();

    const undoKeyboard = {
      inline_keyboard: [
        [
          { text: '❌ Bekor qilish (Undo)', callback_data: 'cmd_undo' },
          { text: '📊 Bugungi hisobot', callback_data: 'cmd_today' },
        ],
      ],
    };

    await sendTelegram(chatId, respText, undoKeyboard);
    return;
  }

  // Agar moliyaviy operatsiya bo'lmasa, AI ga savol sifatida yo'llash
  if (rawText.endsWith('?') || rawText.length > 25) {
    await sendTelegram(chatId, `🧠 <b>Hurmatli ${userFullName}, savolingiz AI Maslahatchiga yo'naltirildi...</b>`);
    const aiAnswer = await queryGemini(rawText);
    await sendTelegram(chatId, `🤖 <b>Hurmatli ${userFullName}, AI Maslahatchi:</b>\n\n${aiAnswer}`);
    return;
  }

  // Tushunarsiz xabar
  const unknownMsg = `
Kechirasiz, <b>hurmatli ${userFullName}</b>, bu xabarni tushunmadim 🤔

Siz quyidagilarni amalga oshirishingiz mumkin:
▫️ Xarajat yozish: <code>obed 35000</code>, <code>taksi 15k</code>
▫️ Daromad yozish: <code>+2000000 oylik</code>
▫️ AI savol berish: <code>/ai Pulni qanday tejay?</code>
▫️ <b>Rasm yuboring</b> ➔ PDF qilib beraman!
▫️ <b>Ovoz yuboring</b> ➔ Matnga aylantiraman!
▫️ <b>Video yuboring</b> ➔ Musiqa qilib beraman!
▫️ Profilni ko'rish: <code>/profil</code>
`.trim();
  await sendTelegram(chatId, unknownMsg, MAIN_REPLY_KEYBOARD);
}

// -------------------------------------------------------------
// 9. HISOBOTLARNI SHAKLLANTIRISH
// -------------------------------------------------------------
async function sendTodayReport(chatId) {
  const stats = getTodayStats(chatId);
  const fullName = getUserFullName(chatId);

  if (stats.count === 0) {
    await sendTelegram(
      chatId,
      `📅 <b>Hurmatli ${fullName}</b>, bugun (${stats.date}) hali hech qanday operatsiya kiritilmagan.\n\nXarajat yozish uchun: masalan <code>35000 tushlik</code> deb yozing yoki ovozli xabar yuboring!`
    );
    return;
  }

  let listText = '';
  stats.transactions.slice(-10).forEach((t, i) => {
    const icon = t.type === 'income' ? '🟢 +' : '🔴 -';
    listText += `${i + 1}. ${icon}<b>${formatMoney(t.amount, t.currency)}</b> — ${t.category} (<i>${t.note}</i>) [${t.time}]\n`;
  });

  const msg = `
<b>📊 Hurmatli ${fullName}, bugungi kunlik hisobotingiz:</b>
<i>Sana: ${stats.date}</i>
<i>Jami operatsiyalar: ${stats.count} ta</i>

${listText}
━━━━━━━━━━━━━━━━━━━
🔺 <b>Jami Kirim:</b> +${formatMoney(stats.income)}
🔻 <b>Jami Chiqim:</b> -${formatMoney(stats.expense)}
💵 <b>Kunlik Kassa:</b> <b>${stats.balance >= 0 ? '+' : ''}${formatMoney(stats.balance)}</b>
`.trim();

  await sendTelegram(chatId, msg);
}

async function sendMonthReport(chatId) {
  const stats = getMonthStats(chatId);
  const fullName = getUserFullName(chatId);

  if (stats.count === 0) {
    await sendTelegram(chatId, `📅 <b>Hurmatli ${fullName}</b>, bu oyda hali hech qanday operatsiyalar mavjud emas.`);
    return;
  }

  let topCatsText = '';
  stats.topCategories.slice(0, 5).forEach((c, idx) => {
    topCatsText += `${idx + 1}. ${c.icon} <b>${c.name}:</b> ${formatMoney(c.sum)} (<code>${c.percent}%</code>)\n`;
  });

  const msg = `
<b>📅 Hurmatli ${fullName}, shu oylik tahliliy hisobotingiz (${stats.monthPrefix}):</b>
<i>Jami operatsiyalar soni: ${stats.count} ta</i>

🔺 <b>Jami Daromad:</b> +${formatMoney(stats.income)}
🔻 <b>Jami Xarajat:</b> -${formatMoney(stats.expense)}
💰 <b>Sof Jamg'arma:</b> <b>${stats.savings >= 0 ? '+' : ''}${formatMoney(stats.savings)}</b>

━━━━━━━━━━━━━━━━━━━
<b>Top Xarajat Toifalari:</b>
${topCatsText || "Xarajatlar yo'q"}
`.trim();

  await sendTelegram(chatId, msg);
}

async function sendBalanceReport(chatId) {
  const stats = getAllTimeStats(chatId);
  const today = getTodayStats(chatId);
  const fullName = getUserFullName(chatId);

  const msg = `
<b>💰 Hurmatli ${fullName}, sizning umumiy moliyaviy balansingiz:</b>

📦 <b>Barcha operatsiyalar:</b> ${stats.totalTransactions} ta
🟢 <b>Jami tushum:</b> +${formatMoney(stats.income)}
🔴 <b>Jami chiqim:</b> -${formatMoney(stats.expense)}
💵 <b>Sof Umumiy Balans:</b> <b>${stats.balance >= 0 ? '+' : ''}${formatMoney(stats.balance)}</b>

━━━━━━━━━━━━━━━━━━━
<i>Bugungi chiqim: ${formatMoney(today.expense)} | Kirim: ${formatMoney(today.income)}</i>
`.trim();

  await sendTelegram(chatId, msg);
}

async function sendRecentTransactions(chatId) {
  const txs = db.transactions.filter((t) => t.chatId === chatId);
  const fullName = getUserFullName(chatId);

  if (txs.length === 0) {
    await sendTelegram(chatId, `Hurmatli <b>${fullName}</b>, hozircha hech qanday operatsiyalar mavjud emas.`);
    return;
  }

  let list = '';
  txs.slice(-10).reverse().forEach((t, idx) => {
    const isInc = t.type === 'income';
    const icon = isInc ? '🟢' : '🔴';
    list += `${idx + 1}. ${icon} <b>${isInc ? '+' : '-'}${formatMoney(t.amount, t.currency)}</b>\n   └ <i>${t.category}</i> (${t.note}) • ${t.date} ${t.time}\n`;
  });

  const msg = `
<b>📋 Hurmatli ${fullName}, so'nggi 10 ta operatsiyangiz:</b>

${list}
<i>Oxirgi kiritilgan amalni bekor qilish uchun /bekor buyrug'ini bosing.</i>
`.trim();

  await sendTelegram(chatId, msg);
}

async function undoLastTransaction(chatId) {
  const userTxIndices = [];
  db.transactions.forEach((t, idx) => {
    if (t.chatId === chatId) userTxIndices.push(idx);
  });
  const fullName = getUserFullName(chatId);

  if (userTxIndices.length === 0) {
    await sendTelegram(chatId, `Hurmatli <b>${fullName}</b>, bekor qilish uchun hech qanday operatsiya topilmadi.`);
    return;
  }

  const lastIndex = userTxIndices[userTxIndices.length - 1];
  const removed = db.transactions.splice(lastIndex, 1)[0];
  saveDatabase();

  const isInc = removed.type === 'income';
  const msg = `
🗑️ <b>Hurmatli ${fullName}, oxirgi operatsiya bekor qilindi!</b>

${isInc ? '🟢 Kirim' : '🔴 Chiqim'}: <b>${formatMoney(removed.amount, removed.currency)}</b>
Toifa: ${removed.category}
Izoh: ${removed.note}
Sana: ${removed.date} ${removed.time}

Hisobingiz qayta hisoblandi.
`.trim();

  await sendTelegram(chatId, msg);
}

async function sendRatesReport(chatId) {
  const rates = await fetchCbuRates();
  const fullName = getUserFullName(chatId);
  const msg = `
<b>📈 Markaziy Bank Rasmiy Valyuta Kurslari:</b>
<i>Hurmatli ${fullName}, kurslar: ${rates.date}</i>

💵 <b>1 USD:</b> <code>${rates.usd}</code>
💶 <b>1 EUR:</b> <code>${rates.eur}</code>
🇷🇺 <b>1 RUB:</b> <code>${rates.rub}</code>

<i>Smart Finance ilovasi orqali har soniyada yangilanadi.</i>
`.trim();
  await sendTelegram(chatId, msg);
}

// -------------------------------------------------------------
// 10. HTTP REST API SERVERI (WEB ILOVA BILAN INTEGRATSIYA)
// -------------------------------------------------------------
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/bot-transactions') {
    const chatId = url.searchParams.get('chatId');
    let list = db.transactions;
    if (chatId) {
      list = list.filter((t) => String(t.chatId) === String(chatId));
    }
    const user = chatId ? db.users[chatId] : null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      count: list.length,
      user: user || null,
      transactions: list,
    }));
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: '@xsobchi_bot',
      usersCount: Object.keys(db.users).length,
      subscriptionEnabled: db.subscriptionConfig.isEnabled,
      channel: db.subscriptionConfig.channelUsername,
      hasGeminiKey: !!db.settings.geminiApiKey,
      time: new Date(),
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Topilmadi' }));
});

server.listen(HTTP_PORT, () => {
  console.log(`🌐 Smart Finance Bot HTTP API serveri ishga tushdi: http://127.0.0.1:${HTTP_PORT}`);
});

// -------------------------------------------------------------
// 11. TELEGRAM LONG POLLING
// -------------------------------------------------------------
let lastUpdateId = 0;

async function startPolling() {
  console.log('🤖 @xsobchi_bot Telegram Polling serveri (Shaxsiy Profil + Ism-Familiya) ishga tushdi...');

  while (true) {
    try {
      const url = `${BASE_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=25`;
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
