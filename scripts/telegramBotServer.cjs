/**
 * Smart Finance — Professional Telegram Finance Bot (@xsobchi_bot)
 * Token: 9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg
 * 
 * Imkoniyatlar:
 * 1. Har kunlik xarajat va daromadlarni oddiy matn orqali kiritish (masalan: "35000 obed", "taksi 15k", "+2000000 oylik")
 * 2. Avtomatik toifa aniqlash (Oziq-ovqat, Transport, Kafe, Kommunal, Sog'liq, Maosh va h.k.)
 * 3. Bugungi hisobot va kassa qoldig'ini avtomatik hisoblash
 * 4. Oylik tahliliy hisobot va eng ko'p ketgan toifalar
 * 5. Umumiy balans va oxirgi 10 ta operatsiyalar tarixi
 * 6. Oxirgi amalni bekor qilish (Undo)
 * 7. Doimiy ma'lumotlar bazasi (data/bot_database.json)
 * 8. Web ilova bilan integratsiya uchun yengil HTTP API (port 3001)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const BOT_TOKEN = '9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg';
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'bot_database.json');
const HTTP_PORT = 3001;

// Ma'lumotlar papkasi mavjudligini ta'minlash
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// 1. DOIMIY MA'LUMOTLAR BAZASI (JSON DATABASE)
// -------------------------------------------------------------
interface_db = {
  transactions: [], // { id, chatId, type: 'income'|'expense', amount, currency, category, note, date, time, createdAt }
  userStates: {},   // chatId -> { step, data }
};

let db = { transactions: [], userStates: {} };

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
      if (!Array.isArray(db.transactions)) db.transactions = [];
      if (!db.userStates) db.userStates = {};
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Baza yuklashda xatolik:', err.message);
    db = { transactions: [], userStates: {} };
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
// 2. KATEGORIYALAR LUG'ATI VA SMART PARSER
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
      'avtobus', 'marshrutka', 'yandex', 'moyka', 'propan', 'zapchast',
      'parking', 'propusk', 'straxovka', 'jarima', 'gaz', 'moy'
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
      'kvartplata', 'arenda', 'ijara', 'issiq suv', 'sovuq suv', 'domkom'
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
      'futbolka', 'krossovka', 'paypoq', 'shopping', 'brend', 'moda'
    ],
  },
  'Uy-ro\'zg\'or': {
    icon: '🏡',
    keywords: [
      'uy', 'texnika', 'remont', 'mebel', 'idish', 'sovun', 'poroshok',
      'hojalik', 'xos', 'tozalash', 'yuvish', 'chiroq', 'instrument'
    ],
  },
  'Ta\'lim': {
    icon: '📚',
    keywords: [
      'kurs', 'oquv', 'kitob', 'talim', 'repetitor', 'institut', 'kontrakt',
      'maktab', 'bogcha', 'dars', 'repetitorlik', 'seminar', 'trening'
    ],
  },
  'Dam olish': {
    icon: '🏖️',
    keywords: [
      'kino', 'sayohat', 'park', 'fitnes', 'sport', 'zal', 'oyun', 'konsert',
      'teatr', 'hovuz', 'basseyn', 'dacha', 'dam'
    ],
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

/**
 * Matndan summani, valyutani, turini va toifasini aqlli tahlil qilish
 */
