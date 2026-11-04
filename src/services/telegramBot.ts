export const DEFAULT_TELEGRAM_BOT_TOKEN = '9144296715:AAF38YvmuGyhTmggURAei4bfv5sxQp5FmXg';
export const DEFAULT_TELEGRAM_BOT_USERNAME = 'xsobchi_bot';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  notifyTransactions: boolean;
  notifyTransfers: boolean;
  notifyGoals: boolean;
  notifyDebts: boolean;
  notifyBudgets: boolean;
}

const STORAGE_KEY = 'sf_telegram_config';

export function getTelegramConfig(): TelegramConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        botToken: parsed.botToken || DEFAULT_TELEGRAM_BOT_TOKEN,
        chatId: parsed.chatId || '',
        isEnabled: typeof parsed.isEnabled === 'boolean' ? parsed.isEnabled : true,
        notifyTransactions: parsed.notifyTransactions !== false,
        notifyTransfers: parsed.notifyTransfers !== false,
        notifyGoals: parsed.notifyGoals !== false,
        notifyDebts: parsed.notifyDebts !== false,
        notifyBudgets: parsed.notifyBudgets !== false,
      };
    }
  } catch (e) {
    console.error('Telegram config o\'qishda xatolik:', e);
  }

  return {
    botToken: DEFAULT_TELEGRAM_BOT_TOKEN,
    chatId: '',
    isEnabled: true,
    notifyTransactions: true,
    notifyTransfers: true,
    notifyGoals: true,
    notifyDebts: true,
    notifyBudgets: true,
  };
}

export function saveTelegramConfig(config: TelegramConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Telegram config saqlashda xatolik:', e);
  }
}

/**
 * Telegram bot orqali xabar yuborish
 */
export async function sendTelegramMessage(
  htmlText: string,
  overrideChatId?: string,
  overrideToken?: string
): Promise<{ ok: boolean; description?: string }> {
  const config = getTelegramConfig();
  const token = overrideToken || config.botToken || DEFAULT_TELEGRAM_BOT_TOKEN;
  const chatId = overrideChatId || config.chatId;

  if (!chatId) {
    return { ok: false, description: "Telegram Chat ID kiritilmagan" };
  }

  if (!overrideChatId && !config.isEnabled) {
    return { ok: false, description: "Telegram xabarnomalari o'chirilgan" };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        description: data.description || `HTTP xatosi: ${res.status}`,
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Telegram xabar yuborishda xatolik:', message);
    return { ok: false, description: message };
  }
}

/**
 * Botga /start bosgan foydalanuvchini getUpdates orqali avtomatik topish
 */
