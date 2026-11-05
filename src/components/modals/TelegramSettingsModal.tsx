import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Bell,
  RefreshCw,
  DownloadCloud,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_TELEGRAM_BOT_USERNAME,
  getTelegramConfig,
  saveTelegramConfig,
  sendTestNotification,
  detectChatIdFromBot,
  TelegramConfig,
} from '../../services/telegramBot';
import { useFinance } from '../../context/FinanceContext';

interface TelegramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast, syncTelegramBotTransactions } = useFinance();

  const [config, setConfig] = useState<TelegramConfig>(getTelegramConfig());
  const [chatIdInput, setChatIdInput] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getTelegramConfig();
      setConfig(current);
      setChatIdInput(current.chatId);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = {
      ...config,
      chatId: chatIdInput.trim(),
    };
    saveTelegramConfig(updated);
    setConfig(updated);
    showToast("Telegram sozlamalari saqlandi!");
    onClose();
  };

  const handleDetectChatId = async () => {
    setIsDetecting(true);
    setStatusMessage({
      type: 'info',
      text: "Bot yangilanishlari tekshirilmoqda...",
    });

    const res = await detectChatIdFromBot(config.botToken);
    setIsDetecting(false);

    if (res.ok && res.chatId) {
      setChatIdInput(res.chatId);
      setConfig((prev) => ({ ...prev, chatId: res.chatId || '' }));
      setStatusMessage({
        type: 'success',
        text: `Topildi! Chat ID: ${res.chatId}${res.firstName ? ` (${res.firstName})` : ''}. Saqlandi va ulandi!`,
      });
      showToast(`Telegram Chat ID aniqlandi: ${res.chatId}`);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || "Chat ID aniqlanmadi. Avval @xsobchi_bot ga kirib /start bosing!",
      });
    }
  };

  const handleSendTest = async () => {
    const targetChatId = chatIdInput.trim() || config.chatId;
    if (!targetChatId) {
      setStatusMessage({
        type: 'error',
        text: "Iltimos, avval Chat ID kiriting yoki botdan aniqlang!",
      });
      return;
    }

    setIsSendingTest(true);
    setStatusMessage({
      type: 'info',
      text: "Test xabarnomasi yuborilmoqda...",
    });

    const res = await sendTestNotification(targetChatId);
    setIsSendingTest(false);

    if (res.ok) {
      setStatusMessage({
        type: 'success',
        text: "Test xabari Telegramingizga muvaffaqiyatli yuborildi! Tekshirib ko'ring. 🚀",
      });
      showToast("Telegramga test xabari yuborildi!");
    } else {
      setStatusMessage({
        type: 'error',
        text: `Xatolik: ${res.description || "Xabar yuborilmadi"}. Botga /start bosganingizni tekshiring.`,
      });
    }
  };

  // Botdan kiritilgan xarajat va daromadlarni web ilovaga sinxronlash
  const handleSyncBotTransactions = async () => {
    setIsSyncing(true);
    try {
      const res = await syncTelegramBotTransactions();
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Sinxronizatsiya yakunlandi: ${res.message}!`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 shadow-sm">
            <Send className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Telegram Bot Integratsiyasi
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                Ulangan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kunlik daromad va chiqimlarni Telegram orqali yozib boring va hisoblang
            </p>
          </div>
        </div>

        {/* Bot Axborot Kartasi */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/5 to-sky-500/15 dark:from-sky-500/10 dark:to-sky-500/5 border border-sky-500/20 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Rasmiy Bot: @{DEFAULT_TELEGRAM_BOT_USERNAME}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kunlik xarajat va daromadlarni avtomatik hisoblovchi bot
                </p>
              </div>
            </div>

            <a
              href={`https://t.me/${DEFAULT_TELEGRAM_BOT_USERNAME}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/30 transition-all shrink-0"
            >
              <span>Botni ochish</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Bot Sinxronizatsiya Tugmasi */}
        <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                Telegramdagi operatsiyalarni yuklash
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Botda yozilgan kunlik xarajatlarni ilovaga o'tkazish
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncBotTransactions}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? "Yuklanmoqda..." : "Sinxronlash"}</span>
          </button>
        </div>

        {/* Holat Xabari */}
        {statusMessage && (
          <div
            className={`mb-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                : 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 text-sky-500 animate-spin mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 1. Chat ID Sozlash Qadami */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Sizning Telegram Chat ID raqamingiz:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatIdInput}
                onChange={(e) => setChatIdInput(e.target.value)}
                placeholder="Masalan: 7452174818"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />

              <button
                type="button"
                onClick={handleDetectChatId}
                disabled={isDetecting}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
                title="Botga /start bosgan bo'lsangiz, ID ni avtomatik aniqlaydi"
              >
                <Search className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? "Tekshirilmoqda..." : "Avto-aniqlash"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              💡 <b>Ko'rsatma:</b> Telegramda <b>@{DEFAULT_TELEGRAM_BOT_USERNAME}</b> botiga kiring va <b>/start</b> tugmasini bosing, so'ng <b>"Avto-aniqlash"</b> tugmasini bosing.
            </p>
          </div>

          {/* Test xabar tugmasi */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Xabarnomani tekshirish
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
              <span>{isSendingTest ? "Yuborilmoqda..." : "Test xabar yuborish"}</span>
            </button>
          </div>
        </div>

        {/* 2. Botda yozish yo'riqnomasi (Tezkor qo'llanma) */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Botda kunlik hisob-kitob qilish:
            </h4>
          </div>
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p>• <b>Chiqim yozish:</b> <code>35000 obed</code>, <code>taksi 15k</code>, <code>benzin 50 000</code></p>
            <p>• <b>Kirim yozish:</b> <code>+2000000 oylik</code>, <code>+500k frilans</code></p>
            <p>• <b>Buyruqlar:</b> <code>/bugun</code> (kunlik kassa), <code>/oy</code> (oylik hisobot), <code>/balans</code>, <code>/bekor</code></p>
          </div>
        </div>

        {/* 3. Xabarnoma sozlamalari (Toggles) */}
        <div className="space-y-3 mb-6 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Qaysi amallarda botga xabar kelsin?
            </h4>
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled }))
              }
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                config.isEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {config.isEnabled ? 'Xabarnomalar yoqiq' : "O'chirilgan"}
            </button>
          </div>

          {[
            {
              key: 'notifyTransactions' as const,
              label: "Kirim va chiqimlar (Yangi operatsiyalar)",
              desc: "Har bir yangi tranzaksiya kiritilganda darhol xabar",
            },
            {
              key: 'notifyTransfers' as const,
              label: "Hamyonlararo pul o'tkazmalari",
              desc: "Bir hamyondan ikkinchisiga pul o'tkazilganda",
            },
            {
              key: 'notifyGoals' as const,
              label: "Moliyaviy maqsadlar (Kopilka)",
              desc: "Kopilkaga pul ajratilganda va progress yangilanganda",
            },
            {
              key: 'notifyDebts' as const,
              label: "Qarzlar nazorati (Berish va qaytarish)",
              desc: "Yangi qarz berilganda, olinganda yoki to'langanda",
            },
            {
              key: 'notifyBudgets' as const,
              label: "Byudjet limitlari oshganda",
              desc: "Oylik xarajat limiti 100% dan oshganda ogohlantirish",
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="w-4 h-4 mt-0.5 rounded text-sky-600 focus:ring-sky-500 rounded-md border-slate-300 dark:border-slate-700"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {item.label}
                </span>
                <span className="text-[11px] text-slate-400 block">{item.desc}</span>
              </div>
            </label>
          ))}
        </div>

        {/* Tugmalar */}
        <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            Yopish
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Sozlamalarni saqlash</span>
          </button>
        </div>

      </div>
    </div>
  );
};