function parseNaturalLanguage(rawText) {
  let text = rawText.trim().toLowerCase();
  let type = 'expense'; // default chiqim
  let currency = 'UZS';

  // 1. Kirim belgisini tekshirish
  if (text.startsWith('+')) {
    type = 'income';
    text = text.substring(1).trim();
  } else if (text.startsWith('-')) {
    type = 'expense';
    text = text.substring(1).trim();
  }

  // 2. Valyutani aniqlash
  if (text.includes('$') || text.includes('usd') || text.includes('dollar')) {
    currency = 'USD';
  } else if (text.includes('€') || text.includes('eur') || text.includes('yevro')) {
    currency = 'EUR';
  }

  // 3. Summani ajratib olish (35000, 35 000, 35k, 1.5m, 100$, 50k va h.k.)
  let amount = 0;
  let matchedStr = '';

  // 35k yoki 35.5k yoki 1.5m
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
    // Oddiy raqamlar: masalan "35000", "35 000", "35.000", "$100", "100$"
    const numPattern = /(\d[\d\s.,]*\d|\d+)/;
    const numMatch = text.match(numPattern);

    if (numMatch) {
      // Bo'sh joylar va nuqtalarni tozalash
      let cleaned = numMatch[1].replace(/\s+/g, '');
      if (cleaned.includes('.') && cleaned.split('.')[1].length === 3) {
        // 35.000 = 35000
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

  if (amount <= 0) {
    return null; // Summa topilmadi
  }

  // Matndan summani olib tashlab, qolgan so'zlarni izoh sifatida olish
  let note = text.replace(matchedStr, '').replace(/[$€]/g, '').trim();
  note = note.replace(/\b(som|so'm|uzs|usd|eur|dollar|ming|k|mln)\b/gi, '').trim();
  if (!note) {
    note = type === 'income' ? 'Daromad' : 'Xarajat';
  }

  // 4. Kirim so'zlari mavjud bo'lsa turini 'income' qilish
  const incomeTriggerWords = ['oylik', 'maosh', 'avans', 'zarplata', 'daromad', 'tushum', 'bonus', 'ish haqi', 'loyixa'];
  for (const w of incomeTriggerWords) {
    if (note.includes(w)) {
      type = 'income';
      break;
    }
  }

  // 5. Toifani aniqlash (Matching)
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
// 3. STATISTIKA VA HISOBLASH FUNKSIYALARI
// -------------------------------------------------------------
function getTodayStats(chatId) {
  const today = getTodayStr();
  const txs = db.transactions.filter(
    (t) => t.chatId === chatId && t.date === today
  );

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

  // Top toifalar
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
// 4. TELEGRAM API BILAN ALOQA (SEND MESSAGE, KEYBOARDS)
// -------------------------------------------------------------
const MAIN_REPLY_KEYBOARD = {
  keyboard: [
    [{ text: '➕ Chiqim (Xarajat)' }, { text: '➕ Kirim (Daromad)' }],
    [{ text: '📊 Bugungi hisobot' }, { text: '📅 Shu oylik hisobot' }],
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

async function answerCallbackQuery(callbackQueryId, text = '') {
  try {
    await fetch(`${BASE_URL}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
      }),
    });
  } catch (err) {
    console.error('Callback javobida xatolik:', err.message);
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
// 5. XABARLARNI QAYTA ISHLASH (MESSAGE & UPDATE ROUTER)
// -------------------------------------------------------------
async function handleUpdate(update) {
  // A. Callback Query (Inline tugmalar)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const data = cb.data;

    await answerCallbackQuery(cb.id);
    if (!chatId) return;

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

  // B. Oddiy Matnli Xabarlar
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const rawText = msg.text.trim();
  const userName = msg.from.first_name || 'Foydalanuvchi';

  console.log(`[Telegram] ${userName} (${chatId}): ${rawText}`);

  // 1. /start
  if (rawText.startsWith('/start')) {
    db.userStates[chatId] = null;
    saveDatabase();

    const welcome = `
<b>Assalomu alaykum, ${userName}! 👋</b>
<b>Smart Finance — Shaxsiy moliya hisobchi botiga xush kelibsiz!</b>

Bu bot orqali har kungi daromad va xarajatlaringizni bir soniyada yozib borishingiz mumkin. Bot ularni avtomatik hisoblaydi va tahlil qiladi.

⚡ <b>Qanday yozish kerak? Shunchaki yozing:</b>
▫️ <code>obed 35000</code> — Oziq-ovqat xarajati
▫️ <code>taksi 15000</code> — Transport xarajati
▫️ <code>kafe 60k</code> — Kafe xarajati (60 000 UZS)
▫️ <code>+2000000 oylik</code> — Maosh daromadi
▫️ <code>100$ bonus</code> — Valyutadagi tushum

🆔 <b>Sizning Chat ID:</b> <code>${chatId}</code>
<i>(Ushbu ID orqali Web ilovani ham bot bilan bog'lashingiz mumkin)</i>

Quyidagi menyu tugmalaridan foydalanishingiz mumkin 👇
`.trim();

    await sendTelegram(chatId, welcome, MAIN_REPLY_KEYBOARD);
    return;
  }

  // 2. /yordam yoki /help
  if (rawText.startsWith('/yordam') || rawText.startsWith('/help')) {
    const helpText = `
<b>📖 Botdan foydalanish bo'yicha tezkor qo'llanma:</b>

🔹 <b>Xarajat yozish misollari:</b>
• <code>35000 obed</code>
• <code>taksi 15k</code>
• <code>dori 85000</code>
• <code>bozor 120 000</code>
• <code>benzin 50k</code>
• <code>svet 70000</code>

🔹 <b>Daromad yozish misollari:</b>
• <code>+2500000 oylik</code>
• <code>+500k frilans</code>
• <code>maosh 3000000</code>
• <code>100$ daromad</code>

🔹 <b>Asosiy buyruqlar:</b>
▫️ /bugun — Bugungi barcha xarajat va tushumlar
▫️ /oy — Shu oylik to'liq hisobot
▫️ /balans — Umumiy qoldiq va statistika
▫️ /tarix — Oxirgi 10 ta operatsiya
▫️ /bekor — Oxirgi kiritilgan xatoni o'chirish
▫️ /kurs — Markaziy bank valyuta kurslari
`.trim();
    await sendTelegram(chatId, helpText);
    return;
  }

  // 3. /bugun yoki "📊 Bugungi hisobot"
  if (rawText === '/bugun' || rawText === '📊 Bugungi hisobot') {
    await sendTodayReport(chatId);
    return;
  }

  // 4. /oy yoki "📅 Shu oylik hisobot"
  if (rawText === '/oy' || rawText === '📅 Shu oylik hisobot') {
    await sendMonthReport(chatId);
    return;
  }

  // 5. /balans yoki "💰 Balans va Kassa"
  if (rawText === '/balans' || rawText === '💰 Balans va Kassa') {
    await sendBalanceReport(chatId);
    return;
  }

  // 6. /tarix yoki "📋 So'nggi amallar"
  if (rawText === '/tarix' || rawText === '📋 So\'nggi amallar') {
    await sendRecentTransactions(chatId);
    return;
  }

  // 7. /kurs yoki "📈 Valyuta kurslari"
  if (rawText === '/kurs' || rawText === '📈 Valyuta kurslari') {
    await sendRatesReport(chatId);
    return;
  }

  // 8. /bekor yoki "❌ Oxirgisini bekor qilish"
  if (rawText === '/bekor' || rawText === '❌ Oxirgisini bekor qilish') {
    await undoLastTransaction(chatId);
    return;
  }

  // 9. "➕ Chiqim (Xarajat)" tugmasi
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
      `<b>Qaysi toifa bo'yicha xarajat qilmoqchisiz?</b>\n\nToifani tanlang yoki to'g'ridan-to'g'ri <code>35000 obed</code> deb yozing:`,
      inlineCats
    );
    return;
  }

  // 10. "➕ Kirim (Daromad)" tugmasi
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
      `<b>Daromad manbasini tanlang:</b>\n\nYoki to'g'ridan-to'g'ri <code>+1500000 oylik</code> deb yozing:`,
      inlineIncome
    );
    return;
  }

  // 11. /id
  if (rawText === '/id') {
    await sendTelegram(
      chatId,
      `🆔 Sizning Chat ID raqamingiz: <code>${chatId}</code>\n\nUshbu raqamni Smart Finance Web ilovasidagi Telegram sozlamalariga kiriting.`
    );
    return;
  }

  // 12. TABIIY TILNI TAHLIL QILISH (Masalan: "35000 obed", "taksi 15k", "+2000000 maosh")
  const parsed = parseNaturalLanguage(rawText);

  // Agar foydalanuvchi avval toifani tanlagan bo'lsa
  const userState = db.userStates[chatId];
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

    // Bugungi statistikani hisoblash
    const todayStats = getTodayStats(chatId);

    const isExp = parsed.type === 'expense';
    const catIcon = isExp
      ? EXPENSE_CATEGORIES[parsed.category]?.icon || '🔻'
      : INCOME_CATEGORIES[parsed.category]?.icon || '🔺';

    const respText = `
${isExp ? '✅ <b>Chiqim (Xarajat) qayd etildi!</b>' : '🎉 <b>Kirim (Daromad) qayd etildi!</b>'}

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

  // Agar tushunarsiz xabar yuborilgan bo'lsa
  const unknownMsg = `
Kechirasiz, <b>${userName}</b>, bu xabarni tushunmadim 🤔

Xarajat yoki daromadni quyidagicha yozing:
▫️ <code>obed 35000</code>
▫️ <code>taksi 15k</code>
▫️ <code>+2000000 oylik</code>
▫️ <code>benzin 50 000</code>

Yoki quyidagi tugmalardan birini bosing 👇
`.trim();
  await sendTelegram(chatId, unknownMsg, MAIN_REPLY_KEYBOARD);
}

// -------------------------------------------------------------
// 6. HISOBOTLARNI SHAKLLANTIRISH VA YUBORISH
// -------------------------------------------------------------
async function sendTodayReport(chatId) {
  const stats = getTodayStats(chatId);

  if (stats.count === 0) {
    await sendTelegram(
      chatId,
      `📅 <b>Bugun (${stats.date}) hali hech qanday operatsiya kiritilmagan.</b>\n\nXarajat yozish uchun: masalan <code>35000 tushlik</code> deb yozing!`
    );
    return;
  }

  let listText = '';
  stats.transactions.slice(-10).forEach((t, i) => {
    const icon = t.type === 'income' ? '🟢 +' : '🔴 -';
    listText += `${i + 1}. ${icon}<b>${formatMoney(t.amount, t.currency)}</b> — ${t.category} (<i>${t.note}</i>) [${t.time}]\n`;
  });

  const msg = `
<b>📊 Bugungi kunlik hisobot:</b>
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

  if (stats.count === 0) {
    await sendTelegram(
      chatId,
      `📅 <b>Bu oyda hali hech qanday operatsiyalar mavjud emas.</b>`
    );
    return;
  }

  let topCatsText = '';
  stats.topCategories.slice(0, 5).forEach((c, idx) => {
    topCatsText += `${idx + 1}. ${c.icon} <b>${c.name}:</b> ${formatMoney(c.sum)} (<code>${c.percent}%</code>)\n`;
  });

  const msg = `
<b>📅 Shu oylik tahliliy hisobot (${stats.monthPrefix}):</b>
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

  const msg = `
<b>💰 Sizning Moliyaviy Balansingiz:</b>

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

  if (txs.length === 0) {
    await sendTelegram(chatId, "Hozircha hech qanday operatsiyalar mavjud emas.");
    return;
  }

  let list = '';
  txs.slice(-10).reverse().forEach((t, idx) => {
    const isInc = t.type === 'income';
    const icon = isInc ? '🟢' : '🔴';
    list += `${idx + 1}. ${icon} <b>${isInc ? '+' : '-'}${formatMoney(t.amount, t.currency)}</b>\n   └ <i>${t.category}</i> (${t.note}) • ${t.date} ${t.time}\n`;
  });

  const msg = `
<b>📋 So'nggi 10 ta operatsiya:</b>

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

  if (userTxIndices.length === 0) {
    await sendTelegram(chatId, "Bekor qilish uchun hech qanday operatsiya topilmadi.");
    return;
  }

  const lastIndex = userTxIndices[userTxIndices.length - 1];
  const removed = db.transactions.splice(lastIndex, 1)[0];
  saveDatabase();

  const isInc = removed.type === 'income';
  const msg = `
🗑️ <b>Oxirgi operatsiya bekor qilindi (o'chirildi)!</b>

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
  const msg = `
<b>📈 Markaziy Bank Rasmiy Valyuta Kurslari:</b>
<i>Sana: ${rates.date}</i>

💵 <b>1 USD:</b> <code>${rates.usd}</code>
💶 <b>1 EUR:</b> <code>${rates.eur}</code>
🇷🇺 <b>1 RUB:</b> <code>${rates.rub}</code>

<i>Smart Finance ilovasi orqali har soniyada yangilanadi.</i>
`.trim();
  await sendTelegram(chatId, msg);
}

// -------------------------------------------------------------
// 7. YENGIL HTTP API SERVERI (WEB ILOVA BILAN INTEGRATSIYA)
// -------------------------------------------------------------
const server = http.createServer((req, res) => {
  // CORS sarlavhalari
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, count: list.length, transactions: list }));
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', bot: '@xsobchi_bot', time: new Date() }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Topilmadi' }));
});

server.listen(HTTP_PORT, () => {
  console.log(`🌐 Smart Finance Bot HTTP API serveri ishga tushdi: http://127.0.0.1:${HTTP_PORT}`);
});

// -------------------------------------------------------------
// 8. TELEGRAM LONG POLLING
// -------------------------------------------------------------
let lastUpdateId = 0;

async function startPolling() {
  console.log('🤖 @xsobchi_bot Telegram Polling serveri muvaffaqiyatli ishga tushdi...');

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
