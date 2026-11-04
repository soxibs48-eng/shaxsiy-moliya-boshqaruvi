export interface LiveRatesResponse {
  USD: number;
  EUR: number;
  diff: {
    USD: number;
    EUR: number;
  };
  source: 'cbu' | 'er-api';
  date: string;
}

interface CbuCurrencyItem {
  id: number;
  Code: string;
  Ccy: string;
  CcyNm_UZ: string;
  Rate: string;
  Diff: string;
  Date: string;
}

interface ErApiResponse {
  result: string;
  rates: {
    UZS?: number;
    EUR?: number;
    [key: string]: number | undefined;
  };
  time_last_update_utc?: string;
}

/**
 * Markaziy Bank (CBU.uz) ochiq bepul API sidon kurslarni olish
 */
async function fetchFromCbu(): Promise<LiveRatesResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`CBU API javob xatosi: HTTP ${res.status}`);
    }

    const data: CbuCurrencyItem[] = await res.json();
    const usdItem = data.find((c) => c.Ccy === 'USD');
    const eurItem = data.find((c) => c.Ccy === 'EUR');

    if (!usdItem || !eurItem) {
      throw new Error("CBU ma'lumotlarida USD yoki EUR topilmadi");
    }

    const usdRate = parseFloat(usdItem.Rate);
    const eurRate = parseFloat(eurItem.Rate);
    const usdDiff = parseFloat(usdItem.Diff) || 0;
    const eurDiff = parseFloat(eurItem.Diff) || 0;

    if (isNaN(usdRate) || usdRate <= 0 || isNaN(eurRate) || eurRate <= 0) {
      throw new Error("CBU kurs qiymatlari yaroqsiz");
    }

    return {
      USD: usdRate,
      EUR: eurRate,
      diff: {
        USD: usdDiff,
        EUR: eurDiff,
      },
      source: 'cbu',
      date: usdItem.Date,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Xalqaro ochiq bepul API (open.er-api.com) dan zaxira kurslarni olish
 */
async function fetchFromErApi(): Promise<LiveRatesResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`ER-API javob xatosi: HTTP ${res.status}`);
    }

    const data: ErApiResponse = await res.json();
    const uzsRate = data.rates?.UZS;
    const eurRate = data.rates?.EUR;

    if (!uzsRate || !eurRate || uzsRate <= 0 || eurRate <= 0) {
      throw new Error("ER-API kurs qiymatlari topilmadi");
    }

    // 1 USD = uzsRate UZS
    // 1 EUR = (uzsRate / eurRate) UZS
    const eurInUzs = Math.round((uzsRate / eurRate) * 100) / 100;

    return {
      USD: Math.round(uzsRate * 100) / 100,
      EUR: eurInUzs,
      diff: {
        USD: 0,
        EUR: 0,
      },
      source: 'er-api',
      date: new Date().toLocaleDateString('uz-UZ'),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Asosiy ochiq tekin API dan valyuta kurslarini tortish
 * Birinchi bo'lib O'zbekiston Markaziy Banki (cbu.uz) dan oladi,
 * agar tarmoq yoki xatolik bo'lsa xalqaro open.er-api ga o'tadi.
 */
export async function getLiveExchangeRates(): Promise<LiveRatesResponse> {
  try {
    return await fetchFromCbu();
  } catch (cbuError) {
    console.warn('CBU API ulanishida ogohlantirish, zaxira API ga olinmoqda:', cbuError);
    try {
      return await fetchFromErApi();
    } catch (fallbackError) {
      console.error('Barcha valyuta API larida xatolik:', fallbackError);
      throw fallbackError;
    }
  }
}