export async function detectChatIdFromBot(
  customToken?: string
): Promise<{
  ok: boolean;
  chatId?: string;
  firstName?: string;
  username?: string;
  error?: string;
}> {
  const config = getTelegramConfig();
  const token = customToken || config.botToken || DEFAULT_TELEGRAM_BOT_TOKEN;

  try {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=-5`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.result)) {
      return { ok: false, error: data.description || "Bot ma'lumotlarini olib bo'lmadi" };
    }

    if (data.result.length === 0) {
      return {
        ok: false,
        error: "Hozircha botda xabarlar topilmadi. Iltimos, avval Telegramda @xsobchi_bot ga kiring va /start tugmasini bosing!",
      };
    }

    // Eng oxirgi xabarni olamiz
    const latestUpdate = data.result[data.result.length - 1];
    const msg = latestUpdate.message || latestUpdate.edited_message || latestUpdate.callback_query?.message;

    if (!msg || !msg.chat) {
      return { ok: false, error: "Xabar tuzilmasi aniqlanmadi" };
    }

    const chatId = String(msg.chat.id);
    const firstName = msg.chat.first_name || '';
    const username = msg.chat.username || '';

    // Avtomatik ravishda saqlaymiz
    config.chatId = chatId;
    config.isEnabled = true;
    saveTelegramConfig(config);

    return {
      ok: true,
      chatId,
      firstName,
      username,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * 1. Yangi Operatsiya (Kirim / Chiqim) uchun xabarnoma
 */
export async function notifyTransactionEvent(params: {
  type: 'income' | 'expense' | 'transfer';
  amountText: string;
  category: string;
  walletName: string;
  note?: string;
  date: string;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyTransactions || !config.chatId) return;

  const isIncome = params.type === 'income';
  const icon = isIncome ? '🟢' : params.type === 'transfer' ? '🔄' : '🔴';
  const title = isIncome
    ? "Kirim (Daromad) kiritildi"
    : params.type === 'transfer'
    ? "O'tkazma kiritildi"
    : "Chiqim (Xarajat) kiritildi";

  const message = `
<b>${icon} ${title}!</b>

▫️ <b>Summa:</b> <code>${params.amountText}</code>
▫️ <b>Kategoriya:</b> ${params.category}
▫️ <b>Hamyon:</b> ${params.walletName}
▫️ <b>Sana:</b> ${params.date}
${params.note ? `▫️ <b>Izoh:</b> <i>${params.note}</i>\n` : ''}
<i>📱 Smart Finance — Shaxsiy moliya boshqaruvi</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 2. Hamyonlararo o'tkazma (Transfer) uchun xabarnoma
 */
export async function notifyTransferEvent(params: {
  fromWallet: string;
  toWallet: string;
  sentAmountText: string;
  receivedAmountText: string;
  feeText?: string;
  date: string;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyTransfers || !config.chatId) return;

  const message = `
<b>🔄 Hamyonlararo pul o'tkazmasi!</b>

▫️ <b>Yechildi:</b> <code>${params.sentAmountText}</code> (${params.fromWallet})
▫️ <b>Tushdi:</b> <code>${params.receivedAmountText}</code> (${params.toWallet})
${params.feeText ? `▫️ <b>Komissiya:</b> ${params.feeText}\n` : ''}▫️ <b>Sana:</b> ${params.date}

<i>📱 Smart Finance — Shaxsiy moliya boshqaruvi</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 3. Maqsadga mablag' qo'shilganda (Goal contribution)
 */
export async function notifyGoalEvent(params: {
  title: string;
  addedText: string;
  currentText: string;
  targetText: string;
  percent: number;
  walletName: string;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyGoals || !config.chatId) return;

  const message = `
<b>🎯 Kopilkaga yangi mablag' qo'shildi!</b>

▫️ <b>Maqsad:</b> <b>${params.title}</b>
▫️ <b>Ajratildi:</b> <code>+${params.addedText}</code> (${params.walletName})
▫️ <b>Jami to'plandi:</b> <code>${params.currentText}</code> / ${params.targetText}
▫️ <b>Progress:</b> <b>${params.percent}%</b> erishildi! 🚀

<i>Orzularingiz sari yana bir qadam tashlandi! ✨</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 4. Qarz berilganda yoki olinganda (Debt creation)
 */
export async function notifyDebtCreatedEvent(params: {
  type: 'lent' | 'borrowed';
  personName: string;
  amountText: string;
  walletName: string;
  dueDate: string;
  phone?: string;
  note?: string;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyDebts || !config.chatId) return;

  const isLent = params.type === 'lent';
  const icon = isLent ? '🤝' : '📥';
  const title = isLent ? "Yangi qarz berildi (Debitorlik)" : "Yangi qarz olindi (Kreditorlik)";

  const message = `
<b>${icon} ${title}!</b>

▫️ <b>${isLent ? 'Kimga berildi' : 'Kimdan olindi'}:</b> <b>${params.personName}</b>
▫️ <b>Summa:</b> <code>${params.amountText}</code>
▫️ <b>Hamyon:</b> ${params.walletName}
▫️ <b>Qaytarish muddati:</b> ${params.dueDate}
${params.phone ? `▫️ <b>Telefon:</b> ${params.phone}\n` : ''}${params.note ? `▫️ <b>Izoh:</b> <i>${params.note}</i>\n` : ''}
<i>Smart Finance Qarzlar Daftari</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 5. Qarz qaytarilganda yoki to'langanda (Debt repayment)
 */
export async function notifyDebtRepaidEvent(params: {
  type: 'lent' | 'borrowed';
  personName: string;
  repayText: string;
  remainingText: string;
  isClosed: boolean;
  walletName: string;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyDebts || !config.chatId) return;

  const isLent = params.type === 'lent';
  const actionTitle = isLent ? "Qarz qabul qilindi (Kirim)" : "Qarz to'landi (Chiqim)";

  const message = `
<b>${params.isClosed ? '🎉' : '💰'} ${actionTitle}!</b>

▫️ <b>Shaxs:</b> <b>${params.personName}</b>
▫️ <b>To'langan summa:</b> <code>${params.repayText}</code> (${params.walletName})
▫️ <b>Qoldiq qarz:</b> <code>${params.remainingText}</code>
▫️ <b>Holat:</b> ${params.isClosed ? '<b>✅ Qarz to\'liq yopildi!</b>' : 'Qisman to\'lov'}

<i>Smart Finance Qarzlar Daftari</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 6. Byudjet limiti oshganda ogohlantirish (Budget Exceeded)
 */
export async function notifyBudgetAlertEvent(params: {
  category: string;
  limitText: string;
  spentText: string;
  percent: number;
}) {
  const config = getTelegramConfig();
  if (!config.isEnabled || !config.notifyBudgets || !config.chatId) return;

  const message = `
<b>⚠️ DIQQAT! Oylik byudjet limiti oshib ketdi!</b>

▫️ <b>Kategoriya:</b> <b>${params.category}</b>
▫️ <b>Belgilangan limit:</b> ${params.limitText}
▫️ <b>Joriy sarflangan:</b> <code>${params.spentText}</code> (<b>${params.percent}%</b>)

<i>Iltimos, ortiqcha xarajatlaringizni nazorat qiling!</i>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * 7. Test Xabari yuborish
 */
export async function sendTestNotification(chatId?: string): Promise<{ ok: boolean; description?: string }> {
  const message = `
<b>🎉 Smart Finance Telegram Boti Muvaffaqiyatli Ulandi!</b>

Hurmatli foydalanuvchi!
Sizning <b>"Smart Finance — Shaxsiy moliya boshqaruvi"</b> tizimingiz <b>@xsobchi_bot</b> orqali muvaffaqiyatli bog'landi.

Endi tizimdagi barcha amallar:
▫️ Kirim va chiqimlar 💸
▫️ Hamyonlararo o'tkazmalar 🔄
▫️ Kopilkaga pul qo'shish 🎯
▫️ Qarzlar nazorati 🤝
▫️ Byudjet limitlari eslatmalari ⚠️

to'g'ridan-to'g'ri Telegramingizga kelib turadi! 🚀
`.trim();

  return await sendTelegramMessage(message, chatId);
}
