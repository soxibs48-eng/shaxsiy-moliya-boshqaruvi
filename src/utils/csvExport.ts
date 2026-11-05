import { Transaction, Wallet, Currency } from '../types/finance';

/**
 * Pul miqdorini formatlash (CSV ichidagi xulosa uchun)
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(num));
}

/**
 * Tranzaksiyalarni CSV / Excel formatida yuklab olish funksiyasi
 * UTF-8 BOM (\uFEFF) bilan eksport qilinadi, shunda Excel harflarni to'g'ri ko'rsatadi
 * va nuqta-vergul (;) ustun ajratgich sifatida qo'llaniladi.
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  wallets: Wallet[],
  filenamePrefix = 'tranzaksiyalar'
): boolean {
  if (!transactions || transactions.length === 0) {
    return false;
  }

  const walletMap = new Map<string, string>();
  wallets.forEach((w) => walletMap.set(w.id, w.name));

  // Jami statistikani hisoblash
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'income') totalIncome += tx.amount;
    if (tx.type === 'expense') totalExpense += tx.amount;
  });

  const now = new Date();
  const exportDateStr = now.toLocaleDateString('uz-UZ') + ' ' + now.toLocaleTimeString('uz-UZ');

  // Excel uchun sarlavha va meta ma'lumotlar
  const metaRows = [
    `"SMART FINANCE — SHAXSIY MOLIYA BOSHQARUVI HISOBOTI"`,
    `"Hisobot yaratilgan sana";"${exportDateStr}"`,
    `"Jami operatsiyalar soni";"${transactions.length} ta"`,
    `"Jami kirim (daromad)";"${formatNumber(totalIncome)}"`,
    `"Jami chiqim (xarajat)";"${formatNumber(totalExpense)}"`,
    `"Sof kassa oqimi";"${formatNumber(totalIncome - totalExpense)}"`,
    `""`, // bo'sh qator
  ];

  const headers = [
    'ID',
    'Sana',
    'Operatsiya turi',
    'Kategoriya',
    'Summa',
    'Valyuta',
    'Chiqim hamyoni',
    'Kirim hamyoni',
    'Izoh',
  ];

  const dataRows = transactions.map((tx) => {
    let typeName = 'Chiqim (Xarajat)';
    if (tx.type === 'income') typeName = 'Kirim (Daromad)';
    if (tx.type === 'transfer') typeName = "Hamyonlararo o'tkazma";

    const fromWalletName = walletMap.get(tx.walletId) || tx.walletId;
    const toWalletName = tx.toWalletId ? walletMap.get(tx.toWalletId) || tx.toWalletId : '-';

    return [
      tx.id,
      tx.date,
      typeName,
      tx.category || '-',
      tx.amount.toString(),
      tx.currency,
      fromWalletName,
      toWalletName,
      tx.note || '-',
    ];
  });

  const formattedDataRows = dataRows.map((row) =>
    row
      .map((field) => {
        const str = String(field).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(';')
  );

  const csvContent = [
    ...metaRows,
    headers.map((h) => `"${h}"`).join(';'),
    ...formattedDataRows,
  ].join('\r\n');

  // UTF-8 BOM (\uFEFF) qo'shamiz (Excel uchun shart)
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = now.toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_finance_${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

/**
 * Toifalar bo'yicha xarajatlar tahlili hisobotini CSV ga eksport qilish
 */
export function exportCategoryAnalysisToCSV(
  categoryData: { name: string; value: number; percent: number }[],
  totalExpense: number,
  baseCurrency: Currency
): boolean {
  if (!categoryData || categoryData.length === 0) return false;

  const now = new Date();
  const exportDateStr = now.toLocaleDateString('uz-UZ') + ' ' + now.toLocaleTimeString('uz-UZ');

  const metaRows = [
    `"SMART FINANCE — XARAJATLAR TOIFALARI STRUKTURASI HISOBOTI"`,
    `"Eksport sanasi";"${exportDateStr}"`,
    `"Asosiy hisob valyutasi";"${baseCurrency}"`,
    `"Jami sarflangan summa";"${formatNumber(totalExpense)} ${baseCurrency}"`,
    `""`,
  ];

  const headers = ['Tartib', 'Xarajat toifasi', `Summa (${baseCurrency})`, 'Ulush (%)'];

  const rows = categoryData.map((cat, idx) => [
    (idx + 1).toString(),
    cat.name,
    cat.value.toString(),
    `${cat.percent}%`,
  ]);

  const formattedRows = rows.map((r) =>
    r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')
  );

  const csvContent = [
    ...metaRows,
    headers.map((h) => `"${h}"`).join(';'),
    ...formattedRows,
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = now.toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_finance_toifalar_tahlili_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
