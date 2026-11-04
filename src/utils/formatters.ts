import { Currency } from '../types/finance';

/**
 * Pul miqdorini valyuta turiga moslab formatlash
 * Masalan:
 * UZS: 15 450 000 UZS
 * USD: $1,250.00
 * EUR: €1,250.00
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  isHidden: boolean = false
): string {
  if (isHidden) {
    return '••••••••';
  }

  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;

  if (currency === 'UZS') {
    // UZS uchun butun son qulayroq (yoki agar kasr bo'lsa)
    const formatted = Math.round(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} UZS`;
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  }

  return `${rounded} ${currency}`;
}

/**
 * Joriy sana va vaqtni o'zbek tilida chiroyli sarlavha uchun formatlash
 * Masalan: "Chorshanba, 4-noyabr, 2026"
 */
export function getFormattedToday(): string {
  const now = new Date();
  
  const haftaKunlari = [
    'Yakshanba',
    'Dushanba',
    'Seshanba',
    'Chorshanba',
    'Payshanba',
    'Juma',
    'Shanba'
  ];

  const oylar = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr'
  ];

  const haftaKuni = haftaKunlari[now.getDay()];
  const kun = now.getDate();
  const oy = oylar[now.getMonth()];
  const yil = now.getFullYear();

  return `${haftaKuni}, ${kun}-${oy}, ${yil}`;
}

/**
 * YYYY-MM-DD sanani qisqa o'zbekcha formatga o'tkazish
 * Masalan: "4-noyabr, 2026"
 */
export function formatDateUz(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const oylar = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr'
  ];

  const kun = date.getDate();
  const oy = oylar[date.getMonth()];
  const yil = date.getFullYear();

  return `${kun}-${oy}, ${yil}`;
}

/**
 * Valyuta kursini formatlash (kasr qismi bilan)
 * Masalan: 12850 -> "12 850.00" yoki 11911.71 -> "11 911.71"
 */
export function formatExchangeRate(rate: number): string {
  if (isNaN(rate) || rate === undefined || rate === null) return '0.00';
  const parts = rate.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart}.${parts[1]}`;
}


