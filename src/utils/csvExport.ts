import { Transaction, Wallet } from '../types/finance';

/**
 * Barcha tranzaksiyalarni CSV / Excel formatida yuklab olish funksiyasi
 * UTF-8 BOM (\uFEFF) bilan eksport qilinadi, shunda Excel harflarni to'g'ri ko'rsatadi
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  wallets: Wallet[]
): boolean {
  if (!transactions || transactions.length === 0) {
    return false;
  }

  const walletMap = new Map<string, string>();
  wallets.forEach((w) => walletMap.set(w.id, w.name));

  const headers = [
    'ID',
    'Sana',
    'Operatsiya turi',
    'Kategoriya',
    'Summa',
    'Valyuta',
    'Hamyon',
    "Qabul qiluvchi hamyon",
    'Izoh',
  ];

  const rows = transactions.map((tx) => {
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

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      row
        .map((field) => {
          const str = String(field).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(';')
    ),
  ].join('\r\n');

  // UTF-8 BOM qo'shamiz
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_finance_tranzaksiyalar_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
