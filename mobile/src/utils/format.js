// Shared formatters — import these instead of redefining in every screen

const _currency = new Intl.NumberFormat('fr-NE', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const _compact = new Intl.NumberFormat('fr-NE', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const _date = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const formatCurrency = (value) => _currency.format(Number(value || 0));

export const formatCompactMoney = (value) => {
  const amount = Number(value || 0);
  if (Math.abs(amount) < 1_000_000) return _currency.format(amount);
  return `${_compact.format(amount)} F CFA`;
};

export const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return _date.format(d);
};

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const getDaysRemaining = (targetDate) => {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
